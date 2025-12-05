import { PDFDocument } from "pdf-lib";

/**
 * Fills template fields in a PDF document with provided values
 * @param replacements - Object containing field names and their replacement values
 * @param templatePath - Path to the template PDF file
 * @returns File object ready for upload
 */

const DEFAULT_TEMPLATE: string = "/Kleros-Dispute-InitialEvidence.pdf";

export async function createInitialEvidencePDF(
  dateOfDispute: string,
  disputeParty: string,
  jobDetails: string,
  disputeReason: string,
): Promise<File> {
  const res = await fetch("/api/create-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Text1: dateOfDispute,
      Text2: disputeParty,
      Text3: jobDetails,
      Text4: disputeReason,
    }),
  });

  if (!res.ok) throw new Error("Failed to generate PDF");

  const initialEvidenceFile = new File([await res.blob()], "initial_evidence.pdf", {
    type: "application/pdf",
  });

  return initialEvidenceFile;
}

async function fillPdfTemplate(
  replacements: Record<string, string>,
  templatePath: string = DEFAULT_TEMPLATE,
): Promise<File> {
  try {
    // Fetch the template PDF file (browser-compatible)
    const response = await fetch(templatePath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    const templateBytes = await response.arrayBuffer();

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Get the form fields (if using fillable PDFs)
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // Fill form fields
    fields.forEach(field => {
      console.log(`Processing field: ${field.getName()}`);
      const fieldName = field.getName();
      if (replacements[fieldName]) {
        console.log(` - Replacing with: ${replacements[fieldName]}`);
        const fieldType = field.constructor.name;

        if (fieldType === "PDFTextField") {
          const textField = form.getTextField(fieldName);
          textField.setText(replacements[fieldName]);
          textField.enableReadOnly();
        } else if (fieldType === "PDFCheckBox") {
          const checkbox = form.getCheckBox(fieldName);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          replacements[fieldName].toLowerCase() === "true" ? checkbox.check() : checkbox.uncheck();
          checkbox.enableReadOnly();
        } else if (fieldType === "PDFDropdown") {
          const dropdown = form.getDropdown(fieldName);
          dropdown.select(replacements[fieldName]);
          dropdown.enableReadOnly();
        }
      }
    });

    // Update field appearances to reflect filled values
    form.updateFieldAppearances();

    // Now flatten to embed the appearances
    form.flatten();

    console.log(
      pdfDoc
        .getForm()
        .getFields()
        .map(f => f.getName()),
    );

    const pdfBytes = await pdfDoc.save();

    // Convert to Uint8Array with ArrayBuffer (not SharedArrayBuffer)
    const uint8Array = new Uint8Array(pdfBytes);

    // Create the file with the converted array
    return new File([uint8Array], "filled-evidence.pdf", {
      type: "application/pdf",
      lastModified: Date.now(),
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fill PDF template: ${error.message}`);
    }
    throw new Error(`Failed to fill PDF template: ${String(error)}`);
  }
}

/**
 * Debug function to inspect and save PDF content for verification
 * @param pdfFile - The File object containing the PDF
 * @param logToConsole - Whether to log debug info to console
 * @returns Object containing PDF metadata and content information
 */
export async function debugPdfContent(
  pdfFile: File,
  logToConsole: boolean = true,
): Promise<{
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: Date;
  contentPreview: string;
  isValidPdf: boolean;
}> {
  try {
    // Get basic file information
    const fileInfo = {
      fileName: pdfFile.name,
      fileSize: pdfFile.size,
      fileType: pdfFile.type,
      lastModified: new Date(pdfFile.lastModified),
    };

    // Convert File to ArrayBuffer for analysis
    const arrayBuffer = await pdfFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Check if it's a valid PDF (starts with %PDF)
    const pdfHeader = new TextDecoder().decode(uint8Array.slice(0, 5));
    const isValidPdf = pdfHeader === "%PDF-";

    // Get a preview of the content (first 200 bytes as text)
    const contentPreview = new TextDecoder("utf-8", { ignoreBOM: true, fatal: false }).decode(uint8Array.slice(0, 200));

    // Load PDF with pdf-lib for detailed inspection
    const debugPdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = debugPdfDoc.getPageCount();
    const form = debugPdfDoc.getForm();
    const fields = form.getFields();

    if (logToConsole) {
      console.log("=== PDF Debug Information ===");
      console.log(`File: ${fileInfo.fileName}`);
      console.log(`Size: ${fileInfo.fileSize} bytes`);
      console.log(`Type: ${fileInfo.fileType}`);
      console.log(`Pages: ${pageCount}`);
      console.log(`Form fields: ${fields.length}`);
      console.log(`Valid PDF: ${isValidPdf}`);

      // Log form field values
      if (fields.length > 0) {
        console.log("\n=== Form Field Values ===");
        fields.forEach(field => {
          const fieldName = field.getName();
          const fieldType = field.constructor.name;
          let fieldValue = "N/A";

          try {
            if (fieldType === "PDFTextField") {
              fieldValue = form.getTextField(fieldName).getText() || "(empty)";
            } else if (fieldType === "PDFCheckBox") {
              fieldValue = form.getCheckBox(fieldName).isChecked().toString();
            } else if (fieldType === "PDFDropdown") {
              fieldValue = form.getDropdown(fieldName).getSelected().join(", ") || "(none selected)";
            }
          } catch (error) {
            fieldValue = `Error reading: ${error instanceof Error ? error.message : String(error)}`;
          }

          console.log(`${fieldName} (${fieldType}): ${fieldValue}`);
        });
      }
    }

    return {
      ...fileInfo,
      contentPreview,
      isValidPdf,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Debug PDF failed:", errorMessage);
    throw new Error(`PDF debugging failed: ${errorMessage}`);
  }
}

// Example usage with debugging
// Creates a mock file with the template and logs the forms filled
// Useful for testing and verification
export async function exampleWithDebug() {
  const replacements = {
    Text1: "2025-11-02",
    Text2: "Freelancer",
    Text3: "-Job title: I'll work for you! \n-Comments on proposal: Do It asap",
    Text4: "Client won't stop asking for me to do it quicker",
  };

  // Fill the template
  const pdfFile = await fillPdfTemplate(replacements);

  // Debug the result
  const debugInfo = await debugPdfContent(pdfFile);

  return { pdfFile, debugInfo };
}
