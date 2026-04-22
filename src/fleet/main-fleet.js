import { mockFleetData } from './data/mockFleetData.js';
import { renderFleetKPIHeader } from './components/FleetKPIHeader.js';
import { renderFleetStrategyPanel } from './components/FleetStrategyPanel.js';
import { renderFleetLivePanel } from './components/FleetLivePanel.js';
import { renderFleetRiskPanel } from './components/FleetRiskPanel.js';

const state = {
  ships: mockFleetData.ships,
  events: mockFleetData.events,
  activeTab: 'strategy',
};

function getContainer(id) {
  return document.getElementById(id);
}

function renderKPI() {
  renderFleetKPIHeader(getContainer('fleet-kpi-header'), state.ships);
}

function renderActiveTab() {
  switch (state.activeTab) {
    case 'strategy':
      renderFleetStrategyPanel(getContainer('tab-strategy'), state.ships);
      break;
    case 'live':
      renderFleetLivePanel(getContainer('tab-live'), state.ships, onDrillDown);
      break;
    case 'risk':
      renderFleetRiskPanel(getContainer('tab-risk'), state.ships, state.events);
      break;
  }
}

function onDrillDown(shipId) {
  // Navigate to ship dashboard
  window.location.href = `ship-dashboard.html?shipId=${shipId}`;
}

function initTabs() {
  const tabEls = document.querySelectorAll('#fleet-tabs .nav-link');
  tabEls.forEach(tab => {
    tab.addEventListener('shown.bs.tab', (e) => {
      const target = e.target.dataset.bsTarget;
      if (target === '#tab-strategy') state.activeTab = 'strategy';
      else if (target === '#tab-live')     state.activeTab = 'live';
      else if (target === '#tab-risk')     state.activeTab = 'risk';
      renderActiveTab();
    });
  });
}

function init() {
  renderKPI();
  renderActiveTab();
  initTabs();

  // Simulate live refresh every 30s
  setInterval(() => {
    renderKPI();
    renderActiveTab();
  }, 30000);
}

document.addEventListener('DOMContentLoaded', init);
