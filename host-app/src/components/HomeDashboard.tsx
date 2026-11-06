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

import { useNavigate } from 'react-router-dom';
import './HomeDashboard.css';
import { getPlacementsForScreen, type PluginPlacement } from '../config/plugin-placements';
import { buildPartnerModulePath } from '../config/routes';

// Native (built-in) Acuitas tiles — static placeholders that mimic the real A3
// home dashboard so partner tiles can be seen in their natural surroundings.
interface NativeTile {
  label: string;
  icon: string;
}

interface DashboardCategory {
  name: string;
  tiles: NativeTile[];
}

const NATIVE_CATEGORIES: DashboardCategory[] = [
  {
    name: 'Patient Care',
    tiles: [
      { label: 'Find a Patient', icon: '👤' },
      { label: 'Patient Balance', icon: '💰' },
      { label: 'Task Management', icon: '📋' },
      { label: 'Reports', icon: '📊' },
      { label: 'Book Appointment', icon: '📅' },
    ],
  },
  {
    name: 'Retail',
    tiles: [
      { label: 'Sales Worklists', icon: '🧾' },
      { label: 'New Sale', icon: '🏷️' },
      { label: 'Outstanding Payments', icon: '💳' },
    ],
  },
  {
    name: 'Examinations',
    tiles: [
      { label: 'Eye Exam', icon: '👁️' },
      { label: 'Exam Setup', icon: '⚙️' },
      { label: 'Contact Lenses', icon: '👓' },
    ],
  },
  {
    name: 'Insurance',
    tiles: [
      { label: 'Claims List', icon: '📑' },
      { label: 'Insurance Maintenance', icon: '🏥' },
    ],
  },
];

function HomeDashboard() {
  const navigate = useNavigate();
  const pluginPlacements = getPlacementsForScreen('HOME');

  const pluginsForCategory = (categoryName: string): PluginPlacement[] =>
    pluginPlacements.filter(placement => placement.category === categoryName);

  const openPlugin = (placement: PluginPlacement) => {
    navigate(buildPartnerModulePath(placement.placementId));
  };

  return (
    <main className="home-dashboard bg-main p-md">
      <div className="content-header">
        <nav className="breadcrumb">
          <span className="text-primary">Home</span>
        </nav>
      </div>

      <div className="home-dashboard-body">
        {NATIVE_CATEGORIES.map(category => (
          <section key={category.name} className="dashboard-category">
            <h6 className="dashboard-category-title text-primary">{category.name}</h6>
            <div className="dashboard-tiles">
              {category.tiles.map(tile => (
                <div key={tile.label} className="dashboard-tile" title={tile.label}>
                  <div className="dashboard-tile-icon">{tile.icon}</div>
                  <div className="dashboard-tile-label">{tile.label}</div>
                </div>
              ))}

              {/* Partner plugin launcher tiles registered for this category */}
              {pluginsForCategory(category.name).map(placement => (
                <button
                  key={placement.placementId}
                  type="button"
                  className="dashboard-tile dashboard-tile-plugin"
                  title={placement.pluginName}
                  onClick={() => openPlugin(placement)}
                >
                  <span className="dashboard-tile-badge">Partner</span>
                  <div className="dashboard-tile-icon">{placement.tileIcon ?? '🧩'}</div>
                  <div className="dashboard-tile-label">{placement.pluginName}</div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export default HomeDashboard;
