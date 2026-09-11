# Smart Market Price Comparator

## Project Overview

**Smart Market Price Comparator** is a JavaFX desktop application that helps users in the Ataşehir/Kayışdağı area of Istanbul find the best prices across five major retail chains: A101, BIM, ŞOK, Migros, and CarrefourSA.

The application addresses a real-world problem: different supermarkets carry the same product at different prices and under different brand variants. A user might find that Migros has the cheapest milk while A101 has cheaper eggs. The application aggregates this complexity into a streamlined five-step workflow:

1. **Search** — Browse all products or filter by category and variant
2. **Basket** — Select specific brand variants with quantities from specific chains
3. **Compare** — View a full price leaderboard across all chains
4. **Price History** — Examine W1–W4 price trends for selected variants
5. **Route** — Get an optimized walking route to the cheapest stores

**Tech Stack:** Java 17 · JavaFX 17 · JSON Simple 1.1.1 · JUnit 5

---

## Project Structure

```
smart-market-price-comparator/
├── src/
│   ├── data/                    ← JSON data files + background images
│   ├── model/                   ← Data model classes (POJOs)
│   ├── repository/              ← Data access layer (stub, for future use)
│   ├── service/
│   │   ├── DataLoader.java      ← JSON parsing and data loading
│   │   ├── campaign/            ← Campaign and discount logic
│   │   ├── pricing/             ← Basket cost calculation
│   │   └── route/               ← Route optimization algorithm
│   ├── ui/                      ← JavaFX screen classes
│   └── util/
│       └── GeoUtils.java        ← Geographic distance calculations
├── test/                        ← JUnit 5 test classes
└── lib/
    └── json-simple-1.1.1.jar
```

---

## Data Model

### JSON Data Files (`src/data/`)

| File | Records | Description |
|------|---------|-------------|
| `products.json` | 27 | General product types across 7 categories |
| `categories.json` | 7 | Dairy, Meat & Protein, Bakery, Personal Care, Household/Cleaning, Snacks & Drinks, Cooking & Pantry |
| `stores.json` | 15 | Store branches — 3 per chain |
| `stock_items.json` | 70 | Brand variants at each chain with prices and availability |
| `campaigns.json` | 12 | Weekly and flash discount campaigns |
| `price_history.json` | 280 | W1–W4 price records per stock item |
| `store_locations.json` | 15 | GPS coordinates for each branch |
| `start_points.json` | 2 | Campus entry points (Üst Kapı, Alt Kapı) |

### Model Classes (`src/model/`)

**`Product`** — General product type (e.g., BEEF, MILK)
```
productId · name · categoryId · categoryName
```

**`StockItem`** — A specific brand variant at a specific chain. Core entity of the system.
```
stockItemId · productId · productName · categoryId · category
storeId · chain · brand · currentPrice · discountedPrice · availabilityTag
```
`getEffectivePrice()` returns `discountedPrice` when available, otherwise `currentPrice`.

**`Campaign`** — Discount applied to a stock item during a specific week.
```
campaignId · stockItemId · chain · type (WEEKLY / FLASH)
discountRate · discountType · startDate (W1–W4) · endDate
```

**`PriceHistory`** — Weekly price snapshot per stock item.
```
historyId · stockItemId · date (W1 / W2 / W3 / W4) · price
```
W4 price always matches `currentPrice` in `stock_items.json`.

**`RouteResult`** — Output of the route optimization algorithm.
```
routeId · totalDistance (km) · storeCount · totalCost (TL)
stores: List<RouteResultStore>
```

**`StoreLocation`** — GPS coordinates of a branch.
```
storeId · latitude · longitude · address
```

**`AvailabilityTag`** (enum) — `HIGH` / `MEDIUM` / `LOW`

---

## Retail Chains

