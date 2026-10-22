import fs from "fs";
import path from "path";
import { VendorApplication } from "@/lib/types/vendor-application";
import {
  dbGetVendorApplications,
  dbGetApplicationByNumber,
  dbGetAllApplications,
  dbSaveVendorApplication,
  dbAdminUpdateApplication,
  dbDeleteVendorApplication,
  dbPermanentDeleteApplication,
} from "@/lib/supabase/server";
import { isDemoOrMockApplication } from "@/lib/mock-filter";

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_FILE = path.join(DATA_DIR, "vendor-applications.json");

// In-memory runtime cache for serverless environments where local disk is read-only
let memoryApplicationsCache: VendorApplication[] | null = null;

function ensureDirectoryExists(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem in serverless environments (e.g. Vercel)
  }
}

/**
 * Reads all stored vendor applications from runtime cache or local file.
 */
export function getAllPersistentApplications(): VendorApplication[] {
  if (memoryApplicationsCache !== null) {
    return memoryApplicationsCache;
  }
  ensureDirectoryExists();
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    memoryApplicationsCache = [];
    return [];
  }
  try {
    const raw = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
    if (!raw.trim()) {
      memoryApplicationsCache = [];
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      memoryApplicationsCache = [];
      return [];
    }
    const genuine = parsed.filter((app) => !isDemoOrMockApplication(app));
    memoryApplicationsCache = genuine;
    return genuine;
  } catch (err) {
    console.warn("Failed to read vendor applications file:", err);
    memoryApplicationsCache = [];
    return [];
  }
}

/**
 * Atomically writes the applications array to runtime memory and attempts disk sync.
 * Safely handles serverless environments (Vercel) where filesystem is read-only.
 */
function saveAllPersistentApplications(applications: VendorApplication[]): void {
  memoryApplicationsCache = [...applications];
  try {
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
    } catch {
      // Ignored if disk is read-only in serverless lambda
    }
  } catch {
    // Disk write error in serverless environment handled gracefully
  }
}

/**
 * Async: Retrieves all persistent applications from Supabase database.
 * Falls back to disk cache if remote query is unavailable.
 */
export async function getAllPersistentApplicationsAsync(): Promise<VendorApplication[]> {
  try {
    const dbApps = await dbGetAllApplications();
    if (Array.isArray(dbApps)) {
      const genuineApps = dbApps.filter((a) => !isDemoOrMockApplication(a));
      saveAllPersistentApplications(genuineApps);
      return genuineApps;
    }
  } catch (err) {
    console.warn("Supabase dbGetAllApplications warning, falling back to disk cache:", err);
  }
  return getAllPersistentApplications();
}

/**
 * Async: Finds all applications owned by a Clerk user ID from Supabase database.
 * If no application is found by Clerk user ID and userEmail is provided, reconciles
 * with existing registered application matching the verified email.
 */
export async function getPersistentApplicationsByUserIdAsync(
  userId: string,
  userEmail?: string
): Promise<VendorApplication[]> {
  if (!userId) return [];
  try {
    const dbApps = await dbGetVendorApplications(userId);
    if (Array.isArray(dbApps) && dbApps.length > 0) {
      const genuineApps = dbApps.filter(
        (app) =>
          !isDemoOrMockApplication(app) &&
          (app.userId === userId || (app as unknown as { clerkUserId?: string }).clerkUserId === userId)
      );
      if (genuineApps.length > 0) {
        return genuineApps;
      }
    }
  } catch (err) {
    console.warn("Supabase dbGetVendorApplications warning, falling back to disk cache:", err);
  }

  // Safe Account Reconciliation: If no application was linked to userId alone, but userEmail was supplied,
  // locate existing legitimate application by verified email and associate with this Clerk user ID
  if (userEmail) {
    try {
      const allDb = await dbGetAllApplications();
      if (Array.isArray(allDb)) {
        const normEmail = userEmail.trim().toLowerCase();
        const matchedApp = allDb.find((a) => {
          if (isDemoOrMockApplication(a)) return false;
          const aEmail = (a.contact?.emailAddress || a.verifiedEmail || "").trim().toLowerCase();
          return aEmail === normEmail;
        });

        if (matchedApp) {
          console.log(
            `[ACCOUNT RECONCILIATION] Linking application ${matchedApp.applicationNumber || matchedApp.id} to Clerk user ${userId} for email ${userEmail}`
          );
          matchedApp.userId = userId;
          await dbSaveVendorApplication(matchedApp).catch((e) => {
            console.warn("Failed to persist reconciled Clerk user ID to Supabase:", e);
          });
          return [matchedApp];
        }
      }
    } catch (err) {
      console.warn("Email reconciliation lookup warning:", err);
    }
  }

  return getPersistentApplicationsByUserId(userId, userEmail);
}

/**
 * Async: Finds a single application by Clerk user ID from Supabase.
 */
