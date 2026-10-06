import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { PluginContext, PluginSettings, ScreenContext, PatientProps, ModalEventDetail, TokenRequestDetail, TokenRequestResponse } from '@acuitas/shared'
import styles from '@acuitas/shared/css/acuitas-design-system.css?inline';
// local styles for the web-component (ensure pre styling applies inside shadow DOM)
import localStyles from './index.css?inline';

/* =============================================================================
 * patient-widget — a sample Acuitas Marketplace plugin (reference implementation)
 * =============================================================================
 *
 * WHAT THIS IS
 * ------------
 * A worked example of a Marketplace "widget" for the PATIENT screen, alongside
 * imaging-widget.ts (read that file's header first — it explains the overall
 * architecture in full). It is a Lit Custom Element / Web Component that the
 * Acuitas host embeds in one of its screens; it runs in an isolated Shadow DOM,
 * so it is framework-agnostic and its styles never clash with the host's.
 *
 * As a partner you FORK this widget and replace its body with your own UI and
 * logic. The contract you must keep is the set of @property() fields the host
 * sets on the element (see the PROPERTIES section) — those come from the shared
 * package `@acuitas/shared` (acuitas-shared/src/types.ts), the source of truth.
 *
 * HOW IT REACHES THE HOST (Module Federation)
 * -------------------------------------------
 * Published as a Vite Module Federation remote. `src/patient-index.ts` imports
 * this file (which registers the `<patient-widget>` tag) and re-exports the
 * class; vite.config.ts exposes it as `./PatientComponent` in `remoteEntry.js`.
 * The host loads that remote at runtime, creates `<patient-widget>` in its DOM,
 * and sets the properties below on the instance.
 *
 * To ship your OWN widget: rename the tag in @customElement(...) (and the
 * matching HTMLElementTagNameMap entry at the bottom), update name/exposes in
 * vite.config.ts and the src/ entry file, then rewrite render() and the private
 * methods.
 *
 * HOW DATA FLOWS
 * --------------
 * In:  the host sets reactive DOM *properties* (e.g. `el.patient = {...}`), not
 *      HTML attributes — Lit re-renders automatically on assignment.
 * Out: the widget holds no credentials. To fetch data it calls the injected
 *      `onRequestToken(detail)` to get a short-lived scoped bearer token, then
 *      calls its own backend (`settings.apiUrl`) with it — see
 *      _fetchPatientDetails below. Modal open/close is reported to the host via
 *      `onOpenModal` / `onCloseModal`.
 * ========================================================================== */

// --- Local view models -------------------------------------------------------
// These describe the shape of YOUR backend's response, not the host contract.
// They are specific to this sample; define whatever types your own API returns.

// A lookup value (id + display text) as used throughout the patient details payload
interface LookupValue {
  id: string;
  text: string;
}

// Subset of the Acuitas patient details response surfaced by this widget
interface PatientDetails {
  id: string;
  title?: LookupValue;
  firstName?: string;
  middleName?: string;
  surname?: string;
  maidenName?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: LookupValue;
  maritalStatus?: LookupValue;
  occupation?: LookupValue;
  spokenLanguage?: LookupValue;
  patientStatus?: string;
}

// `@customElement` registers this class as `<patient-widget>`. Change this tag
// (and the HTMLElementTagNameMap entry at the end of the file) for your own widget.
@customElement('patient-widget')
export class PatientWidget extends LitElement {
  /* ---------------------------------------------------------------------------
   * PROPERTIES — the host ↔ widget contract
   * ---------------------------------------------------------------------------
   * Each @property() is an input the host sets on the element. Types come from
   * `@acuitas/shared` — do not diverge from them. Defaults below are placeholders
   * for standalone/dev use only.
   * ------------------------------------------------------------------------- */

  // Unique id of this widget instance (host-assigned); echo it back in callbacks.
  @property()
  id: string = '';

  // Human-readable widget name, supplied by the host config.
  @property()
  name: string = '';

  // Environment + clinical identity (customer/site/staff). Don't fetch with these
  // directly — pass them through onRequestToken so the host can authorise.
  @property({ type: Object })
  context: PluginContext = {
    environment: 'SANDBOX',
    customerId: '',
    siteId: '',
    staffId: ''
  };

