import { mockData }           from './data/mockShipData.js';
import { renderShipList }     from './components/ShipList.js';
import { renderShipOverview } from './components/ShipOverview.js';
import { initMapPanel }       from './components/MapPanel.js';
import { renderRiskPanel }    from './components/RiskPanel.js';
import { renderEventList }    from './components/EventList.js';
import { renderCrewPanel }    from './components/CrewPanel.js';
import { renderTimeline }     from './components/Timeline.js';

/* ── State ──────────────────────────────────────────── */

const state = {
  selectedShipId: mockData.ships[0].id,
  currentStep: 0,
};

/* ── Helpers ────────────────────────────────────────── */

function ship()     { return mockData.ships.find(s => s.id === state.selectedShipId); }
function snapshot() { return mockData.snapshots[state.selectedShipId][state.currentStep]; }
function allSnaps() { return mockData.snapshots[state.selectedShipId]; }

/* ── Map controller (initialized once) ─────────────── */

let mapCtrl = null;

/* ── Render functions ───────────────────────────────── */

function renderContent() {
  const s = ship();
  const snap = snapshot();
  const snaps = allSnaps();

  renderShipOverview(document.getElementById('ship-overview-pane'), s, snap);
  renderRiskPanel(document.getElementById('risk-panel-pane'), snap.risk);
  renderEventList(document.getElementById('event-list-pane'), snap.events);
  renderCrewPanel(document.getElementById('crew-panel-pane'), s);

  if (mapCtrl) mapCtrl.update(s, snap, state.currentStep, snaps);
}

function renderAll() {
  renderShipList(
    document.getElementById('ship-list-pane'),
    mockData.ships,
    mockData.snapshots,
    state.selectedShipId,
    selectShip,
  );
  renderContent();
}

/* ── Event handlers ─────────────────────────────────── */

function selectShip(shipId) {
  state.selectedShipId = shipId;
  state.currentStep = 0;
  renderAll();
}

function onTimeStep(step) {
  state.currentStep = step;
  renderContent();
}

/* ── Init ───────────────────────────────────────────── */

function init() {
  mapCtrl = initMapPanel(document.getElementById('map-panel-pane'));

  renderTimeline(document.getElementById('timeline-bar'), onTimeStep);

  renderAll();
}

init();
