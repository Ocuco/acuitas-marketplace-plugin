/*
 * Copyright 2026 Ocuco Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  PluginContext,
  PluginSettings,
  ScreenContext,
  ModalEventDetail,
  TokenRequestDetail,
  TokenRequestResponse,
} from '@acuitas/shared';
import styles from '@acuitas/shared/css/acuitas-design-system.css?inline';
// local styles for the web-component (ensure styling applies inside shadow DOM)
import localStyles from './index.css?inline';
import { formatCurrency, formatDate, pickLanguage, toIntlLocales } from './locale';

// The languages this sample ships its own strings in. Acuitas can pass any of its interface locales, so a
// widget always negotiates against its own list and falls back (here to English) — see pickLanguage().
const GREETINGS = {
  en: 'Hello! This module follows the language Acuitas passes in.',
  fr: 'Bonjour ! Ce module suit la langue transmise par Acuitas.',
  nl: 'Hallo! Deze module volgt de taal die Acuitas doorgeeft.',
  de: 'Hallo! Dieses Modul folgt der Sprache, die Acuitas übergibt.',
} as const;
type WidgetLanguage = keyof typeof GREETINGS;
const WIDGET_LANGUAGES = Object.keys(GREETINGS) as WidgetLanguage[];

/* =============================================================================
 * dashboard-widget — a sample Acuitas Marketplace plugin (reference implementation)
 * =============================================================================
 *
 * WHAT THIS IS
 * ------------
 * A worked example of a Marketplace "home dashboard" plugin. Unlike the imaging
 * and patient widgets (which render inside a panel/grid on an existing screen),
 * this widget is launched from a TILE in a home-screen category and then renders
 * as its OWN full-page module inside the Acuitas application shell — under the
 * persistent navigation bar, with a host-provided Close button. Read the header
 * of patient-widget.ts first: it explains the overall architecture, the host ↔
 * widget property contract, and the token-then-call-your-API data flow, all of
 * which apply here too.
 *
 * It is a Lit Custom Element / Web Component running in an isolated Shadow DOM,
 * so it is framework-agnostic and its styles never clash with the host's.
 *
 * HOW IT REACHES THE HOST (Module Federation)
 * -------------------------------------------
 * `src/dashboard-index.ts` imports this file (registering the `<dashboard-widget>`
 * tag) and re-exports the class; vite.config.ts exposes it as `./DashboardComponent`
 * in `remoteEntry.js`. The host loads that remote, creates `<dashboard-widget>`,
 * and sets the properties below on the instance.
 *
 * As a partner you FORK this widget and replace render() with your own full-page
 * module UI. The contract you must keep is the set of @property() fields the host
 * sets — they come from `@acuitas/shared` (acuitas-shared/src/types.ts).
 * ========================================================================== */

// `@customElement` registers this class as `<dashboard-widget>`. Change this tag
// (and the HTMLElementTagNameMap entry at the end) for your own widget.
@customElement('dashboard-widget')
export class DashboardWidget extends LitElement {
  /* ---------------------------------------------------------------------------
   * PROPERTIES — the host ↔ widget contract (see patient-widget.ts for detail)
   * ------------------------------------------------------------------------- */

  // Unique id of this widget instance (host-assigned); echo it back in callbacks.
  @property()
  id: string = '';

  // Human-readable widget name, supplied by the host config.
  @property()
  name: string = '';

  // Environment + clinical identity (customer/site/staff). Don't fetch with these
  // directly — pass them through onRequestToken so the host can authorise.
  // `locale` is the user's interface language (BCP-47, e.g. 'fr-FR'); see locale.ts.
  @property({ type: Object })
  context: PluginContext = {
    environment: 'SANDBOX',
    customerId: '',
    siteId: '',
    staffId: '',
  };

  // The host screen + size budget. On the home screen the widget renders full
  // page, so maxWidth/maxHeight reflect the available content area.
  @property({ type: Object })
  screen: ScreenContext = {
    view: 'HOME',
    maxWidth: 1200,
  };

  // Host-injected per-plugin config (key-value pairs from the Marketplace).
  @property({ type: Object })
  settings: PluginSettings = {};

  // Call to ask the host to expand this widget to a full-screen modal. A home
  // module is already full page, so this is rarely needed — kept for contract parity.
  @property({ type: Function })
  onOpenModal: ((detail: ModalEventDetail) => void) | undefined;

  // Call to ask the host to close the modal.
  @property({ type: Function })
  onCloseModal: ((detail: ModalEventDetail) => void) | undefined;

  // The only way to get credentials: request a scoped, short-lived bearer token
  // from the host, then send it to your own API (see patient-widget._fetchPatientDetails).
  @property({ type: Function })
  onRequestToken: ((detail: TokenRequestDetail) => Promise<TokenRequestResponse>) | undefined;

  // Host-driven: true while shown full-screen modal. Unused by the home module.
  @property({ type: Boolean })
  isModalOpen: boolean = false;

  // Forward-compatibility escape hatch for extra host props; ignore unless documented.
  @property({ type: Object })
  additionalProps: Record<string, any> = {};

  /* ---------------------------------------------------------------------------
   * INTERNAL STATE — not part of the host contract
   * ------------------------------------------------------------------------- */

  // True while a token request is in flight (drives the button's loading label).
  @state()
  private _loading: boolean = false;

  // Last error message, shown inline; null when there is no error.
  @state()
  private _error: string | null = null;

