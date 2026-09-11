// src/data/index.js
import stockItems     from './stock_items.json';
import storeLocations from './store_locations.json';
import products       from './products.json';
import stores         from './stores.json';
import startPoints    from './start_points.json';

// Turkish product names by productId
const TR_NAMES = {
  P001: 'Süt',
  P002: 'Tereyağı',
  P003: 'Yoğurt',
  P004: 'Kaşar Peyniri',
  P005: 'Beyaz Peynir',
  P006: 'Dana Kıyma',
  P007: 'Tavuk',
  P008: 'Sucuk & Sosis',
  P009: 'Yumurta',
  P010: 'Ton Balığı',
  P011: 'Ekmek',
  P012: 'Tost Ekmeği',
  P013: 'Şampuan',
  P014: 'Diş Macunu',
  P015: 'Ped',
  P016: 'Tuvalet Kağıdı',
  P017: 'Çamaşır Deterjanı',
  P018: 'Bulaşık Deterjanı',
  P019: 'Cips',
  P020: 'Kola',
  P021: 'Su',
  P022: 'Maden Suyu',
  P023: 'Çikolata',
  P024: 'Makarna',
  P025: 'Un',
  P026: 'Pirinç',
  P027: 'Yağ',
};

// Category mapping from categoryName -> filter key
const CATEGORY_NORM = {
  'Dairy':              'dairy',
  'Meat & Protein':     'meat',
  'Bakery':             'bakery',
  'Personal Care':      'personal_care',
  'Household/Cleaning': 'household',
  'Snacks & Drinks':    'snacks',
  'Cooking & Pantry':   'pantry',
};

// Icons by category key
const CATEGORY_ICONS = {
  dairy:         '🥛',
  meat:          '🥩',
  bakery:        '🍞',
  personal_care: '🧴',
  household:     '🧹',
  snacks:        '🍿',
  pantry:        '🫙',
};

// Normalize chain names consistently to CARREFOUR
function normalizeChain(chain) {
  if (!chain) return chain;
  const c = chain.toUpperCase();
  if (c === 'CAREFOUR' || c === 'CARREFOUR' || c === 'CF') return 'CARREFOUR';
  return c;
}

// Step 1: seed map from products.json — guarantees all 27 show up
const map = new Map();
for (const p of products) {
  const category = CATEGORY_NORM[p.categoryName] ?? 'other';
  map.set(p.productId, {
    id:       p.productId,
    name:     TR_NAMES[p.productId] ?? p.name,
    category,
    icon:     CATEGORY_ICONS[category] ?? '🛍️',
    price:    null,    // will be filled from stock_items
    brand:    null,
    store:    null,
    variants: [],
  });
}

// Step 2: enrich with stock_items data
for (const item of stockItems) {
  const pid = item.productId;
  if (!map.has(pid)) continue;  // unknown product, skip

  const entry = map.get(pid);
  const price = item.discountedPrice ?? item.currentPrice;

  // Set cheapest price/brand/store
  if (entry.price === null || price < entry.price) {
    entry.price = price;
    entry.brand = item.brand;
    entry.store = normalizeChain(item.chain);
  }

  // Add variant for VariantPopup
  entry.variants.push({
    id:      item.stockItemId,
    name:    item.brand,
    price,
    store:   normalizeChain(item.chain),
    storeId: item.storeId,
  });
}

const enrichedProducts = Array.from(map.values());

export const appData = {
  stockItems,
  storeLocations,
  products: enrichedProducts,   // always all 27
  stores,
  startPoints,
};
