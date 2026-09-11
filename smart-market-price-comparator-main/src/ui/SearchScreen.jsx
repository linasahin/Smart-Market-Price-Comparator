import { searchProducts } from '../service/searchService';
import { useState, useMemo, useEffect, useRef } from 'react';
import { s, storeBadgeStyle, colors } from './styles';

const categories = [
  'Tümü', 'Süt ürünleri', 'Et', 'Fırın',
  'Kişisel Bakım', 'Ev & Temizlik', 'Atıştırmalık', 'Yemeklik',
];

const CATEGORY_MAP = {
  'Süt ürünleri':   'dairy',
  'Et':             'meat',
  'Fırın':          'bakery',
  'Kişisel Bakım':  'personal_care',
  'Ev & Temizlik':  'household',
  'Atıştırmalık':   'snacks',
  'Yemeklik':       'pantry',
};

//const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
//const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

function normalizeTR(str) {
  return str
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
}

function keywordSearch(products, query) {
  const words = normalizeTR(query.trim()).split(/\s+/);
  return products.filter(p => {
    const haystack = normalizeTR([p.name, p.brand].filter(Boolean).join(' '));
    return words.every(word => haystack.includes(word));
  });
}


export default function SearchScreen({
  products = [],
  stores = [],
  stockItems = [],
  basket = [],
  addItem,
  onBasket,
  onVariant,
}) {
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [query, setQuery]                   = useState('');
  const [aiResults, setAiResults]           = useState(null);
  const [aiLoading, setAiLoading]           = useState(false);
  const [aiError, setAiError]               = useState(false);
  const debounceRef                          = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setAiResults(null); setAiError(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
     // if (!GEMINI_API_KEY) { setAiError(true); return; }
      setAiLoading(true); setAiError(false);
      try {
        //setAiResults(await geminiSearch(products, query));
        setAiResults(await searchProducts(query, products));
      } catch (err) {
        console.warn('Gemini failed, fallback:', err.message);
        setAiError(true); setAiResults(null);
      } finally {
        setAiLoading(false);
      }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [query, products]);

  const filtered = useMemo(() => {
    let list = query.trim()
      ? (aiResults !== null && !aiError ? aiResults : keywordSearch(products, query))
      : products;
    if (activeCategory !== 'Tümü') {
      const cat = CATEGORY_MAP[activeCategory];
      if (cat) list = list.filter(p => p.category === cat);
    }
    return list;
  }, [products, query, activeCategory, aiResults, aiError]);

  const basketCount = basket.reduce((sum, i) => sum + i.qty, 0);

  const handleAdd = (product) => {
    if (product.variants?.length > 1) { onVariant?.(product); return; }
    addItem?.(product, product.variants?.[0]?.name ?? '');
  };

  return (
    <div style={{ ...s.phone, display: 'flex', flexDirection: 'column', height: 600, overflow: 'hidden' }}>
      {/* Top Bar */}
      <div style={s.topbar}>
  <div>
    <div style={s.tbTitle}>Smart Market</div>
    <div style={s.tbSub}>Ataşehir</div>
  </div>
</div>

      {/* Fixed search + category area */}
      <div style={{ padding: '11px 12px 0', background: colors.pageBg }}>
        {/* Search Bar */}
        <div style={{ ...s.searchBar, padding: 0, overflow: 'hidden', marginBottom: 6 }}>
          <span style={{ fontSize: 14, color: colors.textPale, paddingLeft: 10 }}>
            {aiLoading ? '⏳' : '🔍'}
          </span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ürün ara... (AI destekli)"
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: colors.textDark,
              flex: 1, padding: '8px 10px 8px 6px',
            }}
          />
          {query.length > 0 && (
            <span onClick={() => setQuery('')}
              style={{ fontSize: 13, color: colors.textPale, paddingRight: 10, cursor: 'pointer' }}>
              ✕
            </span>
          )}
        </div>

        {/* AI indicator */}
        {query.trim().length > 0 && (
          <div style={{ fontSize: 10, color: aiError ? colors.textPale : colors.midGreen, marginBottom: 4, marginTop: -2 }}>
            {aiLoading ? '✨ AI arama yapılıyor...'
              : aiError ? '🔤 Anahtar kelime araması kullanılıyor'
              : aiResults !== null ? '✨ AI arama sonuçları' : ''}
          </div>
        )}

        {/* Category Chips */}
        <div style={{
          display: 'flex', gap: 5, marginBottom: 8,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          paddingBottom: 2, paddingRight: 4,
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                ...(activeCategory === cat ? s.chipOn : { ...s.chip, border: '1px solid #b8d8b0' }),
                flexShrink: 0,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable product grid — fixed height, ~4 cards visible */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', scrollbarWidth: 'none' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: colors.textLight, marginTop: 30, fontSize: 13 }}>
            {aiLoading ? '' : 'Ürün bulunamadı'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, paddingBottom: 9 }}>
            {filtered.map((p) => (
              <div key={p.id} style={s.pcard}>
                <div style={s.pimg}>
                  <span style={{ fontSize: 28 }}>{p.icon ?? '🛍️'}</span>
                </div>
                <div style={s.pinfo}>
                  <div style={s.pname}>{p.name}</div>
                  {p.brand && (
                    <div style={{ fontSize: 9, color: colors.textLight, marginBottom: 1 }}>{p.brand}</div>
                  )}
                  <div style={s.pprice}>{p.price} TL</div>
                  <div style={s.ppriceSub}>den başlayan</div>
                  <span style={storeBadgeStyle(p.store)}>{p.store}</span>
                  <button
                    onClick={() => handleAdd(p)}
                    style={{
                      marginTop: 6, width: '100%', padding: '4px 0',
                      background: colors.primary, color: '#ffffff',
                      border: 'none', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                    }}
                  >
                    {p.variants?.length > 1 ? 'Seçenekler' : '+ Sepete ekle'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sepetim button — always visible above bottom nav */}
      <div style={{ padding: '6px 12px', background: colors.pageBg }}>
      <button style={{ ...s.forwardBtn, marginBottom: 0 }} onClick={onBasket}>          
          🧺 Sepetim ({basketCount})
        </button>
      </div>

      
    </div>
  );
}
