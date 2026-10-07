"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

export interface DemoVendorSession {
  email: string;
  name: string;
  role: string;
  token: string;
  createdAt: number;
}

export interface DemoAdminSession {
  email: string;
  name: string;
  title: string;
  role: "admin";
  token: string;
  createdAt: number;
}

export const VENDOR_SESSION_KEY = "demo_vendor_session";
export const ADMIN_SESSION_KEY = "demo_admin_session";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// In-memory cached snapshots for referential stability in useSyncExternalStore
let cachedVendorRaw: string | null = null;
let cachedVendorSession: DemoVendorSession | null = null;

let cachedAdminRaw: string | null = null;
let cachedAdminSession: DemoAdminSession | null = null;

// ─── Vendor Session Helpers ──────────────────────────────────────────────────

export function getVendorSession(): DemoVendorSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(VENDOR_SESSION_KEY);
    if (raw === cachedVendorRaw) {
      return cachedVendorSession;
    }
    cachedVendorRaw = raw;
    if (!raw) {
      cachedVendorSession = null;
      return null;
    }
    const parsed = JSON.parse(raw) as DemoVendorSession;
    cachedVendorSession = parsed && parsed.email ? parsed : null;
    return cachedVendorSession;
  } catch {
    cachedVendorSession = null;
    return null;
  }
}

export function setVendorSession(payload: {
  email: string;
  name?: string;
  role?: string;
}): DemoVendorSession {
  const session: DemoVendorSession = {
    email: payload.email,
    name: payload.name || "Juan Dela Cruz",
    role: payload.role || "Local Vendor",
    token: `demo-vendor-${Date.now()}`,
    createdAt: Date.now(),
  };

  if (isBrowser()) {
    try {
      const serialized = JSON.stringify(session);
      cachedVendorRaw = serialized;
      cachedVendorSession = session;
      localStorage.setItem(VENDOR_SESSION_KEY, serialized);
      window.dispatchEvent(new CustomEvent("demo-vendor-auth-change", { detail: session }));
    } catch (e) {
      console.error("Failed to save vendor session to localStorage:", e);
    }
  }

  return session;
}

export function clearVendorSession(): void {
  cachedVendorRaw = null;
  cachedVendorSession = null;
  if (isBrowser()) {
    try {
      localStorage.removeItem(VENDOR_SESSION_KEY);
      sessionStorage.removeItem(VENDOR_SESSION_KEY);
      window.dispatchEvent(new CustomEvent("demo-vendor-auth-change", { detail: null }));
    } catch (e) {
      console.error("Failed to clear vendor session:", e);
    }
  }
}

// ─── Admin Session Helpers ───────────────────────────────────────────────────

export function getAdminSession(): DemoAdminSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (raw === cachedAdminRaw) {
      return cachedAdminSession;
    }
    cachedAdminRaw = raw;
    if (!raw) {
      cachedAdminSession = null;
      return null;
    }
    const parsed = JSON.parse(raw) as DemoAdminSession;
    cachedAdminSession = parsed && parsed.email && parsed.role === "admin" ? parsed : null;
    return cachedAdminSession;
  } catch {
    cachedAdminSession = null;
    return null;
  }
}

export function setAdminSession(payload: {
  email: string;
  name?: string;
  title?: string;
  role?: "admin";
}): DemoAdminSession {
  const session: DemoAdminSession = {
    email: payload.email,
    name: payload.name || "Administrator",
    title: payload.title || "City Licensing",
    role: "admin",
    token: `demo-admin-${Date.now()}`,
    createdAt: Date.now(),
  };

  if (isBrowser()) {
    try {
      const serialized = JSON.stringify(session);
      cachedAdminRaw = serialized;
      cachedAdminSession = session;
      localStorage.setItem(ADMIN_SESSION_KEY, serialized);
      window.dispatchEvent(new CustomEvent("demo-admin-auth-change", { detail: session }));
    } catch (e) {
      console.error("Failed to save admin session to localStorage:", e);
    }
  }

  return session;
}

export function clearAdminSession(): void {
  cachedAdminRaw = null;
  cachedAdminSession = null;
  if (isBrowser()) {
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      window.dispatchEvent(new CustomEvent("demo-admin-auth-change", { detail: null }));
    } catch (e) {
      console.error("Failed to clear admin session:", e);
    }
  }
}

// ─── Subscriptions & Hydration Helpers ───────────────────────────────────────

function subscribeClientState() {
  return () => {};
}

function subscribeVendorAuth(callback: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => {
    // Invalidate cache on external change
    cachedVendorRaw = undefined as unknown as string;
    callback();
  };
  window.addEventListener("demo-vendor-auth-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("demo-vendor-auth-change", handler);
    window.removeEventListener("storage", handler);
  };
}

function subscribeAdminAuth(callback: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => {
    cachedAdminRaw = undefined as unknown as string;
    callback();
  };
  window.addEventListener("demo-admin-auth-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("demo-admin-auth-change", handler);
    window.removeEventListener("storage", handler);
  };
}

// ─── React Hooks ─────────────────────────────────────────────────────────────

export function useVendorAuth() {
  const router = useRouter();

  const isServer = useSyncExternalStore(
    subscribeClientState,
    () => false,
    () => true
  );

  const session = useSyncExternalStore(
    subscribeVendorAuth,
    getVendorSession,
    () => null
  );

  const logout = useCallback(() => {
    clearVendorSession();
    router.replace("/login");
  }, [router]);

  const isLoading = isServer;

  return { session, isLoading, logout, isAuthenticated: Boolean(session) };
}

export function useAdminAuth() {
  const router = useRouter();

  const isServer = useSyncExternalStore(
    subscribeClientState,
    () => false,
    () => true
  );

  const session = useSyncExternalStore(
    subscribeAdminAuth,
    getAdminSession,
    () => null
  );

  const logout = useCallback(() => {
    clearAdminSession();
    router.replace("/admin/login");
  }, [router]);

  const isLoading = isServer;

  return { session, isLoading, logout, isAuthenticated: Boolean(session) };
}