  // The short-lived session token returned by the host; null until requested.
  @state()
  private _token: string | null = null;

  render() {
    return html`
      <div class="plugin-container" style="width: 100%; min-height: 100%; padding: var(--padding-default, 16px); box-sizing: border-box;">
        <div class="mb-sm">
          <h2 class="text-primary mb-0">${this.name || 'Partner Module'}</h2>
          <div class="text-secondary text-small">
            Running inside the Acuitas application shell · environment:
            <code>${this.context.environment}</code>
          </div>
        </div>

        <div class="card mb-sm">
          <div class="card-header"><h6 class="mb-0">Context received from Acuitas</h6></div>
          <div class="card-body p-sm">
            ${this._detailRow('Customer', this.context.customerId)}
            ${this._detailRow('Site', this.context.siteId)}
            ${this._detailRow('Staff', this.context.staffId)}
            ${this._detailRow('Granted context types', (this.context.contextTypes ?? []).join(', ') || 'none')}
            ${this._detailRow('Locale', `${this.context.locale ?? '—'} · ${formatDate(new Date(), this.context.locale)}`)}
          </div>
        </div>

        ${this._renderLocalisation()}

        <div class="card mb-sm">
          <div class="card-header"><h6 class="mb-0">Plugin settings</h6></div>
          <div class="card-body p-sm">
            ${
              Object.keys(this.settings).length
                ? Object.entries(this.settings).map(([key, value]) => this._detailRow(key, value))
                : html`<div class="text-secondary text-small">No settings supplied</div>`
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h6 class="mb-0">Authorised API access</h6></div>
          <div class="card-body p-sm">
            <div class="text-secondary text-small mb-sm">
              The module holds no credentials. Request a scoped session token from
              the host, then call your own backend with it as a Bearer token.
            </div>
            <div class="d-flex gap-2 align-center">
              <button
                class="btn btn-primary"
                @click=${this._requestSessionToken}
                ?disabled=${this._loading || !this.onRequestToken}
              >
                ${this._loading ? 'Requesting…' : '🔑 Request session token'}
              </button>
              ${this._token ? html`<span class="text-small">Token received ✔</span>` : ''}
            </div>
            ${this._token ? html`<pre>${this._token}</pre>` : ''}
            ${this._error ? html`<div class="mt-sm text-small" style="color: #b00020;">${this._error}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // REFERENCE: localisation. Read `context.locale` on every render (the host can replace `context` while the widget
  // is running), negotiate your own strings against the languages you ship, and format values with Intl directly.
  private _renderLocalisation() {
    const locale = this.context.locale;
    const language = pickLanguage(locale, WIDGET_LANGUAGES, 'en');
    const requested = locale?.split('-')[0].toLowerCase();
    const intlLocales = toIntlLocales(locale);
    const languageName = (tag: string) => new Intl.DisplayNames([language], { type: 'language' }).of(tag) ?? tag;
    const now = new Date();

    return html`
      <div class="card mb-sm">
        <div class="card-header"><h6 class="mb-0">Localisation</h6></div>
        <div class="card-body p-sm">
          <div class="text-primary mb-sm" lang=${language}>${GREETINGS[language]}</div>
          ${this._detailRow('Locale received', locale ?? 'none — the host did not pass one')}
          ${this._detailRow(
            'Widget language',
            requested && requested !== language
              ? `${languageName(language)} (no ${languageName(requested)} strings shipped, so the widget falls back)`
              : languageName(language),
          )}
          ${this._detailRow('Date', new Intl.DateTimeFormat(intlLocales, { dateStyle: 'full' }).format(now))}
          ${this._detailRow('Time', new Intl.DateTimeFormat(intlLocales, { timeStyle: 'short' }).format(now))}
          ${this._detailRow('Number', new Intl.NumberFormat(intlLocales).format(1234567.891))}
          ${this._detailRow('Price', formatCurrency(1249.5, 'EUR', locale))}
          ${this._detailRow('Next appointment', new Intl.RelativeTimeFormat(intlLocales, { numeric: 'auto' }).format(3, 'day'))}
          <div class="text-secondary text-small mt-sm">
            Dates, numbers and prices come from Intl, so every locale formats correctly without translations of your own.
            Only the greeting needs one, so it is negotiated against the ${WIDGET_LANGUAGES.length} languages this widget ships.
          </div>
        </div>
      </div>
    `;
  }

  private _detailRow(label: string, value?: string) {
    return html`
      <div class="mb-xs">
        <span class="text-secondary text-small">${label}:</span>
        <div class="text-primary">${value || '—'}</div>
      </div>
    `;
  }

  // REFERENCE: the token request pattern. A home module typically needs a general
  // plugin-session token (no specific subject), then calls its own API with it.
  private async _requestSessionToken() {
    if (!this.onRequestToken) return;

    this._loading = true;
    this._error = null;

    try {
      const tokenResponse = await this.onRequestToken({
        pluginId: this.id,
        pluginName: this.name,
        context: this.context,
        subjectTypes: [],
        subjectIds: [],
      });

      this._token = tokenResponse.token;
    } catch (err) {
      console.error('Failed to request session token', err);
      this._error = err instanceof Error ? err.message : 'Failed to request session token';
    } finally {
      this._loading = false;
    }
  }

  static styles = [unsafeCSS(styles), unsafeCSS(localStyles)];
}

declare global {
  interface HTMLElementTagNameMap {
    'dashboard-widget': DashboardWidget;
  }
}
