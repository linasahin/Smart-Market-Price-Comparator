import { haversine } from './geoUtils.js';

// ================= SABİTLER =================

const RESULT_LIMIT = 5;
const PRODUCT_THRESHOLD = 13;

// ================= STRATEJİ ENUM =================

export const RouteStrategy = Object.freeze({
    CHEAPEST:   'CHEAPEST',
    ONE_MARKET: 'ONE_MARKET',
    SHORTEST:   'SHORTEST',
});

// ================= ANA METOT =================

/**
 * Verilen sepet ve stratejiye göre en iyi 5 alışveriş senaryosunu döndürür.
 */
export function optimizeRoute(basketItems, stockItems, storeLocations, startLat, startLon, strategy) {
    if (basketItems == null || basketItems.length === 0) return [];

    if (strategy === RouteStrategy.ONE_MARKET) {
        return findOneMarketScenarios(basketItems, stockItems, storeLocations, startLat, startLon);
    }
    return findMultiMarketScenarios(basketItems, stockItems, storeLocations, startLat, startLon, strategy);
}

// ================= TEK MARKET MANTIĞI =================

/**
 * Tüm ürünleri karşılayan zincirleri bulur.
 * Stok verisi zincir bazında gruplandırılır (SOK-01, SOK-02 hepsi SOK sayılır).
 * Mesafe hesabı o zincirin başlangıca en yakın şubesi üzerinden yapılır.
 */
function findOneMarketScenarios(basketItems, stockItems, storeLocations, startLat, startLon) {
    const results = [];

    // Stoku zincir bazında grupla (storeId değil chain bazında)
    const stockByChain = groupStockByChain(stockItems);
    let routeIdCounter = 1;

    for (const [chain, chainStock] of stockByChain.entries()) {
        // Bu zincirde tüm sepet ürünleri var mı?
        let allFound = true;
        for (const bi of basketItems) {
            let found = false;
            for (const si of chainStock) {
                if (equalsIgnoreCase(si.productId, bi.stockItemId) && brandMatches(si, bi)) {
                    found = true;
                    break;
                }
            }
            if (!found) { allFound = false; break; }
        }
        if (!allFound) continue;

        const totalCost = calculateOneMarketCost(basketItems, chainStock);

        // Zincirin en yakın şubesini kullan
        const closestLoc = closestBranchLocation(chain, storeLocations, startLat, startLon);
        const distance = closestLoc
            ? haversine(startLat, startLon, closestLoc.latitude, closestLoc.longitude)
            : 0.0;

        const result = buildRouteResult(routeIdCounter++, distance, 1, totalCost);
        result.stores.push({ routeId: result.routeId, storeId: closestLoc?.storeId ?? chain });
        results.push(result);
    }

    results.sort((a, b) => a.totalCost - b.totalCost);
    return results.length > RESULT_LIMIT ? results.slice(0, RESULT_LIMIT) : results;
}

/**
 * Tek market için sepetin toplam fiyatını hesaplar.
 */
function calculateOneMarketCost(basketItems, chainStock) {
    let total = 0.0;
    for (const bi of basketItems) {
        for (const si of chainStock) {
            if (equalsIgnoreCase(si.productId, bi.stockItemId) && brandMatches(si, bi)) {
                total += getEffectivePrice(si) * bi.quantity;
                break;
            }
        }
    }
    return total;
}

// ================= CHEAPEST & SHORTEST MANTIĞI =================

/**
 * Tüm kombinasyonları üretip stratejiye göre sıralar.
 */
function findMultiMarketScenarios(basketItems, stockItems, storeLocations, startLat, startLon, strategy) {
    const topLimit = (basketItems.length <= PRODUCT_THRESHOLD) ? 3 : 2;
    const productOptions = [];

    for (const bi of basketItems) {
        const options = findTopOptionsForProduct(
            bi, stockItems, storeLocations,
            startLat, startLon, strategy, topLimit);
        if (options.length === 0) continue;
        productOptions.push(options);
    }

    if (productOptions.length === 0) return [];

    const combinations = generateCombinations(productOptions);
    const results = [];
    let routeIdCounter = 1;

    for (const combo of combinations) {
        const result = buildResultFromCombination(
            combo, basketItems, storeLocations, startLat, startLon, routeIdCounter++);
        if (result != null) results.push(result);
    }

    if (strategy === RouteStrategy.CHEAPEST) {
        results.sort((a, b) => a.totalCost - b.totalCost);
    } else if (strategy === RouteStrategy.SHORTEST) {
        results.sort((a, b) => a.totalDistance - b.totalDistance);
    }

    // Duplicate kombinasyonları filtrele (aynı zincir seti farklı storeId ile gelebilir)
    const seen = new Set();
    const unique = [];
    for (const r of results) {
        const key = r.stores.map(s => chainFromStoreId(s.storeId, storeLocations)).sort().join('+');
        if (!seen.has(key)) { seen.add(key); unique.push(r); }
    }

    return unique.length > RESULT_LIMIT ? unique.slice(0, RESULT_LIMIT) : unique;
}

