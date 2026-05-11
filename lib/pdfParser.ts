// Server-side only — called from API routes.

interface PDFParseResult {
  text: string;
  numPages: number;
}

export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  // Dynamic import avoids bundling issues; serverExternalPackages in next.config handles the rest.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");

  const data = await pdfParse(buffer);

  // pdf-parse separates pages with form-feed characters (\f).
  // We annotate each page so the AI can cite precise page numbers.
  const rawPages: string[] = data.text
    .split("\f")
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 0);

  const annotatedPages = rawPages.map(
    (pageText, i) => `[PAGE ${i + 1}]\n${pageText}`
  );

  return {
    text: annotatedPages.join("\n\n---\n\n"),
    numPages: data.numpages,
  };
}
