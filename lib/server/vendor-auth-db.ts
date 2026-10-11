import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface StoredVendorAccount {
  email: string;
  name: string;
  salt: string;
  hash: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "vendor-accounts.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllAccounts(): StoredVendorAccount[] {
  ensureDirectoryExists();
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, "utf-8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read vendor accounts file:", err);
    return [];
  }
}

function saveAccounts(accounts: StoredVendorAccount[]): void {
  ensureDirectoryExists();
  const tmpFile = `${ACCOUNTS_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(accounts, null, 2), "utf-8");
  fs.renameSync(tmpFile, ACCOUNTS_FILE);
}

export function validatePasswordRequirements(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number." };
  }
  return { valid: true };
}

export function registerVendorAccount(
  email: string,
  password: string,
  name?: string
): { success: boolean; error?: string; account?: { email: string; name: string } } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: "A valid email address is required." };
  }

  const passCheck = validatePasswordRequirements(password);
  if (!passCheck.valid) {
    return { success: false, error: passCheck.error };
  }

  const accounts = getAllAccounts();
  const existing = accounts.find((acc) => acc.email.toLowerCase() === normalizedEmail);

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  const resolvedName = name?.trim() || "Registered Vendor";
  const now = new Date().toISOString();

  if (existing) {
    // If account was previously registered, update credentials securely
    existing.salt = salt;
    existing.hash = hash;
    existing.name = resolvedName;
    existing.createdAt = now;
  } else {
    accounts.push({
      email: normalizedEmail,
      name: resolvedName,
      salt,
      hash,
      createdAt: now,
    });
  }

  saveAccounts(accounts);

  return {
    success: true,
    account: {
      email: normalizedEmail,
      name: resolvedName,
    },
  };
}

export function verifyVendorCredentials(
  email: string,
  password: string
): { success: boolean; user?: { email: string; name: string; role: string }; error?: string } {
  const genericError = "Invalid email or password. Please check your credentials and try again.";

  if (!email || !password) {
    return { success: false, error: genericError };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getAllAccounts();
  const account = accounts.find((acc) => acc.email.toLowerCase() === normalizedEmail);

  if (!account || !account.salt || !account.hash) {
    return { success: false, error: genericError };
  }

  try {
    const derivedKey = crypto.scryptSync(password, account.salt, 64);
    const storedKey = Buffer.from(account.hash, "hex");

    if (derivedKey.length !== storedKey.length) {
      return { success: false, error: genericError };
    }

    const matches = crypto.timingSafeEqual(derivedKey, storedKey);
    if (!matches) {
      return { success: false, error: genericError };
    }

    return {
      success: true,
      user: {
        email: account.email,
        name: account.name || "Registered Vendor",
        role: "Local Vendor",
      },
    };
  } catch (err) {
    console.error("Error verifying credentials:", err);
    return { success: false, error: genericError };
  }
}
