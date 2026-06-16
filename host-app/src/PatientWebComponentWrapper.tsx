import React, { useEffect, useRef } from 'react';
import type { PluginProps, PluginContext, ScreenContext, PluginSettings, PatientProps, ModalEventDetail, TokenRequestDetail, TokenRequestResponse } from '@acuitas/shared';

interface RemoteProps extends PluginProps {
  [key: string]: any;
}

// Define the web component interface
interface PatientWidgetElement extends HTMLElement {
  id: string;
  name: string;
  context: PluginContext;
  screen: ScreenContext;
  settings: PluginSettings;
  patient: PatientProps;
  additionalProps: Record<string, any>;
  isModalOpen?: boolean;
  onOpenModal: (detail: ModalEventDetail) => void;
  onCloseModal: (detail: ModalEventDetail) => void;
  onRequestToken: (detail: TokenRequestDetail) => Promise<TokenRequestResponse>;
}

// React wrapper component for the federated patient web component
export const PatientWebComponentWrapper: React.FC<RemoteProps> = (props) => {
  const ref = useRef<PatientWidgetElement>(null);

  useEffect(() => {
    const webComponent = ref.current;
    if (!webComponent) return;

    // Set plugin properties from props
    if (props.id) webComponent.id = props.id;
    if (props.name) webComponent.name = props.name;
    if (props.context) webComponent.context = props.context;
    if (props.screen) webComponent.screen = props.screen;
    if (props.settings) webComponent.settings = props.settings;
    if (props.patient) webComponent.patient = props.patient;
    if (props.onOpenModal) webComponent.onOpenModal = props.onOpenModal;
    if (props.onCloseModal) webComponent.onCloseModal = props.onCloseModal;
    if (props.onRequestToken) webComponent.onRequestToken = props.onRequestToken;

    webComponent.isModalOpen = props.isModalOpen;

    // Set additional props
    const {
      id, name, context, screen, settings, patient, onOpenModal, onCloseModal,
      onRequestToken, isModalOpen,
      ...additionalProps
    } = props;

    if (Object.keys(additionalProps).length > 0) {
      webComponent.additionalProps = additionalProps;
    }

  }, [props]);

  return React.createElement('patient-widget', { ref });
};

export default PatientWebComponentWrapper;
