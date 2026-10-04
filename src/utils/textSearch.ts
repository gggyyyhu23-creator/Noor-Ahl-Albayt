// Arabic normalization utility for robust fuzzy search
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    // Remove diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize alifs (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize taa marbuta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize yaa (ى -> ي)
    .replace(/ى/g, 'ي')
    // Normalize Persian/Urdu letters if any
    .replace(/ك/g, 'ك')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    // Remove tatweel (ـ)
    .replace(/ـ+/g, '')
    .trim()
    .toLowerCase();
}

export function searchMatches(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  const normHaystack = normalizeArabicText(haystack);
  const normNeedle = normalizeArabicText(needle);
  return normHaystack.includes(normNeedle);
}

export function getSearchSnippet(fullText: string, query: string, snippetLength: number = 100): string {
  if (!fullText) return '';
  const normText = normalizeArabicText(fullText);
  const normQuery = normalizeArabicText(query);
  const index = normText.indexOf(normQuery);

  if (index === -1) {
    return fullText.slice(0, snippetLength) + (fullText.length > snippetLength ? '...' : '');
  }

  const start = Math.max(0, index - 35);
  const end = Math.min(fullText.length, index + normQuery.length + 65);
  return (start > 0 ? '...' : '') + fullText.slice(start, end) + (end < fullText.length ? '...' : '');
}
