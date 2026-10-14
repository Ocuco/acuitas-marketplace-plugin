import { LitElement, html, unsafeCSS } from 'lit'
import type { PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { PluginContext, PluginSettings, ScreenContext, SaleProps, ModalEventDetail, TokenRequestDetail, TokenRequestResponse } from '@acuitas/shared'
import styles from '@acuitas/shared/css/acuitas-design-system.css?inline';
import localStyles from './index.css?inline';

/* =============================================================================
 * checkout-widget — a sample Acuitas Marketplace plugin (CHECKOUT screen)
 * =============================================================================
 *
 * A worked example for the CHECKOUT / new-sale screen. It renders as a
 * FULL-WIDTH banner directly under the cart line items (like an "add product
 * protection" bar) and demonstrates the A3 ACP-4135 partner dynamically-priced
 * line flow:
 *
 *  1. onRequestToken({ subjectTypes: ['SALE'], subjectIds: [saleId] }) — a
 *     sale-scoped PST from the host.
 *  2. POST that PST to the partner's OWN backend (api-server), which (via the
 *     Marketplace API) calls A3's POST api/sales/{saleId}/partnerLine.
 *  3. onRequestRefresh() so the host refetches the sale and the total updates.
 *
 * Whether the plugin's product is ALREADY in the cart — and the cart line count — come from the
 * host via the `sale` prop (sale.cartProductIds / sale.cartItemCount). The host keeps these in
 * sync with the cart including un-saved local edits, so the plugin reflects the user adding or
 * removing lines immediately, without re-reading the persisted sale.
 * ========================================================================== */

interface AddedLine {
  productName: string;
  unitPrice: number;
  currencyCode: string;
  saleId: string;
}

@customElement('checkout-widget')
export class CheckoutWidget extends LitElement {
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
    view: 'CHECKOUT',
    maxWidth: 400
  };

  @property({ type: Object })
  settings: PluginSettings = {};

  @property({ type: Object })
  sale: SaleProps = {
    saleId: ''
  };

  @property({ type: Function })
  onOpenModal: ((detail: ModalEventDetail) => void) | undefined;

  @property({ type: Function })
  onCloseModal: ((detail: ModalEventDetail) => void) | undefined;

  @property({ type: Function })
  onRequestToken: ((detail: TokenRequestDetail) => Promise<TokenRequestResponse>) | undefined;

  @property({ type: Function })
  onRequestRefresh: (() => void) | undefined;

  @property({ type: Boolean })
  isModalOpen: boolean = false;

  @property({ type: Object })
  additionalProps: Record<string, any> = {};

  @state()
  private _productName: string = 'Extended Warranty (24 months)';

  @state()
  private _unitPrice: number = 49.99;

  @state()
  private _loading: boolean = false;

  @state()
  private _error: string | null = null;

  @state()
  private _added: AddedLine | null = null;

  // Derive "is our product already in the cart" from the host-supplied cart contents, before each
  // render. This reflects the user adding/removing the line immediately (the host keeps the prop in
  // sync with the local cart), so the button disables when present and re-enables when removed.
  willUpdate(changed: PropertyValues) {
    if (changed.has('sale')) {
      this._added = this._isConfiguredProductInCart()
        ? {
            productName: this._productName,
            unitPrice: this._unitPrice,
            currencyCode: 'EUR',
            saleId: this.sale.saleId,
          }
        : null;
    }
  }

  /** True when the configured product id is one of the host cart's line product ids. */
  private _isConfiguredProductInCart(): boolean {
    const configuredProductId = this.settings.productId;
    if (!configuredProductId) {
      return false;
    }

    const target = configuredProductId.toLowerCase();
    return (this.sale.cartProductIds ?? []).some(id => (id ?? '').toLowerCase() === target);
  }

  render() {
    const canAdd = !this._loading && !!this.sale.saleId && !!this.onRequestToken;

    // Full-width green "product protection" banner.
    return html`
      <div
        style="
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 0.75rem 1rem;
          background: #e8f5e9;
          border: 1px solid #b7e0c0;
          border-left: 4px solid #1b7f3b;
          border-radius: 6px;
        "
      >
        <div style="flex: 1 1 240px; min-width: 220px;">
          <div style="font-weight: 600; color: #14532d;">
            🛡️ ${this.name || 'Product protection available'}
          </div>
          ${this.sale.saleId && this.sale.cartItemCount !== undefined ? html`
            <div style="font-size: 0.8rem; color: #3f6b4d;">
              Cart: ${this.sale.cartItemCount} item${this.sale.cartItemCount === 1 ? '' : 's'}
            </div>
          ` : ''}
          <div style="font-size: 0.8rem; color: #3f6b4d;">
            ${this._added
              ? html`Added <strong>${this._added.productName}</strong> — ${this._added.unitPrice.toFixed(2)} ${this._added.currencyCode}`
              : this.sale.saleId
                ? html`Add cover to this sale and the total updates automatically.`
                : html`Save the sale to add product protection.`}
          </div>
          ${this._error ? html`<div style="font-size: 0.8rem; color: #b00020;">${this._error}</div>` : ''}
        </div>

        ${!this._added ? html`
          <input
            style="width: 200px; padding: 0.3rem 0.4rem;"
            .value=${this._productName}
            ?disabled=${this._loading}
            @input=${(e: Event) => { this._productName = (e.target as HTMLInputElement).value; }}
          />
          <input
            style="width: 90px; padding: 0.3rem 0.4rem;"
            type="number"
            step="0.01"
            .value=${String(this._unitPrice)}
            ?disabled=${this._loading}
            @input=${(e: Event) => { this._unitPrice = parseFloat((e.target as HTMLInputElement).value) || 0; }}
          />
        ` : ''}

        <button
          style="
            padding: 0.45rem 0.9rem;
            border: none;
            border-radius: 4px;
            background: #1b7f3b;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            opacity: ${canAdd || this._added ? '1' : '0.5'};
          "
          @click=${this._added ? this._openModal : this._addSaleLine}
          ?disabled=${!this._added && !canAdd}
        >
          ${this._loading ? 'Adding…' : this._added ? 'View line' : '➕ Add product protection'}
        </button>
      </div>

      ${this.isModalOpen && this._added ? this._renderModal(this._added) : ''}
    `;
  }

  private _renderModal(line: AddedLine) {
    return html`
      <div class="modal-backdrop">
        <div class="modal card" style="max-width:100%; max-height:90%; overflow:auto;">
          <div class="card-header"><h4>Added line</h4></div>
          <div class="card-body">
            ${this._detailRow('Product', line.productName)}
            ${this._detailRow('Price (incl. VAT)', `${line.unitPrice.toFixed(2)} ${line.currencyCode}`)}
            ${this._detailRow('Sale ID', line.saleId)}
            <button class="btn btn-secondary" @click=${this._closeModal}>Close</button>
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

  private _createModalEventDetail(): ModalEventDetail {
    return { pluginId: this.id, pluginName: this.name, context: this.context };
  }

  private _openModal() {
    this.isModalOpen = true;
    if (this.onOpenModal) this.onOpenModal(this._createModalEventDetail());
    this.requestUpdate();
  }

  private _closeModal() {
    this.isModalOpen = false;
    if (this.onCloseModal) this.onCloseModal(this._createModalEventDetail());
    this.requestUpdate();
  }

  // The token-then-call-your-API pattern for a partner sale line.
  private async _addSaleLine() {
    if (!this.sale.saleId) return;
    if (!this.onRequestToken) return;

    this._loading = true;
    this._error = null;

    try {
      // STEP 1: sale-scoped PST — access limited to this one sale.
      const tokenResponse = await this.onRequestToken({
        pluginId: this.id,
        pluginName: this.name,
        context: this.context,
        subjectTypes: ['SALE'],
        subjectIds: [this.sale.saleId],
      });

      // STEP 2 & 3: call YOUR backend with the host token; it adds the line.
      const apiUrl = this.settings.apiUrl || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/sales/${this.sale.saleId}/lines`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenResponse.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // The catalogue product the line is priced against, configured in the plugin settings.
          productId: this.settings.productId,
          productName: this._productName,
          unitPrice: this._unitPrice,
          currencyCode: 'EUR',
          quantity: 1,
          externalRef: `partner-${Date.now()}`,
          taxAmount: Number((this._unitPrice - this._unitPrice / 1.21).toFixed(2)),
          taxRate: 21,
          // Optional tax type from the plugin settings; omitted when not configured.
          taxTypeId: this.settings.taxTypeId || undefined,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Ask the host to re-hydrate the sale. The host then updates the cart contents it supplies
      // via the `sale` prop, and willUpdate() flips this widget to "added" — so we do not set the
      // added state optimistically here.
      if (this.onRequestRefresh) this.onRequestRefresh();
    } catch (err) {
      console.error('Failed to add sale line', err);
      this._error = err instanceof Error ? err.message : 'Failed to add sale line';
    } finally {
      this._loading = false;
    }
  }

  static styles = [unsafeCSS(styles), unsafeCSS(localStyles)];
}

declare global {
  interface HTMLElementTagNameMap {
    'checkout-widget': CheckoutWidget;
  }
}
