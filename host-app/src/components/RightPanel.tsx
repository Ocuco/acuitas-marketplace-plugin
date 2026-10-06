import React from "react";
import { useState } from 'react'
import { createPortal } from 'react-dom'
import './RightPanel.css'
import { ImagingWebComponentWrapper } from "../ImagingWebComponentWrapper";
import { ModalEventDetail, PluginProps, TokenRequestDetail } from '@acuitas/shared';
import { useAppSelector } from '../store/hooks'
import { selectImages, selectSelectedImage } from '../store/selectors'
import { getPlacementsForScreen, type RemoteConfig } from '../config/plugin-placements'

import {
  __federation_method_getRemote as getRemote,
  __federation_method_setRemote as setRemote,
  // @ts-ignore
} from "__federation__";

type RemoteWidgetType = React.ComponentType<any>;

/**
 * Props for dynamic remote app component
 */
export interface DynamicRemoteProps extends PluginProps {
  /** Remote configuration */
  remoteConfig: RemoteConfig;
  
}


const DynamicRemoteApp: React.FC<DynamicRemoteProps> = ({ remoteConfig, ...props }) => {
  const { url, name, module, type } = remoteConfig;

  const [RemoteComponent, setRemoteComponent] = React.useState<RemoteWidgetType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadRemote = async () => {
      try {
        setLoading(true);
        setError(null);

        if (type === 'webcomponent') {
          // For web components, load the component class and use our wrapper
          setRemote(name, {
            url: () => Promise.resolve(url),
            format: "esm",
            from: "vite",
          });

          // Load the web component class to register it
          await getRemote(name, module);
          
          // Use our React wrapper for web components
          setRemoteComponent(() => ImagingWebComponentWrapper);
        } else {
          // For React components, load normally
          setRemote(name, {
            url: () => Promise.resolve(url),
            format: "esm",
            from: "vite",
          });

          const remoteModule = await getRemote(name, module);
          const Component = remoteModule.default || remoteModule;
          setRemoteComponent(() => Component);
        }
      } catch (err) {
        console.error('Failed to load remote module:', err instanceof Error ? err.message : 'Failed to load remote module');
        setError(err instanceof Error ? err.message : 'Failed to load remote module');
      } finally {
        setLoading(false);
      }
    };

    loadRemote();
  }, [url, name, module, type]);

  if (loading) {
    return <div>Loading remote component...</div>;
  }

  if (error) {
    return <div>Error loading remote component: {error}</div>;
  }

  if (!RemoteComponent) {
    return <div>No remote component loaded</div>;
  }

  return <RemoteComponent {...props} elementTag={remoteConfig.elementTag} />;
};

// The Medical Images side-panel plugin comes from the placement registry, like every other
// screen's, so hosting your own widget here is a change to plugin-placements.ts only.
const imagingPlacement = getPlacementsForScreen('MEDICAL_IMAGES')
  .find(placement => placement.section === 'SIDE_PANEL');

