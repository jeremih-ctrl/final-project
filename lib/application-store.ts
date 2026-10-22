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

// ─── Initial Seed Applications & Demo Sanitization ────────────────────────────
import {
  MOCK_APPLICATION_IDS,
  MOCK_BUSINESS_NAMES,
  isDemoOrMockApplication,
} from "./mock-filter";

export {
  MOCK_APPLICATION_IDS,
  MOCK_BUSINESS_NAMES,
  isDemoOrMockApplication,
};

/**
 * Returns empty array so the applications store starts empty and only genuine
 * registrations appear.
 */
export function getInitialSeedApplications(): VendorApplication[] {
  return [];
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
      cachedSnapshot = EMPTY_STORE_APPLICATIONS;
      return cachedSnapshot;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const genuine = parsed.filter((app) => !isDemoOrMockApplication(app));
      if (genuine.length !== parsed.length) {
        // Silently update storage without re-triggering store events during snapshot calculation
        try {
          const serialized = JSON.stringify(genuine);
          localStorage.setItem(APPLICATIONS_STORAGE_KEY, serialized);
          localStorage.setItem(LEGACY_APPLICATIONS_STORAGE_KEY, serialized);
          lastRaw = serialized;
        } catch {
          // ignore storage errors
        }
      }
      cachedSnapshot = genuine;
    } else {
      cachedSnapshot = EMPTY_STORE_APPLICATIONS;
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
 * Returns empty array if nothing is stored yet.
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
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const genuine = parsed.filter((app) => !isDemoOrMockApplication(app));
    if (genuine.length !== parsed.length) {
      saveApplicationsToStorage(genuine);
    }

    return genuine;
  } catch (error) {
    console.error("Failed to parse vendor applications from localStorage:", error);
    return [];
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

  if (!found || isDemoOrMockApplication(found)) {
    return null;
  }

  return found;
}

// ─── 3. createApplication ─────────────────────────────────────────────────────

/**
 * Add a new application to the shared store.
 * Guaranteed never to duplicate or throw an unhandled error.
 */
