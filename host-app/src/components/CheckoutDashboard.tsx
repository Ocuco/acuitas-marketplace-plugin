import { useState } from 'react'
import './PatientDashboard.css'
import CheckoutPluginHost from './CheckoutPluginHost'
import { getPlacementsForScreen } from '../config/plugin-placements'

// A picked product line in the selection step. productId is intentionally omitted — the
// Marketplace API fills it (and any other missing detail) from its configured dev defaults,
// so the shell never needs real A3 product GUIDs.
interface ProductLine {
  key: string
  productType: 'Spectacle' | 'ContactLens'
  productName: string
  unitPrice: number
  quantity: number
  selected: boolean
}

// Defaulted product lines, so opening a sale is a one-click affair during development.
const DEFAULT_PRODUCT_LINES: ProductLine[] = [
  { key: 'spec', productType: 'Spectacle', productName: 'Sample Spectacle', unitPrice: 199.0, quantity: 1, selected: true },
  { key: 'cl', productType: 'ContactLens', productName: 'Sample Contact Lens', unitPrice: 49.0, quantity: 1, selected: false },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const HOST_PST = import.meta.env.VITE_PST || ''

// The partner line the checkout plugin adds. In real A3 these details come back in the refetched
// open sale; A3 is mocked here, so the host supplies them for the cart panel, totals and the `sale`
// prop. productId must match what the plugin sends as settings.productId (both default to the same
// value) so the plugin recognises its own line in the cart; name/price match the widget defaults.
const MOCK_PARTNER_LINE = {
  productId: import.meta.env.VITE_CHECKOUT_PRODUCT_ID || 'f0000000-0000-4000-8000-000000000001',
  productName: 'Extended Warranty (24 months)',
  unitPrice: 49.99,
  currencyCode: 'EUR',
}

type Phase = 'select' | 'opening' | 'checkout'

function CheckoutDashboard() {
  const [phase, setPhase] = useState<Phase>('select')
  const [products, setProducts] = useState<ProductLine[]>(DEFAULT_PRODUCT_LINES)
  const [saleId, setSaleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The mocked partner line added by the plugin (one per sale — the plugin re-adds are idempotent).
  const [partnerLineAdded, setPartnerLineAdded] = useState(false)

  const mainPlacement = getPlacementsForScreen('CHECKOUT').find(placement => placement.section === 'MAIN')

  const selectedProducts = products.filter(product => product.selected)
  const partnerLineValue = partnerLineAdded ? MOCK_PARTNER_LINE.unitPrice : 0
  const totalValue =
    selectedProducts.reduce((sum, product) => sum + product.unitPrice * product.quantity, 0) + partnerLineValue
  const vat = Number((totalValue - totalValue / 1.21).toFixed(2))

  const updateProduct = (key: string, patch: Partial<ProductLine>) =>
    setProducts(current => current.map(product => (product.key === key ? { ...product, ...patch } : product)))

  const openSale = async () => {
    setError(null)
    setPhase('opening')
    setPartnerLineAdded(false)
    try {
      const response = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${HOST_PST}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedProducts.map(product => ({
            productType: product.productType,
            productName: product.productName,
            unitPrice: product.unitPrice,
            quantity: product.quantity,
          })),
        }),
      })

      if (!response.ok) throw new Error(`Failed to open sale (HTTP ${response.status})`)

      const result = await response.json()
      const openedSaleId = result?.data?.saleId as string | undefined
      if (!openedSaleId) throw new Error('No saleId returned by the API')

      setSaleId(openedSaleId)
      setPhase('checkout')
    } catch (err) {
      console.error('Failed to open sale', err)
      setError(err instanceof Error ? err.message : 'Failed to open sale')
      setPhase('select')
    }
  }

  return (
    <main className="main-content bg-main p-md">
      <div className="content-header">
        <nav className="breadcrumb">
          <span className="text-secondary">Sale</span>
          <span className="text-secondary"> / </span>
          <span className="text-primary">New Sale</span>
        </nav>
      </div>

      {phase !== 'checkout' ? renderSelection() : renderCheckout()}
    </main>
  )

  function renderSelection() {
    return (
      <div className="patient-body">
        <div className="card">
          <div className="card-header"><h4>Select products</h4></div>
          <div className="card-body p-sm">
            <div className="text-secondary text-small mb-sm">
              Pick one or more products, then open the sale. Details are defaulted for development.
            </div>

            {products.map(product => (
              <div key={product.key} className="d-flex align-center gap-2" style={{ padding: '0.4rem 0' }}>
                <input
                  type="checkbox"
                  checked={product.selected}
                  disabled={phase === 'opening'}
                  onChange={event => updateProduct(product.key, { selected: event.target.checked })}
                />
                <div style={{ fontSize: '1.5rem' }}>{product.productType === 'ContactLens' ? '👁️' : '👓'}</div>
                <input
                  style={{ flex: 1, padding: '0.3rem 0.4rem' }}
                  value={product.productName}
                  disabled={phase === 'opening'}
                  onChange={event => updateProduct(product.key, { productName: event.target.value })}
                />
                <input
                  style={{ width: 90, padding: '0.3rem 0.4rem' }}
                  type="number"
                  step="0.01"
                  value={product.unitPrice}
                  disabled={phase === 'opening'}
                  onChange={event => updateProduct(product.key, { unitPrice: parseFloat(event.target.value) || 0 })}
                />
                <input
                  style={{ width: 60, padding: '0.3rem 0.4rem' }}
                  type="number"
                  min="1"
                  value={product.quantity}
                  disabled={phase === 'opening'}
                  onChange={event => updateProduct(product.key, { quantity: parseInt(event.target.value, 10) || 1 })}
                />
                <span className="text-secondary text-small">{product.productType}</span>
              </div>
            ))}

            {error && <div style={{ color: '#b00020', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</div>}

            <div style={{ marginTop: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={openSale}
                disabled={phase === 'opening' || selectedProducts.length === 0}
              >
                {phase === 'opening' ? 'Opening sale…' : 'Open sale'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderCheckout() {
    return (
      <>
        <div className="patient-body">
          {/* Cart line items (the A3 basket order rows) */}
          {selectedProducts.map(product => (
            <div key={product.key} className="card">
              <div className="card-body p-sm">
                <div className="d-flex align-center gap-2">
                  <div style={{ fontSize: '1.75rem' }}>{product.productType === 'ContactLens' ? '👁️' : '👓'}</div>
                  <div style={{ flex: 1 }}>
                    <div className="text-secondary text-small">Product</div>
                    <div className="text-primary">{product.productName}</div>
                    <div className="text-secondary text-small">{product.productType} × {product.quantity}</div>
                  </div>
                  <div className="text-primary" style={{ fontWeight: 600, width: 90, textAlign: 'right' }}>
                    {(product.unitPrice * product.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* The partner line added by the plugin (mocked — in A3 it comes from the open sale). */}
          {partnerLineAdded && (
            <div className="card">
              <div className="card-body p-sm">
                <div className="d-flex align-center gap-2">
                  <div style={{ fontSize: '1.75rem' }}>🛡️</div>
                  <div style={{ flex: 1 }}>
                    <div className="text-secondary text-small">Product protection</div>
                    <div className="text-primary">{MOCK_PARTNER_LINE.productName}</div>
                    <div className="text-secondary text-small">Partner line × 1</div>
                  </div>
                  <div className="text-primary" style={{ fontWeight: 600, width: 90, textAlign: 'right' }}>
                    {MOCK_PARTNER_LINE.unitPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full-width marketplace zone, directly UNDER the cart items and above the totals. */}
          {mainPlacement && saleId && (
            <div style={{ margin: '0.5rem 0' }}>
              <CheckoutPluginHost
                placement={mainPlacement}
                saleId={saleId}
                productId={MOCK_PARTNER_LINE.productId}
                added={partnerLineAdded}
                cartItemCount={selectedProducts.length + (partnerLineAdded ? 1 : 0)}
                onPartnerLineAdded={() => setPartnerLineAdded(true)}
              />
            </div>
          )}
        </div>

        {/* Totals footer */}
        <div className="card">
          <div className="card-body p-sm">
            <div className="d-flex justify-between" style={{ gap: '2rem' }}>
              <div className="text-secondary text-small">
                Total Value <strong className="text-primary">{totalValue.toFixed(2)}</strong>
              </div>
              <div className="text-secondary text-small">
                Discounts <strong className="text-primary">0.00</strong>
              </div>
              <div className="text-secondary text-small">
                Benefit <strong className="text-primary">0.00</strong>
              </div>
              <div className="text-secondary text-small">
                VAT <strong className="text-primary">{vat.toFixed(2)}</strong>
              </div>
              <div className="text-secondary text-small">
                Patient Total <strong className="text-primary">{totalValue.toFixed(2)}</strong>
              </div>
            </div>
            <div className="text-secondary text-small" style={{ marginTop: '0.4rem' }}>
              Sale ID: {saleId}
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default CheckoutDashboard
