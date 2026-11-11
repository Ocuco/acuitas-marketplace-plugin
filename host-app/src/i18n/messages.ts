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

// Shell chrome strings. Only English, French, Dutch and German are translated; every other locale
// falls back to English. The shell's own copy is not the point — the widget's handling of the locale is.
const MESSAGES = {
  en: {
    appTitle: 'Medical Imaging Shell',
    navHome: 'Home',
    navMedicalImages: 'Medical Images',
    navPatient: 'Patient Dashboard',
    navCheckout: 'Checkout',
    language: 'Language',
  },
  fr: {
    appTitle: "Shell d'imagerie médicale",
    navHome: 'Accueil',
    navMedicalImages: 'Images médicales',
    navPatient: 'Tableau de bord patient',
    navCheckout: 'Paiement',
    language: 'Langue',
  },
  nl: {
    appTitle: 'Medische beeldvormingsshell',
    navHome: 'Start',
    navMedicalImages: 'Medische beelden',
    navPatient: 'Patiëntendashboard',
    navCheckout: 'Afrekenen',
    language: 'Taal',
  },
  de: {
    appTitle: 'Shell für medizinische Bildgebung',
    navHome: 'Startseite',
    navMedicalImages: 'Medizinische Bilder',
    navPatient: 'Patienten-Dashboard',
    navCheckout: 'Kasse',
    language: 'Sprache',
  },
};

export type MessageKey = keyof typeof MESSAGES.en;

export function getMessages(locale: string): Record<MessageKey, string> {
  const language = locale.split('-')[0];
  return language in MESSAGES ? MESSAGES[language as keyof typeof MESSAGES] : MESSAGES.en;
}
