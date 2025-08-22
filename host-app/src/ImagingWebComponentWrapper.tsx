import React, { useEffect, useRef } from 'react';
import type { PluginProps, PluginContext, ScreenContext, PluginSettings, ImagingProps, ModalEventDetail, TokenRequestDetail, TokenRequestResponse } from '@acuitas/shared';

interface RemoteProps extends PluginProps {
  [key: string]: any;
}

// Define the web component interface
interface SampleWidgetElement extends HTMLElement {
  id: string;
  name: string;
  context: PluginContext;
  screen: ScreenContext;
  settings: PluginSettings;
  imaging: ImagingProps;
  additionalProps: Record<string, any>;
  isModalOpen?: boolean;
  onOpenModal: (detail: ModalEventDetail) => void;
  onCloseModal: (detail: ModalEventDetail) => void;
  onRequestToken: (detail: TokenRequestDetail) => TokenRequestResponse;
}

// React wrapper component for the federated web component
export const ImagingWebComponentWrapper: React.FC<RemoteProps> = (props) => {
  const ref = useRef<SampleWidgetElement>(null);

  useEffect(() => {
    const webComponent = ref.current;
    if (!webComponent) return;

    // Set plugin properties from props
    if (props.id) webComponent.id = props.id;
    if (props.name) webComponent.name = props.name;
    if (props.context) webComponent.context = props.context;
    if (props.settings) webComponent.settings = props.settings;
    if (props.imaging) webComponent.imaging = props.imaging;
    if (props.onOpenModal) webComponent.onOpenModal = props.onOpenModal;
    if (props.onCloseModal) webComponent.onCloseModal = props.onCloseModal;
    if (props.onRequestToken) webComponent.onRequestToken = props.onRequestToken;
    
    webComponent.isModalOpen = props.isModalOpen;
    
    // Set additional props
    const { 
      id, name, context, screen, settings, imaging, onOpenModal, onCloseModal, 
      ...additionalProps 
    } = props;
    
    if (Object.keys(additionalProps).length > 0) {
      webComponent.additionalProps = additionalProps;
    }

  }, [props]);

  return React.createElement('sample-widget', { ref });
};

export default ImagingWebComponentWrapper;
