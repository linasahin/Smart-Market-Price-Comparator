import { useState } from 'react';
import { s, colors } from './styles';

const MODES = [
  { id: 'cheapest', label: 'En ucuz mod' },
  { id: 'single',   label: 'Tek market modu' },
  { id: 'nearest',  label: 'En yakın mod' },
];

export default function RouteResults({ routeResults, selectedMode, basket, onBack, onShowMap, onModeChange }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const results   = routeResults || [];
  const modeLabel = MODES.find(m => m.id === selectedMode)?.label ?? 'En ucuz mod';
  const basketEmpty = !basket || basket.length === 0;

  let emptyMessage;
  if (basketEmpty) emptyMessage = 'Sepetiniz boş';
  else if (selectedMode === 'single') emptyMessage = 'Bu sepet için tek market rotası önerilemiyor.';
  else if (selectedMode === 'nearest') emptyMessage = 'Bu sepet için en yakın rota önerilemiyor.';
  else emptyMessage = 'Bu sepet için uygun rota bulunamadı.';

  return (
    <div style={{ ...s.phone, display: 'flex', flexDirection: 'column', height: 600 }}>
      {/* Üst Bar */}
      <div style={s.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={s.backBtn}>←</button>
          <div style={s.tbTitle}>Sonuçlar</div>
        </div>

        {/* Mod dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              background: colors.topbarMuted,
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 7, padding: '3px 8px',
              fontSize: 10, color: colors.topbarText,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {modeLabel} ▾
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 28, right: 0,
              background: '#fff', border: `1px solid ${colors.border}`,
              borderRadius: 8, overflow: 'hidden', zIndex: 100,
              minWidth: 150, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}>
              {MODES.map(m => (
                <div
                  key={m.id}
                  onClick={() => { onModeChange?.(m.id); setDropdownOpen(false); }}
                  style={{
                    padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                    color: selectedMode === m.id ? colors.topbar : colors.textDark,
                    background: selectedMode === m.id ? '#e8ecf7' : '#fff',
                    fontWeight: selectedMode === m.id ? 600 : 400,
                    borderBottom: `1px solid ${colors.softBorder}`,
                  }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '11px 12px', scrollbarWidth: 'thin', scrollbarColor: `${colors.topbar} ${colors.border}` }}>
        {results.length === 0 && (
          <div style={{ fontSize: 12, color: colors.textLight, textAlign: 'center', padding: '20px 10px', lineHeight: 1.5 }}>
            {emptyMessage}
          </div>
        )}

        {results.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 7 }}>
              En iyi {results.length} kombinasyon
            </div>

            {results.map((route, index) => {
              const isTop   = index === 0;
              const timeStr = `${route.timeMin} dk`;
              const distStr = `${route.totalDistance.toFixed(2)} km`;

              return (
                <div
                  key={route.routeId}
                  onClick={() => onShowMap?.(route)}
                  style={{
                    background: '#fff',
                    border: isTop ? `2px solid ${colors.topbar}` : `1px solid ${colors.softBorder}`,
                    borderRadius: 10, padding: '9px 11px', marginBottom: 7, cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      {isTop && (
                        <div style={{ fontSize: 10, color: colors.topbar, fontWeight: 600, marginBottom: 2 }}>
                          1. öneri
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.textDark }}>{route.name}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textDark }}>{route.totalCost} TL</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                    {[`🏪 ${route.storeCount} market`, `🚶 ${timeStr}`, `📍 ${distStr}`].map(pill => (
                      <span key={pill} style={{ background: colors.totalBg, color: colors.textMid, borderRadius: 5, padding: '2px 7px', fontSize: 10 }}>
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Sticky bottom — sarı Haritada gör butonu */}
      <div style={{ padding: '8px 12px', background: colors.pageBg, borderTop: `1px solid ${colors.softBorder}` }}>
        <button
          style={{ ...s.forwardBtn, marginBottom: 0 }}
          onClick={() => results.length > 0 && onShowMap?.(results[0])}
          disabled={results.length === 0}
        >
          🗺️ Haritada gör
        </button>
      </div>
    </div>
  );
}