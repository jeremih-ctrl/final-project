-- ============================================================================
-- Butuan Vendors Registration System: Database Schema Migration
-- Migration: 20261013000001_create_butuan_vendors_schema.sql
-- Description: Core tables, indexes, RLS, triggers, and storage bucket
-- ============================================================================

-- Enable pgcrypto / uuid-ossp for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Profiles Table (Clerk Identity Mapping)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile_number TEXT,
    role TEXT NOT NULL CHECK (role IN ('vendor', 'admin')) DEFAULT 'vendor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON public.profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ----------------------------------------------------------------------------
-- 2. Vendor Applications Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    vendor_id TEXT,
    clerk_user_id TEXT NOT NULL REFERENCES public.profiles(clerk_user_id) ON DELETE CASCADE,
    verified_email TEXT NOT NULL,
    
    -- Owner Information
    owner_name TEXT NOT NULL,
    owner_first_name TEXT,
    owner_last_name TEXT,
    owner_middle_name TEXT,
    
    -- Business Information
    business_name TEXT NOT NULL,
    business_description TEXT,
    business_category TEXT,
    
    -- Contact & Address
    contact_number TEXT NOT NULL,
    email_address TEXT NOT NULL,
    house_no TEXT,
    street TEXT,
    barangay TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Butuan City',
    province TEXT NOT NULL DEFAULT 'Agusan del Norte',
    region TEXT NOT NULL DEFAULT 'Caraga',
    country TEXT NOT NULL DEFAULT 'Philippines',
    
    -- Status & Lifecycle
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'needs_correction', 'correction_submitted', 'approved', 'rejected')) DEFAULT 'submitted',
    verification_status TEXT CHECK (verification_status IN ('Verified', 'Pending', 'Not Verified')) DEFAULT 'Pending',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    current_stage INTEGER NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 4),
    
    -- Administrative Remarks
    admin_remarks TEXT DEFAULT '',
    
    -- Timestamps
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vendor_applications_app_number ON public.vendor_applications(application_number);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_clerk_user_id ON public.vendor_applications(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON public.vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_vendor_id ON public.vendor_applications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_barangay ON public.vendor_applications(barangay);

-- ----------------------------------------------------------------------------
-- 3. Application Documents Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.vendor_applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    id_number TEXT,
    file_name TEXT NOT NULL,
    storage_path TEXT,
    mime_type TEXT,
    file_size_bytes BIGINT,
    file_size_formatted TEXT,
    status TEXT NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'Verified', 'Accepted', 'Needs Replacement', 'Replacement Requested')) DEFAULT 'Submitted',
    is_skipped_id BOOLEAN NOT NULL DEFAULT false,
    reviewed_by TEXT,
    review_notes TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_app_documents_app_id ON public.application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_app_documents_status ON public.application_documents(status);

-- ----------------------------------------------------------------------------
-- 4. Application Payments Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.vendor_applications(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    payment_method_category TEXT DEFAULT 'e_wallet',
    assessed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'PHP',
    transaction_reference TEXT,
    fee_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    assessment_status TEXT DEFAULT 'assessed',
    assessment_notes TEXT,
    gateway_provider TEXT,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'awaiting_payment', 'awaiting_cashier_payment', 'pending_verification', 'pending', 'verified', 'paid', 'rejected', 'failed', 'cancelled', 'refunded')) DEFAULT 'unpaid',
    receipt_number TEXT,
    receipt_storage_path TEXT,
    receipt_url TEXT,
    receipt_filename TEXT,
    receipt_file_type TEXT,
    receipt_file_size BIGINT,
    receipt_uploaded_at TIMESTAMPTZ,
    payment_date TIMESTAMPTZ,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_app_payments_app_id ON public.application_payments(application_id);
CREATE INDEX IF NOT EXISTS idx_app_payments_payment_status ON public.application_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_app_payments_receipt_number ON public.application_payments(receipt_number);

-- ----------------------------------------------------------------------------
-- 5. Application Status History Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.vendor_applications(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    action TEXT,
    action_by TEXT,
    remark TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_status_history_app_id ON public.application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON public.application_status_history(created_at);

-- ----------------------------------------------------------------------------
-- 6. Vendor Certificates Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL UNIQUE REFERENCES public.vendor_applications(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL,
    vendor_id TEXT NOT NULL,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    barangay TEXT NOT NULL,
    business_category TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ,
    storage_path TEXT,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Suspended', 'Revoked', 'Expired')) DEFAULT 'Active',
    issued_by TEXT NOT NULL DEFAULT 'City Business Permits and Licensing Department (CBPLD)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_certificates_cert_number ON public.vendor_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_vendor_id ON public.vendor_certificates(vendor_id);
CREATE INDEX IF NOT EXISTS idx_certificates_app_id ON public.vendor_certificates(application_id);

-- ----------------------------------------------------------------------------
-- 7. Notifications Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id TEXT NOT NULL,
    application_id UUID REFERENCES public.vendor_applications(id) ON DELETE SET NULL,
    application_number TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    full_message TEXT,
    type TEXT NOT NULL DEFAULT 'system',
    category TEXT NOT NULL DEFAULT 'application',
    priority TEXT NOT NULL CHECK (priority IN ('normal', 'high')) DEFAULT 'normal',
    action_label TEXT,
    action_url TEXT,
    href TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ----------------------------------------------------------------------------
-- 8. Administrative Audit Logs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id TEXT NOT NULL,
    actor_name TEXT,
    actor_role TEXT,
    application_id UUID REFERENCES public.vendor_applications(id) ON DELETE SET NULL,
    application_number TEXT,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_app_id ON public.audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. Trigger Function for updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_vendor_applications_updated_at ON public.vendor_applications;
CREATE TRIGGER trg_vendor_applications_updated_at
    BEFORE UPDATE ON public.vendor_applications
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_application_payments_updated_at ON public.application_payments;
CREATE TRIGGER trg_application_payments_updated_at
    BEFORE UPDATE ON public.application_payments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_vendor_certificates_updated_at ON public.vendor_certificates;
CREATE TRIGGER trg_vendor_certificates_updated_at
    BEFORE UPDATE ON public.vendor_certificates
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 10. Private Storage Bucket for Vendor Documents & Official Receipts
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vendor-documents',
    'vendor-documents',
    false,
    10485760, -- 10MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];

-- ----------------------------------------------------------------------------
-- 11. Row Level Security (RLS) Configuration
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
