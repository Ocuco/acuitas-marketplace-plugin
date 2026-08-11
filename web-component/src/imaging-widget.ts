import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { PluginContext, PluginSettings, ScreenContext, ImagingProps, ModalEventDetail, TokenRequestDetail, TokenRequestResponse } from '@acuitas/shared'
import styles from '@acuitas/shared/css/acuitas-design-system.css?inline';
// local styles for the web-component (ensure pre styling applies inside shadow DOM)
import localStyles from './index.css?inline';

/* =============================================================================
 * imaging-widget — a sample Acuitas Marketplace plugin (reference implementation)
 * =============================================================================
 *
 * WHAT THIS IS
 * ------------
 * This file is a worked example of a Marketplace "widget": a self-contained UI
 * component that the Acuitas host application embeds inside one of its screens.
 * It is built with Lit (https://lit.dev) as a standard Custom Element / Web
 * Component, so it runs in an isolated Shadow DOM and can be dropped into any
 * host page regardless of the host's own framework.
 *
 * As a partner, you are expected to FORK this widget and replace its body with
 * your own UI and logic. Everything below the "PROPERTIES" section is sample
 * behaviour you can delete. The contract you MUST keep is the set of properties
 * the host sets on the element — see the PROPERTIES section.
 *
 * HOW IT REACHES THE HOST (Module Federation)
 * -------------------------------------------
 * The widget is published as a Vite Module Federation remote. See:
 *   - vite.config.ts  -> federation({ name, filename: 'remoteEntry.js', exposes })
 *   - src/index.ts     -> imports this file (registering the custom element) and
 *                         re-exports the class as the federated module.
 * The host loads your `remoteEntry.js` at runtime, imports the exposed module
 * (which calls `customElement('imaging-widget')` and registers the tag), then
 * creates `<imaging-widget>` in its own DOM and feeds it the properties below.
 *
 * To ship your OWN widget:
 *   1. Rename the tag in the @customElement(...) decorator below (must be unique,
 *      kebab-case, and contain a hyphen — a Custom Elements requirement).
 *   2. Keep the same `declare global` augmentation in sync with that tag name.
 *   3. Update `name`/`exposes` in vite.config.ts and the entry file in src/.
 *   4. Replace render() and the private methods with your own implementation.
 *
 * HOW DATA FLOWS IN
 * -----------------
 * The host passes data by setting DOM *properties* on the element instance
 * (e.g. `el.context = {...}`, `el.imaging = {...}`), NOT HTML attributes —
 * objects and functions cannot be expressed as attribute strings. Lit's
 * @property() decorator makes each field reactive: assigning to it re-renders
 * the widget automatically. Primitive props (id, name) can also be set as
 * attributes from markup, but the host normally sets everything as properties.
 *
 * HOW DATA FLOWS OUT / CALLING YOUR BACKEND
 * -----------------------------------------
 * The widget never receives raw credentials. To call an API on the patient's
 * behalf it asks the host for a short-lived, scoped token via the injected
 * `onRequestToken(detail)` callback (see _analyzeImages below), then sends that
 * token as a Bearer header to your own service (`settings.apiUrl`). Modal
 * open/close is signalled back to the host via `onOpenModal` / `onCloseModal`
 * so the host can expand the widget to full screen.
 *
 * The exact shape of every property and callback is defined in the shared
 * contract package `@acuitas/shared` (see acuitas-shared/src/types.ts).
 * ========================================================================== */

// `@customElement` registers this class under the HTML tag `<imaging-widget>`.
// Change this tag name (and the HTMLElementTagNameMap entry at the bottom of the
// file) when you create your own widget. The host references the widget by this tag.
@customElement('imaging-widget')
export class ImagingWidget extends LitElement {
  /* ---------------------------------------------------------------------------
   * PROPERTIES — the host ↔ widget contract
   * ---------------------------------------------------------------------------
   * Every field decorated with @property() is part of the public API the host
   * sets on the element. These are the inputs your widget can rely on. The types
   * (PluginContext, ScreenContext, etc.) come from `@acuitas/shared` — treat that
   * package as the source of truth and do not diverge from it, or the host will
   * fail to bind your widget. The default values below are only placeholders used
   * when the widget runs standalone (e.g. in index.html during development).
   * ------------------------------------------------------------------------- */

