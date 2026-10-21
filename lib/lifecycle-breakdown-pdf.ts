import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface LifecycleStatusRow {
  statusTier: string;
  volume: number;
  ratio: string;
  classificationAction: string;
}

export interface LifecycleBreakdownPDFOptions {
  totalCount: number;
  activeCount: number;
  archivedCount: number;
  approvalRate?: string;
  rows?: LifecycleStatusRow[];
  // Direct status counts if rows are not pre-constructed
  approved?: number;
  underReview?: number;
  needsCorrection?: number;
  submitted?: number;
  rejected?: number;
  archived?: number;
  exportDate?: Date;
}

/**
 * Builds the official PDF Document instance for the Butuan Application Lifecycle Breakdown.
 * Generates an official, printable government report with headers, metadata, summary statistics,
 * and a clearly formatted lifecycle status breakdown table.
 */
export function buildLifecycleBreakdownPDF(options: LifecycleBreakdownPDFOptions): jsPDF {
  const {
    totalCount,
    activeCount,
    archivedCount,
    exportDate = new Date(),
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const leftMargin = 40;
  const rightMargin = 40;
  const printableWidth = pageWidth - leftMargin - rightMargin; // 515.28 pt

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

  // Calculate percentage helper
  const calcPct = (count: number) =>
    totalCount > 0 ? `${((count / totalCount) * 100).toFixed(1)}%` : "0.0%";

  // Prepare table rows from either options.rows or explicit counts
  const approvedCount = options.approved ?? 0;
  const underReviewCount = options.underReview ?? 0;
  const needsCorrectionCount = options.needsCorrection ?? 0;
  const submittedCount = options.submitted ?? 0;
  const rejectedCount = options.rejected ?? 0;
  const archivedRecordsCount = options.archived ?? archivedCount;

  const defaultRows: LifecycleStatusRow[] = [
    {
      statusTier: "Approved (Accredited)",
      volume: approvedCount,
      ratio: calcPct(approvedCount),
      classificationAction: "Issued Official Vendor ID & Municipal Accreditation",
    },
    {
      statusTier: "Under Administrative Review",
      volume: underReviewCount,
      ratio: calcPct(underReviewCount),
      classificationAction: "Assigned Evaluator Active / Pending Admin Decision",
    },
    {
      statusTier: "Needs Correction",
      volume: needsCorrectionCount,
      ratio: calcPct(needsCorrectionCount),
      classificationAction: "Pending Vendor Correction / Resubmission",
    },
    {
      statusTier: "Submitted (New Intake)",
      volume: submittedCount,
      ratio: calcPct(submittedCount),
      classificationAction: "New Intake Queue / Awaiting Initial Verification",
    },
    {
      statusTier: "Rejected",
      volume: rejectedCount,
      ratio: calcPct(rejectedCount),
      classificationAction: "Zoning Non-Compliance / Disapproved Application",
    },
    {
      statusTier: "Archived",
      volume: archivedRecordsCount,
      ratio: calcPct(archivedRecordsCount),
      classificationAction: "Preserved in Archive History / Soft-Deleted Record",
    },
  ];

  const tableRows = options.rows ?? defaultRows;

  // ── Header Section ────────────────────────────────────────────────────────
  // Top Civic Bar
  doc.setFillColor(30, 58, 138); // Civic Navy (#1e3a8a)
  doc.rect(leftMargin, 26, printableWidth, 3, "F");

  // Republic / Government Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text("REPUBLIC OF THE PHILIPPINES", leftMargin, 42);

  // Main City Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text("CITY GOVERNMENT OF BUTUAN", leftMargin, 58);

  // Division Subheading
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text(
    "Business Permits and Licensing Division • City Economic Enterprises Office",
    leftMargin,
    71
  );

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138); // Blue-800
  doc.text("APPLICATION LIFECYCLE BREAKDOWN", leftMargin, 88);

  // Divider Line
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.75);
  doc.line(leftMargin, 96, leftMargin + printableWidth, 96);

  // ── Metadata Grid ─────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Organization:", leftMargin, 110);
  doc.setFont("helvetica", "normal");
  doc.text("City Government of Butuan", leftMargin + 85, 110);

  doc.setFont("helvetica", "bold");
  doc.text("Report Date & Time:", leftMargin, 124);
  doc.setFont("helvetica", "normal");
  doc.text(formattedDateTime, leftMargin + 85, 124);

  // Right Column Metadata
  const rightMetaX = leftMargin + 270;
  doc.setFont("helvetica", "bold");
  doc.text("Total Applications:", rightMetaX, 110);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${totalCount.toLocaleString()} Records (${activeCount} Active • ${archivedCount} Archived)`,
    rightMetaX + 90,
    110
  );

  doc.setFont("helvetica", "bold");
  doc.text("Document Type:", rightMetaX, 124);
  doc.setFont("helvetica", "normal");
  doc.text("Official Municipal Lifecycle Audit", rightMetaX + 90, 124);

  // ── Summary KPI Strip ─────────────────────────────────────────────────────
  const cardY = 136;
  const cardHeight = 36;
  const cardGap = 8;
  const cardWidth = (printableWidth - cardGap * 3) / 4;

  const kpis = [
    { label: "TOTAL APPLICATIONS", value: totalCount.toLocaleString(), color: [30, 58, 138] },
    { label: "ACTIVE APPLICATIONS", value: activeCount.toLocaleString(), color: [3, 105, 161] },
    { label: "ARCHIVED RECORDS", value: archivedCount.toLocaleString(), color: [71, 85, 105] },
    {
      label: "APPROVAL RATE",
      value: options.approvalRate ? `${options.approvalRate}%` : activeCount > 0 ? `${((approvedCount / activeCount) * 100).toFixed(1)}%` : "0.0%",
      color: [5, 150, 105],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = leftMargin + idx * (cardWidth + cardGap);
    // Background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 4, 4, "F");
    // Border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 4, 4, "S");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 8, cardY + 12);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 8, cardY + 28);
  });

  // ── Breakdown Table ───────────────────────────────────────────────────────
  const tableData = tableRows.map((row) => [
    row.statusTier,
    row.volume.toLocaleString(),
    row.ratio,
    row.classificationAction,
  ]);

  autoTable(doc, {
    startY: cardY + cardHeight + 14,
    head: [
      ["Status Tier", "Volume", "Ratio", "Classification / Action"],
    ],
    body: tableData,
    foot: [
      [
        "Total Registry Records",
        totalCount.toLocaleString(),
        "100.0%",
        "Reconciled Municipal Registry (Active & Archived)",
      ],
    ],
    theme: "grid",
    showHead: "everyPage",
    margin: { left: leftMargin, right: rightMargin, top: 46, bottom: 46 },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
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
      cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
    },
    footStyles: {
      fillColor: [241, 245, 249], // Slate-100
      textColor: [15, 23, 42], // Slate-900
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    columnStyles: {
      0: { cellWidth: 145, fontStyle: "bold" },
      1: { cellWidth: 60, halign: "right", fontStyle: "bold" },
      2: { cellWidth: 55, halign: "right" },
      3: { cellWidth: 255.28, halign: "left" },
    },
  });

  // ── Running Footers ───────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running header on page 2 and up
    if (i > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "CITY GOVERNMENT OF BUTUAN • APPLICATION LIFECYCLE BREAKDOWN (CONTINUED)",
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
    doc.line(leftMargin, pageHeight - 42, leftMargin + printableWidth, pageHeight - 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "City Government of Butuan • Business Permits & Licensing Division • Official Municipal Registry Record",
      leftMargin,
      pageHeight - 28
    );

    doc.text(
      `Page ${i} of ${totalPages}`,
      leftMargin + printableWidth,
      pageHeight - 28,
      { align: "right" }
    );
  }

  return doc;
}

/**
 * Triggers the browser download of the generated Application Lifecycle Breakdown PDF.
 * Returns the generated filename and row count.
 */
export function exportLifecycleBreakdownPDF(options: LifecycleBreakdownPDFOptions): {
  success: boolean;
  filename: string;
} {
  const date = options.exportDate || new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const filename = `Butuan-Application-Lifecycle-Report-${yyyy}-${mm}-${dd}.pdf`;

  const doc = buildLifecycleBreakdownPDF(options);
  doc.save(filename);

  return {
    success: true,
    filename,
  };
}
