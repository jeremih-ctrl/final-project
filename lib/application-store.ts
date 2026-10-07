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

let cachedSnapshot: VendorApplication[] = [];
let lastRaw: string | null = null;

function subscribeToStore(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleEvent = () => {
    lastRaw = null;
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
    return [];
  }
  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (lastRaw !== null && raw === lastRaw && cachedSnapshot !== null) {
      return cachedSnapshot;
    }
    lastRaw = raw;
    cachedSnapshot = getApplications();
    return cachedSnapshot;
  } catch {
    return [];
  }
}

function getStoreServerSnapshot(): VendorApplication[] {
  return [];
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
    lastRaw = null;
    cachedSnapshot = [];
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
