/**
 * Centralized Vendor Application Store
 * 
 * Shared client-side store utilizing browser localStorage so the Vendor Portal,
 * Admin Portal, Track Status, and Registration can read, create, update, and manage
 * the SAME application records without external databases.
 * 
 * Browser-safe and SSR-compatible for Next.js.
 */

import { useSyncExternalStore } from "react";
import { VendorApplication } from "./types/vendor-application";

// ─── Constants ────────────────────────────────────────────────────────────────

export const APPLICATIONS_STORAGE_KEY = "vendorApplications";
export const LEGACY_APPLICATIONS_STORAGE_KEY = "butuan-vendor-applications";
export const APPLICATIONS_STORE_UPDATED_EVENT = "bvr_applications_store_updated";

export const DELETED_APPLICATIONS_STORAGE_KEY = "bvr_deleted_applications";
export const DELETED_APPLICATIONS_UPDATED_EVENT = "bvr_deleted_applications_updated";

// ─── Initial Seed Applications (Used when localStorage is empty) ──────────────

export function getInitialSeedApplications(): VendorApplication[] {
  return [
    {
      id: "BVR-2026-001248",
      applicationNumber: "BVR-2026-001248",
      vendorId: "BUT-V-001248",
      status: "under_review",
      verificationStatus: "Pending",
      isVerified: false,
      currentStage: 2,
      business: {
        businessName: "Montilla Street Produce & Snacks",
        businessDescription: "Produce, local snacks, and fresh goods in Butuan City.",
        category: "Produce & Snacks / Market Stall",
      },
      owner: {
        ownerName: "Maria Santos",
      },
      contact: {
        contactNumber: "09181234567",
        emailAddress: "maria.santos@email.com",
      },
      address: {
        houseNo: "123",
        street: "Montilla Boulevard",
        barangay: "Barangay Urduja",
        city: "Butuan City",
        province: "Agusan del Norte",
        region: "Caraga",
        country: "Philippines",
      },
      documents: [
        {
          id: "doc-1248",
          filename: "government-id.pdf",
          idType: "Philippine National ID (PhilSys)",
          uploadedAt: "October 6, 2026",
          status: "Submitted",
        },
      ],
      adminRemarks: "Please provide a clearer business address and replace the submitted government ID image with a readable copy.",
      statusHistory: [
        {
          id: "act-1248-1",
          previousStatus: null,
          newStatus: "under_review",
          timestamp: "2026-10-06T09:30:00Z",
          action: "Application Under Review",
          actionBy: "Admin",
        },
      ],
      submittedAt: "2026-10-06T09:30:00Z",
      updatedAt: "2026-10-06T09:30:00Z",
    },
    {
      id: "BVR-2026-001247",
      applicationNumber: "BVR-2026-001247",
      vendorId: "BUT-V-001247",
      status: "under_review",
      verificationStatus: "Pending",
      isVerified: false,
      currentStage: 2,
      business: {
        businessName: "Urduja Dry Goods & General Merchandise",
        businessDescription: "Textiles, kitchenware, and general household items.",
        category: "Dry Goods / Market Stall",
      },
      owner: {
        ownerName: "Carlos Mendoza",
      },
      contact: {
        contactNumber: "09171234567",
        emailAddress: "carlos.mendoza@email.com",
      },
      address: {
        houseNo: "45",
        street: "Burgos Street",
        barangay: "Urduja",
        city: "Butuan City",
        province: "Agusan del Norte",
        region: "Caraga",
        country: "Philippines",
      },
      documents: [
        {
          id: "doc-1247",
          filename: "philsys-id.pdf",
          idType: "PhilSys National ID",
          uploadedAt: "October 6, 2026",
          status: "Submitted",
        },
      ],
      adminRemarks: "",
      statusHistory: [
        {
          id: "act-1247-1",
          previousStatus: null,
          newStatus: "under_review",
          timestamp: "2026-10-06T08:00:00Z",
          action: "Application Under Review",
          actionBy: "Admin",
        },
      ],
      submittedAt: "2026-10-06T08:00:00Z",
      updatedAt: "2026-10-06T08:00:00Z",
    },
    {
      id: "BVR-2026-001246",
      applicationNumber: "BVR-2026-001246",
      vendorId: "BUT-V-001246",
      status: "needs_correction",
      verificationStatus: "Pending",
      isVerified: false,
      currentStage: 2,
      business: {
        businessName: "Barangay Dagohoy Carinderia & Catering",
        businessDescription: "Cooked meals, lutong bahay, and snack catering.",
        category: "Food & Beverage",
      },
      owner: {
        ownerName: "Lucia Dagohoy",
      },
      contact: {
        contactNumber: "09187654321",
        emailAddress: "lucia.dagohoy@email.com",
      },
      address: {
        houseNo: "88",
        street: "Dagohoy Street",
        barangay: "Dagohoy",
        city: "Butuan City",
        province: "Agusan del Norte",
        region: "Caraga",
        country: "Philippines",
      },
      documents: [
        {
          id: "doc-1246",
          filename: "valid-id-scan.png",
          idType: "Driver's License",
          uploadedAt: "October 5, 2026",
          status: "Replacement Requested",
        },
      ],
      adminRemarks: "Please provide a clearer copy of the submitted document.",
      statusHistory: [
        {
          id: "act-1246-1",
          previousStatus: null,
          newStatus: "needs_correction",
          timestamp: "2026-10-05T10:00:00Z",
          action: "Correction Requested",
          actionBy: "Admin",
        },
      ],
      submittedAt: "2026-10-05T10:00:00Z",
      updatedAt: "2026-10-05T10:00:00Z",
    },
    {
      id: "BVR-2026-001245",
      applicationNumber: "BVR-2026-001245",
      vendorId: "BUT-V-001245",
      status: "submitted",
      verificationStatus: "Pending",
      isVerified: false,
      currentStage: 1,
      business: {
        businessName: "Agusan River Fresh Fish",
        businessDescription: "Fresh catch tilapia, bangus, and river shrimp sold at morning market.",
        category: "Wet Market / Seafood",
      },
      owner: {
        ownerName: "Elena Roxas",
      },
      contact: {
        contactNumber: "09179876543",
        emailAddress: "elena.roxas@email.com",
      },
      address: {
        houseNo: "12",
        street: "Riverside Drive",
        barangay: "San Vicente",
        city: "Butuan City",
        province: "Agusan del Norte",
        region: "Caraga",
        country: "Philippines",
      },
      documents: [],
      adminRemarks: "Initial queue intake.",
      statusHistory: [
        {
          id: "act-1245-1",
          previousStatus: null,
          newStatus: "submitted",
          timestamp: "2026-10-05T09:00:00Z",
          action: "Application Submitted",
          actionBy: "Vendor",
        },
      ],
      submittedAt: "2026-10-05T09:00:00Z",
      updatedAt: "2026-10-05T09:00:00Z",
    },
    {
      id: "BVR-2026-001244",
      applicationNumber: "BVR-2026-001244",
      vendorId: "BUT-V-001244",
      status: "approved",
      verificationStatus: "Verified",
      isVerified: true,
      currentStage: 4,
      business: {
        businessName: "Golden Tara Refreshments",
        businessDescription: "Specialty halo-halo, sago't gulaman, and cold native snacks.",
        category: "Refreshments & Snacks",
      },
      owner: {
        ownerName: "Roberto Ramos",
      },
      contact: {
        contactNumber: "09192233445",
        emailAddress: "roberto.ramos@email.com",
      },
      address: {
        houseNo: "302",
        street: "Pizarro Street",
        barangay: "Villa Kananga",
        city: "Butuan City",
        province: "Agusan del Norte",
        region: "Caraga",
        country: "Philippines",
      },
      documents: [
        {
          id: "doc-1244",
          filename: "dti-certificate.pdf",
          idType: "Postal ID (Digital)",
          uploadedAt: "October 4, 2026",
          status: "Verified",
        },
      ],
      adminRemarks: "Compliant with City Health sanitary guidelines.",
      statusHistory: [
        {
          id: "act-1244-1",
          previousStatus: null,
          newStatus: "approved",
          timestamp: "2026-10-04T14:00:00Z",
          action: "Application Approved",
          actionBy: "Admin",
        },
      ],
      submittedAt: "2026-10-04T08:00:00Z",
      updatedAt: "2026-10-04T14:00:00Z",
    },
    {
      id: "BVR-2026-001243",
      applicationNumber: "BVR-2026-001243",
      vendorId: "BUT-V-001243",
      status: "rejected",
      verificationStatus: "Not Verified",
      isVerified: false,
      currentStage: 2,
      business: {
        businessName: "Butuan Balut & Penoy Express",
        businessDescription: "Mobile evening egg cart serving hot balut and penoy.",
        category: "Street Vendor / Eggs",
      },
      owner: {
        ownerName: "Dante Magbanua",
      },
      contact: {
        contactNumber: "09214455667",
        emailAddress: "dante.balut@email.com",
      },
      address: {
        houseNo: "77",
        street: "Langihan Road",
        barangay: "Baan KM 3",
        city: "Butuan City",
        province: "Agusan del Norte",
        region: "Caraga",
        country: "Philippines",
      },
      documents: [
        {
          id: "doc-1243",
          filename: "national-id-scan.jpg",
          idType: "PhilSys National ID",
          uploadedAt: "October 3, 2026",
          status: "Submitted",
        },
      ],
      adminRemarks: "Duplicate registration detected for same stall location.",
      statusHistory: [
        {
          id: "act-1243-1",
          previousStatus: null,
          newStatus: "rejected",
          timestamp: "2026-10-03T16:00:00Z",
          action: "Application Rejected",
          actionBy: "Admin",
        },
      ],
      submittedAt: "2026-10-03T09:00:00Z",
      updatedAt: "2026-10-03T16:00:00Z",
    },
    {
      id: "BVR-2026-001242",
      applicationNumber: "BVR-2026-001242",
      vendorId: "BUT-V-001242",
      status: "under_review",
      verificationStatus: "Pending",
      isVerified: false,
      currentStage: 2,
      business: {
        businessName: "Kadayawan Fruit Stand",
        businessDescription: "Seasonal tropical fruits: durian, lanzones, and marang direct from growers.",
        category: "Fruits & Produce",
      },
      owner: {
        ownerName: "Liza Flores",
      },
      contact: {
        contactNumber: "09307788990",
        emailAddress: "liza.flores@email.com",
      },
      address: {
        houseNo: "51",
        street: "Capitol Drive",
        barangay: "Villa Kananga",
        city: "Butuan City",
        province: "Agusan del Norte",
        region: "Caraga",
        country: "Philippines",
      },
      documents: [
        {
          id: "doc-1242",
          filename: "philhealth-id.pdf",
          idType: "PhilHealth ID",
          uploadedAt: "October 3, 2026",
          status: "Submitted",
        },
      ],
      adminRemarks: "Pending cross-check with City Agriculture vendor permits.",
      statusHistory: [
        {
          id: "act-1242-1",
          previousStatus: null,
          newStatus: "under_review",
          timestamp: "2026-10-03T11:00:00Z",
          action: "Application Under Review",
          actionBy: "Admin",
        },
      ],
      submittedAt: "2026-10-03T11:00:00Z",
      updatedAt: "2026-10-03T11:00:00Z",
    },
    {
      id: "BVR-2026-001241",
      applicationNumber: "BVR-2026-001241",
      vendorId: "BUT-V-001241",
      status: "under_review",
      verificationStatus: "Pending",
      isVerified: false,
      currentStage: 2,
      business: {
        businessName: "Maningning Tailoring & Repair",
        businessDescription: "Clothing alterations, zipper repairs, and custom school uniform sewing.",
        category: "Tailoring & Repair Services",
      },
      owner: {
        ownerName: "Estrella Maningning",
      },
      contact: {
        contactNumber: "09153322114",
        emailAddress: "estrella.sew@email.com",
      },
      address: {
        houseNo: "14",
        street: "E. Luna Street",
        barangay: "San Vicente",
        city: "Butuan City",
        province: "Agusan del Norte",
        region: "Caraga",
        country: "Philippines",
      },
      documents: [
        {
          id: "doc-1241",
          filename: "voters-cert.pdf",
          idType: "COMELEC Voter's Certificate",
          uploadedAt: "October 2, 2026",
          status: "Submitted",
        },
      ],
      adminRemarks: "Stall location verified along commercial alleyway.",
      statusHistory: [
        {
          id: "act-1241-1",
          previousStatus: null,
          newStatus: "under_review",
          timestamp: "2026-10-02T15:00:00Z",
          action: "Application Under Review",
          actionBy: "Admin",
        },
      ],
      submittedAt: "2026-10-02T09:00:00Z",
      updatedAt: "2026-10-02T15:00:00Z",
    },
  ];
}

