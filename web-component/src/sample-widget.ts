import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { PluginContext, PluginSettings, ScreenContext, ImagingProps, ModalEventDetail, TokenRequestDetail, TokenRequestResponse } from '@acuitas/shared'
import styles from '@acuitas/shared/css/acuitas-design-system.css?inline';

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
    images: [],
    selectedImage: null
  };

  @property({ type: Function})
  onOpenModal: ((detail: ModalEventDetail) => void) | undefined;

  @property({ type: Function})
  onCloseModal: ((detail: ModalEventDetail) => void) | undefined;

  @property({ type: Function })
  onRequestToken: ((detail: TokenRequestDetail) => TokenRequestResponse) | undefined;

  @property({ type: Boolean })
  isModalOpen: boolean = false;

  @property({ type: Object })
  additionalProps: Record<string, any> = {};

  render() {
    const containerStyle =
      this.isModalOpen ?
        `
        max-width: 100%;
        max-height: 100%;
      `
      :
      `
        max-width: ${this.screen.maxWidth}px;
        ${this.screen.maxHeight ? `max-height: ${this.screen.maxHeight}px;` : ''}
      `;

    return html`
      <div class="plugin-container" style="${containerStyle}">
        <div class="card">
          <div class="card-header">
            <h3 class="mb-0">${this.name || 'Sample Medical Widget'}</h3>
            <div class="d-flex align-center gap-2">
              <span class="badge ${this.context.environment === 'PRODUCTION' ? 'badge-success' : 'badge-warning'}">
                ${this.context.environment}
              </span>
            </div>
          </div>
          
          <div class="card-body">
            <!-- Plugin Information -->
            <div class="mb-sm">
              <strong>Plugin ID:</strong> <code>${this.id}</code>
            </div>
            
            <!-- Context Information -->
            <div class="mb-sm">
              <strong>Context:</strong>
              <div class="text-small text-secondary px-sm">
                <div>Customer: ${this.context.customerId}</div>
                <div>Site: ${this.context.siteId}</div>
                <div>Staff: ${this.context.staffId}</div>
                <div>View: ${this.screen.view}</div>
              </div>
            </div>

            <!-- Imaging Information -->
            ${this.imaging.images.length > 0 ? html`
              <div class="mb-sm">
                <strong>Images (${this.imaging.images.length}):</strong>
                <div class="image-list">
                  ${this.imaging.images.map(image => html`
                    <div class="image-item">
                      <span class="text-small">📷 ${image.id} (${image.fileName})</span>
                    </div>
                  `)}
                </div>
              </div>
            ` : html`
              <div class="mb-sm">
                <span class="text-secondary">No images available</span>
              </div>
            `}

            <!-- Plugin Settings -->
            ${Object.keys(this.settings).length > 0 ? html`
              <div class="mb-sm">
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

            <!-- Modal Controls -->
            <div class="d-flex gap-2">
              ${!this.isModalOpen ? html`
                <button 
                  class="btn btn-primary" 
                  @click=${this._openModal}
                >
                  🔍 Open Full Screen Analysis
                </button>
              ` : html`
                <button 
                  class="btn btn-primary" 
                  @click=${this._closeModal}
                >
                  ❌ Close Modal
                </button>
              `}
              
              <button 
                class="btn btn-secondary"
                @click=${this._analyzeImages}
                ?disabled=${this.imaging.images.length === 0}
              >
                🧠 Analyze Images
              </button>
            </div>

            <!-- Status Information -->
            <div class="mt-sm p-xs bg-secondary text-small">
              Modal: ${this.isModalOpen ? 'Open' : 'Closed'} | 
              Images: ${this.imaging.images.length} | 
              Max Size: ${this.screen.maxWidth}×${this.screen.maxHeight || 'auto'}px
            </div>
          </div>
        </div>
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

  /**
   * Dispatches a standardized modal opened event
   */
  private _openModal() {
    if(this.onOpenModal) { 
      this.onOpenModal(this._createModalEventDetail());
    }
  }

  /**
   * Dispatches a standardized modal closed event
   */
  private _closeModal() {
    if(this.onCloseModal) { 
      this.onCloseModal(this._createModalEventDetail());
    }
  }

  private _analyzeImages() {
    // First we have to request the token to access the images  
    if(this.onRequestToken) { 
      const token = this.onRequestToken({
        pluginId: this.id,
        pluginName: this.name,
        context: this.context,
        subjectType: 'MEDICAL-IMAGE',
        subjectIds: this.imaging.selectedImage ? [this.imaging.selectedImage.id] : this.imaging.images.map(img => img.id),
      });
      console.log('Token received:', token);
      // Pass this token to your backend API to be used as the bearer token when calling the Acuitas Marketplace Public API
      // TODO: add your API call here and handle the response
    }
  }

  static styles = unsafeCSS(styles);
}

declare global {
  interface HTMLElementTagNameMap {
    'sample-widget': SampleWidget;
  }
}
