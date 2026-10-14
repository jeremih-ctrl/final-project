import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface VendorPDFRecord {
  id: string;
  applicationNumber?: string;
  businessName: string;
  ownerName: string;
  category: string;
  barangay: string;
  street?: string;
  contactNumber?: string;
  emailAddress?: string;
  certifiedDate?: string;
  expiryDate?: string;
  status: string;
}

export interface VendorPDFExportOptions {
  vendors: VendorPDFRecord[];
  totalRegistryCount: number;
  searchQuery?: string;
  selectedBarangay?: string;
  selectedCategory?: string;
  exportDate?: Date;
}

/**
 * Builds the official PDF Document instance for the Butuan Registered Vendors Registry.
 * Generates an official, printable government report with headers, metadata, multi-page
 * pagination, and repeated table headers.
 */
export function buildVendorRegistryPDF(options: VendorPDFExportOptions): jsPDF {
  const {
    vendors,
    totalRegistryCount,
    searchQuery = "",
    selectedBarangay = "All",
    selectedCategory = "All",
    exportDate = new Date(),
  } = options;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = 841.89;
  const leftMargin = 40;
  const rightMargin = 40;
  const printableWidth = pageWidth - leftMargin - rightMargin; // 761.89 pt

  // Format date and time
  const formattedDateTime = exportDate.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Compose filter summary text
  const filterParts: string[] = [];
  if (selectedBarangay && selectedBarangay !== "All") {
    filterParts.push(`Barangay: ${selectedBarangay}`);
  }
  if (selectedCategory && selectedCategory !== "All") {
    filterParts.push(`Category: ${selectedCategory}`);
  }
  if (searchQuery && searchQuery.trim()) {
    filterParts.push(`Search: "${searchQuery.trim()}"`);
  }
  const filterSummary = filterParts.length > 0 ? filterParts.join(" | ") : "All Registered Records";

  // ── Page 1: Official Header ──────────────────────────────────────────────
  // Top Civic Bar
  doc.setFillColor(30, 58, 138); // Civic Navy (#1e3a8a)
  doc.rect(leftMargin, 26, printableWidth, 3, "F");

  // Republic / Government Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text("REPUBLIC OF THE PHILIPPINES", leftMargin, 40);

  // Main City Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text("CITY GOVERNMENT OF BUTUAN", leftMargin, 55);

  // Division Subheading
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text("Business Permits and Licensing Division • City Economic Enterprises Office", leftMargin, 68);

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138); // Blue-800
  doc.text("REGISTERED VENDORS REGISTRY", leftMargin, 84);

  // Divider Line
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.75);
  doc.line(leftMargin, 92, leftMargin + printableWidth, 92);

  // ── Page 1: Metadata Section ─────────────────────────────────────────────
  // Left Column: Date & Total Count
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Export Date & Time:", leftMargin, 104);
  doc.setFont("helvetica", "normal");
  doc.text(formattedDateTime, leftMargin + 95, 104);

  doc.setFont("helvetica", "bold");
  doc.text("Total Vendors Included:", leftMargin, 117);
  doc.setFont("helvetica", "normal");
  const countText =
    vendors.length === totalRegistryCount
      ? `${vendors.length} Records (Complete Registry)`
      : `${vendors.length} of ${totalRegistryCount} Records (Filtered)`;
  doc.text(countText, leftMargin + 110, 117);

  // Right Column: Filter details & Classification
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Registry Filter:", leftMargin + printableWidth - 250, 104);
  doc.setFont("helvetica", "normal");
  doc.text(filterSummary, leftMargin + printableWidth - 175, 104, { maxWidth: 175 });

  doc.setFont("helvetica", "bold");
  doc.text("Classification:", leftMargin + printableWidth - 250, 117);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Official Municipal Registry Document", leftMargin + printableWidth - 175, 117);

  // Divider above table
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, 125, leftMargin + printableWidth, 125);

  // ── Table Body ───────────────────────────────────────────────────────────
  const tableRows = vendors.map((vendor) => [
    vendor.id,
    vendor.businessName,
    vendor.ownerName,
    vendor.barangay ? `${vendor.barangay}, Butuan City` : "Butuan City",
    vendor.category,
    vendor.status,
  ]);

  autoTable(doc, {
    startY: 132,
    head: [
      [
        "Vendor ID",
        "Trade / Business Name",
        "Proprietor Name",
        "Location / Barangay",
        "Business Category",
        "Accreditation / Verification Status",
      ],
    ],
    body: tableRows,
    theme: "grid",
    showHead: "everyPage",
    margin: { left: leftMargin, right: rightMargin, top: 46, bottom: 46 },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [30, 58, 138], // Navy blue #1e3a8a
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 7, bottom: 7, left: 6, right: 6 },
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    columnStyles: {
      0: { cellWidth: 85, fontStyle: "bold" },
      1: { cellWidth: 175, fontStyle: "bold" },
      2: { cellWidth: 135 },
      3: { cellWidth: 125 },
      4: { cellWidth: 110 },
      5: { cellWidth: 131.89, halign: "center" },
    },
  });

  // ── Multi-page Running Headers & Footers ─────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running header on page 2 and up
    if (i > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "CITY GOVERNMENT OF BUTUAN • REGISTERED VENDORS REGISTRY (CONTINUED)",
        leftMargin,
        34
      );
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, 38, leftMargin + printableWidth, 38);
    }

    // Running footer on every page
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, 563, leftMargin + printableWidth, 563);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "City Government of Butuan • Business Permits & Licensing Division • Official Municipal Registry Record",
      leftMargin,
      576
    );

    doc.text(
      `Page ${i} of ${totalPages}`,
      leftMargin + printableWidth,
      576,
      { align: "right" }
    );
  }

  return doc;
}

/**
 * Triggers the browser download of the generated PDF file.
 * Returns the generated filename and record count.
 */
export function exportVendorRegistryPDF(options: VendorPDFExportOptions): {
  success: boolean;
  filename: string;
  count: number;
} {
  const date = options.exportDate || new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const filename = `Butuan_Vendor_Registry_${yyyy}-${mm}-${dd}.pdf`;

  const doc = buildVendorRegistryPDF(options);
  doc.save(filename);

  return {
    success: true,
    filename,
    count: options.vendors.length,
  };
}