export function createApplication(application: VendorApplication): VendorApplication {
  if (isDemoOrMockApplication(application)) {
    return application;
  }

  if (!isBrowser()) {
    return application;
  }

  const applications = getApplications();
  const normalizedId = application.id.toLowerCase();
  const existingIndex = applications.findIndex(
    (app) => app.id.toLowerCase() === normalizedId
  );

  const existing = existingIndex >= 0 ? applications[existingIndex] : null;
  const isDeletedAlready =
    Boolean(application.isDeleted) ||
    Boolean(existing?.isDeleted) ||
    isApplicationDeleted(application.id) ||
    isApplicationDeleted(application.applicationNumber);

  const now = new Date().toISOString();
  const newApp: VendorApplication = {
    ...application,
    isDeleted: isDeletedAlready,
    deletedAt: isDeletedAlready ? (application.deletedAt || existing?.deletedAt || now) : null,
    deletedBy: isDeletedAlready ? (application.deletedBy || existing?.deletedBy || "Administrator") : "",
    deletedReason: isDeletedAlready ? (application.deletedReason || existing?.deletedReason || "") : "",
    status: application.status || "submitted",
    verificationStatus: application.verificationStatus || "Pending",
    isVerified: Boolean(application.isVerified),
    currentStage: application.currentStage ?? 1,
    submittedAt: application.submittedAt || now,
    updatedAt: application.updatedAt || now,
    payment: application.payment || {
      status: "unpaid",
      assessedAmount: 0,
      amountPaid: 0,
      currency: "PHP",
      feeBreakdown: [],
      assessmentStatus: "assessment_required",
    },
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

  if (existingIndex >= 0) {
    applications[existingIndex] = newApp;
  } else {
    // Put newly registered application at the beginning so it appears on top
    applications.unshift(newApp);
  }

  saveApplicationsToStorage(applications);
  return newApp;
}

/**
 * Atomically synchronizes applications retrieved from the authoritative server API
 * into the client application store. Replaces and merges genuine remote applications
 * without causing multiple rapid re-renders or event storming.
 */
export function setApplicationsFromRemote(
  serverApplications: VendorApplication[]
): VendorApplication[] {
  if (!Array.isArray(serverApplications)) return [];
  const genuine = serverApplications.filter((app) => !isDemoOrMockApplication(app));

  if (!isBrowser()) {
    return genuine;
  }

  // Preserve deleted status flags if tracked in deletedStore
  const deletedIds = getDeletedStoreSnapshot();
  const reconciled = genuine.map((app) => {
    const isDeletedAlready =
      Boolean(app.isDeleted) ||
      deletedIds.includes((app.id || "").trim().toLowerCase()) ||
      deletedIds.includes((app.applicationNumber || "").trim().toLowerCase());

    return {
      ...app,
      isDeleted: isDeletedAlready,
    };
  });

  saveApplicationsToStorage(reconciled);
  return reconciled;
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
  if (isDemoOrMockApplication(existing)) {
    return null;
  }

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

  // Synchronize update to server persistent database
  if (typeof window !== "undefined" && typeof fetch === "function") {
    fetch(`/api/admin/applications/${encodeURIComponent(existing.applicationNumber || existing.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {});
  }

  return updated;
}

// ─── 5. deleteApplication ─────────────────────────────────────────────────────

/**
 * Soft-delete / archive an application by ID in the shared store.
 * Preserves the application record, historical documents, payments, and marks it as isDeleted: true.
 */
export function deleteApplication(id: string, reason = "Archived by Administrator"): boolean {
  if (!isBrowser() || !id) {
    return false;
  }

  const applications = getApplications();
  const normalizedQuery = id.trim().toLowerCase();

  const index = applications.findIndex(
    (app) =>
      app.id.toLowerCase() === normalizedQuery ||
      app.applicationNumber.toLowerCase() === normalizedQuery
  );

  if (index === -1) {
    return false;
  }

  const existing = applications[index];
  const now = new Date().toISOString();

  const updated: VendorApplication = {
    ...existing,
    isDeleted: true,
    deletedAt: now,
    deletedBy: "Administrator",
    deletedReason: reason,
    updatedAt: now,
    statusHistory: [
      ...(existing.statusHistory || []),
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        previousStatus: existing.status,
        newStatus: existing.status,
        timestamp: now,
        action: "Application Deleted by Administrator",
        actionBy: "Administrator",
        remark: reason,
      },
    ],
  };

  applications[index] = updated;
  saveApplicationsToStorage(applications);

  // Synchronize soft deletion to server persistent database
  if (typeof window !== "undefined" && typeof fetch === "function") {
    fetch(`/api/admin/applications/${encodeURIComponent(existing.applicationNumber || existing.id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }).catch(() => {});
  }

  return true;
}

// ─── 5.1 permanentlyDeleteApplication ──────────────────────────────────────────

/**
 * Permanently removes an application record from the client-side store and deleted set.
 * Used when an administrator confirms permanent deletion of an archived/rejected record.
 * Only targets the specific application by ID or application number.
 */
export function permanentlyDeleteApplication(id: string): boolean {
  if (!id || !isBrowser()) {
    return false;
  }

  const normalizedQuery = id.trim().toLowerCase();
  const applications = getApplications();

  const index = applications.findIndex(
    (app) =>
      app.id?.toLowerCase() === normalizedQuery ||
      app.applicationNumber?.toLowerCase() === normalizedQuery
  );

  let targetAppNumber = "";
  let targetId = "";

  if (index !== -1) {
    targetAppNumber = (applications[index].applicationNumber || "").toLowerCase();
    targetId = (applications[index].id || "").toLowerCase();
    applications.splice(index, 1);
    saveApplicationsToStorage(applications);
  }

  // Remove from deleted applications list
  const currentDeleted = getDeletedStoreSnapshot();
  const filteredDeleted = currentDeleted.filter(
    (item) =>
      item !== normalizedQuery &&
      (!targetAppNumber || item !== targetAppNumber) &&
      (!targetId || item !== targetId)
  );

  if (filteredDeleted.length !== currentDeleted.length) {
    const serialized = JSON.stringify(filteredDeleted);
    localStorage.setItem(DELETED_APPLICATIONS_STORAGE_KEY, serialized);
    lastDeletedRaw = serialized;
    cachedDeletedSnapshot = filteredDeleted;
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(DELETED_APPLICATIONS_UPDATED_EVENT, { detail: filteredDeleted })
      );
    }
  }

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
  let maxSeq = 0;
  for (const app of allApps) {
    if (isDemoOrMockApplication(app)) continue;
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

const EMPTY_DELETED_SNAPSHOT: string[] = [];
let cachedDeletedSnapshot: string[] = EMPTY_DELETED_SNAPSHOT;
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
    return EMPTY_DELETED_SNAPSHOT;
  }
  try {
    const raw = localStorage.getItem(DELETED_APPLICATIONS_STORAGE_KEY);
    if (raw === lastDeletedRaw) {
      return cachedDeletedSnapshot;
    }
    lastDeletedRaw = raw;
    if (!raw) {
      cachedDeletedSnapshot = EMPTY_DELETED_SNAPSHOT;
      return cachedDeletedSnapshot;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (
        cachedDeletedSnapshot.length === parsed.length &&
        cachedDeletedSnapshot.every((val, idx) => val === parsed[idx])
      ) {
        return cachedDeletedSnapshot;
      }
      cachedDeletedSnapshot = parsed as string[];
    } else {
      cachedDeletedSnapshot = EMPTY_DELETED_SNAPSHOT;
    }
    return cachedDeletedSnapshot;
  } catch {
    return cachedDeletedSnapshot;
  }
}

export function getDeletedStoreServerSnapshot(): string[] {
  return EMPTY_DELETED_SNAPSHOT;
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
  const normalized = id.trim().toLowerCase();
  const deleted = getDeletedStoreSnapshot();
  if (deleted.includes(normalized)) return true;
  const app = getApplication(id);
  return Boolean(app?.isDeleted);
}

/**
 * Explicitly mark an application as deleted / archived.
 * Called ONLY when an Administrator confirms a Delete action in the UI.
 */
export function deleteAdminApplicationRecord(id: string, reason = "Archived by Administrator"): boolean {
  if (!id || !isBrowser()) return false;
  const normalized = id.trim().toLowerCase();
  const current = getDeletedStoreSnapshot();
  if (!current.includes(normalized)) {
    const updated = [...current, normalized];
    const serialized = JSON.stringify(updated);
    localStorage.setItem(DELETED_APPLICATIONS_STORAGE_KEY, serialized);
    lastDeletedRaw = serialized;
    cachedDeletedSnapshot = updated;

    // Mark as deleted in stored applications while preserving the historical record
    deleteApplication(id, reason);

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(DELETED_APPLICATIONS_UPDATED_EVENT, { detail: updated })
      );
    }
    return true;
  }

  deleteApplication(id, reason);
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
    cachedDeletedSnapshot = EMPTY_DELETED_SNAPSHOT;
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(DELETED_APPLICATIONS_UPDATED_EVENT, {
          detail: EMPTY_DELETED_SNAPSHOT,
        })
      );
    }
  } catch (error) {
    console.error("Failed to reset deleted applications:", error);
  }
}