// ─── SSR / Browser Safety Check ───────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// ─── Reactive Cache & Subscription ───────────────────────────────────────────

const EMPTY_STORE_APPLICATIONS: VendorApplication[] = [];
let cachedSnapshot: VendorApplication[] = EMPTY_STORE_APPLICATIONS;
let lastRaw: string | null = "__UNSET__";

function subscribeToStore(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleEvent = () => {
    lastRaw = "__UNSET__";
    callback();
  };
  window.addEventListener(APPLICATIONS_STORE_UPDATED_EVENT, handleEvent);
  window.addEventListener("storage", handleEvent);
  return () => {
    window.removeEventListener(APPLICATIONS_STORE_UPDATED_EVENT, handleEvent);
    window.removeEventListener("storage", handleEvent);
  };
}

function getStoreSnapshot(): VendorApplication[] {
  if (!isBrowser()) {
    return EMPTY_STORE_APPLICATIONS;
  }
  try {
    const raw =
      localStorage.getItem(APPLICATIONS_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_APPLICATIONS_STORAGE_KEY);

    if (raw === lastRaw) {
      return cachedSnapshot;
    }
    lastRaw = raw;

    if (!raw) {
      // Seed with initial applications if none exist yet
      const seed = getInitialSeedApplications();
      saveApplicationsToStorage(seed);
      cachedSnapshot = seed;
    } else {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedSnapshot = parsed as VendorApplication[];
      } else {
        const seed = getInitialSeedApplications();
        saveApplicationsToStorage(seed);
        cachedSnapshot = seed;
      }
    }
    return cachedSnapshot;
  } catch {
    return cachedSnapshot;
  }
}

