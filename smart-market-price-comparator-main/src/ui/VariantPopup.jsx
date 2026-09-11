import { useState } from 'react';
import { s, colors, storeBadgeStyle } from './styles';

export default function VariantPopup({ product, basket = [], addItem, updateQty, onClose }) {
  const [selectedBrand, setSelectedBrand] = useState(null);

  const variants = product?.variants ?? [];

  // Group variants by brand, collect stores as info, find cheapest price
  const brandMap = new Map();
  for (const v of variants) {
    const brand = v.name;
    if (!brandMap.has(brand)) {
      brandMap.set(brand, { brand, minPrice: v.price, stores: [] });
    }
    const entry = brandMap.get(brand);
    if (v.price < entry.minPrice) entry.minPrice = v.price;
    if (!entry.stores.includes(v.store)) {
      entry.stores.push(v.store);
    }
  }

  // Sort cheapest first
  const brandList = Array.from(brandMap.values()).sort((a, b) => a.minPrice - b.minPrice);

  const handleAddToBasket = () => {
    if (!selectedBrand) return;
    addItem?.(product, selectedBrand);
    onClose?.();
  };

  return (
    <div style={s.phone}>
      {/* Top Bar */}
      <div style={s.topbar}>
        <div style={s.tbTitle}>Smart Market</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8d8a8', fontSize: 17 }}>
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={s.body}>
        <div style={{ background: 'rgba(26,77,36,0.18)', borderRadius: 10, padding: 8, marginBottom: 12 }}>
          <div style={{ background: '#fff', border: `1px solid ${colors.borderGreen}`, borderRadius: 10, padding: '10px 12px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: colors.textDark }}>
                {product?.name ?? 'Ürün'}
              </span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textLight, fontSize: 14 }}>
                ✕
              </button>
            </div>
            <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 10 }}>Marka seçin</div>

            {/* Brand rows */}
            <div style={{ maxHeight: 300, overflowY: 'auto', scrollbarWidth: 'none' }}>
              {brandList.map((entry, i) => (
                <div
                  key={entry.brand}
                  onClick={() => setSelectedBrand(entry.brand)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 6px',
                    borderBottom: i < brandList.length - 1 ? `1px solid #eef5ec` : 'none',
                    cursor: 'pointer',
                    borderRadius: 6,
                    background: selectedBrand === entry.brand ? '#eef7ee' : 'transparent',
                    gap: 8,
                  }}
                >
                  {/* Brand name + store badges (info only) */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: colors.textDark, marginBottom: 3 }}>
                      {entry.brand}
                      {selectedBrand === entry.brand && (
                        <span style={{ marginLeft: 6, color: colors.darkGreen, fontSize: 11 }}>✓</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {entry.stores.map(store => (
                        <span key={store} style={{ ...storeBadgeStyle(store), marginTop: 0, fontSize: 8, pointerEvents: 'none' }}>
                          {store}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cheapest price */}
                  <div style={{ fontSize: 12, fontWeight: 500, color: colors.darkGreen, whiteSpace: 'nowrap' }}>
                    {entry.minPrice} TL
                  </div>
                </div>
              ))}
            </div>

            {/* Add button */}
            <button
              onClick={handleAddToBasket}
              disabled={!selectedBrand}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '7px 0',
                background: selectedBrand ? colors.darkGreen : '#c8e0c8',
                color: selectedBrand ? '#e8f5e3' : '#8aaa8a',
                border: 'none',
                borderRadius: 7,
                fontSize: 12,
                cursor: selectedBrand ? 'pointer' : 'not-allowed',
              }}
            >
              {selectedBrand ? `+ Sepete ekle — ${selectedBrand}` : 'Marka seçin'}
            </button>
          </div>
        </div>

        {/* Current basket items */}
        {basket.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 6 }}>Sepetim</div>
            {basket.map((item, i) => (
              <div
                key={item.id}
                style={{
                  padding: '6px 0',
                  borderBottom: i < basket.length - 1 ? `1px solid #eef5ec` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: colors.textDark }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: colors.textLight }}>{item.variant}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button style={s.qbtn} onClick={() => updateQty?.(item.id, -1)}>−</button>
                  <span style={{ fontSize: 12, color: colors.darkGreen, minWidth: 14, textAlign: 'center' }}>{item.qty}</span>
                  <button style={s.qbtn} onClick={() => updateQty?.(item.id, +1)}>+</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      
    </div>
  );
}
