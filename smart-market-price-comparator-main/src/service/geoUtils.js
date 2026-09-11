/**
 * GeoUtils
 * Iki koordinat arasi mesafe ve yurume suresi hesaplar.
 * Haversine formulunu kullanir.
 */

// ================= SABITLER =================

// dunya yaricapi (km)
const EARTH_RADIUS = 6371.0;

// ortalama yurume hizi (km/h)
const WALKING_SPEED = 5.0;


// ================= HAVERSINE =================

/**
 * Iki koordinat arasi kus ucusu mesafe (km).
 * lat/lng derece cinsinden verilir.
 */
export function haversine(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const radLat1 = toRadians(lat1);
    const radLat2 = toRadians(lat2);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(radLat1) * Math.cos(radLat2)
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS * c;
}


// ================= YURUME SURESI =================

/**
 * Mesafeyi (km) dakika cinsinden yurume suresine cevirir.
 * Ortalama 5 km/h yurume hizi kullanir.
 */
export function walkingTime(distanceKm) {
    if (distanceKm <= 0) return 0.0;

    return (distanceKm / WALKING_SPEED) * 60.0;
}


// ================= TOPLAM MESAFE =================

/**
 * Birden fazla nokta arasindaki toplam mesafeyi hesaplar.
 * lats ve lons dizileri ayni uzunlukta olmali.
 * Sirali olarak her nokta arasini toplar.
 */
export function totalDistance(lats, lons) {
    if (lats == null || lons == null) return 0.0;
    if (lats.length !== lons.length) return 0.0;
    if (lats.length < 2) return 0.0;

    let total = 0.0;

    for (let i = 0; i < lats.length - 1; i++) {
        total += haversine(lats[i], lons[i], lats[i + 1], lons[i + 1]);
    }

    return total;
}


// ================= YARDIMCI =================

// derece -> radyan donusumu (Math.toRadians karsiligi)
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