/**
 * Bir ürün için stratejiye göre top N zincir opsiyonunu döndürür.
 * Mesafe hesabı zincirin en yakın şubesi üzerinden yapılır.
 */
function findTopOptionsForProduct(basketItem, stockItems, storeLocations, startLat, startLon, strategy, topLimit) {
    const productId = basketItem.stockItemId;
    const candidates = [];

    for (const si of stockItems) {
        if (si.productId != null && equalsIgnoreCase(si.productId, productId) && brandMatches(si, basketItem)) {
            candidates.push(si);
        }
    }

    if (strategy === RouteStrategy.CHEAPEST) {
        candidates.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (strategy === RouteStrategy.SHORTEST) {
        candidates.sort((a, b) => {
            // storeId değil, zincirin en yakın şubesine göre sırala
            const distA = distanceToChain(a.chain, storeLocations, startLat, startLon);
            const distB = distanceToChain(b.chain, storeLocations, startLat, startLon);
            return distA - distB;
        });
    }

    return candidates.length > topLimit ? candidates.slice(0, topLimit) : candidates;
}

// ================= KOMBİNASYON ÜRETİMİ =================

/**
 * Kartezyen çarpım — her ürünün her seçeneği için tüm kombinasyonları üretir.
 */
function generateCombinations(productOptions) {
    let result = [[]];
    for (const options of productOptions) {
        const newResult = [];
        for (const existing of result) {
            for (const option of options) {
                newResult.push([...existing, option]);
            }
        }
        result = newResult;
    }
    return result;
}

// ================= SONUÇ OLUŞTURMA =================

/**
 * Bir kombinasyondan RouteResult oluşturur.
 * Zincir bazında çalışır — her zincirin en yakın şubesi waypoint olarak kullanılır.
 */
function buildResultFromCombination(combo, basketItems, storeLocations, startLat, startLon, routeId) {
    if (combo.length !== basketItems.length) return null;

    let totalCost = 0.0;
    for (let i = 0; i < combo.length; i++) {
        totalCost += getEffectivePrice(combo[i]) * basketItems[i].quantity;
    }

    // Unique zincirler (storeId değil chain bazında tekilleştir)
    const uniqueChains = new Set();
    for (const si of combo) {
        const chain = si.chain ?? chainFromStoreId(si.storeId, storeLocations);
        if (chain) uniqueChains.add(chain.toUpperCase());
    }

    // Her zincirin en yakın şubesini waypoint olarak kullan
    const waypoints = [];
    const resolvedStoreIds = [];
    for (const chain of uniqueChains) {
        const loc = closestBranchLocation(chain, storeLocations, startLat, startLon);
        if (loc) {
            waypoints.push(loc);
            resolvedStoreIds.push(loc.storeId);
        }
    }

    const totalDistance = calculateNearestNeighborDistance(waypoints, startLat, startLon);

    const result = buildRouteResult(
        routeId,
        Math.round(totalDistance * 1000.0) / 1000.0,
        uniqueChains.size,
        Math.round(totalCost * 100.0) / 100.0);

    for (const storeId of resolvedStoreIds) {
        result.stores.push({ routeId: routeId, storeId: storeId });
    }

    return result;
}

/**
 * Nearest-neighbor algoritması ile sıralanmış toplam mesafeyi hesaplar.
 */
function calculateNearestNeighborDistance(waypoints, startLat, startLon) {
    if (waypoints.length === 0) return 0.0;

    const remaining = [...waypoints];
    let totalDist = 0.0;
    let curLat = startLat;
    let curLon = startLon;

    while (remaining.length > 0) {
        let nearest = null, nearestIndex = -1, minDist = Number.MAX_VALUE;
        for (let i = 0; i < remaining.length; i++) {
            const d = haversine(curLat, curLon, remaining[i].latitude, remaining[i].longitude);
            if (d < minDist) { minDist = d; nearest = remaining[i]; nearestIndex = i; }
        }
        if (nearest != null) {
            totalDist += minDist;
            curLat = nearest.latitude;
            curLon = nearest.longitude;
            remaining.splice(nearestIndex, 1);
        }
    }
    return totalDist;
}

// ================= KONUM YARDIMCILARI =================

/**
 * Zincirin başlangıç noktasına en yakın şubesini döndürür.
 * Örn: "SOK" -> SOK-01, SOK-02, SOK-03 arasından en yakını.
 */

function closestBranchLocation(chain, storeLocations, startLat, startLon) {
    if (!chain || !storeLocations) return null;
    // CF/CARREFOUR normalizasyonu
    const normalized = (chain === 'CAREFOUR' || chain === 'CARREFOUR' || chain === 'CF') ? 'CF' : chain;
    const branches = storeLocations.filter(loc =>
        equalsIgnoreCase(loc.chain, normalized)
    );
    if (branches.length === 0) return null;
    let closest = branches[0];
    let minDist = haversine(startLat, startLon, closest.latitude, closest.longitude);
    for (const branch of branches.slice(1)) {
        const d = haversine(startLat, startLon, branch.latitude, branch.longitude);
        if (d < minDist) { minDist = d; closest = branch; }
    }
    return closest;
}

/**
 * Zincirin başlangıç noktasına en yakın şubesinin mesafesini döndürür.
 */
function distanceToChain(chain, storeLocations, startLat, startLon) {
    const loc = closestBranchLocation(chain, storeLocations, startLat, startLon);
    return loc ? haversine(startLat, startLon, loc.latitude, loc.longitude) : Number.MAX_VALUE;
}

// ================= YARDIMCI METOTLAR =================

function buildRouteResult(routeId, totalDistance, storeCount, totalCost) {
    return { routeId, totalDistance, storeCount, totalCost, stores: [] };
}

function getEffectivePrice(stockItem) {
    return (stockItem.discountedPrice != null) ? stockItem.discountedPrice : stockItem.currentPrice;
}

function findLocationById(locations, storeId) {
    if (locations == null || storeId == null) return null;
    for (const loc of locations) {
        if (equalsIgnoreCase(storeId, loc.storeId)) return loc;
    }
    return null;
}

/**
 * Stok öğelerini storeId bazında değil, zincir (chain) bazında gruplar.
 * Böylece SOK-01 ve SOK-02 aynı zincir altında değerlendirilir.
 */

function groupStockByChain(stockItems) {
    const map = new Map();
    if (stockItems == null) return map;
    for (const si of stockItems) {
        const raw = si.chain?.toUpperCase();
        if (raw == null) continue;
        // CF ve CARREFOUR aynı zincir
        const chain = (raw === 'CAREFOUR' || raw === 'CARREFOUR' || raw === 'CF') ? 'CF' : raw;
        if (!map.has(chain)) map.set(chain, []);
        map.get(chain).push(si);
    }
    return map;
}

function equalsIgnoreCase(a, b) {
    if (a == null || b == null) return false;
    return a.toLowerCase() === b.toLowerCase();
}

/**
 * Loose mod brand karşılaştırması.
 * basketItem.brand null/boş ise -> her brand kabul edilir.
 * Doluysa -> stockItem.brand ile case-insensitive karşılaştırılır.
 */
function brandMatches(stockItem, basketItem) {
    if (basketItem == null || basketItem.brand == null || basketItem.brand === '') return true;
    if (stockItem.brand == null) return false;
    return equalsIgnoreCase(stockItem.brand, basketItem.brand);
}

/**
 * Bir storeId'nin hangi zincire ait olduğunu bulur.
 * Öncelik store_locations.json'daki chain alanı, yoksa storeId öneki kullanılır.
 */
function chainFromStoreId(storeId, storeLocations) {
    if (storeId == null) return null;
    if (storeLocations != null) {
        for (const loc of storeLocations) {
            if (equalsIgnoreCase(loc.storeId, storeId) && loc.chain != null) return loc.chain;
        }
    }
    const dash = storeId.lastIndexOf('-');
    return dash > 0 ? storeId.substring(0, dash) : storeId;
}

// ================= UI ADAPTÖR =================

/**
 * UI tarafındaki sepet formatını optimizer'ın beklediği BasketItem[] formatına çevirir.
 *
 * Notlar:
 *  - productId yoksa item atlanır.
 *  - brand opsiyoneldir: boşsa optimizer tüm markaları aday kabul eder.
 */
export function basketToOptimizerInput(uiBasket) {
    if (uiBasket == null || uiBasket.length === 0) return [];
    const result = [];
    for (const item of uiBasket) {
        if (item.productId == null) continue;
        result.push({
            basketId:    item.id != null ? item.id : 1,
            stockItemId: item.productId,
            quantity:    item.qty != null ? item.qty : 1,
            brand:       item.brand != null ? item.brand : null,
        });
    }
    return result;
}

/**
 * UI mode ID'sini optimizer strateji değerine çevirir.
 */
export function uiModeToStrategy(uiMode) {
    switch (uiMode) {
        case 'cheapest': return RouteStrategy.CHEAPEST;
        case 'single':   return RouteStrategy.ONE_MARKET;
        case 'nearest':  return RouteStrategy.SHORTEST;
        default:         return RouteStrategy.CHEAPEST;
    }
}

/**
 * Optimizer çıktısını UI formatına çevirir.
 * Zincir isimleri toplanır, süre hesaplanır.
 * Optimizer artık zaten doğru şubeleri kullandığı için
 * burada ek bir şube çözümleme yapılmaz.
 */
export function enrichResultsForUI(results, storeLocations, startLat, startLon) {
    if (results == null || results.length === 0) return [];

    const enriched = [];
    for (const r of results) {
        const chainNames = [];
        for (const rs of r.stores) {
            const chain = chainFromStoreId(rs.storeId, storeLocations);
            if (chain != null && !chainNames.includes(chain)) chainNames.push(chain);
        }

        const name = (r.storeCount === 1 && chainNames.length === 1)
            ? `${chainNames[0]} tek`
            : chainNames.join(' + ');

        const timeMin = Math.round(r.totalDistance * 12);

        enriched.push({
            routeId:       r.routeId,
            name:          name,
            totalCost:     r.totalCost,
            totalDistance: r.totalDistance,
            storeCount:    r.storeCount,
            stores:        r.stores,
            timeMin:       timeMin,
        });
    }
    return enriched;
}