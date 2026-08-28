/**
 * HaiCAD Live Web Search & Engineering Retrieval Tool
 * Performs real-time web searches to ground mechanical dimensions, motor specs,
 * fastener standards, and electronic board layouts without hallucination.
 */

export interface WebSearchResult {
  query: string;
  title: string;
  snippet: string;
  sourceUrl: string;
  extractedDimensions?: Record<string, number | string>;
}

/**
 * Searches Wikipedia and open engineering knowledge sources in real time.
 */
export async function performWebSearch(query: string): Promise<WebSearchResult | null> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 3) return null;

  try {
    // 1. Search Wikipedia API
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      trimmed
    )}&format=json&origin=*`;
    
    const res = await fetch(wikiUrl, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) return null;

    const data = await res.json();
    const firstHit = data.query?.search?.[0];

    if (firstHit && firstHit.title) {
      // Strip HTML tags from snippet
      const cleanSnippet = firstHit.snippet.replace(/<\/?[^>]+(>|$)/g, '');
      const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(firstHit.title.replace(/ /g, '_'))}`;

      return {
        query: trimmed,
        title: firstHit.title,
        snippet: cleanSnippet,
        sourceUrl: pageUrl,
      };
    }
  } catch (err) {
    console.warn('[HaiCAD WebSearch] Live search failed:', err);
  }

  // 2. Fallback to DuckDuckGo Instant Answer API
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(trimmed)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText) {
        return {
          query: trimmed,
          title: data.Heading || trimmed,
          snippet: data.AbstractText,
          sourceUrl: data.AbstractURL || 'https://duckduckgo.com/?q=' + encodeURIComponent(trimmed),
        };
      }
    }
  } catch (err) {
    console.warn('[HaiCAD WebSearch] DuckDuckGo search fallback failed:', err);
  }

  return null;
}

/**
 * Checks if a user prompt is asking about real-world standard components
 * (motors, bearings, standard fasteners, microcontrollers, switch sockets, etc.)
 */
export function extractSearchableQuery(prompt: string): string | null {
  const p = prompt.toLowerCase();
  const keywords = [
    'nema', 'stepper', 'motor', 'servo', 'bearing', '608', '625', '6800',
    'extrusion', '2020', '4040', 'v-slot', 't-slot', 'iso', 'din', 'm3', 'm4', 'm5', 'm6',
    'cherry mx', 'key switch', 'macropad', 'raspberry pi', 'arduino', 'esp32',
    'sprocket', 'pulley', 'gt2', 'lead screw', 'flange', 'hex nut', 'counterbore'
  ];

  const matched = keywords.filter((kw) => p.includes(kw));
  if (matched.length > 0) {
    // Construct concise engineering search query
    return `${matched.join(' ')} standard mechanical specifications dimensions`;
  }

  return null;
}