function getStoreServerSnapshot(): VendorApplication[] {
  return EMPTY_STORE_APPLICATIONS;
}

/**
 * React hook to reactively subscribe to the shared applications store.
 * Automatically synchronizes across components and browser tabs.
 */
export function useStoredApplications(): VendorApplication[] {
  return useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    getStoreServerSnapshot
  );
}

// ─── Internal Persistence Helpers ─────────────────────────────────────────────

function saveApplicationsToStorage(applications: VendorApplication[]): void {
  if (!isBrowser()) return;
  try {
    const serialized = JSON.stringify(applications);
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_APPLICATIONS_STORAGE_KEY, serialized);
    lastRaw = serialized;
    cachedSnapshot = applications;
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(APPLICATIONS_STORE_UPDATED_EVENT, { detail: applications })
      );
    }
  } catch (error) {
    console.error("Failed to save vendor applications to localStorage:", error);
  }
}

// ─── 1. getApplications ───────────────────────────────────────────────────────

/**
 * Retrieve all saved VendorApplication records from the shared store.
 * Returns initial seeds if nothing is stored yet.
 */
export function getApplications(): VendorApplication[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw =
      localStorage.getItem(APPLICATIONS_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_APPLICATIONS_STORAGE_KEY);

    if (!raw) {
      const seed = getInitialSeedApplications();
      saveApplicationsToStorage(seed);
      return seed;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seed = getInitialSeedApplications();
      saveApplicationsToStorage(seed);
      return seed;
    }

    return parsed as VendorApplication[];
  } catch (error) {
    console.error("Failed to parse vendor applications from localStorage:", error);
    return getInitialSeedApplications();
  }
}

