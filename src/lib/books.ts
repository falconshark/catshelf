export interface Book {
  id: number;
  title: string;
  // The API returns a JSON array; older data may come back as a JSON string.
  author: string[] | string | null;
  isbn: string | null;
  description: string | null;
  file: string;
  cover: string;
}

export function parseAuthors(author: Book['author']): string[] {
  if (Array.isArray(author)) return author;
  if (typeof author !== 'string' || !author) return [];
  try {
    const parsed = JSON.parse(author);
    return Array.isArray(parsed) ? parsed.map(String) : [author];
  } catch {
    return [author];
  }
}

// Covers and epub files are served by the API under /api/v1/epub. Returns
// undefined when the book has no cover.
export function assetUrl(apiUrl: string | undefined, path: string | null | undefined) {
  return path ? `${apiUrl}/api/v1${path}` : undefined;
}