  // Unique id of THIS widget instance, assigned by the host. Echo it back in
  // any callback payloads so the host can correlate the request to the instance.
  @property()
  id: string = '';

  // Human-readable widget name shown in the header / supplied by the host config.
  @property()
  name: string = '';

  // Where the widget is running and for whom. `environment` lets you switch API
  // endpoints; customerId/siteId/staffId identify the logged-in clinical context.
  // Never use these to fetch data directly — pass them through onRequestToken so
  // the host can authorise the request.
  @property({ type: Object })
  context: PluginContext = {
    environment: 'SANDBOX',
    customerId: '',
    siteId: '',
    staffId: ''
  };

  // The host screen this instance is mounted on, plus the size budget you must
  // render within (maxWidth/maxHeight, in px). `view` tells you which screen
  // (e.g. MEDICAL_IMAGES vs PATIENT) so one widget can adapt to several slots.
  @property({ type: Object })
  screen: ScreenContext = {
    view: 'MEDICAL_IMAGES',
    maxWidth: 400,
    maxHeight: 600
  };

  // Free-form key/value configuration the host injects for your plugin
  // (set up per customer in the Marketplace). This sample reads `settings.apiUrl`
  // to know where your backend lives — define whatever keys you need here.
  @property({ type: Object })
  settings: PluginSettings = {};

  // Domain data for the imaging screen: the patient id, the list of available
  // images, and which image the host currently has selected. This is the
  // imaging-specific payload; a patient widget would receive `patient` instead.
  @property({ type: Object })
  imaging: ImagingProps = {
    patientId: '',
    images: [],
    selectedImage: null
  };

  // Callback injected by the host. Call it to ask the host to expand this widget
  // into a full-screen modal. The host responds by setting `isModalOpen = true`.
  @property({ type: Function })
  onOpenModal: ((detail: ModalEventDetail) => void) | undefined;

  // Callback injected by the host. Call it to tell the host you want the modal
  // closed; the host responds by setting `isModalOpen = false`.
  @property({ type: Function })
  onCloseModal: ((detail: ModalEventDetail) => void) | undefined;

  // Callback injected by the host — the ONLY way to obtain credentials. You tell
  // the host which subject types/ids you need access to; it returns a short-lived
  // scoped bearer token you then send to your own API. See _analyzeImages below.
  @property({ type: Function })
  onRequestToken: ((detail: TokenRequestDetail) => Promise<TokenRequestResponse>) | undefined;

  // Driven by the host. true while the widget is shown full-screen — use it to
  // switch between the compact (in-place) layout and the expanded modal layout.
  @property({ type: Boolean })
  isModalOpen: boolean = false;

  // Internal UI state for this sample (toggles the debug "info" panel). Not part
  // of the host contract — safe to remove in your own widget.
  @property({ type: Boolean })
  showInfoMenu: boolean = false;

  // Escape hatch for any extra host-provided props not covered above. Reserved
  // for forward compatibility; ignore it unless the host documents a key you need.
  @property({ type: Object })
  additionalProps: Record<string, any> = {};