  // The host screen + size budget (px) the widget must render within.
  @property({ type: Object })
  screen: ScreenContext = {
    view: 'PATIENT',
    maxWidth: 400
  };

  // Host-injected per-plugin config. This sample reads `settings.apiUrl`.
  @property({ type: Object })
  settings: PluginSettings = {};

  // Domain data for the patient screen — here just the patient id to load.
  @property({ type: Object })
  patient: PatientProps = {
    patientId: ''
  };

  // Call to ask the host to expand this widget to a full-screen modal.
  @property({ type: Function })
  onOpenModal: ((detail: ModalEventDetail) => void) | undefined;

  // Call to ask the host to close the modal.
  @property({ type: Function })
  onCloseModal: ((detail: ModalEventDetail) => void) | undefined;

  // The only way to get credentials: request a scoped, short-lived bearer token
  // from the host, then send it to your own API. See _fetchPatientDetails below.
  @property({ type: Function })
  onRequestToken: ((detail: TokenRequestDetail) => Promise<TokenRequestResponse>) | undefined;

  // Host-driven: true while shown full-screen. Switch layout based on this.
  @property({ type: Boolean })
  isModalOpen: boolean = false;

  // Forward-compatibility escape hatch for extra host props; ignore unless documented.
  @property({ type: Object })
  additionalProps: Record<string, any> = {};

  /* ---------------------------------------------------------------------------
   * INTERNAL STATE — not part of the host contract
   * ---------------------------------------------------------------------------
   * @state() fields are private reactive state: changing them re-renders the
   * widget but they are NOT exposed to the host. Use these for things the widget
   * owns itself (loading flags, fetched data, error messages).
   * ------------------------------------------------------------------------- */

  // True while a fetch is in flight (drives the button's loading label).
  @state()
  private _loading: boolean = false;

  // Last fetch error message, shown inline; null when there is no error.
  @state()
  private _error: string | null = null;

  // The patient record fetched from your backend; null until loaded.
  @state()
  private _details: PatientDetails | null = null;

  // Lit calls render() whenever a reactive @property or @state changes. Return a
  // Lit `html` template; Lit diffs it into the Shadow DOM. Replace this with your
  // own markup — it reads host props (this.patient, this.isModalOpen, ...) and the
  // internal @state fields above.
  render() {
    // Respect the host's size budget inline; fill the screen when in a modal.
    const containerStyle = this.isModalOpen
      ? `max-width: 100%; max-height: 100%; overflow-y: auto;`
      : `max-width: ${this.screen.maxWidth}px; ${this.screen.maxHeight ? `max-height: ${this.screen.maxHeight}px;` : ''}`;

    return html`
      <div class="plugin-container" style="${containerStyle}">
        <div class="card">
          ${this.isModalOpen ? html`
            <div class="modal-header" style="position: sticky; top: 0; z-index: 10;">
              <h3 class="mb-0">${this.name || 'Patient Details'}</h3>
              <button class="btn btn-icon" @click=${this._closeModal} title="Close modal" style="font-size: 1.1rem; line-height: 1;">✕</button>
            </div>
          ` : ''}

          <div class="card-body">
            <div class="mb-sm">
              <strong>Patient ID:</strong>
              <div class="text-small px-sm">
                ${this.patient.patientId ? html`<code>${this.patient.patientId}</code>` : html`<div>No patient</div>`}
              </div>
            </div>

            ${this._details ? html`
              <div class="mb-sm">
                <strong>Name:</strong>
                <div class="text-small px-sm">${this._fullName(this._details)}</div>
              </div>
            ` : ''}

            <!-- Controls -->
            ${!this.isModalOpen ? html`
            <div class="d-flex gap-2">
              <button
                class="btn btn-primary"
                @click=${this._fetchPatientDetails}
                ?disabled=${this._loading || !this.patient.patientId || !this.onRequestToken}
              >
                ${this._loading ? 'Loading…' : '👤 Fetch patient details'}
              </button>
              ${this._details ? html`
                <button class="btn btn-secondary" @click=${this._openModal}>📄 View details</button>
              ` : ''}
            </div>` : ''}

            ${this._error ? html`
              <div class="mt-sm text-small" style="color: #b00020;">${this._error}</div>
            ` : ''}

            <!-- Modal (detailed patient info) -->
            ${this.isModalOpen && this._details ? this._renderModal(this._details) : ''}

          </div>
        </div>
      </div>
    `;
  }

