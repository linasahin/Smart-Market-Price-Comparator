# 🛒 Smart Market Price Comparator & Route Optimizer

A modern web application built with **React** and **Vite** that helps users compare grocery prices across major retail chains (A101, BİM, ŞOK, Migros, and CarrefourSA) and calculates the most cost-effective shopping path using geospatial route optimization.

The application addresses a real-world problem: different supermarkets carry the same product at different prices and under different brand variants. A user might find that Migros has the cheapest milk while A101 has cheaper eggs. The application aggregates this complexity into a streamlined workflow:
1. Search — Browse all products or filter by category and variant
2. Basket — Select specific brand variants with quantities from specific chains
3. Compare — View a full price leaderboard across all chains
4. Price History — Examine W1–W4 price trends for selected variants
5. Route — Get an optimized walking route to the cheapest stores

---

## 🛠 Tech Stack

* **Frontend:** React 18, JSX, Modern CSS
* **Build Tool:** Vite
* **Algorithms:** Brute-force waypoint permutation (Heap's Algorithm), Haversine geospatial formula
* **Data Layer:** Structured JSON datasets (store locations, stock items, campaigns, price history)

---

## 📁 Project Structure

* public/ : Static assets, favicons, and SVG icons
* src/data/ : JSON datasets for products, stores, stock items, and GPS coordinates
* src/service/ : Business logic, geospatial calculations, and route optimization algorithms
* src/ui/ : Modular React screens and interface components

---

## 📊 Data Model

### JSON Data Files (src/data/)

| File | Records | Description |
| --- | --- | --- |
| products.json | 27 | General product types across 7 categories |
| categories.json | 7 | Dairy, Meat & Protein, Bakery, Personal Care, Household/Cleaning, Snacks & Drinks, Cooking & Pantry |
| stores.json | 15 | Store branches — 3 per chain |
| stock_items.json | 70 | Brand variants at each chain with prices and availability |
| campaigns.json | 12 | Weekly and flash discount campaigns |
| price_history.json | 280 | W1–W4 price records per stock item |
| store_locations.json | 15 | GPS coordinates for each branch |
| start_points.json | 2 | Campus/User starting points |

---

## 🏪 Retail Chains

| Chain | Branch IDs | Normalize Key |
| --- | --- | --- |
| A101 | A101-01, A101-02, A101-03 | a101 |
| BİM | BIM-01, BIM-02, BIM-03 | bim |
| ŞOK | SOK-01, SOK-02, SOK-03 | sok |
| Migros | MIGROS-01, MIGROS-02, MIGROS-03 | migros |
| CarrefourSA | CF-01, CF-02, CF-03 | carrefour |

All branches are located within local proximity of the primary shopping district.

---

## 🖥️️ UI Screens & Components

### SearchScreen
The main entry point and navigation hub.
* Live search input with case-insensitive and Turkish character normalization.
* Category & product cascading filters.
* Supports both general product selection and brand variant drill-down.

### BasketScreen
Finalize selections by chain and brand variant.
* Product cards displaying live running totals.
* Chain selectors indicating the cheapest available stores.
* Dynamic suggestion box recommending multi-market plans to minimize overall spending.

### PriceHistoryScreen
W1–W4 price trend visualization for variants chosen in the basket.
* Interactive canvas/SVG line chart mapping price fluctuations across weeks.
* Summary cards highlighting lowest, highest, and current market prices.

### MapRouteScreen
Interactive geospatial map displaying the calculated shopping path.
* Canvas-rendered street layout with Mercator projection support.
* Dynamic markers for stores (green stops) and user start position (red).
* Route summary panel calculating total walking distance (km) and estimated duration (min).

### ComparisonScreen
Leaderboard comparing total basket costs across all chains.
* Highlights the overall best store option with total savings.
* Visual indicators for item availability and active promotional discounts.

---

## ⚙️ Core Optimization Algorithms

### Route Optimization (RouteOptimizer)
Finds the minimum walking distance through required store branches:
1. Identifies the lowest-price chain for each item in the basket.
2. Selects the nearest store branch for each needed chain relative to the start point using the Haversine distance formula.
3. Evaluates permutations of waypoints using Heap's algorithm (up to 5 chains = 120 combinations) to determine the absolute shortest walking path.

### Geospatial Calculations (geoUtils)
* Implements the Haversine formula to compute great-circle distances between GPS coordinates.
* Estimates total travel time based on standard average pedestrian walking speed (5 km/h).

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed (v18+ recommended).

### Installation
1. Clone the repository:
   git clone https://github.com/linasahin/Smart-Market-Price-Comparator.git

2. Navigate to the project directory:
   cd Smart-Market-Price-Comparator/smart-market-price-comparator-main

3. Install dependencies:
   npm install

### Running the App
Start the local development server:
   npm run dev