| Chain | Branch IDs | Normalize Key |
|-------|-----------|---------------|
| A101 | A101-01, A101-02, A101-03 | `a101` |
| BIM | BIM-01, BIM-02, BIM-03 | `bim` |
| ŞOK | SOK-01, SOK-02, SOK-03 | `sok` |
| Migros | MIGROS-01, MIGROS-02, MIGROS-03 | `migros` |
| CarrefourSA | CF-01, CF-02, CF-03 | `carefour` |

All branches are within ~1.5 km of Yeditepe University (Kayışdağı, Ataşehir).

---

## UI Screens

### SearchScreen

The main entry point and navigation hub.

- "Welcome to Smart Market!" header (Comic Sans MS Bold)
- **SEARCH ITEMS** — live text field, case-insensitive, Turkish character normalized (ş→s, ı→i, ö→o etc.)
- **CATEGORY** dropdown — filters to one category and activates the PRODUCTS dropdown
- **PRODUCTS** dropdown — lists product types within the selected category

**Two modes:**
- *Product mode (default)* — shows all 27 products; double-click adds a general item to basket
- *Variant mode* — after selecting a product type, shows all brand variants with price range (min–max across chains); double-click adds a specific variant

When a category is selected but no product type is chosen, an orange hint box appears guiding the user to select from the PRODUCTS dropdown.

Basket state (`basketModel`) is a static `ObservableList` that persists across screen instances. Double-clicking a basket item removes it.

Navigation: MY BASKET · MAP/ROUTE · TAP TO COMPARE

---

### BasketScreen

Where users finalize selections by chain and brand variant.

Each basket item renders as a card:

1. **Header** — Product name + running total (e.g., "Total number of products: 3")

2. **Chain buttons** — One per chain that carries this product, showing the cheapest available price:
   - Dark blue filled = selected chain
   - Light blue border + blue price = cheapest chain (not yet selected)
   - Grey background + green price = other chains

3. **Variant list** (after chain selection) — All brand variants at that chain, sorted by price:
   - Green highlight = cheapest variant
   - Purple highlight = selected variant
   - Each variant has its own + / − quantity buttons
   - Multiple variants from the same chain can be selected simultaneously

4. **Summary line** — Total cost for this product with selected variants listed

**Optimized Suggestion box** calculates the cheapest chain per product and recommends a multi-market plan with minimum market count and estimated total.

State maps (`quantities`, `selectedChain`, `selectedVariant`, `variantQuantities`) are all `static` so selections persist when navigating to PriceHistoryScreen and back.

Navigation: PRICE HISTORY (with hover scale effect) · BACK TO SEARCH

---

### PriceHistoryScreen

W1–W4 price trend charts for variants selected in BasketScreen.

- **PICK PRODUCT** dropdown — populated only with variants that have qty > 0 in BasketScreen. If none selected, displays: *"No items selected. Please go back to Basket and select variants first."*
- **Line chart** drawn on a JavaFX Canvas (880×360 px) — data points with price labels, grid lines, W1–W4 x-axis
- **Summary cards:**
  - CHEAPEST — week + lowest price (green)
  - MOST EXPENSIVE — week + highest price (red)
  - CURRENT (W4) — current market price (blue)

Background: semi-transparent white overlay over the basket artwork.

---

### MapRouteScreen

Interactive map with optimized route from campus to required stores.

- Custom JavaFX Canvas (920×430 px) rendering the Kayışdağı/Ataşehir street grid
- Zoom (+ / −) and pan (drag) support using Mercator projection
- Store branches shown as pins with chain labels; route stops in green, start in red
- Start point selector: Yeditepe Üst Kapı or Yeditepe Alt Kapı
- Dashed red line connecting stops in optimal order
- Info panel: route summary, distance (km), walking time (min), total cost (TL)
- Empty basket → displays "No items in basket. Add products to see your route."

**Future Improvement — Map Accuracy:** The current map is a hand-drawn approximation of the Kayışdağı/Ataşehir area rendered on a JavaFX Canvas. Store and campus coordinates use real GPS data (Haversine-accurate), but the visual street layout is schematic. A future iteration could integrate a real tile-based map to provide pixel-accurate street rendering.

