import React, { useEffect, useRef } from 'react';
import type { PluginProps, PluginContext, ScreenContext, PluginSettings, ModalEventDetail, TokenRequestDetail, TokenRequestResponse } from '@acuitas/shared';

interface RemoteProps extends PluginProps {
  [key: string]: any;
}

// Define the web component interface
interface DashboardWidgetElement extends HTMLElement {
  id: string;
  name: string;
  context: PluginContext;
  screen: ScreenContext;
  settings: PluginSettings;
  additionalProps: Record<string, any>;
  isModalOpen?: boolean;
  onOpenModal: (detail: ModalEventDetail) => void;
  onCloseModal: (detail: ModalEventDetail) => void;
  onRequestToken: (detail: TokenRequestDetail) => Promise<TokenRequestResponse>;
}

// React wrapper component for the federated dashboard web component
export const DashboardWebComponentWrapper: React.FC<RemoteProps> = (props) => {
  const ref = useRef<DashboardWidgetElement>(null);

  useEffect(() => {
    const webComponent = ref.current;
    if (!webComponent) return;

    // Set plugin properties from props
    if (props.id) webComponent.id = props.id;
    if (props.name) webComponent.name = props.name;
    if (props.context) webComponent.context = props.context;
    if (props.screen) webComponent.screen = props.screen;
    if (props.settings) webComponent.settings = props.settings;
    if (props.onOpenModal) webComponent.onOpenModal = props.onOpenModal;
    if (props.onCloseModal) webComponent.onCloseModal = props.onCloseModal;
    if (props.onRequestToken) webComponent.onRequestToken = props.onRequestToken;

    webComponent.isModalOpen = props.isModalOpen;

    // Set additional props
    const {
      id, name, context, screen, settings, onOpenModal, onCloseModal,
      onRequestToken, isModalOpen,
      ...additionalProps
    } = props;

    if (Object.keys(additionalProps).length > 0) {
      webComponent.additionalProps = additionalProps;
    }

  }, [props]);

  return React.createElement('dashboard-widget', { ref });
};

export default DashboardWebComponentWrapper;
