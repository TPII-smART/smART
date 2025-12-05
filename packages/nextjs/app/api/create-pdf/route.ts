import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { Text1, Text2, Text3, Text4 } = await request.json();

    // Load template from /public
    const filePath = path.join(process.cwd(), "public", "Kleros-Dispute-InitialEvidence.pdf");
    const templateBytes = await fs.readFile(filePath);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    // Fill fields
    form.getTextField("Text1").setText(Text1);
    form.getTextField("Text2").setText(Text2);
    form.getTextField("Text3").setText(Text3);
    form.getTextField("Text4").setText(Text4);

    // Make appearance streams so flattening doesn't blank the PDF
    form.updateFieldAppearances();

    // Flatten so text becomes permanent
    form.flatten();

    const pdfBytes = await pdfDoc.save();
    // Convert to Buffer for Node.js response body
    const pdfBuffer = Buffer.from(pdfBytes);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="initial-evidence.pdf"',
      },
    });
  } catch (err: any) {
    console.error("PDF generation failed:", err);
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