Navigation: GO TO BASKET (hover scale) · BACK TO SEARCH (hover scale)

---

### ComparisonScreen

Final price leaderboard across all chains.

- One card per chain showing each basket product with price, brand, availability tag, and campaign badge
- Discounted prices shown in orange with original price
- Availability: HIGH = green · MEDIUM = orange · LOW = red
- Campaign badges in purple
- **BEST OPTION** winner highlighted in gold with total cost
- If no chain stocks all items: "NO STORE HAS ALL ITEMS"

---

## Services

### DataLoader (`service/DataLoader.java`)

Reads all JSON files from `src/data/` and maps them to model objects using JSON Simple. `loadAll(week)` runs all loaders then calls `applyDiscounts()`, which matches campaigns by `stockItemId + chain + startDate` and sets `discountedPrice` on matching stock items.

```java
DataLoader.AppData data = new DataLoader().loadAll("W1");
```

### RouteOptimizer (`service/route/RouteOptimizer.java`)

Finds the minimum-distance walking route through required store branches using brute-force permutation.

**Algorithm:**
1. Build a chain index from stock items (`normalize(chain)` → `List<StockItem>`)
2. For each basket item, find the chain with the lowest `getEffectivePrice()`
3. For each needed chain, select the branch nearest to the start point using `GeoUtils.haversine()`
4. Generate all permutations of waypoints using Heap's algorithm (n! — at most 5 chains = 120 combinations)
5. Return the ordering with minimum total walking distance

```java
RouteResult route = new RouteOptimizer().optimizeRoute(
    basketItems, stockItems, storeLocations, startLat, startLon);
```

### CampaignService (`service/campaign/CampaignService.java`)

Wraps `DataLoader.loadCampaigns()` with null validation.

### DiscountCalculator (`service/campaign/DiscountCalculator.java`)

Applies percentage discounts with clamping: negative rates → 0, rates over 100 → 100.
```java
new DiscountCalculator().applyDiscount(100.0, 20.0); // → 80.0
```

### GeoUtils (`util/GeoUtils.java`)

```java
GeoUtils.haversine(lat1, lon1, lat2, lon2)  // distance in km
GeoUtils.walkingTime(distanceKm)             // minutes at 5 km/h
GeoUtils.totalDistance(lats[], lons[])       // sum along a path
```

---

## Testing (`test/`)

| Test Class | Coverage |
|-----------|----------|
| `CampaignServiceTest` | Campaign loading returns non-null, non-empty list |
| `DiscountCalculatorTest` | 20% off 100 → 80.0 · Zero discount → 100.0 |
| `GeoUtilsTest` | Haversine distance · Walking time calculations |
| `RouteOptimizerTest` | Route optimization logic and output structure |

---

## How to Run

**Requirements:** JDK 17+ · JavaFX SDK 17+

**Dependency Note:** The project currently uses `lib/json-simple-1.1.1.jar` as a manually managed JAR. This will be migrated to Maven in a future update, at which point `lib/` will be removed and the dependency will be declared in `pom.xml`. Until then, the JAR must be added to the build path manually.

**Eclipse setup:**
1. Clone the repository
2. Import as existing Java project
3. Add to Build Path: `lib/json-simple-1.1.1.jar`
4. Add to Build Path: JavaFX SDK jars (`javafx.base`, `javafx.controls`, `javafx.graphics`)
5. Add VM arguments to the run configuration:
   ```
   --module-path /path/to/javafx-sdk-17/lib --add-modules javafx.controls,javafx.graphics,javafx.base
   ```
6. Run `ui.MainApp`

Data files are loaded from `src/data/` relative to the project root via `Paths.get("src", "data")` in `DataLoader`.# smart-market-route-suggestor
CSE344 Software Engineering project – In person shopping route suggestor
