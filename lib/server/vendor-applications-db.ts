import fs from "fs";
import path from "path";
import { VendorApplication } from "@/lib/types/vendor-application";
import {
  dbGetVendorApplications,
  dbGetApplicationByNumber,
  dbGetAllApplications,
  dbSaveVendorApplication,
  dbAdminUpdateApplication,
} from "@/lib/supabase/server";

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_FILE = path.join(DATA_DIR, "vendor-applications.json");

function ensureDirectoryExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Reads all stored vendor applications from local cache.
 */
export function getAllPersistentApplications(): VendorApplication[] {
  ensureDirectoryExists();
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read vendor applications file:", err);
    return [];
  }
}

/**
 * Atomically writes the applications array to local cache on disk.
 */
function saveAllPersistentApplications(applications: VendorApplication[]): void {
  ensureDirectoryExists();
  const serialized = JSON.stringify(applications, null, 2);
  const tmpFile = `${APPLICATIONS_FILE}.tmp.${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    fs.writeFileSync(tmpFile, serialized, "utf-8");
    try {
      fs.renameSync(tmpFile, APPLICATIONS_FILE);
    } catch {
      try {
        fs.copyFileSync(tmpFile, APPLICATIONS_FILE);
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
      } catch {
        fs.writeFileSync(APPLICATIONS_FILE, serialized, "utf-8");
      }
    }
  } catch (err) {
    console.error("Failed to write applications disk cache:", err);
  }
}

/**
 * Async: Retrieves all persistent applications from Supabase database.
 * Falls back to disk cache if remote query is unavailable.
 */
export async function getAllPersistentApplicationsAsync(): Promise<VendorApplication[]> {
  try {
    const dbApps = await dbGetAllApplications();
    if (Array.isArray(dbApps) && dbApps.length > 0) {
      saveAllPersistentApplications(dbApps);
      return dbApps;
    }
  } catch (err) {
    console.warn("Supabase dbGetAllApplications warning, falling back to disk cache:", err);
  }
  return getAllPersistentApplications();
}

/**
 * Async: Finds all applications owned by a Clerk user ID from Supabase database.
 */
export async function getPersistentApplicationsByUserIdAsync(
  userId: string
): Promise<VendorApplication[]> {
  if (!userId) return [];
  try {
    const dbApps = await dbGetVendorApplications(userId);
    if (Array.isArray(dbApps) && dbApps.length > 0) {
      // Merge into local cache
      const cached = getAllPersistentApplications();
      const merged = [...cached];
      for (const app of dbApps) {
        const idx = merged.findIndex((m) => m.applicationNumber === app.applicationNumber || m.id === app.id);
        if (idx >= 0) {
          merged[idx] = app;
        } else {
          merged.unshift(app);
        }
      }
      saveAllPersistentApplications(merged);
      return dbApps;
    }
  } catch (err) {
    console.warn("Supabase dbGetVendorApplications warning, falling back to disk cache:", err);
  }
  return getPersistentApplicationsByUserId(userId);
}

/**
 * Async: Finds a single application by Clerk user ID from Supabase.
 */
export async function getPersistentApplicationByUserIdAsync(
  userId: string
): Promise<VendorApplication | null> {
  const apps = await getPersistentApplicationsByUserIdAsync(userId);
  return apps[0] || null;
}

/**
 * Async: Finds an application by Application Number or ID from Supabase database.
 */
export async function getPersistentApplicationByIdAsync(
  idOrNumber: string
): Promise<VendorApplication | null> {
  if (!idOrNumber) return null;
  try {
    const dbApp = await dbGetApplicationByNumber(idOrNumber);
    if (dbApp) {
      return dbApp;
    }
  } catch (err) {
    console.warn("Supabase dbGetApplicationByNumber warning, falling back to disk cache:", err);
  }
  return getPersistentApplicationById(idOrNumber);
}

/**
 * Sync: Finds an application by its Clerk user ID from local cache.
 */
export function getPersistentApplicationByUserId(userId: string): VendorApplication | null {
  if (!userId) return null;
  const applications = getAllPersistentApplications();
  const found = applications.find(
    (app) => app.userId === userId || (app as unknown as { clerkUserId?: string }).clerkUserId === userId
  );
  return found || null;
}

/**
 * Sync: Finds all applications owned by a Clerk user ID from local cache.
 */
export function getPersistentApplicationsByUserId(userId: string): VendorApplication[] {
  if (!userId) return [];
  const applications = getAllPersistentApplications();
  return applications.filter(
    (app) => app.userId === userId || (app as unknown as { clerkUserId?: string }).clerkUserId === userId
  );
}

/**
 * Sync: Finds an application by its Application Number or ID from local cache.
 */
export function getPersistentApplicationById(idOrNumber: string): VendorApplication | null {
  if (!idOrNumber) return null;
  const normalized = idOrNumber.trim().toLowerCase();
  const applications = getAllPersistentApplications();
  const found = applications.find(
    (app) =>
      app.id?.toLowerCase() === normalized ||
      app.applicationNumber?.toLowerCase() === normalized
  );
  return found || null;
}

/**
 * Async: Persists a new or updated application record directly to Supabase PostgreSQL database.
 */
export async function savePersistentApplicationAsync(
  application: VendorApplication
): Promise<VendorApplication> {
  // Always update local disk cache
  const localSaved = savePersistentApplication(application);

  try {
    const dbSaved = await dbSaveVendorApplication(application);
    if (dbSaved) {
      savePersistentApplication(dbSaved);
      return dbSaved;
    }
  } catch (err) {
    console.error("Supabase dbSaveVendorApplication error:", err);
  }

  return localSaved;
}

/**
 * Sync: Persists a new or updated application record to disk, and triggers Supabase sync in background.
 */
export function savePersistentApplication(application: VendorApplication): VendorApplication {
  const applications = getAllPersistentApplications();
  const now = new Date().toISOString();

  const preparedApp: VendorApplication = {
    ...application,
    updatedAt: now,
    createdAt: application.createdAt || now,
  };

  const existingIndex = applications.findIndex((app) => {
    if (preparedApp.id && (app.id === preparedApp.id || app.applicationNumber === preparedApp.id)) return true;
    if (preparedApp.applicationNumber && (app.applicationNumber === preparedApp.applicationNumber || app.id === preparedApp.applicationNumber)) return true;
    if (!preparedApp.id && !preparedApp.applicationNumber && preparedApp.userId && app.userId === preparedApp.userId) return true;
    return false;
  });

  if (existingIndex >= 0) {
    const existing = applications[existingIndex];
    applications[existingIndex] = {
      ...existing,
      ...preparedApp,
      id: existing.id || preparedApp.id,
      applicationNumber: existing.applicationNumber || preparedApp.applicationNumber,
      createdAt: existing.createdAt || preparedApp.createdAt,
      userId: preparedApp.userId || existing.userId,
    };
    saveAllPersistentApplications(applications);

    // Background sync to Supabase
    dbSaveVendorApplication(applications[existingIndex]).catch((err) => {
      console.warn("Background sync to Supabase failed:", err);
    });

    return applications[existingIndex];
  } else {
    applications.unshift(preparedApp);
    saveAllPersistentApplications(applications);

    // Background sync to Supabase
    dbSaveVendorApplication(preparedApp).catch((err) => {
      console.warn("Background sync to Supabase failed:", err);
    });

    return preparedApp;
  }
}

/**
 * Async: Updates an existing application in Supabase PostgreSQL database.
 */
export async function updatePersistentApplicationAsync(
  idOrNumber: string,
  updates: Partial<VendorApplication> & { remarks?: string; action?: string; actionBy?: string }
): Promise<VendorApplication | null> {
  // Update local disk cache
  const localUpdated = updatePersistentApplication(idOrNumber, updates);

  try {
    const dbUpdated = await dbAdminUpdateApplication(idOrNumber, updates);
    if (dbUpdated) {
      updatePersistentApplication(idOrNumber, dbUpdated);
      return dbUpdated;
    }
  } catch (err) {
    console.error("Supabase dbAdminUpdateApplication error:", err);
  }

  return localUpdated;
}

/**
 * Sync: Updates an existing application in disk cache and triggers Supabase sync in background.
 */
export function updatePersistentApplication(
  idOrNumber: string,
  updates: Partial<VendorApplication>
): VendorApplication | null {
  if (!idOrNumber) return null;
  const normalized = idOrNumber.trim().toLowerCase();
  const applications = getAllPersistentApplications();

  const index = applications.findIndex(
    (app) =>
      app.id?.toLowerCase() === normalized ||
      app.applicationNumber?.toLowerCase() === normalized
  );

  if (index === -1) return null;

  const existing = applications[index];
  const now = new Date().toISOString();

  const updated: VendorApplication = {
    ...existing,
    ...updates,
    id: existing.id,
    applicationNumber: existing.applicationNumber,
    userId: existing.userId,
    updatedAt: now,
  };

  applications[index] = updated;
  saveAllPersistentApplications(applications);

  // Background sync to Supabase
  dbAdminUpdateApplication(existing.applicationNumber || existing.id, updates).catch((err) => {
    console.warn("Background sync to Supabase failed:", err);
  });

  return updated;
}

/**
 * Deletes an application from persistent storage.
 */
export function deletePersistentApplication(idOrNumber: string): boolean {
  if (!idOrNumber) return false;
  const normalized = idOrNumber.trim().toLowerCase();
  const applications = getAllPersistentApplications();
  const initialLength = applications.length;

  const filtered = applications.filter(
    (app) =>
      app.id?.toLowerCase() !== normalized &&
      app.applicationNumber?.toLowerCase() !== normalized &&
      app.userId !== idOrNumber
  );

  if (filtered.length !== initialLength) {
    saveAllPersistentApplications(filtered);
    return true;
  }
  return false;
}

/**
 * Generates the next sequential application number purely on the server.
 */
export function generateServerApplicationNumber(): string {
  const year = new Date().getFullYear();
  const allApps = getAllPersistentApplications();
  let maxSeq = 1248;
  for (const app of allApps) {
    const num = app.applicationNumber || app.id || "";
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