// ─── 2. getApplication ────────────────────────────────────────────────────────

/**
 * Retrieve a single application by its ID or application number.
 * Returns null if no matching application is found.
 */
export function getApplication(id: string): VendorApplication | null {
  if (!id) {
    return null;
  }

  const applications = getApplications();
  const normalizedQuery = id.trim().toLowerCase();

  const found = applications.find(
    (app) =>
      app.id.toLowerCase() === normalizedQuery ||
      app.applicationNumber.toLowerCase() === normalizedQuery
  );

  return found ?? null;
}

// ─── 3. createApplication ─────────────────────────────────────────────────────

/**
 * Add a new application to the shared store.
 * Guaranteed never to duplicate or throw an unhandled error.
 */
export function createApplication(application: VendorApplication): VendorApplication {
  if (!isBrowser()) {
    return application;
  }

  const applications = getApplications();
  const normalizedId = application.id.toLowerCase();
  const existingIndex = applications.findIndex(
    (app) => app.id.toLowerCase() === normalizedId
  );

  const now = new Date().toISOString();
  const newApp: VendorApplication = {
    ...application,
    status: application.status || "submitted",
    verificationStatus: application.verificationStatus || "Pending",
    isVerified: Boolean(application.isVerified),
    currentStage: application.currentStage ?? 1,
    submittedAt: application.submittedAt || now,
    updatedAt: application.updatedAt || now,
    statusHistory: application.statusHistory ?? [
      {
        id: `act-${Date.now()}`,
        previousStatus: null,
        newStatus: application.status || "submitted",
        timestamp: now,
        action: "Application Submitted",
        actionBy: "Vendor",
      },
    ],
  };

  // Crucial: remove from deleted applications list if present
  undeleteAdminApplicationRecord(application.id);

  if (existingIndex >= 0) {
    applications[existingIndex] = newApp;
  } else {
    // Put newly registered application at the beginning so it appears on top
    applications.unshift(newApp);
  }

  saveApplicationsToStorage(applications);
  return newApp;
}

