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

// Locale helpers for the sample widgets.
//
// Acuitas passes the logged-in user's interface language as `context.locale`: a BCP-47 tag that is
// usually language-region ('en-GB', 'fr-BE') but can be language-only ('en'), and can be absent in
// older hosts. Formatting through Intl with that tag gives dates and prices the user's conventions.
// For your own translated strings, match the tag against the languages you ship (full tag first,
// then the language part) and fall back to a default — never assume the tag is one you support.

/** Returns an Intl-safe locale list: the given tag when Intl accepts it, otherwise the browser default. */
export function toIntlLocales(locale?: string): string[] | undefined {
  if (!locale) {
    return undefined;
  }
  try {
    return Intl.getCanonicalLocales(locale);
  } catch {
    return undefined;
  }
}

/** Formats a date (or ISO date string) as a medium date in the given locale. */
export function formatDate(value: Date | string, locale?: string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat(toIntlLocales(locale), { dateStyle: 'medium' }).format(date);
}

/** Formats an amount in the given ISO 4217 currency, e.g. '€ 49,00' for nl-NL or '49,00 €' for fr-FR. */
export function formatCurrency(amount: number, currencyCode: string, locale?: string): string {
  return new Intl.NumberFormat(toIntlLocales(locale), { style: 'currency', currency: currencyCode }).format(amount);
}

/**
 * Picks the language your widget will use for its own strings: the full tag when you ship it, otherwise the first
 * language you ship with the same language part ('fr-BE' → 'fr'), otherwise `fallback`.
 */
export function pickLanguage<T extends string>(locale: string | undefined, supported: readonly T[], fallback: T): T {
  if (!locale) {
    return fallback;
  }
  const exact = supported.find(tag => tag.toLowerCase() === locale.toLowerCase());
  if (exact) {
    return exact;
  }
  const language = locale.split('-')[0].toLowerCase();
  return supported.find(tag => tag.split('-')[0].toLowerCase() === language) ?? fallback;
}