  private _renderModal(details: PatientDetails) {
    return html`
      <div class="modal-backdrop">
        <div class="modal card" style="max-width:100%; max-height:90%; overflow:auto;">
          <div class="card-header">
            <h4>Patient Details</h4>
          </div>
          <div class="card-body">
            ${this._detailRow('Name', this._fullName(details))}
            ${this._detailRow('Date of birth', this._formatDate(details.dateOfBirth))}
            ${this._detailRow('Age', details.age != null ? String(details.age) : undefined)}
            ${this._detailRow('Gender', details.gender?.text)}
            ${this._detailRow('Marital status', details.maritalStatus?.text)}
            ${this._detailRow('Occupation', details.occupation?.text)}
            ${this._detailRow('Spoken language', details.spokenLanguage?.text)}
            ${this._detailRow('Status', details.patientStatus)}
            ${this._detailRow('Patient ID', details.id)}
          </div>
        </div>
      </div>
    `;
  }

  private _detailRow(label: string, value?: string) {
    return html`
      <div class="mb-sm">
        <span class="text-secondary text-small">${label}:</span>
        <div class="text-primary">${value || '—'}</div>
      </div>
    `;
  }

  private _fullName(details: PatientDetails): string {
    return [details.title?.text, details.firstName, details.middleName, details.surname]
      .filter(Boolean)
      .join(' ');
  }

  private _formatDate(value?: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }

  // Payload sent to the host on every modal callback so it can identify which
  // plugin instance and context the request came from.
  private _createModalEventDetail(): ModalEventDetail {
    return {
      pluginId: this.id,
      pluginName: this.name,
      context: this.context
    };
  }

  // Ask the host to expand us to full screen; the host sets isModalOpen = true.
  private _openModal() {
    this.isModalOpen = true;
    if (this.onOpenModal) this.onOpenModal(this._createModalEventDetail());
    this.requestUpdate();
  }

  // Ask the host to collapse us back to inline; the host sets isModalOpen = false.
  private _closeModal() {
    this.isModalOpen = false;
    if (this.onCloseModal) this.onCloseModal(this._createModalEventDetail());
    this.requestUpdate();
  }

  // ===========================================================================
  // REFERENCE: the token-then-call-your-API pattern
  // ===========================================================================
  // The widget never holds credentials. It asks the host for a token scoped to
  // exactly the subjects it needs, then calls its own backend with that token.
  // Copy this shape for any data your widget fetches.
  private async _fetchPatientDetails() {
    // Need a patient to load and the host's token callback to authorise the call.
    if (!this.patient.patientId) return;
    if (!this.onRequestToken) return;

    // Flip into the loading state and clear any previous error (re-renders the UI).
    this._loading = true;
    this._error = null;

    try {
      // STEP 1: request a scoped, short-lived token from the host. We only ask
      // for PATIENT-DETAILS access to this one patient id.
      const tokenResponse = await this.onRequestToken({
        pluginId: this.id,
        pluginName: this.name,
        context: this.context,
        subjectTypes: ['PATIENT-DETAILS'],
        subjectIds: [this.patient.patientId],
      });

      // STEP 2 & 3: call YOUR backend (base URL from host settings) sending the
      // host token as a Bearer header; your service validates it before responding.
      const apiUrl = this.settings.apiUrl || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/patients/${this.patient.patientId}/details`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenResponse.token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Store the result in @state so render() picks it up on the next update.
      const result = await response.json();
      this._details = result.data as PatientDetails;
    } catch (err) {
      // Surface failures to the user via the inline error message.
      console.error('Failed to fetch patient details', err);
      this._error = err instanceof Error ? err.message : 'Failed to fetch patient details';
    } finally {
      this._loading = false;
    }
  }

  // Styles are scoped to this element's Shadow DOM (no leakage in either
  // direction). We adopt the shared Acuitas design-system CSS plus local
  // overrides, both imported `?inline` as raw strings and wrapped with unsafeCSS.
  static styles = [unsafeCSS(styles), unsafeCSS(localStyles)];
}

// Maps `<patient-widget>` to this class for type-safe property access. Keep this
// tag identical to the one in the @customElement(...) decorator above.
declare global {
  interface HTMLElementTagNameMap {
    'patient-widget': PatientWidget;
  }
}
