const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Given a Turkish search query and your product list,
 * returns a filtered array of matching products using Gemini.
 */
export async function searchProducts(query, products) {
  if (!query || query.trim().length < 3) return products;

  // Build a minimal product list to send — only what Gemini needs
  const productIndex = products.map(p => ({
    id:       p.id,
    name:     p.name,
    brand:    p.brand    ?? '',
    category: p.category ?? '',
  }));

  const prompt = `
Sen bir Türkçe market ürün arama motorusun.
Kullanıcı şunu arıyor: "${query}"

Aşağıdaki ürün listesinden bu aramayla ilgili olan ürünlerin ID'lerini döndür.
Eşleşme olmasa bile en yakın ürünleri öner.
Yazım hatalarını ve anlamsal benzerlikleri göz önünde bulundur.
Örnek: "kahvaltılık" → peynir, yumurta, tereyağı gibi ürünler eşleşebilir.

Ürün listesi:
${JSON.stringify(productIndex)}

SADECE şu formatta JSON döndür, başka hiçbir şey yazma:
{"matchedIds": [1, 3, 5]}
`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:     0.1,   // low — we want consistent results
          maxOutputTokens: 256,
        },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Strip markdown code fences if Gemini wraps the JSON
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const matchedIds = new Set(parsed.matchedIds);

    return products.filter(p => matchedIds.has(p.id));

  } catch (err) {
    console.error('searchService error:', err);
    // Fall back to local name filter so the UI never breaks
    const q = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  }
}