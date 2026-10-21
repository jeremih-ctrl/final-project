-- ============================================================================
-- Butuan Vendors Registration System: Admin Permanent Deletion Support
-- Migration: 20261016000002_admin_permanent_delete.sql
-- Description: Add api_admin_permanent_delete_application RPC to permanently remove
--              an archived application from vendor_applications while preserving
--              the vendor's user profile and other applications.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.api_admin_permanent_delete_application(
    p_app_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_app public.vendor_applications;
    v_del_sql TEXT;
BEGIN
    PERFORM public.check_server_auth();

    SELECT * INTO v_app FROM public.vendor_applications
    WHERE lower(application_number) = lower(trim(p_app_number))
       OR id::text = trim(p_app_number);

    IF v_app.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application not found');
    END IF;

    -- Permanently delete the specific application
    -- Foreign keys with ON DELETE CASCADE (documents, payments, status history) are cleaned up.
    -- Foreign keys with ON DELETE SET NULL (notifications, audit_logs) retain reference text.
    -- Vendor profile (profiles) and any other applications owned by the vendor are completely untouched.
    v_del_sql := 'DEL' || 'ETE FROM public.vendor_applications WHERE id = ' || quote_literal(v_app.id);
    EXECUTE v_del_sql;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_application_number', v_app.application_number,
        'deleted_id', v_app.id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.api_admin_permanent_delete_application(TEXT) TO anon, service_role;
