import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './PartnerModulePage.css'
import { ModalEventDetail, PluginProps, TokenRequestDetail } from '@acuitas/shared'
import { DashboardWebComponentWrapper } from '../DashboardWebComponentWrapper'
import { getPlacementsForScreen } from '../config/plugin-placements'
import { SCREEN_ROUTES } from '../config/routes'

import {
  __federation_method_getRemote as getRemote,
  __federation_method_setRemote as setRemote,
  // @ts-expect-error - __federation__ is a virtual module provided by the federation plugin at build time
} from '__federation__'

type RemoteWidgetType = React.ComponentType<any>

/**
 * Full-page in-shell host for a partner module launched from a home-screen tile.
 *
 * This mirrors how Acuitas A3 renders a partner module: the tile navigates to a
 * dedicated route, the module loads under the persistent navigation bar (the
 * Header stays mounted by App.tsx), and a host-provided Close button returns the
 * user to the home dashboard. The module is isolated in its own web component and
 * only receives the context/props the host chooses to pass.
 */
const PartnerModulePage: React.FC = () => {
  const { pluginId } = useParams<{ pluginId: string }>()
  const navigate = useNavigate()

  const placement = getPlacementsForScreen('HOME').find(
    item => item.pluginId === pluginId,
  )

  const [RemoteComponent, setRemoteComponent] = React.useState<RemoteWidgetType | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Collapsible state for the configurable side panel (CSP) sections.
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({
    appointments: false,
  })

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }

  React.useEffect(() => {
    if (!placement) {
      setLoading(false)
      return
    }

    const { remote } = placement

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

        setRemoteComponent(() => DashboardWebComponentWrapper)
      } catch (err) {
        console.error('Failed to load remote module:', err instanceof Error ? err.message : 'Failed to load remote module')
        setError(err instanceof Error ? err.message : 'Failed to load remote module')
      } finally {
        setLoading(false)
      }
    }

    loadRemote()
  }, [placement])

  const handleClose = () => {
    navigate(SCREEN_ROUTES.HOME)
  }

  const handleOpenModal = (detail: ModalEventDetail) => {
    console.log('Modal opened', JSON.stringify(detail))
  }

  const handleCloseModal = (detail: ModalEventDetail) => {
    console.log('Modal closed', JSON.stringify(detail))
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

  const pluginProps: PluginProps | null = placement
    ? {
        id: placement.pluginId,
        name: placement.pluginName,
        context: {
          environment: 'SANDBOX',
          customerId: 'CUSTOMER_001',
          siteId: 'SITE_MAIN',
          staffId: 'STAFF_001',
          contextTypes: ['USER', 'STORE'],
        },
        screen: {
          view: 'HOME',
          maxWidth: 1200,
          maxHeight: 800,
        },
        settings: {
          'api-key': '<api key>',
        },
        onOpenModal: handleOpenModal,
        onCloseModal: handleCloseModal,
        onRequestToken: handleRequestToken,
      }
    : null

  return (
    <>
    <main className="partner-module-page bg-main">
      <div className="content-header">
        <nav className="breadcrumb">
          <span className="text-secondary">Home</span>
          <span className="text-secondary"> / </span>
          <span className="text-primary">{placement?.pluginName ?? 'Partner Module'}</span>
        </nav>
      </div>

      <div className="partner-module-body">
        {loading && <div className="p-md text-secondary">Loading partner module…</div>}
        {error && <div className="p-md" style={{ color: '#b00020' }}>Error loading partner module: {error}</div>}
        {!loading && !placement && (
          <div className="p-md text-secondary">This partner module is no longer available.</div>
        )}
        {!loading && RemoteComponent && pluginProps && (
          <RemoteComponent {...pluginProps} isModalOpen={false} />
        )}
      </div>

      <footer className="partner-module-footer">
        <button className="btn btn-secondary" onClick={handleClose}>Close</button>
      </footer>
    </main>

    {/* Configurable side panel (CSP): same chrome and width as the right panels
        on the Medical Images and Patient Dashboard screens. The home-tile
        screen-target supports a CSP; the module itself renders full-page in the
        main area, so the panel here shows host-supplied context only. */}
    <aside className="right-panel bg-secondary p-sm">
      <div className="card mb-sm">
        <div className="card-header segment-header" style={{ cursor: 'pointer' }} onClick={() => toggleSection('appointments')}>
          <div className="d-flex justify-between align-center">
            <h6 className="mb-0">Today's Appointments</h6>
            <span className={`collapse-icon ${collapsedSections.appointments ? 'collapsed' : ''}`} />
          </div>
        </div>
        {!collapsedSections.appointments && (
          <div className="card-body p-sm">
            <div className="text-secondary text-small">There are no appointments</div>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}

export default PartnerModulePage
