import { mockFleetData } from './data/mockFleetData.js';
import { renderFleetKPIHeader } from './components/FleetKPIHeader.js';
import { renderFleetStrategyPanel } from './components/FleetStrategyPanel.js';
import { renderFleetLivePanel } from './components/FleetLivePanel.js';
import { renderFleetRiskPanel } from './components/FleetRiskPanel.js';

const state = {
  ships: mockFleetData.ships,
  events: mockFleetData.events,
  rankingKPI: 'fuel',
};

function getContainer(id) {
  return document.getElementById(id);
}

function renderKPI() {
  renderFleetKPIHeader(getContainer('fleet-kpi-header'), state.ships);
}

function renderAll() {
  renderFleetStrategyPanel(
    getContainer('fleet-strategy-panel'),
    state.ships,
    state.rankingKPI,
    onRankingKPIChange
  );
  renderFleetLivePanel(getContainer('fleet-live-panel'), state.ships, onDrillDown);
  renderFleetRiskPanel(getContainer('fleet-risk-panel'), state.ships, state.events);
}

function onRankingKPIChange(kpi) {
  state.rankingKPI = kpi;
  renderFleetStrategyPanel(
    getContainer('fleet-strategy-panel'),
    state.ships,
    state.rankingKPI,
    onRankingKPIChange
  );
}

function onDrillDown(shipId) {
  window.location.href = `ship-dashboard.html?shipId=${shipId}`;
}

function init() {
  renderKPI();
  renderAll();

  // Simulate live refresh every 30s
  setInterval(() => {
    renderKPI();
    renderAll();
  }, 30000);
}

document.addEventListener('DOMContentLoaded', init);
