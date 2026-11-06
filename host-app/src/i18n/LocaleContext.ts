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

import { createContext, useContext } from 'react';
import { DEFAULT_LOCALE } from './locales';
import { getMessages, type MessageKey } from './messages';

export interface LocaleContextValue {
  locale: string;
  setLocale: (locale: string) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

/** The shell's current locale; the hosts pass it to every widget as `context.locale`. */
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

/** Translates shell chrome strings into the current locale. */
export function useT(): (key: MessageKey) => string {
  const messages = getMessages(useLocale().locale);
  return key => messages[key];
}
