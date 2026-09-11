import * as L from 'leaflet';

/**
 * routeDisplayService.js
 * ORS (OpenRouteService) API kullanarak rota cizer.
 */

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking';

const COLORS = {
  routeLine:   '#2e7d32',
  startPin:    '#e53935',
  activeStore: '#2e7d32',
};

const _activeLayers = new WeakMap();

export async function drawRoute(map, routeResult, storeLocations, startLat, startLon) {
  if (!map || !routeResult) return;
  clearRoute(map);
  const waypoints = buildWaypoints(routeResult, storeLocations, startLat, startLon);
  if (waypoints.length === 0) return;
  try {
    const routeCoords = await fetchORSRoute(waypoints);
    _drawPolyline(map, routeCoords);
  } catch (err) {
    console.warn('ORS failed, drawing straight lines:', err);
    const fallbackCoords = waypoints.map(wp => [wp.lat, wp.lon]);
    _drawPolyline(map, fallbackCoords, true);
  }
  _drawStartMarker(map, startLat, startLon);
  _drawStoreMarkers(map, routeResult, storeLocations);
  _fitMapToRoute(map, waypoints);
}

export function clearRoute(map) {
  if (!map) return;
  const layers = _activeLayers.get(map);
  if (!layers) return;
  layers.polylines.forEach(p => p.remove());
  layers.markers.forEach(m => m.remove());
  _activeLayers.set(map, { polylines: [], markers: [] });
}

async function fetchORSRoute(waypoints) {
  const coordinates = waypoints.map(wp => [wp.lon, wp.lat]);
  const response = await fetch(ORS_BASE_URL + '/geojson', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': ORS_API_KEY,
    },
    body: JSON.stringify({ coordinates }),
  });
  if (!response.ok) throw new Error(`ORS API error: ${response.status}`);
  const data = await response.json();
  const orsCoords = data.features[0].geometry.coordinates;
  return orsCoords.map(([lon, lat]) => [lat, lon]);
}

function buildWaypoints(routeResult, storeLocations, startLat, startLon) {
  const waypoints = [{ lat: startLat, lon: startLon, label: 'Baslangic', storeId: null }];
  const storeIds = routeResult.stores.map(s => s.storeId);
  const sorted = nearestNeighborSort(storeIds, storeLocations, startLat, startLon);
  for (const storeId of sorted) {
    const loc = findLocation(storeLocations, storeId);
    if (loc) waypoints.push({ lat: loc.latitude, lon: loc.longitude, label: storeId, storeId });
  }
  return waypoints;
}

function nearestNeighborSort(storeIds, storeLocations, startLat, startLon) {
  const remaining = [...storeIds];
  const sorted = [];
  let curLat = startLat, curLon = startLon;
  while (remaining.length > 0) {
    let nearestId = null, nearestIdx = -1, minDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const loc = findLocation(storeLocations, remaining[i]);
      if (!loc) continue;
      const d = haversine(curLat, curLon, loc.latitude, loc.longitude);
      if (d < minDist) { minDist = d; nearestId = remaining[i]; nearestIdx = i; }
    }
    if (nearestId) {
      sorted.push(nearestId);
      const loc = findLocation(storeLocations, nearestId);
      curLat = loc.latitude; curLon = loc.longitude;
      remaining.splice(nearestIdx, 1);
    } else break;
  }
  return sorted;
}

function _drawPolyline(map, coords, dashed = false) {
  
  if (!map || !coords || coords.length === 0) return;  
// Harita unmount edildikten sonra gelen async ORS cevaplarını yakala
  // map.remove() sonrası _panes undefined olduğu için appendChild hatası verir
  const polyline = L.polyline(coords, {
    color: COLORS.routeLine, weight: 4, opacity: 0.85,
    ...(dashed ? { dashArray: '8, 6' } : {}),
  }).addTo(map);
  _registerLayer(map, 'polylines', polyline);
}

function _drawStartMarker(map, lat, lon) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="background:${COLORS.startPin};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconAnchor: [7, 7],
  });
  const marker = L.marker([lat, lon], { icon }).bindTooltip('Başlangıç', { direction: 'top' }).addTo(map);
  _registerLayer(map, 'markers', marker);
}

function _drawStoreMarkers(map, routeResult, storeLocations) {
  for (const rs of routeResult.stores) {
    const loc = findLocation(storeLocations, rs.storeId);
    if (!loc) continue;
    const chain = rs.storeId.includes('-') ? rs.storeId.substring(0, rs.storeId.lastIndexOf('-')) : rs.storeId;
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:${COLORS.activeStore};color:white;font-size:9px;font-weight:600;padding:2px 5px;border-radius:5px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3)">${chain}</div>`,
      iconAnchor: [0, 0],
    });
    const marker = L.marker([loc.latitude, loc.longitude], { icon })
      .bindPopup(`<b>${chain}</b><br>${loc.address || rs.storeId}`).addTo(map);
    _registerLayer(map, 'markers', marker);
  }
}

function _fitMapToRoute(map, waypoints) {
  if (waypoints.length === 0) return;
  map.fitBounds(L.latLngBounds(waypoints.map(wp => [wp.lat, wp.lon])), { padding: [30, 30] });
}

function _registerLayer(map, type, layer) {
  if (!_activeLayers.has(map)) _activeLayers.set(map, { polylines: [], markers: [] });
  _activeLayers.get(map)[type].push(layer);
}

function findLocation(storeLocations, storeId) {
  if (!storeLocations || !storeId) return null;
  return storeLocations.find(loc => loc.storeId.toLowerCase() === storeId.toLowerCase()) || null;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function toRad(deg) { return deg * Math.PI / 180; }