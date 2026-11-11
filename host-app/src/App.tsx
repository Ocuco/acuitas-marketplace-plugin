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

import './App.css';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store/store';
import LocaleProvider from './i18n/LocaleProvider';
import Header from './components/Header.tsx';
import MainContent from './components/MainContent.tsx';
import RightPanel from './components/RightPanel.tsx';
import PatientDashboard from './components/PatientDashboard.tsx';
import CheckoutDashboard from './components/CheckoutDashboard.tsx';
import HomeDashboard from './components/HomeDashboard.tsx';
import PartnerModulePage from './components/PartnerModulePage.tsx';
import { SCREEN_ROUTES, DEFAULT_ROUTE, PARTNER_MODULE_ROUTE } from './config/routes';

function App() {
  return (
    <Provider store={store}>
      <LocaleProvider>
        <BrowserRouter>
          <div className="app">
            <Header />
            <div className="app-body">
              <Routes>
                <Route path={SCREEN_ROUTES.HOME} element={<HomeDashboard />} />
                <Route path={PARTNER_MODULE_ROUTE} element={<PartnerModulePage />} />
                <Route
                  path={SCREEN_ROUTES.MEDICAL_IMAGES}
                  element={
                    <>
                      <MainContent />
                      <RightPanel />
                    </>
                  }
                />
                <Route path={SCREEN_ROUTES.PATIENT} element={<PatientDashboard />} />
                <Route path={SCREEN_ROUTES.CHECKOUT} element={<CheckoutDashboard />} />
                <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </LocaleProvider>
    </Provider>
  );
}

export default App;