// ─── 4. updateApplication ─────────────────────────────────────────────────────

export type UpdateApplicationInput = Partial<
  Omit<VendorApplication, "id" | "applicationNumber">
> & {
  id?: string;
  applicationNumber?: string;
};

/**
 * Update an existing application by ID.
 * Automatically synchronizes to localStorage and notifies subscribers.
 */
export function updateApplication(
  id: string,
  updates: UpdateApplicationInput
): VendorApplication | null {
  if (!isBrowser() || !id) {
    return null;
  }

  const applications = getApplications();
  const normalizedQuery = id.trim().toLowerCase();

  const index = applications.findIndex(
    (app) =>
      app.id.toLowerCase() === normalizedQuery ||
      app.applicationNumber.toLowerCase() === normalizedQuery
  );

  if (index === -1) {
    return null;
  }

  const existing = applications[index];
  const now = new Date().toISOString();

  // Maintain audit trail if status transitions
  let newStatusHistory = updates.statusHistory ?? existing.statusHistory ?? [];
  if (
    updates.status &&
    updates.status !== existing.status &&
    !updates.statusHistory
  ) {
    newStatusHistory = [
      ...newStatusHistory,
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        previousStatus: existing.status,
        newStatus: updates.status,
        timestamp: now,
        remark: updates.adminRemarks ?? existing.adminRemarks,
      },
    ];
  }

  const updated: VendorApplication = {
    ...existing,
    ...updates,
    id: existing.id,
    applicationNumber: existing.applicationNumber,
    business: updates.business
      ? { ...existing.business, ...updates.business }
      : existing.business,
    owner: updates.owner
      ? { ...existing.owner, ...updates.owner }
      : existing.owner,
    contact: updates.contact
      ? { ...existing.contact, ...updates.contact }
      : existing.contact,
    address: updates.address
      ? { ...existing.address, ...updates.address }
      : existing.address,
    documents: updates.documents ?? existing.documents,
    statusHistory: newStatusHistory,
    updatedAt: now,
  };

  applications[index] = updated;
  saveApplicationsToStorage(applications);
  return updated;
}

// ─── 5. deleteApplication ─────────────────────────────────────────────────────

/**
 * Remove an application by ID from the shared store.
 */
export function deleteApplication(id: string): boolean {
  if (!isBrowser() || !id) {
    return false;
  }

  const applications = getApplications();
  const normalizedQuery = id.trim().toLowerCase();

  const initialLength = applications.length;
  const filtered = applications.filter(
    (app) =>
      app.id.toLowerCase() !== normalizedQuery &&
      app.applicationNumber.toLowerCase() !== normalizedQuery
  );

  if (filtered.length === initialLength) {
    return false;
  }

  saveApplicationsToStorage(filtered);
  return true;
}

// ─── Utility: clearApplications ───────────────────────────────────────────────

export function clearApplications(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(APPLICATIONS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_APPLICATIONS_STORAGE_KEY);
    lastRaw = "__UNSET__";
    cachedSnapshot = EMPTY_STORE_APPLICATIONS;
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(APPLICATIONS_STORE_UPDATED_EVENT, { detail: [] })
      );
    }
  } catch (error) {
    console.error("Failed to clear vendor applications:", error);
  }
}

// ─── Utility: generateNextApplicationNumber ───────────────────────────────────

/**
 * Generate a unique application reference number in format BVR-YYYY-XXXXXX
 * (e.g. "BVR-2026-001249"). Increments based on the highest existing number.
 */
