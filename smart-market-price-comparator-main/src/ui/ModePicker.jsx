import { useState } from 'react';
import { s, colors } from './styles';

const modes = [
  { id: 'cheapest', icon: '💰', label: 'En ucuz',    desc: 'Fiyatı en düşük market kombinasyonu' },
  { id: 'single',   icon: '🏪', label: 'Tek market', desc: 'Hepsini tek marketten al'            },
  { id: 'nearest',  icon: '🚶', label: 'En yakın',   desc: 'En az yürüyüş, en az market'        },
];

export default function ModePicker({
  basket = [],
  startPoints = [],
  selectedStartPoint,
  onStartPointChange,
  onConfirm,
}) {
  const [selected, setSelected]   = useState('cheapest');
  const [showStarts, setShowStarts] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError]     = useState(null);

  const activeStart = selectedStartPoint ?? startPoints[0];

  const handleStartSelect = (sp) => {
    setShowStarts(false);
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
    <div style={{ ...s.phone, display: 'flex', flexDirection: 'column', height: 600, overflow: 'hidden' }}>
      {/* Üst Bar */}
      <div style={s.topbar}>
        <div style={s.tbTitle}>Sepetim</div>
      </div>

      {/* Soluk sepet önizlemesi */}
      <div style={{ background: 'rgba(30,45,74,0.06)', padding: '11px 12px 0', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ opacity: 0.25, pointerEvents: 'none', flexShrink: 0 }}>
          {basket.slice(0, 2).map(item => (
            <div key={item.id} style={s.bcard}>
              <div style={s.bcTitle}>{item.name}</div>
            </div>
          ))}
          {basket.length === 0 && (
            <div style={s.bcard}>
              <div style={s.bcTitle}>Sepet boş</div>
            </div>
          )}
        </div>

        {/* Bottom sheet */}
        <div style={{
          background: '#fff',
          borderRadius: '14px 14px 0 0',
          padding: '13px 12px 16px',
          borderTop: `2px solid ${colors.topbar}`,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Sürükleme çubuğu */}
          <div style={{ width: 36, height: 4, background: colors.border, borderRadius: 2, margin: '0 auto 13px', flexShrink: 0 }} />

          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textDark, marginBottom: 11, flexShrink: 0 }}>
            Rota modu seçin
          </div>

          {/* Mod seçenekleri */}
          <div style={{ flexShrink: 0 }}>
            {modes.map((mode) => {
              const isOn = selected === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => setSelected(mode.id)}
                  style={{
                    border: `1px solid ${isOn ? colors.topbar : colors.border}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    marginBottom: 7,
                    background: isOn ? '#e8ecf7' : '#f7f8fc',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: colors.textDark }}>
                      <span style={{ marginRight: 5 }}>{mode.icon}</span>{mode.label}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>{mode.desc}</div>
                  </div>
                  {isOn && <span style={{ color: colors.topbar, fontSize: 15 }}>✓</span>}
                </div>
              );
            })}
          </div>

          {/* Başlangıç noktası — dropdown açılınca ekran uzamaz, position absolute */}
          {startPoints.length > 0 && (
            <div style={{ marginBottom: 9, flexShrink: 0, position: 'relative' }}>
              <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 5 }}>Başlangıç noktası</div>
              <div
                onClick={() => !gpsLoading && setShowStarts(s => !s)}
                style={{
                  ...s.searchBar,
                  marginBottom: 0,
                  padding: '6px 10px',
                  cursor: gpsLoading ? 'wait' : 'pointer',
                  justifyContent: 'space-between',
                  opacity: gpsLoading ? 0.7 : 1,
                }}
              >
                <span style={{ fontSize: 12, color: colors.textDark }}>
                  {gpsLoading ? '📡 Konum alınıyor...' : `📍 ${activeStart?.name ?? ''}`}
                </span>
                {!gpsLoading && <span style={{ fontSize: 12, color: colors.textLight }}>▾</span>}
              </div>

              {/* Dropdown — position absolute, ekranı itmez */}
              {showStarts && (
                <div style={{
                  position: 'absolute', top: 38, left: 0, right: 0,
                  background: '#fff',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  zIndex: 100,
                  boxShadow: '0 -4px 12px rgba(0,0,0,0.12)',
                }}>
                  {startPoints.map(sp => (
                    <div
                      key={sp.startPointId}
                      onClick={() => handleStartSelect(sp)}
                      style={{
                        padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                        color: activeStart?.startPointId === sp.startPointId ? colors.topbar : colors.textDark,
                        background: activeStart?.startPointId === sp.startPointId ? '#e8ecf7' : '#fff',
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
          )}

          {/* Boşluğu doldur */}
          <div style={{ flex: 1 }} />

          <button style={s.forwardBtn} onClick={() => onConfirm?.(selected)}>
            → Sonuçları göster
          </button>
        </div>
      </div>
    </div>
  );
}