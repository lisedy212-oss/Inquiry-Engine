import { NextRequest, NextResponse } from "next/server";
import { parsePDF } from "@/lib/pdfParser";
import type { ParsePDFResponse } from "@/types";

export const maxDuration = 30; // allow up to 30s for large PDFs

export async function POST(req: NextRequest): Promise<NextResponse<ParsePDFResponse>> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ text: "", numPages: 0, error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ text: "", numPages: 0, error: "No file provided." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { text: "", numPages: 0, error: "Only PDF files are supported." },
      { status: 415 }
    );
  }

  // 20 MB limit
  const MAX_BYTES = 20 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { text: "", numPages: 0, error: "PDF is too large (max 20 MB)." },
      { status: 413 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, numPages } = await parsePDF(buffer);
    return NextResponse.json({ text, numPages });
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { text: "", numPages: 0, error: "Failed to parse PDF. Make sure it contains selectable text." },
      { status: 422 }
    );
  }
}