function RightPanel() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // Get imaging state from Redux store - this connects the RightPanel to centralized state
  const images = useAppSelector(selectImages)
  const selectedImage = useAppSelector(selectSelectedImage)
  
  const handleCloseModal = (detail: ModalEventDetail) => {
    setIsModalOpen(false);
  };

  const handleOpenModal = (detail: ModalEventDetail) => {
    setIsModalOpen(true);
  }

  const handleRequestToken = async (detail: TokenRequestDetail) =>  {
    console.log('Token requested', JSON.stringify(detail));
    return {
      detail: {
        pluginId: detail.pluginId,
        pluginName: detail.pluginName,
        context: detail.context,
        subjectTypes: detail.subjectTypes,
        subjectIds: detail.subjectIds,
      },
      token: import.meta.env.VITE_PST || 'no VITE_PST environment variable exists or no value set',
    };
  }

  // Create plugin props following the PluginProps interface
  const webComponentRemoteProps: PluginProps = {
    id: imagingPlacement?.pluginId ?? '',
    name: imagingPlacement?.pluginName ?? '',
    context: {
      environment: 'SANDBOX',
      customerId: 'CUSTOMER_001',
      siteId: 'SITE_MAIN',
      staffId: 'STAFF_001'
    },
    // Acuitas passes fixed 400 x 400 hints in the side panel (see Plugin render zones).
    screen: {
      view: 'MEDICAL_IMAGES',
      section: 'SIDE_PANEL',
      maxWidth: 400,
      maxHeight: 400,
    },
    settings: {
      'analysis-endpoint': 'https://api.example.com/v1/imaging/analyze',
      'api-key': '<api key>',
    },
    imaging: {
      patientId: '3e87af32-a498-4174-9f59-9fa6865d4597',
      // Convert Redux images to the expected Image interface format
      images: images.map(img => ({
        id: img.id,
        fileName: img.name
      })),
      // Convert selected image to the expected format
      selectedImage: selectedImage ? {
        id: selectedImage.id,
        fileName: selectedImage.name
      } : null
    },
    onOpenModal: handleOpenModal,
    onCloseModal: handleCloseModal,
    onRequestToken: handleRequestToken,
  };

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
    boxSizing: 'border-box'
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '0',
    padding: '0',
    width: '90vw',
    height: '90vh',
    position: 'relative',
    overflow: 'auto',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  };

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    patient: false,
    visits: false,
    tools: false,
  })

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  // Refs and portal node for a single shared instance of the remote app
  const remoteNodeRef = React.useRef<HTMLDivElement | null>(null);
  const hostContainerRef = React.useRef<HTMLDivElement | null>(null);
  const modalContentRef = React.useRef<HTMLDivElement | null>(null);
  const [portalReady, setPortalReady] = React.useState(false);

  // Create the portal node once
  React.useEffect(() => {
    const node = document.createElement('div');
    node.className = 'remote-app-wrapper';
    remoteNodeRef.current = node;
    // trigger a re-render so createPortal can run after the node exists
    setPortalReady(true);
    return () => {
      if (remoteNodeRef.current && remoteNodeRef.current.parentNode) {
        remoteNodeRef.current.parentNode.removeChild(remoteNodeRef.current);
      }
      remoteNodeRef.current = null;
      setPortalReady(false);
    };
  }, []);

  // Move the portal node between the tools host and the modal content when modal state changes
  React.useEffect(() => {
    const node = remoteNodeRef.current;
    if (!node) return;

    // Choose a target: modalContent when open, otherwise the tools host container.
    const target = isModalOpen ? modalContentRef.current : hostContainerRef.current;

    if (target) {
      if (node.parentNode !== target) {
        target.appendChild(node);
      }
    } else if (node.parentNode) {
      // No valid container (for example tools collapsed) — detach to keep the
      // shared instance alive but hidden, rather than leaving it floating in the page.
      node.parentNode.removeChild(node);
    }
  }, [isModalOpen, collapsedSections.tools]);
  return (
    <aside className="right-panel bg-secondary p-sm">
      
      {/* Patient Information Section */}
      <div className="card mb-sm">
        <div className="card-header segment-header" style={{cursor: 'pointer'}} onClick={() => toggleSection('patient')}>
          <div className="d-flex justify-between align-center">
            <h6 className="mb-0">Patient Information</h6>
            <span className={`collapse-icon ${collapsedSections.patient ? 'collapsed' : ''}`} />
          </div>
        </div>
        {!collapsedSections.patient && (
          <div className="card-body p-sm">
            <div className="mb-xs">
              <span className="text-secondary text-small">Name:</span>
              <div className="text-primary">John Doe</div>
            </div>
            <div className="mb-xs">
              <span className="text-secondary text-small">ID:</span>
              <div className="text-primary">PT001234</div>
            </div>
            <div className="mb-xs">
              <span className="text-secondary text-small">DOB:</span>
              <div className="text-primary">1980-05-15</div>
            </div>
            <div className="mb-xs">
              <span className="text-secondary text-small">Gender:</span>
              <div className="text-primary">Male</div>
            </div>
          </div>
        )}
      </div>

      {/* Previous Visits Section */}
      <div className="card mb-sm">
        <div className="card-header segment-header" style={{cursor: 'pointer'}} onClick={() => toggleSection('visits')}>
          <div className="d-flex justify-between align-center">
            <h6 className="mb-0">Previous Visits</h6>
            <span className={`collapse-icon ${collapsedSections.visits ? 'collapsed' : ''}`} />
          </div>
        </div>
        {!collapsedSections.visits && (
          <div className="card-body p-sm">
            <div className="mb-xs">
              <span className="text-secondary text-small">2024-01-15:</span>
              <div className="text-primary">Eye examination</div>
            </div>
          </div>
        )}
      </div>

      {/* Plugin section: the host draws this header, as Acuitas does */}
      {imagingPlacement && (
      <div className="card mb-sm">
        <div className="card-header segment-header" style={{cursor: 'pointer'}} onClick={() => toggleSection('tools')}>
          <div className="d-flex justify-between align-center">
            <h6 className="mb-0">{imagingPlacement.pluginName}</h6>
            <span className={`collapse-icon ${collapsedSections.tools ? 'collapsed' : ''}`} />
          </div>
        </div>
        {!collapsedSections.tools && (
          <div className="card-body p-sm">
            {/* host container where the shared instance will mount when modal is closed */}
            <div ref={hostContainerRef} className="remote-host side-panel-zone" />
          </div>
        )}
      </div>
      )}

      {/* Full Screen Modal */}
      <div style={modalStyle}>
        <div style={modalContentStyle} ref={modalContentRef}>
          <React.Suspense fallback="Loading modal content...">
            {/* single shared instance rendered into the movable DOM node */}
            {portalReady && remoteNodeRef.current && imagingPlacement && createPortal(
              <DynamicRemoteApp {...webComponentRemoteProps} remoteConfig={imagingPlacement.remote} isModalOpen={isModalOpen} />,
              remoteNodeRef.current
            )}
          </React.Suspense>
        </div>
      </div>      

    </aside>
  )
}

export default RightPanel
