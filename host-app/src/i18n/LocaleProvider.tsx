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

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { LocaleContext } from './LocaleContext';
import { DEFAULT_LOCALE, matchSupportedLocale } from './locales';

const STORAGE_KEY = 'shell.locale';

function getInitialLocale(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && matchSupportedLocale([stored]) === stored) {
      return stored;
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data); fall back to the browser.
  }
  return matchSupportedLocale(navigator.languages) ?? DEFAULT_LOCALE;
}

function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Not persisting is fine; the choice still applies for this session.
    }
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export default LocaleProvider;
