import { mockData }          from "./data/mockShipData.js";
import { renderShipList }    from "./components/ShipList.js";
import { renderShipOverview } from "./components/ShipOverview.js";
import { initMapPanel }      from "./components/MapPanel.js";
import { renderRiskPanel }   from "./components/RiskPanel.js";
import { renderEventList }   from "./components/EventList.js";
import { renderCrewPanel }   from "./components/CrewPanel.js";
import { renderTimeline }    from "./components/Timeline.js";

/* ── State ──────────────────────────────────────────── */

const state = {
  selectedShipId: mockData.ships[0].id,
  currentStep:    0,
  timelineMode:   'NOW',   // 'NOW' | 'EVENT'
  focusEventId:   null,
  window:         { start: 0, end: 24 },
};

/* ── Helpers ────────────────────────────────────────── */

function ship()     { return mockData.ships.find(s => s.id === state.selectedShipId); }
function snapshot() { return mockData.snapshots[state.selectedShipId][state.currentStep]; }
function allSnaps() { return mockData.snapshots[state.selectedShipId]; }

function updateWindow() {
  if (state.timelineMode === 'NOW') {
    state.window = {
      start: Math.max(0,  state.currentStep - 6),
      end:   Math.min(24, state.currentStep + 6),
    };
  }
  // EVENT mode: window is set by onEventClick, keep unchanged
}

/* ── Map controller (initialized once) ─────────────── */

let mapCtrl = null;

/* ── Render ─────────────────────────────────────────── */

function renderContent() {
  const s    = ship();
  const snap = snapshot();
  const snaps = allSnaps();

  renderShipOverview(document.getElementById('ship-overview-pane'), s, snap);

  const riskEl = document.getElementById('risk-panel-pane');
  if (riskEl) renderRiskPanel(riskEl, snap.risk, snap.fuelStatus);

  renderEventList(document.getElementById('event-list-pane'), snap.events, onEventClick, state.focusEventId);
  renderCrewPanel(document.getElementById('crew-panel-pane'), s);

  if (mapCtrl) mapCtrl.update(s, snap, state.currentStep, snaps);

  renderTimeline(document.getElementById('timeline-bar'), {
    currentStep:  state.currentStep,
    window:       state.window,
    events:       s.events,
    mode:         state.timelineMode,
    focusEventId: state.focusEventId,
    onChange:     onTimeStep,
    onNow,
  });
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
  state.currentStep    = 0;
  state.timelineMode   = 'NOW';
  state.focusEventId   = null;
  updateWindow();
  renderAll();
}

function onTimeStep(step) {
  state.currentStep = step;
  updateWindow();
  renderContent();
}

function onEventClick(event) {
  state.timelineMode = 'EVENT';
  state.focusEventId = `${event.type}_${event.hour}`;
  state.currentStep  = event.hour;
  state.window = {
    start: Math.max(0,  event.hour - 6),
    end:   Math.min(24, event.hour + 6),
  };
  renderContent();
}

function onNow() {
  state.timelineMode = 'NOW';
  state.focusEventId = null;
  updateWindow();
  renderContent();
}

/* ── Init ───────────────────────────────────────────── */

function init() {
  mapCtrl = initMapPanel(document.getElementById('map-panel-pane'));
  updateWindow();
  renderAll();
}

init();