import React from "react";
import { useState } from 'react'
import './RightPanel.css'
import { ImagingWebComponentWrapper } from "../ImagingWebComponentWrapper";
import { ModalEventDetail, PluginProps, TokenRequestDetail } from '@acuitas/shared';

import {
  __federation_method_getRemote as getRemote,
  __federation_method_setRemote as setRemote,
  // @ts-ignore
} from "__federation__";

type RemoteWidgetType = React.ComponentType<any>;

/**
 * Remote component configuration
 */
export interface RemoteConfig {
  /** URL to the remote module */
  url: string;
  
  /** Name of the remote module */
  name: string;
  
  /** Module path to load */
  module: string;
  
  /** Type of component */
  type: 'react' | 'webcomponent';
}

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

  return <RemoteComponent {...props} />;
};

function RightPanel() {

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const webComponentRemoteConfig: RemoteConfig = {
    url: "http://localhost:9001/assets/remoteEntry.js", 
    name: "sampleWidget",
    module: "./Component",
    type: "webcomponent"
  };

  const handleCloseModal = (detail: ModalEventDetail) => {
    setIsModalOpen(false);
  };

  const handleClickCloseModal = () => {
    setIsModalOpen(false);
  };
  const handleOpenModal = (detail: ModalEventDetail) => {
    setIsModalOpen(true);
  }

  const handleRequestToken = (detail: TokenRequestDetail) =>  {
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
    id: "medical-imaging-widget-001",
    name: "Medical Image Analysis Widget",
    context: {
      environment: 'SANDBOX',
      customerId: 'CUSTOMER_001',
      siteId: 'SITE_MAIN',
      staffId: 'STAFF_001'
    },
    screen: { 
      view: 'MEDICAL_IMAGES',
      maxWidth: 400,
      maxHeight: 600,
    },
    settings: {
      'analysis-endpoint': 'https://api.example.com/v1/imaging/analyze',
      'api-key': '<api key>',
    },
    imaging: {
      patientId: '3e87af32-a498-4174-9f59-9fa6865d4597',
      images: [
        { id: '95800790-5E70-4083-BE05-59B97583F5F4', fileName: '95800790-5E70-4083-BE05-59B97583F5F4.jpg' },
        { id: '76538477-D664-4620-9BE2-40AD604CA8FC', fileName: '76538477-D664-4620-9BE2-40AD604CA8FC.jpg' },
        { id: '43AC4C75-8EBD-4898-9513-75811300CFE7', fileName: '43AC4C75-8EBD-4898-9513-75811300CFE7.jpg' },
      ],
      selectedImage: null
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
    padding: '20px',
    boxSizing: 'border-box'
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    width: '90vw',
    height: '90vh',
    position: 'relative',
    overflow: 'auto',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#ff4757',
    top: '15px',
    right: '15px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '15px',
    transition: 'background-color 0.2s',
    fontWeight: 'bold',
    zIndex: 10000
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
  return (
    <aside className="right-panel bg-secondary p-sm">
      
      {/* Patient Information Section */}
      <div className="card mb-sm">
        <div className="card-header" style={{cursor: 'pointer'}} onClick={() => toggleSection('patient')}>
          <div className="d-flex justify-between align-center">
            <h6 className="mb-0">Patient Information</h6>
            <span className={`collapse-icon ${collapsedSections.patient ? 'collapsed' : ''}`}>▼</span>
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
        <div className="card-header" style={{cursor: 'pointer'}} onClick={() => toggleSection('visits')}>
          <div className="d-flex justify-between align-center">
            <h6 className="mb-0">Previous Visits</h6>
            <span className={`collapse-icon ${collapsedSections.visits ? 'collapsed' : ''}`}>▼</span>
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

      {/* Tools Section */}
      <div className="card mb-sm">
        <div className="card-header" style={{cursor: 'pointer'}} onClick={() => toggleSection('tools')}>
          <div className="d-flex justify-between align-center">
            <h6 className="mb-0">Tools</h6>
            <span className={`collapse-icon ${collapsedSections.tools ? 'collapsed' : ''}`}>▼</span>
          </div>
        </div>
        {!collapsedSections.tools && (
          <div className="card-body p-sm">
            <DynamicRemoteApp {...webComponentRemoteProps} remoteConfig={webComponentRemoteConfig} isModalOpen={isModalOpen} />
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      <div style={modalStyle}>
        <div style={modalContentStyle}>
          <button
            style={closeButtonStyle}
            onClick={handleClickCloseModal}
            title="Close Modal"
          >
            ×
          </button>
          <React.Suspense fallback="Loading modal content...">
            {isModalOpen && (
              <div style={{ marginTop: '40px' }}>
                <DynamicRemoteApp 
                  {...webComponentRemoteProps} remoteConfig={webComponentRemoteConfig} isModalOpen={isModalOpen} />
              </div>
            )}
          </React.Suspense>
        </div>
      </div>      

    </aside>
  )
}

export default RightPanel
