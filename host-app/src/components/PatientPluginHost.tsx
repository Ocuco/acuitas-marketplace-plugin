import React from 'react'
import { createPortal } from 'react-dom'
import { ModalEventDetail, PluginProps, TokenRequestDetail } from '@acuitas/shared'
import { PatientWebComponentWrapper } from '../PatientWebComponentWrapper'
import { PluginPlacement } from '../config/plugin-placements'

import {
  __federation_method_getRemote as getRemote,
  __federation_method_setRemote as setRemote,
  // @ts-expect-error - __federation__ is a virtual module provided by the federation plugin at build time
} from '__federation__'

type RemoteWidgetType = React.ComponentType<any>

interface PatientPluginHostProps {
  /** Placement describing the remote and where it renders */
  placement: PluginPlacement;

  /** Patient identifier passed to the plugin */
  patientId: string;
}

/**
 * Loads a federated patient plugin described by a PluginPlacement and renders
 * it with the props derived from that placement.
 *
 * The plugin can request a full-screen modal via the onOpenModal callback. As
 * with the imaging widget (see RightPanel.tsx), a single shared instance is
 * rendered into a movable DOM node that is physically relocated between the
 * in-panel host container and the modal overlay when the modal opens/closes.
 * Moving (rather than re-rendering) the instance preserves the plugin's
 * internal state (e.g. the fetched patient details) across the transition.
 */
const PatientPluginHost: React.FC<PatientPluginHostProps> = ({ placement, patientId }) => {
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

        // Load the web component class to register the custom element
        await getRemote(remote.name, remote.module)

        setRemoteComponent(() => PatientWebComponentWrapper)
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
      view: 'PATIENT',
      section,
      maxWidth: section === 'MAIN' ? 600 : 400,
      maxHeight: 600,
    },
    settings: {
      'api-key': '<api key>',
    },
    patient: {
      patientId,
    },
    onOpenModal: handleOpenModal,
    onCloseModal: handleCloseModal,
    onRequestToken: handleRequestToken,
  }

  // Refs and portal node for a single shared instance of the remote plugin
  const remoteNodeRef = React.useRef<HTMLDivElement | null>(null)
  const hostContainerRef = React.useRef<HTMLDivElement | null>(null)
  const modalContentRef = React.useRef<HTMLDivElement | null>(null)
  const [portalReady, setPortalReady] = React.useState(false)

  // Create the movable portal node once
  React.useEffect(() => {
    const node = document.createElement('div')
    node.className = 'remote-app-wrapper'
    remoteNodeRef.current = node
    // trigger a re-render so createPortal can run after the node exists
    setPortalReady(true)
    return () => {
      if (remoteNodeRef.current && remoteNodeRef.current.parentNode) {
        remoteNodeRef.current.parentNode.removeChild(remoteNodeRef.current)
      }
      remoteNodeRef.current = null
      setPortalReady(false)
    }
  }, [])

  // Move the portal node between the in-panel host container and the modal
  // content when the modal state changes.
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
    borderRadius: '0',
    padding: '0',
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

      {/* In-panel host container where the shared instance mounts when the modal is closed */}
      <div ref={hostContainerRef} className="remote-host" />

      {/* Full-screen modal */}
      <div style={modalStyle}>
        <div style={modalContentStyle} ref={modalContentRef} />
      </div>

      {/* Single shared instance rendered into the movable DOM node */}
      {portalReady && RemoteComponent && remoteNodeRef.current && createPortal(
        <RemoteComponent {...pluginProps} isModalOpen={isModalOpen} />,
        remoteNodeRef.current
      )}
    </>
  )
}

export default PatientPluginHost
