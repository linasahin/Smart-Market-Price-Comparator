import { useState, useMemo } from 'react';
import SearchScreen  from './SearchScreen';
import VariantPopup  from './VariantPopup';
import BasketScreen  from './BasketScreen';
import ModePicker    from './ModePicker';
import RouteResults  from './RouteResults';
import MapScreen     from './MapScreen';
import { appData }   from '../data';
import {
  optimizeRoute,
  basketToOptimizerInput,
  uiModeToStrategy,
  enrichResultsForUI,
} from '../service/optimizationService';

const SCREENS = {
  SEARCH:        'search',
  VARIANT:       'variant',
  BASKET:        'basket',
  MODE_PICKER:   'mode_picker',
  ROUTE_RESULTS: 'route_results',
  MAP:           'map',
};

export default function App() {
  const [screen, setScreen]                     = useState(SCREENS.SEARCH);
  const [selectedProduct, setSelectedProduct]   = useState(null);

  // ================= SEPET STATE =================
  const [basket, setBasket] = useState([]);

  // ================= ROTA / MOD STATE =================
  const [selectedMode, setSelectedMode]             = useState('cheapest');
  const [selectedStartPoint, setSelectedStartPoint] = useState(appData.startPoints[0]);
  const [selectedRoute, setSelectedRoute]           = useState(null);

  const nav = (s) => setScreen(s);

  // ================= SEPET OPERASYONLARI =================

  const addItem = (product, variant) => {
    setBasket(prev => {
      const existing = prev.find(
        i => i.productId === product.id && i.variant === variant
      );
      if (existing) {
        return prev.map(i =>
          i.productId === product.id && i.variant === variant
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      // Sepet kartındaki market chip'leri için stores dizisi oluştur
      // Her zincirin en ucuz fiyatı chip olarak gösterilir
      const storeMap = new Map();
      for (const v of (product.variants ?? [])) {
        const key = v.store;
        if (!storeMap.has(key) || v.price < storeMap.get(key).price) {
          storeMap.set(key, { store: key, price: v.price });
        }
      }
      const stores = Array.from(storeMap.values());

      // Seçilen varyantı bul (marka bilgisi için)
      const selectedVariant = product.variants?.find(v => v.name === variant);
      const brand = selectedVariant?.name ?? product.brand ?? null;

      return [...prev, {
        id:            Date.now(),
        productId:     product.id,
        brand:         brand,
        name:          product.name,
        variant:       variant,
        qty:           1,
        price:         selectedVariant?.price ?? product.price,
        stores:        stores,
      }];
    });
  };

  const removeItem = (id) => {
    setBasket(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id, delta) => {
    setBasket(prev =>
      prev.map(i =>
        i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i
      )
    );
  };

  const basketProps = { basket, addItem, removeItem, updateQty };

  // ================= OPTİMİZER ÇIKTISI =================
  const routeResults = useMemo(() => {
    const optimizerBasket = basketToOptimizerInput(basket);
    if (optimizerBasket.length === 0) return [];

    const strategy = uiModeToStrategy(selectedMode);
    const rawResults = optimizeRoute(
      optimizerBasket,
      appData.stockItems,
      appData.storeLocations,
      selectedStartPoint.latitude,
      selectedStartPoint.longitude,
      strategy,
    );

    return enrichResultsForUI(
      rawResults,
      appData.storeLocations,
      selectedStartPoint.latitude,
      selectedStartPoint.longitude,
    );
  }, [basket, selectedMode, selectedStartPoint]);

  // ================= NAVİGASYON =================

  const handleModeConfirm = (mode) => {
    if (mode) setSelectedMode(mode);
    nav(SCREENS.ROUTE_RESULTS);
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    nav(SCREENS.MAP);
  };

  // ================= RENDER =================

  return (
    <div style={{ maxWidth: 320, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {screen === SCREENS.SEARCH && (
        <SearchScreen
          products={appData.products}
          stores={appData.stores}
          stockItems={appData.stockItems}
          storeLocations={appData.storeLocations}
          {...basketProps}
          onBasket={() => nav(SCREENS.BASKET)}
          onVariant={(product) => {
            setSelectedProduct(product);
            nav(SCREENS.VARIANT);
          }}
        />
      )}

      {screen === SCREENS.VARIANT && (
        <VariantPopup
          product={selectedProduct}
          products={appData.products}
          {...basketProps}
          onClose={() => nav(SCREENS.SEARCH)}
        />
      )}

      {screen === SCREENS.BASKET && (
        <BasketScreen
          {...basketProps}
          onBack={() => nav(SCREENS.SEARCH)}
          onCompareRoutes={() => nav(SCREENS.MODE_PICKER)}
        />
      )}

      {screen === SCREENS.MODE_PICKER && (
  <ModePicker
    {...basketProps}
    startPoints={appData.startPoints}
    selectedStartPoint={selectedStartPoint}
    onStartPointChange={setSelectedStartPoint}
    onConfirm={handleModeConfirm}
  />
)}

      {screen === SCREENS.ROUTE_RESULTS && (
        <RouteResults
          routeResults={routeResults}
          selectedMode={selectedMode}
          {...basketProps}
          onBack={() => nav(SCREENS.BASKET)}
          onShowMap={handleRouteSelect}
          onModeChange={(newMode) => setSelectedMode(newMode)}
        />
      )}

      {screen === SCREENS.MAP && (
  <MapScreen
    storeLocations={appData.storeLocations}
    selectedRoute={selectedRoute}
    startPoint={selectedStartPoint}
    startPoints={appData.startPoints}
    onStartPointChange={setSelectedStartPoint}
    onBack={() => nav(SCREENS.ROUTE_RESULTS)}
  />
)}

    </div>
  );
}