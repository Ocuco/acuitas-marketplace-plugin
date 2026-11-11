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

// The interface languages Acuitas offers. The shell lets you switch between them so you can see how
// your widget behaves when `context.locale` changes; Acuitas itself passes the logged-in user's choice.
export const SUPPORTED_LOCALES = [
  'en-GB',
  'en-US',
  'en-CA',
  'fr-FR',
  'fr-BE',
  'nl-NL',
  'nl-BE',
  'sv-SE',
  'da-DK',
  'fi-FI',
  'nb-NO',
  'de-DE',
  'es-ES',
] as const;

export const DEFAULT_LOCALE = 'en-GB';

/** The locale's own name for itself, e.g. 'français (France)' for fr-FR. */
export function getLocaleDisplayName(locale: string): string {
  const [language, region] = locale.split('-');
  const languageName = new Intl.DisplayNames([locale], { type: 'language' }).of(language) ?? language;
  const regionName = region ? new Intl.DisplayNames([locale], { type: 'region' }).of(region) : undefined;
  return regionName ? `${languageName} (${regionName})` : languageName;
}

/** Picks the first supported locale matching the browser's languages, by full tag and then by language. */
export function matchSupportedLocale(candidates: readonly string[]): string | undefined {
  const supported: readonly string[] = SUPPORTED_LOCALES;
  for (const candidate of candidates) {
    if (supported.includes(candidate)) {
      return candidate;
    }
  }
  for (const candidate of candidates) {
    const language = candidate.split('-')[0];
    const match = supported.find(locale => locale.split('-')[0] === language);
    if (match) {
      return match;
    }
  }
  return undefined;
}