export async function getPersistentApplicationByUserIdAsync(
  userId: string,
  userEmail?: string
): Promise<VendorApplication | null> {
  const apps = await getPersistentApplicationsByUserIdAsync(userId, userEmail);
  return apps.find((a) => !a.isDeleted) || apps[0] || null;
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
export function getPersistentApplicationByUserId(userId: string, userEmail?: string): VendorApplication | null {
  if (!userId) return null;
  const userApps = getPersistentApplicationsByUserId(userId, userEmail);
  return userApps.find((a) => !a.isDeleted) || userApps[0] || null;
}

/**
 * Sync: Finds all applications owned by a Clerk user ID from local cache.
 */
export function getPersistentApplicationsByUserId(userId: string, userEmail?: string): VendorApplication[] {
  if (!userId) return [];
  const applications = getAllPersistentApplications();
  let matched = applications.filter(
    (app) => app.userId === userId || (app as unknown as { clerkUserId?: string }).clerkUserId === userId
  );
  if (matched.length === 0 && userEmail) {
    const normEmail = userEmail.trim().toLowerCase();
    matched = applications.filter((app) => {
      if (isDemoOrMockApplication(app)) return false;
      const aEmail = (app.contact?.emailAddress || app.verifiedEmail || "").trim().toLowerCase();
      return aEmail === normEmail;
    });
    if (matched.length > 0) {
      matched.forEach((app) => {
        app.userId = userId;
      });
      saveAllPersistentApplications(applications);
    }
  }
  return matched;
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
  if (isDemoOrMockApplication(application)) {
    console.warn(
      `[DATA INTEGRITY] Blocked attempt to persist async synthetic/demo application: ${application.id || application.applicationNumber}`
    );
    return application;
  }

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
  if (isDemoOrMockApplication(application)) {
    console.warn(
      `[DATA INTEGRITY] Blocked attempt to persist synthetic/demo application: ${application.id || application.applicationNumber}`
    );
    return application;
  }

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

    // Enforce strict vendor ownership:
    // If the existing application belongs to another user, DO NOT overwrite it.
    // Generate a fresh unique application number instead to preserve both users' data.
    if (existing.userId && preparedApp.userId && existing.userId !== preparedApp.userId) {
      console.warn(
        `[SECURITY] Cross-user collision prevented for ${preparedApp.applicationNumber || preparedApp.id} (Owner: ${existing.userId}, Incoming: ${preparedApp.userId}). Assigning new reference.`
      );
      const newAppNumber = generateServerApplicationNumber();
      preparedApp.id = newAppNumber;
      preparedApp.applicationNumber = newAppNumber;
      applications.unshift(preparedApp);
      saveAllPersistentApplications(applications);

      if (!isDemoOrMockApplication(preparedApp)) {
        dbSaveVendorApplication(preparedApp).catch((err) => {
          console.warn("Background sync to Supabase failed:", err);
        });
      }
      return preparedApp;
    }

    applications[existingIndex] = {
      ...existing,
      ...preparedApp,
      id: existing.id || preparedApp.id,
      applicationNumber: existing.applicationNumber || preparedApp.applicationNumber,
      createdAt: existing.createdAt || preparedApp.createdAt,
      userId: existing.userId || preparedApp.userId,
    };
    saveAllPersistentApplications(applications);

    const isTestUser = Boolean(
      preparedApp.userId?.startsWith("user_test_") ||
      preparedApp.userId?.startsWith("user_synthetic_") ||
      (preparedApp as unknown as { clerkUserId?: string })?.clerkUserId?.startsWith("user_test_") ||
      (preparedApp as unknown as { clerkUserId?: string })?.clerkUserId?.startsWith("user_synthetic_")
    );

    // Background sync to Supabase only for genuine non-test applications
    if (!isDemoOrMockApplication(applications[existingIndex]) && !isTestUser) {
      dbSaveVendorApplication(applications[existingIndex]).catch((err) => {
        console.warn("Background sync to Supabase failed:", err);
      });
    }

    return applications[existingIndex];
  } else {
    applications.unshift(preparedApp);
    saveAllPersistentApplications(applications);

    const isTestUser = Boolean(
      preparedApp.userId?.startsWith("user_test_") ||
      preparedApp.userId?.startsWith("user_synthetic_") ||
      (preparedApp as unknown as { clerkUserId?: string })?.clerkUserId?.startsWith("user_test_") ||
      (preparedApp as unknown as { clerkUserId?: string })?.clerkUserId?.startsWith("user_synthetic_")
    );

    // Background sync to Supabase only for genuine non-test applications
    if (!isDemoOrMockApplication(preparedApp) && !isTestUser) {
      dbSaveVendorApplication(preparedApp).catch((err) => {
        console.warn("Background sync to Supabase failed:", err);
      });
    }

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

  // Background sync to Supabase only for genuine non-test applications
  const isTestUser = Boolean(
    existing.userId?.startsWith("user_test_") ||
    existing.userId?.startsWith("user_synthetic_") ||
    (existing as unknown as { clerkUserId?: string })?.clerkUserId?.startsWith("user_test_") ||
    (existing as unknown as { clerkUserId?: string })?.clerkUserId?.startsWith("user_synthetic_")
  );
  if (!isDemoOrMockApplication(existing) && !isTestUser) {
    dbAdminUpdateApplication(existing.applicationNumber || existing.id, updates).catch((err) => {
      console.warn("Background sync to Supabase failed:", err);
    });
  }

  return updated;
}

/**
 * Deletes an application from persistent storage.
/**
 * Soft-deletes / archives an application from active status while preserving
 * its original reference number, historical information, documents, and audit trails.
 */
export function deletePersistentApplication(
  idOrNumber: string,
  deletedBy = "Administrator",
  reason = "Archived by Administrator"
): boolean {
  if (!idOrNumber) return false;
  const normalized = idOrNumber.trim().toLowerCase();
  const applications = getAllPersistentApplications();

  const index = applications.findIndex(
    (app) =>
      app.id?.toLowerCase() === normalized ||
      app.applicationNumber?.toLowerCase() === normalized
  );

  if (index === -1) return false;

  const app = applications[index];
  const now = new Date().toISOString();

  const historyEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    previousStatus: app.status,
    newStatus: app.status,
    timestamp: now,
    action: "Application Deleted by Administrator",
    actionBy: deletedBy,
    remark: reason,
  };

  const updated: VendorApplication = {
    ...app,
    isDeleted: true,
    deletedAt: now,
    deletedBy,
    deletedReason: reason,
    updatedAt: now,
    statusHistory: [...(app.statusHistory || []), historyEntry],
  };

  applications[index] = updated;
  saveAllPersistentApplications(applications);

  // Background sync to Supabase only for genuine non-test applications
  const isTestUser = Boolean(
    app.userId?.startsWith("user_test_") ||
    app.userId?.startsWith("user_synthetic_") ||
    (app as unknown as { clerkUserId?: string })?.clerkUserId?.startsWith("user_test_") ||
    (app as unknown as { clerkUserId?: string })?.clerkUserId?.startsWith("user_synthetic_")
  );
  if (!isDemoOrMockApplication(app) && !isTestUser) {
    dbDeleteVendorApplication(app.applicationNumber || app.id, deletedBy, reason).catch((err) => {
      console.warn("Background sync to Supabase delete failed:", err);
    });
  }

  return true;
}

