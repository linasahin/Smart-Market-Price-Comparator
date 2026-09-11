import { s, colors, storeBadgeStyle } from './styles';

export default function BasketScreen({ basket, updateQty, removeItem, onCompareRoutes, onBack }) {
  const items = basket ?? [];

  const total = items.reduce((sum, item) => {
    const price = item.stores?.length > 0
      ? Math.min(...item.stores.map(s => s.price))
      : item.price ?? 0;
    return sum + price * item.qty;
  }, 0);

  return (
    <div style={{ ...s.phone, display: 'flex', flexDirection: 'column', height: 600 }}>
      {/* Üst Bar */}
      <div style={s.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={s.backBtn}>←</button>
          <div style={s.tbTitle}>Sepetim</div>
        </div>
        <span style={{ background: colors.topbarMuted, color: colors.topbarText, borderRadius: 10, padding: '2px 9px', fontSize: 11 }}>
          {items.length} ürün
        </span>
      </div>

      {/* Kaydırılabilir içerik */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '11px 12px', scrollbarWidth: 'thin', scrollbarColor: `${colors.topbar} ${colors.border}` }}>
        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: colors.textLight, marginTop: 40, fontSize: 13 }}>
            Sepetiniz boş
          </div>
        )}

        {items.map((item) => {
          const storeMap = new Map();
          for (const v of (item.stores ?? [])) {
            if (!storeMap.has(v.store) || v.price < storeMap.get(v.store).price) {
              storeMap.set(v.store, v);
            }
          }
          const storeChips = Array.from(storeMap.values());

          return (
            <div key={item.id} style={s.bcard}>
              {/* Ürün başlığı */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  <span style={{ ...s.bcTitle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </span>
                  {item.variant && (
                    <span style={{ fontSize: 10, color: colors.textLight, whiteSpace: 'nowrap' }}>
                      {item.variant}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textLight, fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                >✕</button>
              </div>

              {/* Market chip'leri — renkli, sadece bilgi */}
              {storeChips.length > 0 && (
                <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                  {storeChips.map((v) => (
                    <div key={v.store} style={{ ...storeBadgeStyle(v.store), padding: '4px 7px', fontSize: 10, borderRadius: 7, marginTop: 0 }}>
                      {v.store}
                      <br />
                      <span style={{ fontSize: 9 }}>{v.price} TL</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Miktar satırı */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: colors.textLight }}>{item.variant}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button style={s.qbtn} onClick={() => updateQty(item.id, -1)}>−</button>
                  <span style={{ fontSize: 12, color: colors.textDark, minWidth: 14, textAlign: 'center' }}>{item.qty}</span>
                  <button style={s.qbtn} onClick={() => updateQty(item.id, +1)}>+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sabit alt — sarı buton */}
      <div style={{ padding: '8px 12px', background: colors.pageBg, borderTop: `1px solid ${colors.softBorder}` }}>
        <div style={s.totalBar}>
          <span style={{ fontSize: 12, color: colors.textMid }}>Toplam</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: colors.textDark }}>{total.toFixed(2)} TL</span>
        </div>
        <button style={{ ...s.forwardBtn, marginBottom: 0 }} onClick={onCompareRoutes}>
          🗺️ Rotaları karşılaştır
        </button>
      </div>
    </div>
  );
}