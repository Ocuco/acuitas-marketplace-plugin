/**
 * Plugin Props Types for Acuitas Medical Imaging Federation
 * 
 * These types define the standard interface for federated components
 * in the Acuitas medical imaging platform.
 */

/**
 * Main plugin properties interface that all federated components should implement
 */
export interface PluginProps {
  /** Unique identifier for the plugin instance */
  id: string;
  
  /** Human-readable name of the plugin */
  name: string;

  /** Screen context information */
  screen: ScreenContext;
  
  /** Application context information */
  context: PluginContext;
  
  /** Plugin-specific configuration settings */
  settings: PluginSettings;
  
  /** Medical imaging specific properties */
  imaging: ImagingProps;
 
  /** Callback to open modal/fullscreen view */
  onOpenModal: (detail: ModalEventDetail) => void;
  
  /** Callback to close modal/fullscreen view */
  onCloseModal: (detail: ModalEventDetail) => void;

  /** Callback to request a token for a specific subject and identifier */
  onRequestToken: (detail: TokenRequestDetail) => TokenRequestResponse;

  /** Whether modal is currently open */
  isModalOpen?: boolean;
  
}

/**
 * Application context information
 */
export interface PluginContext {
  /** Current environment */
  environment: 'SANDBOX' | 'UAT' | 'PRODUCTION';
  
  /** Unique customer identifier */
  customerId: string;
  
  /** Site identifier */
  siteId: string;

  /** Staff identifier */
  staffId: string;
}

export interface ScreenContext { 
  /** View type where the component is rendered */
  view: 'MEDICAL_IMAGES';
  
  /** Maximum width constraint for the component */
  maxWidth: number;
  
  /** Optional maximum height constraint for the component */
  maxHeight?: number;
  
}

/**
 * Plugin settings as key-value pairs
 */
export interface PluginSettings {
  [setting: string]: string;
}

/**
 * Medical imaging specific properties
 */
export interface ImagingProps {
  // Array of image objects
  images: Image[];
  selectedImage: Image | null; // Currently selected image for viewing
}

/**
 * Image object representing a medical image
 */
export interface Image { 
  id: string;
  fileName: string;
}

export type SubjectType = 'MEDICAL-IMAGE';

/**
 * Token request detail payload
 */
export interface TokenRequestDetail { 
  /** Plugin instance identifier */
  pluginId: string;
  /** Plugin name */
  pluginName: string;
  /** Plugin context information */
  context: PluginContext;
  /** Requested subject type */
  subjectType: SubjectType;
  /** Requested subject IDs */
  subjectIds: string[];
}

export interface TokenRequestResponse { 
  /** Request details */
  detail: TokenRequestDetail;
  /** Token value */
  token: string;
}


/**
 * Standard modal event detail payload
 */
export interface ModalEventDetail {
  /** Plugin instance identifier */
  pluginId: string;
  /** Plugin name */
  pluginName: string;
  /** Plugin context information */
  context: PluginContext;
}


/**
 * Sample plugin props factory for testing/development
 */
export function createSamplePluginProps(overrides: Partial<PluginProps> = {}): PluginProps {
  return {
    id: "medical-imaging-widget-001",
    name: "Medical Image Analysis Widget",
    context: {
      environment: 'SANDBOX',
      customerId: 'CUSTOMER_001',
      siteId: 'SITE_MAIN',
      staffId: 'STAFF_001'
    },
    screen:  {
      view: 'MEDICAL_IMAGES',
      maxWidth: 400,
      maxHeight: 600,
    },
    settings: {
      'analysis-endpoint': 'https://api.example.com/v1/imaging/analyze',
      'api-key': '<api key>',
    },
    imaging: {
      images: [
        { id: 'IMG_CT_20240115_001', fileName: 'IMG_CT_20240115_001.jpg' },
        { id: 'IMG_CT_20240115_002', fileName: 'IMG_CT_20240115_002.jpg' },
        { id: 'IMG_MRI_20240116_001', fileName: 'IMG_MRI_20240116_001.jpg' },
        { id: 'IMG_XRAY_20240117_001', fileName: 'IMG_XRAY_20240117_001.jpg' }
      ],
      selectedImage: null
    },
    onOpenModal: (detail: ModalEventDetail) => console.log('Modal opened', JSON.stringify(detail)),
    onCloseModal: (detail: ModalEventDetail) => console.log('Modal closed', JSON.stringify(detail)),
    onRequestToken: (detail: TokenRequestDetail ) => {
      console.log('Token requested', JSON.stringify(detail));
      return {
        detail: { 
          pluginId: detail.pluginId,
          pluginName: detail.pluginName,
          context: detail.context,
          subjectType: detail.subjectType,
          subjectIds: detail.subjectIds,
        },
        token: '<generated-token>'
      };
    },
    ...overrides
  };
}
