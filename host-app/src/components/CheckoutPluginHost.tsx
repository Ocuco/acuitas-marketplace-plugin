import React from 'react'
import { createPortal } from 'react-dom'
import { ModalEventDetail, PluginProps, TokenRequestDetail } from '@acuitas/shared'
import { CheckoutWebComponentWrapper } from '../CheckoutWebComponentWrapper'
import { PluginPlacement } from '../config/plugin-placements'

import {
  __federation_method_getRemote as getRemote,
  __federation_method_setRemote as setRemote,
  // @ts-expect-error - __federation__ is a virtual module provided by the federation plugin at build time
} from '__federation__'

type RemoteWidgetType = React.ComponentType<any>

interface CheckoutPluginHostProps {
  /** Placement describing the remote and where it renders */
  placement: PluginPlacement;

  /** Open sale identifier passed to the plugin */
  saleId: string;

  /** Total cart line items on the sale (picked products + any added partner line), for `sale`. */
  cartItemCount: number;

  /** The catalogue product id the plugin is priced against; also what a matched cart line carries. */
  productId: string;

  /** Whether the (mocked) partner line has been added to the sale — drives sale.cartProductIds. */
  added: boolean;

  /** Called when the plugin asks the host to refresh after adding its line. */
  onPartnerLineAdded: () => void;
}

/**
 * Loads a federated checkout plugin and renders it. The MAIN placement is a
 * full-width band under the cart items (the plugin styles itself, e.g. as a
 * green "product protection" bar), mirroring A3's in-cart marketplace zone.
 */
const CheckoutPluginHost: React.FC<CheckoutPluginHostProps> = ({ placement, saleId, cartItemCount, productId, added, onPartnerLineAdded }) => {
  const { remote, section } = placement
  const [RemoteComponent, setRemoteComponent] = React.useState<RemoteWidgetType | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  React.useEffect(() => {
    const loadRemote = async () => {
      try {
        setLoading(true)
        setError(null)

        setRemote(remote.name, {
          url: () => Promise.resolve(remote.url),
          format: 'esm',
          from: 'vite',
        })

        await getRemote(remote.name, remote.module)

        setRemoteComponent(() => CheckoutWebComponentWrapper)
      } catch (err) {
        console.error('Failed to load remote module:', err instanceof Error ? err.message : 'Failed to load remote module')
        setError(err instanceof Error ? err.message : 'Failed to load remote module')
      } finally {
        setLoading(false)
      }
    }

    loadRemote()
  }, [remote.url, remote.name, remote.module])

  const handleOpenModal = (detail: ModalEventDetail) => {
    console.log('Modal opened', JSON.stringify(detail))
    setIsModalOpen(true)
  }

  const handleCloseModal = (detail: ModalEventDetail) => {
    console.log('Modal closed', JSON.stringify(detail))
    setIsModalOpen(false)
  }

  const handleRequestToken = async (detail: TokenRequestDetail) => {
    console.log('Token requested', JSON.stringify(detail))
    return {
      detail: {
        pluginId: detail.pluginId,
        pluginName: detail.pluginName,
        context: detail.context,
        subjectTypes: detail.subjectTypes,
        subjectIds: detail.subjectIds,
      },
      token: import.meta.env.VITE_PST || 'no VITE_PST environment variable exists or no value set',
    }
  }

  // In A3 this refetches the open sale so the cart reflects the added line. A3 is mocked here, so
  // tell the dashboard to record the partner line — the updated `sale` prop (and the cart/totals)
  // then reflect it, flipping the plugin to its "added" state, mirroring A3.
  const handleRequestRefresh = () => {
    console.log('Cart refresh requested for sale', saleId)
    onPartnerLineAdded()
  }

  const pluginProps: PluginProps = {
    id: placement.pluginId,
    name: placement.pluginName,
    context: {
      environment: 'SANDBOX',
      customerId: 'CUSTOMER_001',
      siteId: 'SITE_MAIN',
      staffId: 'STAFF_001',
    },
    screen: {
      view: 'CHECKOUT',
      section,
      // MAIN is a full-width band under the cart items; the widget sizes itself.
      maxWidth: section === 'MAIN' ? 1600 : 400,
      maxHeight: 600,
    },
    settings: {
      'api-key': '<api key>',
      // Catalogue product the partner line is priced against. The plugin matches this against the
      // cart's product ids to know whether its line is already added, so it must equal the id the
      // host records on that line (see productId prop / MOCK_PARTNER_LINE in CheckoutDashboard).
      productId,
      // Optional A3 tax type the line's VAT is recorded against.
      taxTypeId: import.meta.env.VITE_CHECKOUT_TAX_TYPE_ID || '',
    },
    sale: {
      saleId,
      // Cart contents the plugin reads to know whether its product is already added and how many
      // items the cart holds. Driven by the dashboard's mocked add, as A3 does after a refetch.
      cartProductIds: added ? [productId] : [],
      cartItemCount,
    },
    onOpenModal: handleOpenModal,
    onCloseModal: handleCloseModal,
    onRequestToken: handleRequestToken,
    onRequestRefresh: handleRequestRefresh,
  }

  const remoteNodeRef = React.useRef<HTMLDivElement | null>(null)
  const hostContainerRef = React.useRef<HTMLDivElement | null>(null)
  const modalContentRef = React.useRef<HTMLDivElement | null>(null)
  const [portalReady, setPortalReady] = React.useState(false)

  React.useEffect(() => {
    const node = document.createElement('div')
    node.className = 'remote-app-wrapper'
    node.style.width = '100%'
    remoteNodeRef.current = node
    setPortalReady(true)
    return () => {
      if (remoteNodeRef.current && remoteNodeRef.current.parentNode) {
        remoteNodeRef.current.parentNode.removeChild(remoteNodeRef.current)
      }
      remoteNodeRef.current = null
      setPortalReady(false)
    }
  }, [])

  React.useEffect(() => {
    const node = remoteNodeRef.current
    if (!node) return

    const target = isModalOpen ? modalContentRef.current : hostContainerRef.current

    if (target) {
      if (node.parentNode !== target) {
        target.appendChild(node)
      }
    } else if (node.parentNode) {
      node.parentNode.removeChild(node)
    }
  }, [isModalOpen, portalReady, RemoteComponent])

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
    display: isModalOpen ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0',
    boxSizing: 'border-box',
  }

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    width: '90vw',
    height: '90vh',
    position: 'relative',
    overflow: 'auto',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  }

  return (
    <>
      {loading && <div>Loading remote component...</div>}
      {error && <div>Error loading remote component: {error}</div>}

      {/* Full-width in-cart host container where the shared instance mounts when the modal is closed */}
      <div ref={hostContainerRef} className="remote-host" style={{ width: '100%' }} />

      {/* Full-screen modal */}
      <div style={modalStyle}>
        <div style={modalContentStyle} ref={modalContentRef} />
      </div>

      {portalReady && RemoteComponent && remoteNodeRef.current && createPortal(
        <RemoteComponent {...pluginProps} isModalOpen={isModalOpen} />,
        remoteNodeRef.current
      )}
    </>
  )
}

export default CheckoutPluginHost