  // Lit calls render() whenever a reactive @property changes. Return a Lit
  // `html` template describing the UI; Lit diffs it into the shadow DOM for you.
  // This is the main method you will replace with your own markup. Everything it
  // references (this.imaging, this.isModalOpen, ...) is the host-provided state above.
  render() {
    // Respect the host's size budget when inline; fill the screen when in a modal.
    const containerStyle = this.isModalOpen
      ? `max-width: 100%; max-height: 100%; overflow-y: auto;`
      : `max-width: ${this.screen.maxWidth}px; ${this.screen.maxHeight ? `max-height: ${this.screen.maxHeight}px;` : ''}`;

    return html`
      <div class="plugin-container" style="${containerStyle}">
        <div class="card">
          ${this.isModalOpen ? html`
            <div class="modal-header" style="position: sticky; top: 0; z-index: 10;">
              <h3 class="mb-0">${this.name || 'Imaging Widget'}</h3>
              <button class="btn btn-icon" @click=${this._closeModal} title="Close modal" style="font-size: 1.1rem; line-height: 1;">✕</button>
            </div>
          ` : ''}

          <div class="card-body">
            <!-- Imaging Information: show only selected image id in default view -->
            <div class="mb-sm">
              <strong>Selected Image:</strong>
              <div class="text-small px-sm">
                ${this.imaging.selectedImage ? html`<div>${this.imaging.selectedImage.fileName}</div>` : html`<div>No image selected</div>`}
              </div>
            </div>

            ${!this.isModalOpen ? html`
            <div class="mb-sm">
              <button class="btn btn-icon" @click=${() => (this.showInfoMenu = !this.showInfoMenu)} title="Show details">ℹ️</button>
            </div>` : ''}

            <!-- Hidden info menu -->
            ${this.showInfoMenu ? html`
              <div class="mb-sm p-xs bg-muted">
                <strong>Plugin ID:</strong> <code>${this.id}</code>
                <div class="mt-xs">
                  <strong>Context:</strong>
                  <div class="text-small text-secondary px-sm">
                    <div>Customer: ${this.context.customerId}</div>
                    <div>Site: ${this.context.siteId}</div>
                    <div>Staff: ${this.context.staffId}</div>
                    <div>View: ${this.screen.view}</div>
                  </div>
                </div>

                <div class="mt-xs">
                  <strong>Images (${this.imaging.images.length}):</strong>
                  <div class="image-list">
                    ${this.imaging.images.map(image => html`
                      <div class="image-item">
                        <span class="text-small">📷 ${image.fileName}</span>
                      </div>
                    `)}
                  </div>
                </div>

                ${Object.keys(this.settings).length > 0 ? html`
                  <div class="mt-xs">
                    <strong>Settings:</strong>
                    <div class="settings-list">
                      ${Object.entries(this.settings).map(([key, value]) => html`
                        <div class="setting-item">
                          <span class="text-small text-secondary">${key}:</span>
                          <span class="text-small">${value}</span>
                        </div>
                      `)}
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Controls -->
            ${!this.isModalOpen ? html`
            <div class="d-flex gap-2">
              <button
                class="btn btn-primary"
                @click=${this._analyzeImages}
                ?disabled=${this.imaging.images.length === 0 || !this.imaging.selectedImage}
              >
                🧠 Analyze Image
              </button>
            </div>` : ''}

            <!-- Modal (detailed report) -->
            ${this.isModalOpen && (this as any).__modalPayload ? html`
              <div class="modal-backdrop">
                <div class="modal card" style="max-width:100%; max-height:90%; overflow:auto;">
                  <div class="card-header">
                    <h4>Detailed Report</h4>
                  </div>
                  <div class="card-body">
                    <pre class="mt-sm text-small bg-muted p-xs" style="white-space:pre-wrap;">${(this as any).__modalPayload.detailedReport}</pre>
                  </div>
                </div>
              </div>
            ` : ''}

            ${this._renderAnalysisPreview()}

          </div>
        </div>
      </div>
    `;
  }

  private _renderAnalysisPreview() {
    const analysis = (this as any).__analysis;
    if (!analysis || !analysis.imageData) return html``;

    return html`
      <div class="mt-sm">
        <strong>Scan:</strong>
        <div class="mt-xs">
          <img src="data:${analysis.imageMimeType};base64, ${analysis.imageData}" alt="analysis-preview" style="max-width:100%; height:auto; border:1px solid #ccc;" />
        </div>
        <div class="mt-xs text-small">Summary: ${analysis.summary}</div>
        ${this.isModalOpen ? html`` : html`<button class="btn btn-secondary" @click=${this._openDetailedReport}>📄 Show Detailed Report</button>`}
      </div>
    `;
  }

  /**
   * Builds the payload sent to the host on every modal open/close callback so
   * the host knows which plugin instance and context the request came from.
   */
  private _createModalEventDetail(): ModalEventDetail {
    return {
      pluginId: this.id,
      pluginName: this.name,
      context: this.context
    };
  }

  // ===========================================================================
  // REFERENCE: the token-then-call-your-API pattern
  // ===========================================================================
  // This is the canonical way a widget reaches a backend. The widget holds no
  // credentials of its own — it asks the host for a token scoped to exactly the
  // subjects it needs, then calls its own service with that token. Copy this
  // shape for any data your widget needs to fetch.
  private async _analyzeImages() {
    // Nothing to do without a selected image, and we can't authorise without the
    // host's token callback — bail out early in both cases.
    if (!this.imaging.selectedImage) return;

    if (!this.onRequestToken) return;

    // STEP 1: ask the host for a scoped, short-lived token. Declare which subject
    // TYPES and IDS you need; the host mints a token granting only that access.
    const tokenResponse = await this.onRequestToken({
      pluginId: this.id,
      pluginName: this.name,
      context: this.context,
      subjectTypes: ['MEDICAL-IMAGE', 'PATIENT-DETAILS', 'CONFIGURATION-CAMERA'],
      subjectIds: [this.imaging.patientId, this.imaging.selectedImage.id],
    });

    // STEP 2: call YOUR backend. Its base URL comes from host-supplied settings.
    const apiUrl = this.settings.apiUrl || 'http://localhost:3001';
    try {
      const result = await this._fetchImageAnalysis(tokenResponse.token, apiUrl, this.imaging.selectedImage.id);
      console.log('Analysis result', result);
      // Store the image data and a random summary in a private field
      (this as any).__analysis = {
        imageData: result.data?.originalFile || null,
        imageMimeType: result.data?.fileMimeType || 'image/jpeg',
        summary: this._randomShortSummary(),
        detailedReport: this._randomDetailedReport()
      };
      this.requestUpdate();
    } catch (err) {
      console.error('Analysis failed', err);
    }
  }

  // STEP 3: the actual HTTP call to your service. The host token goes in the
  // Authorization header as a Bearer token; your backend validates it before
  // returning data. Swap this URL/shape for your own endpoint.
  private async _fetchImageAnalysis(token: string, apiUrl: string, imageId: string) {
    const response = await fetch(`${apiUrl}/api/images/${imageId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  private _randomShortSummary() {
    const options = [
      'No immediate concerns detected.',
      'Minor irregularities found — recommend follow-up.',
      'Signs consistent with early-stage condition — monitor closely.',
      'Image appears normal for patient age.'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  private _randomDetailedReport() {
    const checks = [
      { check: 'Macula', result: 'Normal' },
      { check: 'Optic Nerve Head', result: 'Slight cupping' },
      { check: 'Retinal Vessels', result: 'Normal' },
      { check: 'Hemorrhages', result: 'None detected' },
      { check: 'Exudates', result: 'Trace exudates' }
    ];
    // pick 3 checks randomly
    const shuffled = checks.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(c => `${c.check}: ${c.result}`).join('\n');
  }

  // Notify the host we want to collapse back to inline, then update local state.
  private _closeModal() {
    this.isModalOpen = false;
    (this as any).__modalPayload = null;
    if (this.onCloseModal) this.onCloseModal(this._createModalEventDetail());
    this.requestUpdate();
  }

  // Ask the host to expand us to full screen, then render the detailed report.
  private _openDetailedReport() {
    // open modal and populate modal content from analysis
    const analysis = (this as any).__analysis;
    if (!analysis) return;
    this.isModalOpen = true;
    if (this.onOpenModal) this.onOpenModal(this._createModalEventDetail());
    // attach modal payload to a private field for rendering
    (this as any).__modalPayload = analysis;
    this.requestUpdate();
  }

  // Styles are scoped to this element's Shadow DOM, so they cannot leak into the
  // host page and the host's CSS cannot leak in. We load the shared Acuitas
  // design-system CSS plus a few local overrides. Both are imported `?inline`
  // (as raw strings) and wrapped with unsafeCSS so Lit can adopt them.
  static styles = [unsafeCSS(styles), unsafeCSS(localStyles)];
}

// Tells TypeScript that `<imaging-widget>` maps to this class (gives callers
// type-safe access to the properties above). Keep the tag here identical to the
// one in the @customElement(...) decorator at the top of the file.
declare global {
  interface HTMLElementTagNameMap {
    'imaging-widget': ImagingWidget;
  }
}
