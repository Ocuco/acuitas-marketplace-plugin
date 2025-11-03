import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { PluginContext, PluginSettings, ScreenContext, ImagingProps, ModalEventDetail, TokenRequestDetail, TokenRequestResponse } from '@acuitas/shared'
import styles from '@acuitas/shared/css/acuitas-design-system.css?inline';
// local styles for the web-component (ensure pre styling applies inside shadow DOM)
import localStyles from './index.css?inline';

@customElement('sample-widget')
export class SampleWidget extends LitElement {
  @property()
  id: string = '';

  @property()
  name: string = '';

  @property({ type: Object })
  context: PluginContext = {
    environment: 'SANDBOX',
    customerId: '',
    siteId: '',
    staffId: ''
  };

  @property({ type: Object })
  screen: ScreenContext = {
    view: 'MEDICAL_IMAGES',
    maxWidth: 400,
    maxHeight: 600
  };

  @property({ type: Object })
  settings: PluginSettings = {};

  @property({ type: Object })
  imaging: ImagingProps = {
    patientId: '',
    images: [],
    selectedImage: null
  };

  @property({ type: Function })
  onOpenModal: ((detail: ModalEventDetail) => void) | undefined;

  @property({ type: Function })
  onCloseModal: ((detail: ModalEventDetail) => void) | undefined;

  @property({ type: Function })
  onRequestToken: ((detail: TokenRequestDetail) => TokenRequestResponse) | undefined;

  @property({ type: Boolean })
  isModalOpen: boolean = false;

  @property({ type: Boolean })
  showInfoMenu: boolean = false;

  @property({ type: Object })
  additionalProps: Record<string, any> = {};

  render() {
    const containerStyle = this.isModalOpen ? `max-width: 100%; max-height: 100%;` : `max-width: ${this.screen.maxWidth}px; ${this.screen.maxHeight ? `max-height: ${this.screen.maxHeight}px;` : ''}`;

    return html`
      <div class="plugin-container" style="${containerStyle}">
        <div class="card">
          <div class="card-header">
            <h3 class="mb-0">${this.name || 'Sample Medical Widget'}</h3>
            <div class="d-flex align-center gap-2">
              <span class="badge ${this.context.environment === 'PRODUCTION' ? 'badge-success' : 'badge-warning'}">
                ${this.context.environment}
              </span>
              <!-- Info icon toggles the hidden menu -->
              <button class="btn btn-icon" @click=${() => (this.showInfoMenu = !this.showInfoMenu)} title="Show details">ℹ️</button>
            </div>
          </div>
          
          <div class="card-body">
            <!-- Imaging Information: show only selected image id in default view -->
            <div class="mb-sm">
              <strong>Selected Image:</strong>
              <div class="text-small px-sm">
                ${this.imaging.selectedImage ? html`<div>${this.imaging.selectedImage.fileName}</div>` : html`<div>No image selected</div>`}
              </div>
            </div>

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
   * Creates a standardized modal event detail payload
   */
  private _createModalEventDetail(): ModalEventDetail {
    return {
      pluginId: this.id,
      pluginName: this.name,
      context: this.context
    };
  }

  private async _analyzeImages() {
    // Request a token and call API for the selected image
    if (!this.imaging.selectedImage) return;

    if (!this.onRequestToken) return;

    const tokenResponse = this.onRequestToken({
      pluginId: this.id,
      pluginName: this.name,
      context: this.context,
      subjectTypes: ['MEDICAL-IMAGE', 'PATIENT-DETAILS', 'CONFIGURATION-CAMERA'],
      subjectIds: [this.imaging.patientId, this.imaging.selectedImage.id],
    });

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

  static styles = [unsafeCSS(styles), unsafeCSS(localStyles)];
}

declare global {
  interface HTMLElementTagNameMap {
    'sample-widget': SampleWidget;
  }
}
