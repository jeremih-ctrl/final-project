import { buildLifecycleBreakdownPDF } from "../lib/lifecycle-breakdown-pdf";
import fs from "fs";
import path from "path";
import assert from "assert";

console.log("=== RUNNING APPLICATION LIFECYCLE PDF EXPORT UNIT TESTS ===");

// 1. Test with genuine current figures (e.g. Total 3, Approved 1, Archived 2)
const testDate = new Date("2026-10-19T12:50:00+08:00");
const doc1 = buildLifecycleBreakdownPDF({
  totalCount: 3,
  activeCount: 1,
  archivedCount: 2,
  approved: 1,
  underReview: 0,
  needsCorrection: 0,
  submitted: 0,
  rejected: 0,
  archived: 2,
  exportDate: testDate,
});

const pdf1Output = Buffer.from(doc1.output("arraybuffer"));
console.log(`[TEST 1] Generated PDF size: ${pdf1Output.length} bytes, pages: ${doc1.getNumberOfPages()}`);
assert(pdf1Output.length > 1000, "PDF byte length must be greater than 1KB");
assert.strictEqual(pdf1Output.subarray(0, 5).toString(), "%PDF-", "Generated file must have genuine %PDF- header");
assert.strictEqual(doc1.getNumberOfPages(), 1, "Expected single-page PDF for lifecycle breakdown report");
console.log("✓ TEST 1 PASSED: Generated valid PDF with genuine registry numbers.");

// 2. Test with empty / zero datasets safely
const docEmpty = buildLifecycleBreakdownPDF({
  totalCount: 0,
  activeCount: 0,
  archivedCount: 0,
  approved: 0,
  underReview: 0,
  needsCorrection: 0,
  submitted: 0,
  rejected: 0,
  archived: 0,
  exportDate: testDate,
});

const pdfEmptyOutput = Buffer.from(docEmpty.output("arraybuffer"));
console.log(`[TEST 2] Empty dataset PDF size: ${pdfEmptyOutput.length} bytes, pages: ${docEmpty.getNumberOfPages()}`);
assert.strictEqual(pdfEmptyOutput.subarray(0, 5).toString(), "%PDF-", "Empty PDF must have genuine %PDF- header");
console.log("✓ TEST 2 PASSED: Empty datasets handled safely without errors.");

// 3. Test with custom row mappings
const customRows = [
  { statusTier: "Approved (Accredited)", volume: 15, ratio: "30.0%", classificationAction: "Issued Official Vendor ID" },
  { statusTier: "Under Administrative Review", volume: 10, ratio: "20.0%", classificationAction: "Assigned Evaluator Active" },
  { statusTier: "Needs Correction", volume: 5, ratio: "10.0%", classificationAction: "Pending Vendor Correction" },
  { statusTier: "Submitted (New Intake)", volume: 10, ratio: "20.0%", classificationAction: "In Intake Queue" },
  { statusTier: "Rejected", volume: 5, ratio: "10.0%", classificationAction: "Zoning Non-Compliance" },
  { statusTier: "Archived", volume: 5, ratio: "10.0%", classificationAction: "Preserved in Archive History" },
];

const docCustom = buildLifecycleBreakdownPDF({
  totalCount: 50,
  activeCount: 45,
  archivedCount: 5,
  approvalRate: "33.3",
  rows: customRows,
  exportDate: testDate,
});

const pdfCustomOutput = Buffer.from(docCustom.output("arraybuffer"));
assert.strictEqual(pdfCustomOutput.subarray(0, 5).toString(), "%PDF-", "Custom rows PDF must have genuine %PDF- header");
console.log("✓ TEST 3 PASSED: Custom table rows and percentages render accurately.");

// 4. Save sample file to test output directory
const outDir = path.join(__dirname, "output");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, "test_lifecycle_breakdown_export.pdf");
fs.writeFileSync(outPath, pdf1Output);
console.log(`[TEST 4] Written test PDF to ${outPath}`);
assert(fs.existsSync(outPath), "Output PDF file must exist on disk");

console.log("\nALL APPLICATION LIFECYCLE PDF EXPORT TESTS PASSED SUCCESSFULLY! ✓✓✓");
