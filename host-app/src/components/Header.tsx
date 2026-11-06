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

import './Header.css';
import { NavLink } from 'react-router-dom';
import { SCREEN_ROUTES } from '../config/routes';
import { useLocale, useT } from '../i18n/LocaleContext';
import { getLocaleDisplayName, SUPPORTED_LOCALES } from '../i18n/locales';
import type { MessageKey } from '../i18n/messages';

const navItems: { to: string; labelKey: MessageKey }[] = [
  { to: SCREEN_ROUTES.HOME, labelKey: 'navHome' },
  { to: SCREEN_ROUTES.MEDICAL_IMAGES, labelKey: 'navMedicalImages' },
  { to: SCREEN_ROUTES.PATIENT, labelKey: 'navPatient' },
  { to: SCREEN_ROUTES.CHECKOUT, labelKey: 'navCheckout' },
];

function Header() {
  const { locale, setLocale } = useLocale();
  const t = useT();

  return (
    <header className="app-bar">
      <div className="d-flex align-center">
        <div className="d-flex align-center gap-2">
          <span className="logo-icon">
            <img src="/logo.png" alt="Medical Logo" style={{ height: '1.5rem', width: 'auto' }} />
          </span>
          <span className="logo-text" style={{ fontSize: 'var(--font-size-header)', fontWeight: 'var(--font-weight-header)' }}>
            {t('appTitle')}
          </span>
        </div>
        <nav className="app-nav d-flex align-center gap-2">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </div>
      {/* Switches the shell's language and the `context.locale` every widget receives, without a reload. */}
      <label className="language-select d-flex align-center gap-2">
        <span>{t('language')}</span>
        <select value={locale} onChange={event => setLocale(event.target.value)}>
          {SUPPORTED_LOCALES.map(code => (
            <option key={code} value={code} lang={code}>
              {getLocaleDisplayName(code)} · {code}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}

export default Header;