/**
 * Async: Soft-deletes / archives an application in disk cache and triggers Supabase archival.
 */
export async function deletePersistentApplicationAsync(
  idOrNumber: string,
  deletedBy = "Administrator",
  reason = "Archived by Administrator"
): Promise<boolean> {
  const localDeleted = deletePersistentApplication(idOrNumber, deletedBy, reason);
  try {
    await dbDeleteVendorApplication(idOrNumber, deletedBy, reason);
  } catch (err) {
    console.warn("Supabase dbDeleteVendorApplication failed:", err);
  }
  return localDeleted;
}

/**
 * Permanently removes an application from persistent storage (disk cache and Supabase).
 * Used when an administrator permanently deletes an archived record.
 * Only targets the specific application by ID or application number.
 * Vendor profiles and other vendor applications remain intact.
 */
export function purgePersistentApplication(idOrNumber: string): boolean {
  if (!idOrNumber) return false;
  const normalized = idOrNumber.trim().toLowerCase();
  const applications = getAllPersistentApplications();

  const index = applications.findIndex(
    (app) =>
      app.id?.toLowerCase() === normalized ||
      app.applicationNumber?.toLowerCase() === normalized
  );

  if (index === -1) return false;

  const app = applications[index];
  applications.splice(index, 1);
  saveAllPersistentApplications(applications);

  // Background sync permanent delete to Supabase
  dbPermanentDeleteApplication(app.applicationNumber || app.id).catch((err) => {
    console.warn("Background sync to Supabase permanent delete failed:", err);
  });

  return true;
}

/**
 * Async: Permanently removes an application from persistent storage and Supabase database.
 */
export async function purgePersistentApplicationAsync(idOrNumber: string): Promise<boolean> {
  const localPurged = purgePersistentApplication(idOrNumber);
  try {
    await dbPermanentDeleteApplication(idOrNumber);
  } catch (err) {
    console.warn("Supabase dbPermanentDeleteApplication failed:", err);
  }
  return localPurged;
}


/**
 * Generates the next sequential application number purely on the server.
 */
export function generateServerApplicationNumber(): string {
  const year = new Date().getFullYear();
  const allApps = getAllPersistentApplications();
  let maxSeq = 0;
  for (const app of allApps) {
    if (isDemoOrMockApplication(app)) continue;
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
