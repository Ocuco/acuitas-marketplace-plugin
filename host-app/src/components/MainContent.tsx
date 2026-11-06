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

import './MainContent.css';
import ImagingViewer from './ImagingViewer';

function MainContent() {
  return (
    <main className="main-content bg-main p-md">
      <div className="content-header">
        <nav className="breadcrumb">
          <span className="text-secondary">Imaging</span>
          <span className="text-secondary"> / </span>
          <span className="text-primary">Medical Images</span>
        </nav>
      </div>

      <div className="content-body">
        <div className="card shadow-light">
          <div className="card-header">
            <h5 className="mb-0">Medical Image Viewport</h5>
          </div>
          <div className="card-body" style={{ minHeight: '400px', padding: 0 }}>
            <ImagingViewer />
          </div>
        </div>
      </div>
    </main>
  );
}

export default MainContent;
