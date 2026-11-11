/*
 * Copyright 2026 Ocuco Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
  /**
   * The Marketplace plugin id. Acuitas sets it to the id of the plugin it is hosting — the same id
   * every Plugin Session Token is issued for, and the one your backend claims the session with.
   */
  id: string;

  /** Human-readable name of the plugin */
  name: string;

  /** Screen context information */
  screen: ScreenContext;

  /** Application context information */
  context: PluginContext;

  /** Plugin-specific configuration settings */
  settings: PluginSettings;

  /** Medical imaging specific properties (present on imaging screens) */
  imaging?: ImagingProps;

  /** Patient specific properties (present on patient screens) */
  patient?: PatientProps;

  /** Checkout/sale specific properties (present on checkout screens) */
  sale?: SaleProps;

  /** Callback to open modal/fullscreen view */
  onOpenModal: (detail: ModalEventDetail) => void;

  /** Callback to close modal/fullscreen view */
  onCloseModal: (detail: ModalEventDetail) => void;

  /** Callback to request a token for a specific subject and identifier */
  onRequestToken: (detail: TokenRequestDetail) => Promise<TokenRequestResponse>;

  /**
   * Optional callback the plugin invokes after it mutates the current sale so
   * the host refetches and the cart total updates (present on checkout screens).
   */
  onRequestRefresh?: () => void;

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

  /** Available context types */
  contextTypes?: string[];

  /**
   * Interface language of the logged-in Acuitas user as a BCP-47 tag, passed as Acuitas holds it:
   * usually language-region (e.g. 'en-GB', 'fr-FR'), occasionally language-only (e.g. 'en').
   * Match it against the languages your widget supports and fall back when there is no match.
   */
  locale?: string;
}

export interface ScreenContext {
  /** View type where the component is rendered */
  view: 'MEDICAL_IMAGES' | 'PATIENT' | 'HOME' | 'CHECKOUT';

  /** Section of the screen the component is rendered in */
  section?: PluginSection;

  /** Maximum width constraint for the component */
  maxWidth: number;

  /** Optional maximum height constraint for the component */
  maxHeight?: number;
}

/**
 * Section of a host screen where a plugin can be rendered
 */
export type PluginSection = 'MAIN' | 'SIDE_PANEL';

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
  patientId: string; // Patient identifier
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

/**
 * Patient specific properties
 */
export interface PatientProps {
  patientId: string; // Patient identifier
}

/**
 * Checkout/sale specific properties.
 * saleId is the open sale the partner line will be added to.
 */
export interface SaleProps {
  saleId: string;
  // The product ids of the lines currently in the host cart, and the line count. The host keeps
  // these in sync with the cart (including un-saved local edits), so a plugin can tell whether its
  // product is already present and reflect additions/removals immediately.
  cartProductIds?: string[];
  cartItemCount?: number;
}

/**
 * The kinds of data a token can be requested for. List every type your backend uses with the session;
 * see "Retrieving and using the plugin session token" in the developer docs for what each one covers.
 */
export type SubjectType =
  | 'MEDICAL-IMAGE'
  | 'PATIENT-DETAILS'
  | 'SALE'
  | 'TRANSACTIONS'
  | 'PRODUCTS'
  | 'PROMOTIONS'
  | 'ORDERS'
  | 'STAFF-MEMBERS'
  | 'DIARY'
  | 'BUSINESS'
  | 'SITES'
  | 'CONFIGURATION-CAMERA'
  | 'CORRESPONDENCE'
  | 'PRESCRIPTIONS'
  | 'ACCOMMODATION'
  | 'AXIAL-LENGTHS'
  | 'COLOR-VISIONS'
  | 'CONTACT-LENS'
  | 'COVER-TEST'
  | 'EXAM-CHECKLIST-RESULTS'
  | 'INSURANCE-MAINTENANCE'
  | 'INSURANCE-CLAIMS'
  | 'INSURANCE-CLAIM-BATCHES'
  | 'COMPANIES'
  | 'CUSTOMERS'
  | 'COUNTRIES'
  | 'REGIONS'
  | 'LOOKUPS'
  | 'TASKS'
  | 'REPORTING';

/**
 * Token request detail payload
 */
export interface TokenRequestDetail {
  /**
   * The requesting plugin, normally the `id` property the host set. Acuitas issues the token for
   * the plugin it is hosting whatever this says, so it does not choose which plugin you get.
   */
  pluginId: string;
  /** Plugin name */
  pluginName: string;
  /** Plugin context information */
  context: PluginContext;
  /** Requested subject types */
  subjectTypes: SubjectType[];
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
    // Stands in for the plugin id Acuitas passes; override it with your own.
    id: 'your-plugin-id',
    name: 'Medical Image Analysis Widget',
    context: {
      environment: 'SANDBOX',
      customerId: 'CUSTOMER_001',
      siteId: 'SITE_MAIN',
      staffId: 'STAFF_001',
      locale: 'en-GB',
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
        { id: '76538477-D664-4620-9BE2-40AD604CA8FC', fileName: 'IMG_CT_20240115_001.jpg' },
        { id: '95800790-5E70-4083-BE05-59B97583F5F4', fileName: 'IMG_CT_20240115_002.jpg' },
        { id: '43AC4C75-8EBD-4898-9513-75811300CFE7', fileName: 'IMG_MRI_20240116_001.jpg' },
      ],
      selectedImage: null,
    },
    onOpenModal: (detail: ModalEventDetail) => console.log('Modal opened', JSON.stringify(detail)),
    onCloseModal: (detail: ModalEventDetail) => console.log('Modal closed', JSON.stringify(detail)),
    onRequestToken: async (detail: TokenRequestDetail) => {
      console.log('Token requested', JSON.stringify(detail));
      return {
        detail: {
          pluginId: detail.pluginId,
          pluginName: detail.pluginName,
          context: detail.context,
          subjectTypes: detail.subjectTypes,
          subjectIds: detail.subjectIds,
        },
        token: '<generated-token>',
      };
    },
    ...overrides,
  };
}
