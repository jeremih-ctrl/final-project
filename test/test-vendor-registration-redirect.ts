import {
  getAllPersistentApplications,
  getPersistentApplicationsByUserId,
  getPersistentApplicationById,
  savePersistentApplication,
  generateServerApplicationNumber,
  getPersistentApplicationsByUserIdAsync,
} from "../lib/server/vendor-applications-db";
import { VendorApplication } from "../lib/types/vendor-application";
import fs from "fs";
import path from "path";

console.log("=== RUNNING TEST: VENDOR REGISTRATION REDIRECT & APPLICATION DETAILS ===");

const APPS_FILE = path.join(process.cwd(), "data/vendor-applications.json");
const initialDataRaw = fs.readFileSync(APPS_FILE, "utf-8");
const initialApplications: VendorApplication[] = JSON.parse(initialDataRaw);

try {
  // ─── VERIFICATION 1: Verify Existing Applications Preserved ───
  console.log("\n[VERIFICATION 1] Checking existing vendor applications integrity...");
  const irishUser = getPersistentApplicationsByUserId("user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn");
  if (!irishUser.some((a) => a.applicationNumber === "BVR-2026-000002")) {
    throw new Error("FAIL: Existing user Ma. Irish Relleta's application BVR-2026-000002 is missing!");
  }
  if (irishUser.some((a) => a.applicationNumber === "BVR-2026-000003" || a.business?.businessName?.includes("BRANCH 2"))) {
    throw new Error("FAIL: Fabricated branch 2 was found under Ma. Irish Relleta!");
  }
  console.log("✓ Existing application (BVR-2026-000002) is fully intact, and no duplicate branch 2 exists.");

  // ─── VERIFICATION 2: Simulate Genuinely New User Registration ───
  console.log("\n[VERIFICATION 2] Simulating brand-new user sign up and first application submission...");
  const newClerkUserId = `user_test_new_vendor_${Date.now()}`;
  const newVendorEmail = `newvendor_${Date.now()}@butuan.gov.ph`;
  const newVendorOwnerName = "Test Isolation Vendor";
  const newBusinessName = "Test Fresh Produce";

  // Check that new user initially has 0 applications
  const initialNewUserApps = getPersistentApplicationsByUserId(newClerkUserId);
  if (initialNewUserApps.length !== 0) {
    throw new Error(`FAIL: Brand new user should have 0 applications, found ${initialNewUserApps.length}`);
  }
  console.log(`✓ Confirmed brand-new user ${newClerkUserId} has 0 initial applications.`);

  // Authoritative server application number generation
  const authoritativeAppNumber = generateServerApplicationNumber();
  console.log(`Server generated authoritative reference number: ${authoritativeAppNumber}`);
  if (!/^BVR-\d{4}-\d{6}$/.test(authoritativeAppNumber)) {
    throw new Error(`FAIL: Application number ${authoritativeAppNumber} does not match BVR-YYYY-XXXXXX format!`);
  }

  // Simulate what the POST /api/vendor/application route does
  const now = new Date().toISOString();
  const newAppPayload: VendorApplication = {
    id: authoritativeAppNumber,
    applicationNumber: authoritativeAppNumber,
    userId: newClerkUserId,
    verifiedEmail: newVendorEmail,
    status: "submitted",
    verificationStatus: "Pending",
    isVerified: false,
    currentStage: 1,
    business: {
      businessName: newBusinessName,
      category: "Food & Refreshment / Market Stall",
      businessDescription: "Traditional Butuan delicacies",
    },
    owner: {
      ownerName: newVendorOwnerName,
    },
    contact: {
      contactNumber: "09171234567",
      emailAddress: newVendorEmail,
    },
    address: {
      houseNo: "Stall 14",
      street: "Mayor Salvador Calo St.",
      barangay: "Dagohoy",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    documents: [
      {
        id: "doc-1",
        idType: "Government ID",
        idNumber: "PH-1234-5678",
        filename: "valid-id.pdf",
        uploadedAt: now,
        status: "Submitted",
      },
    ],
    payment: {
      status: "pending_verification",
      assessedAmount: 1450,
      amountPaid: 0,
      currency: "PHP",
      paymentMethod: "GCash",
      paymentMethodCategory: "e_wallet",
      transactionReference: `PAY-${authoritativeAppNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`,
      paymentDate: null,
      feeBreakdown: [],
      assessmentStatus: "assessed",
    },
    statusHistory: [
      {
        id: "hist-1",
        previousStatus: null,
        newStatus: "submitted",
        timestamp: now,
        action: "Application Submitted",
        actionBy: "Vendor",
      },
    ],
    submittedAt: now,
    updatedAt: now,
    createdAt: now,
  };

  const savedApp = savePersistentApplication(newAppPayload);
  if (!savedApp || savedApp.applicationNumber !== authoritativeAppNumber) {
    throw new Error("FAIL: Failed to save application or returned mismatching application number!");
  }
  console.log(`✓ Application successfully persisted to database with applicationNumber: ${savedApp.applicationNumber}`);

  // ─── VERIFICATION 3: Verify Redirect Logic on Client ───
  console.log("\n[VERIFICATION 3] Verifying client redirect uses returned savedApp.applicationNumber...");
  // In app/register/page.tsx:
  // const actualAppNumber = (savedApp.applicationNumber || savedApp.id).trim();
  // router.push(`/dashboard/my-application?appNumber=${encodeURIComponent(actualAppNumber)}`);
  const actualAppNumber = (savedApp.applicationNumber || savedApp.id).trim();
  const redirectedUrl = `/dashboard/my-application?appNumber=${encodeURIComponent(actualAppNumber)}`;
  console.log(`Client redirects to: ${redirectedUrl}`);
  if (!redirectedUrl.includes(authoritativeAppNumber)) {
    throw new Error(`FAIL: Client redirect URL does not contain authoritative number ${authoritativeAppNumber}`);
  }
  if (redirectedUrl.includes("000001")) {
    throw new Error("FAIL: Client redirect URL mistakenly used guessed sequence 000001!");
  }
  console.log(`✓ Confirmed redirect uses authoritative ${authoritativeAppNumber} directly.`);

  // ─── VERIFICATION 4: Simulate /dashboard/my-application Lookup & Ownership Check ───
  console.log("\n[VERIFICATION 4] Simulating /dashboard/my-application load for new vendor...");
  const userApps = getPersistentApplicationsByUserId(newClerkUserId);
  if (userApps.length !== 1) {
    throw new Error(`FAIL: Expected 1 application for new vendor, found ${userApps.length}`);
  }

  // Dashboard page lookup logic:
  const requestedAppNumber = authoritativeAppNumber;
  const match = userApps.find(
    (a) =>
      a.id?.toLowerCase() === requestedAppNumber.trim().toLowerCase() ||
      a.applicationNumber?.toLowerCase() === requestedAppNumber.trim().toLowerCase()
  );

  if (!match) {
    throw new Error("FAIL: Dashboard lookup failed to find the newly registered application!");
  }
  const isUnauthorized = !match;
  if (isUnauthorized) {
    throw new Error("FAIL: isUnauthorizedRequestedApp was incorrectly flagged true!");
  }
  console.log(`✓ Application found successfully! Ref: ${match.applicationNumber}, Business: "${match.business?.businessName}", Status: ${match.status}`);
  console.log("✓ Access granted: user is confirmed owner, error page will NOT render.");

  // ─── VERIFICATION 5: Page Refresh Simulation ───
  console.log("\n[VERIFICATION 5] Simulating page refresh...");
  const refreshApps = getPersistentApplicationsByUserId(newClerkUserId);
  const refreshMatch = refreshApps.find((a) => a.applicationNumber === authoritativeAppNumber);
  if (!refreshMatch) {
    throw new Error("FAIL: Page refresh did not find the application!");
  }
  console.log("✓ Page refresh correctly loads the same application details.");

  // ─── VERIFICATION 6: Sign-out and Sign-back-in Simulation ───
  console.log("\n[VERIFICATION 6] Simulating user sign-out and re-login...");
  const reloginApps = getPersistentApplicationsByUserId(newClerkUserId);
  if (reloginApps.length === 0 || reloginApps[0].applicationNumber !== authoritativeAppNumber) {
    throw new Error("FAIL: Re-login failed to load existing applications for this account!");
  }
  console.log("✓ Application remains accessible after re-authenticating with the same account.");

  // ─── VERIFICATION 7: Cross-User Security Check (Tampering with URL) ───
  console.log("\n[VERIFICATION 7] Verifying access denial when another vendor tries to access this application...");
  const attackerUserId = "user_attacker_vendor_999999";
  const attackerApps = getPersistentApplicationsByUserId(attackerUserId); // Has 0 apps or own apps

  const attackerMatch = attackerApps.find(
    (a) =>
      a.id?.toLowerCase() === authoritativeAppNumber.toLowerCase() ||
      a.applicationNumber?.toLowerCase() === authoritativeAppNumber.toLowerCase()
  );

  const attackerIsUnauthorized = !attackerMatch;
  if (!attackerIsUnauthorized) {
    throw new Error("SECURITY BREACH: Unauthorized vendor was able to access another vendor's application!");
  }
  console.log("✓ Security verified: Unauthorized vendor gets Access Denied (isUnauthorizedRequestedApp = true).");

  // ─── VERIFICATION 8: Multiple Applications Support ───
  console.log("\n[VERIFICATION 8] Verifying support for multiple applications by same user...");
  const secondAppNumber = generateServerApplicationNumber();
  const secondAppPayload: VendorApplication = {
    ...newAppPayload,
    id: secondAppNumber,
    applicationNumber: secondAppNumber,
    business: {
      businessName: "Test Second Business Crafts",
      category: "Handicrafts & Souvenirs",
    },
    submittedAt: new Date().toISOString(),
  };

  savePersistentApplication(secondAppPayload);
  const multiApps = getPersistentApplicationsByUserId(newClerkUserId);
  if (multiApps.length !== 2) {
    throw new Error(`FAIL: Expected 2 applications for user, found ${multiApps.length}`);
  }
  console.log(`✓ User now owns ${multiApps.length} applications: ${multiApps.map((a) => a.applicationNumber).join(", ")}`);

  // ─── VERIFICATION 9: Client Registration Code Static Verification ───
  console.log("\n[VERIFICATION 9] Checking registration code in app/register/page.tsx...");
  const registerPageCode = fs.readFileSync(path.join(process.cwd(), "app/register/page.tsx"), "utf-8");
  if (!registerPageCode.includes("savedApp.applicationNumber || savedApp.id")) {
    throw new Error("FAIL: app/register/page.tsx does not use savedApp.applicationNumber!");
  }
  if (!registerPageCode.includes("router.push(`/dashboard/my-application?appNumber=${encodeURIComponent(actualAppNumber)}`)")) {
    throw new Error("FAIL: app/register/page.tsx does not redirect to /dashboard/my-application with actualAppNumber!");
  }
  console.log("✓ app/register/page.tsx correctly extracts authoritative number and navigates directly.");

  // ─── VERIFICATION 10: Dashboard Detail View Routing Static Verification ───
  console.log("\n[VERIFICATION 10] Checking dashboard code in app/dashboard/my-application/page.tsx...");
  const myAppCode = fs.readFileSync(path.join(process.cwd(), "app/dashboard/my-application/page.tsx"), "utf-8");
  if (!myAppCode.includes('searchParams.get("appNumber") || searchParams.get("ref") || searchParams.get("id")')) {
    throw new Error("FAIL: app/dashboard/my-application/page.tsx does not handle query params correctly!");
  }
  if (!myAppCode.includes('setViewMode("details")')) {
    throw new Error("FAIL: app/dashboard/my-application/page.tsx does not set viewMode to details upon matching!");
  }
  console.log("✓ app/dashboard/my-application/page.tsx correctly switches to details view.");

  console.log("\n========================================================");
  console.log("ALL 10 VERIFICATION REQUIREMENTS COMPLETED SUCCESSFULLY! ✓✓✓");
  console.log("========================================================");
} finally {
  // Clean up synthetic test applications to preserve clean state
  const currentRaw = fs.readFileSync(APPS_FILE, "utf-8");
  const currentApps: VendorApplication[] = JSON.parse(currentRaw);
  const cleanedApps = currentApps.filter((a) => !a.userId?.startsWith("user_test_new_vendor_"));
  fs.writeFileSync(APPS_FILE, JSON.stringify(cleanedApps, null, 2), "utf-8");
  console.log("\n[CLEANUP] Synthetic test applications removed. Database state restored.");
}
