import { mockData }             from "./data/mockShipData.js";
import { renderShipList }        from "./components/ShipList.js";
import { renderShipOverview }    from "./components/ShipOverview.js";
import { initMapPanel }          from "./components/MapPanel.js";
import { renderRiskPanel }       from "./components/RiskPanel.js";
import { renderEventList,
         renderPortEventList }   from "./components/EventList.js";
import { renderCrewPanel }       from "./components/CrewPanel.js";
import { renderVoyageTimeline }  from "./components/VoyageTimeline.js";
import { renderPortTimeline }    from "./components/PortTimeline.js";

/* ── State ──────────────────────────────────────────── */

const state = {
  selectedShipId: mockData.ships[0].id,

  // Voyage domain: NOW → ETA (0-24h)
  voyage: {
    step:    0,
    mode:    'NOW',   // 'NOW' | 'EVENT'
    focusId: null,
    window:  { start: 0, end: 6 },
  },

  // Port domain: ETA → ETA+72h
  port: {
    step:    0,       // hours after expectedEtaH (0-72)
    focusId: null,
    window:  { start: 0, end: 24 },
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
  // EVENT mode: window stays locked (set by onVoyageEventClick)
}

function updatePortWindow() {
  state.port.window = {
    start: Math.max(0,  state.port.step - 12),
    end:   Math.min(72, state.port.step + 12),
  };
}

/* ── Map controller (initialized once) ─────────────── */

let mapCtrl = null;

/* ── Render ─────────────────────────────────────────── */

function renderContent() {
  const s     = ship();
  const snap  = snapshot();
  const snaps = allSnaps();

  // ── Voyage domain ──────────────────────────────────
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

  // ── Port domain ────────────────────────────────────
  renderPortTimeline(document.getElementById('port-timeline-bar'), {
    portStep: state.port.step,
    window:   state.port.window,
    events:   s.portEvents || [],
    etaH:     s.expectedEtaH,
    focusId:  state.port.focusId,
    onChange: onPortStep,
  });

  renderPortEventList(
    document.getElementById('port-event-pane'),
    s.portEvents || [],
    state.port.step,
    s.expectedEtaH,
    onPortEventClick,
    state.port.focusId,
  );

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
  state.port.step      = 0;
  state.port.focusId   = null;
  updateVoyageWindow();
  updatePortWindow();
  renderAll();
}

// Voyage handlers
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

// Port handlers
function onPortStep(step) {
  state.port.step = step;
  updatePortWindow();
  renderContent();
}

function onPortEventClick(ev) {
  const offset         = ev.hour - ship().expectedEtaH;
  state.port.focusId   = `${ev.type}_${ev.hour}`;
  state.port.step      = Math.max(0, Math.min(72, offset));
  state.port.window    = {
    start: Math.max(0,  state.port.step - 12),
    end:   Math.min(72, state.port.step + 12),
  };
  renderContent();
}

/* ── Init ───────────────────────────────────────────── */

function init() {
  mapCtrl = initMapPanel(document.getElementById('map-panel-pane'));
  updateVoyageWindow();
  updatePortWindow();
  renderAll();
}

init();
