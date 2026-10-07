/**
 * Centralized Vendor Application Store
 * 
 * Shared client-side store utilizing browser localStorage so the Vendor Portal
 * and Admin Portal can read, create, update, and delete the SAME application records.
 * 
 * Browser-safe and SSR-compatible for Next.js.
 */

import { useSyncExternalStore } from "react";
import { VendorApplication } from "./types/vendor-application";

// ─── Constants ────────────────────────────────────────────────────────────────

export const APPLICATIONS_STORAGE_KEY = "butuan-vendor-applications";
export const APPLICATIONS_STORE_UPDATED_EVENT = "bvr_applications_store_updated";

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
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (raw === lastRaw) {
      return cachedSnapshot;
    }
    lastRaw = raw;
    if (!raw) {
      cachedSnapshot = EMPTY_STORE_APPLICATIONS;
    } else {
      const parsed = JSON.parse(raw);
      cachedSnapshot = Array.isArray(parsed) ? (parsed as VendorApplication[]) : EMPTY_STORE_APPLICATIONS;
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
 * Returns an empty array if nothing exists or during server-side rendering.
 */
export function getApplications(): VendorApplication[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as VendorApplication[];
  } catch (error) {
    console.error("Failed to parse vendor applications from localStorage:", error);
    return [];
  }
}

// ─── 2. getApplication ────────────────────────────────────────────────────────

/**
 * Retrieve a single application by its ID or application number.
 * Returns null if no matching application is found or during server-side rendering.
 */
export function getApplication(id: string): VendorApplication | null {
  if (!isBrowser() || !id) {
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
 * Throws an Error if an application with the same ID already exists.
 */
export function createApplication(application: VendorApplication): VendorApplication {
  if (!isBrowser()) {
    return application;
  }

  const applications = getApplications();
  const exists = applications.some(
    (app) => app.id.toLowerCase() === application.id.toLowerCase()
  );

  if (exists) {
    throw new Error(`Application with ID "${application.id}" already exists.`);
  }

  const now = new Date().toISOString();
  const newApp: VendorApplication = {
    ...application,
    submittedAt:
      application.submittedAt ?? (application.status !== "draft" ? now : null),
    updatedAt: application.updatedAt || now,
    statusHistory: application.statusHistory ?? [],
  };

  applications.push(newApp);
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
 * Updates only the provided fields while keeping `id` and `applicationNumber` unchanged.
 * Automatically updates `updatedAt` to the current timestamp.
 * Appends a statusHistory entry if the status is altered and not explicitly supplied.
 * Returns the updated record, or null if the application was not found.
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
    // Preserve immutable identity fields
    id: existing.id,
    applicationNumber: existing.applicationNumber,
    // Merge nested sub-objects when partial updates are supplied
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
    // Automatically update timestamp
    updatedAt: now,
  };

  applications[index] = updated;
  saveApplicationsToStorage(applications);
  return updated;
}

// ─── 5. deleteApplication ─────────────────────────────────────────────────────

/**
 * Remove an application by ID from the shared store.
 * Returns true if the application was found and deleted, false otherwise.
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

/**
 * Reset / clear all saved applications in the store.
 */
export function clearApplications(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(APPLICATIONS_STORAGE_KEY);
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

// ─── Deleted Admin Applications Store ─────────────────────────────────────────

export const DELETED_APPLICATIONS_STORAGE_KEY = "bvr_deleted_applications";
export const DELETED_APPLICATIONS_UPDATED_EVENT = "bvr_deleted_applications_updated";

const EMPTY_DELETED_APPLICATIONS: string[] = [];
let cachedDeletedSnapshot: string[] = EMPTY_DELETED_APPLICATIONS;
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

/**
 * Returns a stable snapshot of deleted application IDs.
 * The exact same array reference is returned unless the underlying stored data has changed.
 */
export function getDeletedStoreSnapshot(): string[] {
  if (!isBrowser()) {
    return EMPTY_DELETED_APPLICATIONS;
  }
  try {
    const raw = localStorage.getItem(DELETED_APPLICATIONS_STORAGE_KEY);
    if (raw === lastDeletedRaw) {
      return cachedDeletedSnapshot;
    }
    lastDeletedRaw = raw;
    if (!raw) {
      cachedDeletedSnapshot = EMPTY_DELETED_APPLICATIONS;
    } else {
      const parsed = JSON.parse(raw);
      cachedDeletedSnapshot = Array.isArray(parsed)
        ? (parsed as string[])
        : EMPTY_DELETED_APPLICATIONS;
    }
    return cachedDeletedSnapshot;
  } catch {
    return cachedDeletedSnapshot;
  }
}

/**
 * Stable server snapshot for SSR compatibility.
 */
export function getDeletedStoreServerSnapshot(): string[] {
  return EMPTY_DELETED_APPLICATIONS;
}

/**
 * React hook to reactively subscribe to deleted application IDs.
 * Strictly adheres to useSyncExternalStore contract with stable snapshot references.
 */
export function useDeletedApplicationIds(): string[] {
  return useSyncExternalStore(
    subscribeToDeletedStore,
    getDeletedStoreSnapshot,
    getDeletedStoreServerSnapshot
  );
}

/**
 * Retrieve all deleted application IDs from the store.
 * Returns the stable cached snapshot reference.
 */
export function getDeletedApplicationIds(): string[] {
  return getDeletedStoreSnapshot();
}

/**
 * Check if a specific application ID is marked as deleted.
 */
export function isApplicationDeleted(id: string): boolean {
  if (!id || !isBrowser()) return false;
  const deleted = getDeletedStoreSnapshot();
  return deleted.includes(id.trim().toLowerCase());
}

/**
 * Mark an application as deleted in the store.
 * Updates snapshot once and notifies subscribers.
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

    // Also remove from stored applications if it exists there
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
 * Reset all deleted applications (restores deleted seed/mock applications).
 * Updates snapshot once and notifies subscribers.
 */
export function resetDeletedAdminApplications(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(DELETED_APPLICATIONS_STORAGE_KEY);
    lastDeletedRaw = null;
    cachedDeletedSnapshot = EMPTY_DELETED_APPLICATIONS;
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(DELETED_APPLICATIONS_UPDATED_EVENT, {
          detail: EMPTY_DELETED_APPLICATIONS,
        })
      );
    }
  } catch (error) {
    console.error("Failed to reset deleted applications:", error);
  }
}

