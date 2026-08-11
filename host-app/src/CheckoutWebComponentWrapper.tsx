import React, { useEffect, useRef } from 'react';
import type { PluginProps, PluginContext, ScreenContext, PluginSettings, SaleProps, ModalEventDetail, TokenRequestDetail, TokenRequestResponse } from '@acuitas/shared';

interface RemoteProps extends PluginProps {
  [key: string]: any;
}

// Define the web component interface
interface CheckoutWidgetElement extends HTMLElement {
  id: string;
  name: string;
  context: PluginContext;
  screen: ScreenContext;
  settings: PluginSettings;
  sale: SaleProps;
  additionalProps: Record<string, any>;
  isModalOpen?: boolean;
  onOpenModal: (detail: ModalEventDetail) => void;
  onCloseModal: (detail: ModalEventDetail) => void;
  onRequestToken: (detail: TokenRequestDetail) => Promise<TokenRequestResponse>;
  onRequestRefresh?: () => void;
}

// React wrapper component for the federated checkout web component
export const CheckoutWebComponentWrapper: React.FC<RemoteProps> = (props) => {
  const ref = useRef<CheckoutWidgetElement>(null);

  useEffect(() => {
    const webComponent = ref.current;
    if (!webComponent) return;

    if (props.id) webComponent.id = props.id;
    if (props.name) webComponent.name = props.name;
    if (props.context) webComponent.context = props.context;
    if (props.screen) webComponent.screen = props.screen;
    if (props.settings) webComponent.settings = props.settings;
    if (props.sale) webComponent.sale = props.sale;
    if (props.onOpenModal) webComponent.onOpenModal = props.onOpenModal;
    if (props.onCloseModal) webComponent.onCloseModal = props.onCloseModal;
    if (props.onRequestToken) webComponent.onRequestToken = props.onRequestToken;
    if (props.onRequestRefresh) webComponent.onRequestRefresh = props.onRequestRefresh;

    webComponent.isModalOpen = props.isModalOpen;

    const {
      id, name, context, screen, settings, sale, onOpenModal, onCloseModal,
      onRequestToken, onRequestRefresh, isModalOpen,
      ...additionalProps
    } = props;

    if (Object.keys(additionalProps).length > 0) {
      webComponent.additionalProps = additionalProps;
    }

  }, [props]);

  return React.createElement('checkout-widget', { ref });
};

export default CheckoutWebComponentWrapper;
