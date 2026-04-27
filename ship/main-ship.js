import { mockData }            from "./data/mockShipData.js";
import { renderShipList }       from "./components/ShipList.js";
import { renderShipOverview }   from "./components/ShipOverview.js";
import { initMapPanel }         from "./components/MapPanel.js";
import { renderRiskPanel }      from "./components/RiskPanel.js";
import { renderEventList }      from "./components/EventList.js";
import { renderCrewPanel }      from "./components/CrewPanel.js";
import { renderVoyageTimeline } from "./components/VoyageTimeline.js";

/* ── State ──────────────────────────────────────────── */

const state = {
  selectedShipId: mockData.ships[0].id,

  voyage: {
    step:    0,
    mode:    'NOW',   // 'NOW' | 'EVENT'
    focusId: null,
    window:  { start: 0, end: 6 },
  },
};

/* ── Helpers ────────────────────────────────────────── */

function ship()     { return mockData.ships.find(s => s.id === state.selectedShipId); }
function snapshot() { return mockData.snapshots[state.selectedShipId][state.voyage.step]; }
function allSnaps() { return mockData.snapshots[state.selectedShipId]; }

function updateVoyageWindow() {
  if (state.voyage.mode === 'NOW') {
    state.voyage.window = {
      start: Math.max(0,  state.voyage.step - 6),
      end:   Math.min(24, state.voyage.step + 6),
    };
  }
}

/* ── Map controller (initialized once) ─────────────── */

let mapCtrl = null;

/* ── Render ─────────────────────────────────────────── */

function renderContent() {
  const s     = ship();
  const snap  = snapshot();
  const snaps = allSnaps();

  renderShipOverview(document.getElementById('ship-overview-pane'), s, snap);

  const riskEl = document.getElementById('risk-panel-pane');
  if (riskEl) renderRiskPanel(riskEl, snap.risk, snap.fuelStatus);

  renderEventList(
    document.getElementById('voyage-event-pane'),
    snap.events,
    onVoyageEventClick,
    state.voyage.focusId,
  );

  renderVoyageTimeline(document.getElementById('voyage-timeline-bar'), {
    currentStep:  state.voyage.step,
    window:       state.voyage.window,
    events:       s.events,
    mode:         state.voyage.mode,
    focusEventId: state.voyage.focusId,
    onChange:     onVoyageStep,
    onNow:        onVoyageNow,
  });

  if (mapCtrl) mapCtrl.update(s, snap, state.voyage.step, snaps);

  renderCrewPanel(document.getElementById('crew-panel-pane'), s);
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
  state.voyage.step    = 0;
  state.voyage.mode    = 'NOW';
  state.voyage.focusId = null;
  updateVoyageWindow();
  renderAll();
}

function onVoyageStep(step) {
  state.voyage.step = step;
  updateVoyageWindow();
  renderContent();
}

function onVoyageEventClick(ev) {
  state.voyage.mode    = 'EVENT';
  state.voyage.focusId = `${ev.type}_${ev.hour}`;
  state.voyage.step    = ev.hour;
  state.voyage.window  = {
    start: Math.max(0,  ev.hour - 6),
    end:   Math.min(24, ev.hour + 6),
  };
  renderContent();
}

function onVoyageNow() {
  state.voyage.mode    = 'NOW';
  state.voyage.focusId = null;
  updateVoyageWindow();
  renderContent();
}

/* ── Init ───────────────────────────────────────────── */

function init() {
  mapCtrl = initMapPanel(document.getElementById('map-panel-pane'));
  updateVoyageWindow();
  renderAll();
}

init();
