import { useState, useRef, useEffect } from 'react';
import { s, colors } from './styles';
import { drawRoute, clearRoute } from '../service/routeDisplayService';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

function buildRouteSummary(routeName) {
  if (!routeName) return 'Başlangıç';
  const cleaned = routeName.replace(/\s+tek$/i, '');
  const chains = cleaned.split('+').map(c => c.trim()).filter(c => c.length > 0);
  return ['Başlangıç', ...chains].join(' → ');
}

export default function MapScreen({
  selectedRoute, startPoint, storeLocations, onBack,
  startPoints = [], onStartPointChange,
}) {
  const mapRef     = useRef(null);
  const leafletMap = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [gpsError, setGpsError]         = useState(null);

  const route     = selectedRoute || null;
  const startName = startPoint?.name ?? 'Yeditepe Üst Kapı';
  const startLat  = startPoint?.latitude  ?? 40.9755;
  const startLon  = startPoint?.longitude ?? 29.1498;
  const routeName = route?.name ?? '—';
  const summary   = buildRouteSummary(routeName);
  const distStr   = route ? `${route.totalDistance.toFixed(2)} km` : '—';
  const timeStr   = route ? `${route.timeMin} dk` : '—';
  const priceStr  = route ? `${route.totalCost} TL` : '—';

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([startLat, startLon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(leafletMap.current);
    }
    return () => {
      if (leafletMap.current) {
        clearRoute(leafletMap.current);
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
  if (!leafletMap.current) return;
  leafletMap.current.setView([startLat, startLon], 14);
  if (route) {
    drawRoute(leafletMap.current, route, storeLocations, startLat, startLon);
  }
}, [route, startLat, startLon]);

  const handleStartSelect = (sp) => {
    setShowDropdown(false);
    setGpsError(null);
    if (!sp.isUserLocation) {
      onStartPointChange?.(sp);
      return;
    }
    if (!navigator.geolocation) {
      setGpsError('Tarayıcı konum özelliğini desteklemiyor.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onStartPointChange?.({ ...sp, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => { setGpsLoading(false); setGpsError('Konum alınamadı.'); },
      { timeout: 10000 }
    );
  };

  return (
    <div style={{ ...s.phone, display: 'flex', flexDirection: 'column', height: 600 }}>
      {/* Üst Bar */}
      <div style={s.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={s.backBtn}>←</button>
          <div style={s.tbTitle}>Harita / Rota</div>
        </div>
        <span style={{ fontSize: 11, color: colors.topbarSub }}>{routeName}</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 8, background: 'rgba(245,246,249,0.93)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 5 }}>Başlangıç noktası:</div>

        {/* Dropdown */}
        <div style={{ position: 'relative', marginBottom: 8, zIndex: 200 }}>
          <div
            onClick={() => !gpsLoading && setShowDropdown(d => !d)}
            style={{
              ...s.searchBar,
              marginBottom: 0,
              padding: '6px 10px',
              cursor: 'pointer',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 12, color: colors.textDark }}>
              {gpsLoading ? '📡 Konum alınıyor...' : `📍 ${startName}`}
            </span>
            <span style={{ fontSize: 12, color: colors.textLight }}>▾</span>
          </div>

          {showDropdown && startPoints.length > 0 && (
            <div style={{
              position: 'absolute', top: 36, left: 0, right: 0,
              background: '#fff', border: `1px solid ${colors.border}`,
              borderRadius: 8, overflow: 'hidden', zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}>
              {startPoints.map(sp => (
                <div
                  key={sp.startPointId}
                  onClick={() => handleStartSelect(sp)}
                  style={{
                    padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                    color: startPoint?.startPointId === sp.startPointId ? colors.topbar : colors.textDark,
                    background: startPoint?.startPointId === sp.startPointId ? '#e8ecf7' : '#fff',
                    borderBottom: `1px solid ${colors.softBorder}`,
                  }}
                >
                  {sp.isUserLocation ? '📡 ' : '📍 '}{sp.name}
                </div>
              ))}
            </div>
          )}

          {gpsError && (
            <div style={{ marginTop: 4, padding: '5px 9px', background: '#fff3f3', border: '1px solid #ffcccc', borderRadius: 6, fontSize: 11, color: '#c0392b' }}>
              ⚠️ {gpsError}
            </div>
          )}
        </div>

        {/* Harita */}
<div ref={mapRef} style={{ height: 230, width: '100%', borderRadius: 10, marginBottom: 8, flexShrink: 0, zIndex: 1 }} />
        {/* Rota bilgi kartı */}
        <div style={{ ...s.bcard, marginBottom: 0, flex: 1 }}>
          <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 4 }}>Önerilen rota</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: colors.textDark, marginBottom: 5 }}>{summary}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[`📍 ${distStr}`, `🚶 ${timeStr}`, `💰 ${priceStr}`].map(pill => (
              <span key={pill} style={{ background: colors.totalBg, color: colors.textMid, borderRadius: 5, padding: '2px 7px', fontSize: 10 }}>
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom — sarı buton */}
      <div style={{ padding: '8px 12px', background: 'rgba(245,246,249,0.93)', borderTop: `1px solid ${colors.softBorder}` }}>
        <button style={{ ...s.forwardBtn, marginBottom: 0 }} onClick={onBack}>
          ← Sonuçlara dön
        </button>
      </div>
    </div>
  );
}