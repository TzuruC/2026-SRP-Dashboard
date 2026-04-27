import { mockData } from "./fleet/data/mockData.js";
import { renderKpiBar } from "./fleet/components/kpiBar.js";
import { renderShipList } from "./fleet/components/shipList.js";
import { initMap } from "./fleet/components/mapView.js";
import { renderAlertPanel } from "./fleet/components/alertPanel.js";
import { renderShipDetail } from "./fleet/components/shipDetail.js";
import { renderTimeline } from "./fleet/components/timeline.js";

const state = {
  selectedShipId: null,
  ships: mockData.ships,
  events: mockData.events,
};

let mapCtrl = null;

function selectedShip() {
  return state.ships.find((s) => s.id === state.selectedShipId) ?? null;
}

function selectShip(shipId) {
  state.selectedShipId = shipId === state.selectedShipId ? null : shipId;
  renderShipList(
    document.getElementById("ship-list-pane"),
    state.ships,
    state.selectedShipId,
    selectShip,
  );
  renderShipDetail(document.getElementById("detail-pane"), selectedShip());
  if (mapCtrl) mapCtrl.selectShip(state.selectedShipId);
}

function init() {
  renderKpiBar(document.getElementById("kpi-bar"), state.ships);

  renderShipList(
    document.getElementById("ship-list-pane"),
    state.ships,
    state.selectedShipId,
    selectShip,
  );

  mapCtrl = initMap(
    document.getElementById("map-container"),
    state.ships,
    selectShip,
  );

  renderAlertPanel(
    document.getElementById("alert-pane"),
    state.events,
    state.ships,
    selectShip,
  );

  renderShipDetail(document.getElementById("detail-pane"), null);

  renderTimeline(document.getElementById("timeline-pane"), (_step) => {
    // placeholder: future implementation will replay historical ship positions
  });
}

init();