export function generateNextApplicationNumber(): string {
  const year = new Date().getFullYear();
  const allApps = getApplications();
  let maxSeq = 1248; // Base seed number from mock data
  for (const app of allApps) {
    const num = app.applicationNumber || app.id;
    const match = num.match(/BVR-\d{4}-(\d+)/i);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(6, "0");
  return `BVR-${year}-${nextSeq}`;
}

// ─── Explicit Deleted Applications Store ──────────────────────────────────────

let cachedDeletedSnapshot: string[] = [];
let lastDeletedRaw: string | null = "__UNSET__";

export function subscribeToDeletedStore(callback: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }
  const handleEvent = () => {
    lastDeletedRaw = "__UNSET__";
    callback();
  };
  window.addEventListener(DELETED_APPLICATIONS_UPDATED_EVENT, handleEvent);
  window.addEventListener("storage", handleEvent);
  return () => {
    window.removeEventListener(DELETED_APPLICATIONS_UPDATED_EVENT, handleEvent);
    window.removeEventListener("storage", handleEvent);
  };
}

export function getDeletedStoreSnapshot(): string[] {
  if (!isBrowser()) {
    return [];
  }
  try {
    const raw = localStorage.getItem(DELETED_APPLICATIONS_STORAGE_KEY);
    if (raw === lastDeletedRaw) {
      return cachedDeletedSnapshot;
    }
    lastDeletedRaw = raw;
    if (!raw) {
      cachedDeletedSnapshot = [];
    } else {
      const parsed = JSON.parse(raw);
      cachedDeletedSnapshot = Array.isArray(parsed)
        ? (parsed as string[])
        : [];
    }
    return cachedDeletedSnapshot;
  } catch {
    return cachedDeletedSnapshot;
  }
}

export function getDeletedStoreServerSnapshot(): string[] {
  return [];
}

/**
 * React hook to reactively subscribe to explicitly deleted application IDs.
 */
export function useDeletedApplicationIds(): string[] {
  return useSyncExternalStore(
    subscribeToDeletedStore,
    getDeletedStoreSnapshot,
    getDeletedStoreServerSnapshot
  );
}

export function getDeletedApplicationIds(): string[] {
  return getDeletedStoreSnapshot();
}

/**
 * Check if a specific application ID was explicitly marked as deleted by an Admin.
 */
export function isApplicationDeleted(id: string): boolean {
  if (!id || !isBrowser()) return false;
  const deleted = getDeletedStoreSnapshot();
  return deleted.includes(id.trim().toLowerCase());
}

/**
 * Explicitly mark an application as deleted.
 * Called ONLY when an Administrator confirms a Delete action in the UI.
 */
export function deleteAdminApplicationRecord(id: string): boolean {
  if (!id || !isBrowser()) return false;
  const normalized = id.trim().toLowerCase();
  const current = getDeletedStoreSnapshot();
  if (!current.includes(normalized)) {
    const updated = [...current, normalized];
    const serialized = JSON.stringify(updated);
    localStorage.setItem(DELETED_APPLICATIONS_STORAGE_KEY, serialized);
    lastDeletedRaw = serialized;
    cachedDeletedSnapshot = updated;

    // Also remove from active stored applications
    deleteApplication(id);

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(DELETED_APPLICATIONS_UPDATED_EVENT, { detail: updated })
      );
    }
    return true;
  }
  return false;
}

/**
 * Remove an ID from the deleted list (e.g. if a vendor re-registers or restores).
 */
export function undeleteAdminApplicationRecord(id: string): void {
  if (!id || !isBrowser()) return;
  const normalized = id.trim().toLowerCase();
  const current = getDeletedStoreSnapshot();
  if (current.includes(normalized)) {
    const updated = current.filter((item) => item !== normalized);
    const serialized = JSON.stringify(updated);
    localStorage.setItem(DELETED_APPLICATIONS_STORAGE_KEY, serialized);
    lastDeletedRaw = serialized;
    cachedDeletedSnapshot = updated;
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(DELETED_APPLICATIONS_UPDATED_EVENT, { detail: updated })
      );
    }
  }
}

/**
 * Reset all deleted application records.
 */
export function resetDeletedAdminApplications(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(DELETED_APPLICATIONS_STORAGE_KEY);
    lastDeletedRaw = null;
    cachedDeletedSnapshot = [];
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(DELETED_APPLICATIONS_UPDATED_EVENT, {
          detail: [],
        })
      );
    }
  } catch (error) {
    console.error("Failed to reset deleted applications:", error);
  }
}
