-- ============================================================================
-- Butuan Vendors Registration System: Database RPC Functions
-- Migration: 20261013000002_create_api_functions.sql
-- Description: Server-authenticated RPC procedures for Next.js backend integration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Server Authentication Guard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_server_auth()
RETURNS BOOLEAN AS $$
DECLARE
    headers JSONB;
    auth_header TEXT;
    configured_secret TEXT := 'bvr_prod_sec_99a81e3f8472901a88b5024e0b3c6628';
BEGIN
    BEGIN
        headers := current_setting('request.headers', true)::jsonb;
    EXCEPTION WHEN OTHERS THEN
        headers := '{}'::jsonb;
    END;
    auth_header := headers->>'x-server-auth';
    IF auth_header IS NULL OR auth_header <> configured_secret THEN
        RAISE EXCEPTION 'Unauthorized: Invalid or missing server authorization credential';
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. Profile Sync & Retrieval
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_sync_profile(
    p_clerk_user_id TEXT,
    p_full_name TEXT,
    p_email TEXT,
    p_mobile TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'vendor'
)
RETURNS JSONB AS $$
DECLARE
    rec public.profiles;
    target_role TEXT := 'vendor';
BEGIN
    PERFORM public.check_server_auth();

    -- Determine safe role: existing admins cannot be downgraded; only server can set role
    SELECT * INTO rec FROM public.profiles WHERE clerk_user_id = p_clerk_user_id;
    IF rec.id IS NOT NULL AND rec.role = 'admin' THEN
        target_role := 'admin';
    ELSIF p_role = 'admin' THEN
        target_role := 'admin';
    ELSE
        target_role := 'vendor';
    END IF;

    INSERT INTO public.profiles (
        clerk_user_id,
        full_name,
        email,
        mobile_number,
        role,
        updated_at
    ) VALUES (
        p_clerk_user_id,
        p_full_name,
        p_email,
        p_mobile,
        target_role,
        timezone('utc'::text, now())
    )
    ON CONFLICT (clerk_user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        mobile_number = coalesce(EXCLUDED.mobile_number, public.profiles.mobile_number),
        role = CASE WHEN public.profiles.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END,
        updated_at = timezone('utc'::text, now())
    RETURNING * INTO rec;

    RETURN to_jsonb(rec);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.api_get_profile(p_clerk_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
    rec public.profiles;
BEGIN
    PERFORM public.check_server_auth();
    SELECT * INTO rec FROM public.profiles WHERE clerk_user_id = p_clerk_user_id;
    IF rec.id IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN to_jsonb(rec);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. Vendor Applications Retrieval
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_get_vendor_applications(p_clerk_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
    res JSONB;
BEGIN
    PERFORM public.check_server_auth();

    SELECT coalesce(jsonb_agg(public.format_application_json(va.*) ORDER BY va.created_at DESC), '[]'::jsonb)
    INTO res
    FROM public.vendor_applications va
    WHERE va.clerk_user_id = p_clerk_user_id;

    RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.api_get_application_by_number(p_app_number TEXT)
RETURNS JSONB AS $$
DECLARE
    va public.vendor_applications;
BEGIN
    PERFORM public.check_server_auth();

    SELECT * INTO va
    FROM public.vendor_applications
    WHERE lower(application_number) = lower(trim(p_app_number))
       OR id::text = trim(p_app_number)
    LIMIT 1;

    IF va.id IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN public.format_application_json(va);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.api_admin_get_all_applications()
RETURNS JSONB AS $$
DECLARE
    res JSONB;
BEGIN
    PERFORM public.check_server_auth();

    SELECT coalesce(jsonb_agg(public.format_application_json(va.*) ORDER BY va.created_at DESC), '[]'::jsonb)
    INTO res
    FROM public.vendor_applications va;

    RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 4. Vendor Application Upsert (Submission & Update)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_save_vendor_application(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_app_num TEXT;
    v_user_id TEXT;
    v_email TEXT;
    v_owner_name TEXT;
    v_biz_name TEXT;
    v_app_id UUID;
    v_existing public.vendor_applications;
    v_updated public.vendor_applications;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_doc JSONB;
    v_doc_type TEXT;
    v_doc_num TEXT;
    v_doc_file TEXT;
    v_doc_status TEXT;
    v_doc_size TEXT;
    v_fee_item JSONB;
BEGIN
    PERFORM public.check_server_auth();

    v_user_id := p_payload->>'userId';
    IF v_user_id IS NULL OR trim(v_user_id) = '' THEN
        RAISE EXCEPTION 'Missing authenticated Clerk user ID';
    END IF;

    -- Ensure profile exists
    v_email := coalesce(p_payload->>'verifiedEmail', p_payload->'contact'->>'emailAddress', '');
    v_owner_name := coalesce(p_payload->'owner'->>'ownerName', 'Registered Vendor');
    PERFORM public.api_sync_profile(v_user_id, v_owner_name, v_email, p_payload->'contact'->>'contactNumber', 'vendor');

    v_app_num := coalesce(p_payload->>'applicationNumber', p_payload->>'id');
    IF v_app_num IS NULL OR trim(v_app_num) = '' THEN
        -- Auto-generate BVR-YYYY-XXXXXX format
        v_app_num := 'BVR-' || to_char(v_now, 'YYYY') || '-' || lpad((nextval('public.application_number_seq'::regclass))::text, 6, '0');
    END IF;

    -- Check if record already exists
    SELECT * INTO v_existing FROM public.vendor_applications
    WHERE application_number = v_app_num
       OR (clerk_user_id = v_user_id AND status = 'draft')
    LIMIT 1;

    v_biz_name := coalesce(p_payload->'business'->>'businessName', 'New Vendor Business');

    IF v_existing.id IS NOT NULL THEN
        -- Update existing application
        UPDATE public.vendor_applications SET
            vendor_id = coalesce(p_payload->>'vendorId', v_existing.vendor_id),
            owner_name = coalesce(p_payload->'owner'->>'ownerName', v_existing.owner_name),
            owner_first_name = coalesce(p_payload->'owner'->>'firstName', v_existing.owner_first_name),
            owner_last_name = coalesce(p_payload->'owner'->>'lastName', v_existing.owner_last_name),
            owner_middle_name = coalesce(p_payload->'owner'->>'middleName', v_existing.owner_middle_name),
            business_name = coalesce(p_payload->'business'->>'businessName', v_existing.business_name),
            business_description = coalesce(p_payload->'business'->>'businessDescription', v_existing.business_description),
            business_category = coalesce(p_payload->'business'->>'category', v_existing.business_category),
            contact_number = coalesce(p_payload->'contact'->>'contactNumber', v_existing.contact_number),
            email_address = coalesce(v_email, v_existing.email_address),
            house_no = coalesce(p_payload->'address'->>'houseNo', v_existing.house_no),
            street = coalesce(p_payload->'address'->>'street', v_existing.street),
            barangay = coalesce(p_payload->'address'->>'barangay', v_existing.barangay),
            city = coalesce(p_payload->'address'->>'city', v_existing.city),
            province = coalesce(p_payload->'address'->>'province', v_existing.province),
            region = coalesce(p_payload->'address'->>'region', v_existing.region),
            country = coalesce(p_payload->'address'->>'country', v_existing.country),
            status = coalesce(p_payload->>'status', v_existing.status),
            verification_status = coalesce(p_payload->>'verificationStatus', v_existing.verification_status),
            is_verified = coalesce((p_payload->>'isVerified')::boolean, v_existing.is_verified),
            current_stage = coalesce((p_payload->>'currentStage')::integer, v_existing.current_stage),
            admin_remarks = coalesce(p_payload->>'adminRemarks', v_existing.admin_remarks),
            submitted_at = coalesce(v_existing.submitted_at, CASE WHEN p_payload->>'status' <> 'draft' THEN v_now ELSE NULL END),
            updated_at = v_now
        WHERE id = v_existing.id
        RETURNING * INTO v_updated;

        v_app_id := v_existing.id;
    ELSE
        -- Insert new application
        INSERT INTO public.vendor_applications (
            application_number,
            vendor_id,
            clerk_user_id,
            verified_email,
            owner_name,
            owner_first_name,
            owner_last_name,
            owner_middle_name,
            business_name,
            business_description,
            business_category,
            contact_number,
            email_address,
            house_no,
            street,
            barangay,
            city,
            province,
            region,
            country,
            status,
            verification_status,
            is_verified,
            current_stage,
            admin_remarks,
            submitted_at,
            created_at,
            updated_at
        ) VALUES (
            v_app_num,
            p_payload->>'vendorId',
            v_user_id,
            v_email,
            v_owner_name,
            p_payload->'owner'->>'firstName',
            p_payload->'owner'->>'lastName',
            p_payload->'owner'->>'middleName',
            v_biz_name,
            p_payload->'business'->>'businessDescription',
            p_payload->'business'->>'category',
            coalesce(p_payload->'contact'->>'contactNumber', ''),
            v_email,
            p_payload->'address'->>'houseNo',
            p_payload->'address'->>'street',
            coalesce(p_payload->'address'->>'barangay', 'All Barangays'),
            coalesce(p_payload->'address'->>'city', 'Butuan City'),
            coalesce(p_payload->'address'->>'province', 'Agusan del Norte'),
            coalesce(p_payload->'address'->>'region', 'Caraga'),
            coalesce(p_payload->'address'->>'country', 'Philippines'),
            coalesce(p_payload->>'status', 'submitted'),
            coalesce(p_payload->>'verificationStatus', 'Pending'),
            coalesce((p_payload->>'isVerified')::boolean, false),
            coalesce((p_payload->>'currentStage')::integer, 1),
            coalesce(p_payload->>'adminRemarks', ''),
            v_now,
            v_now,
            v_now
        )
        RETURNING * INTO v_updated;

        v_app_id := v_updated.id;
    END IF;

    -- Upsert Documents if provided
    IF p_payload ? 'documents' AND jsonb_array_length(p_payload->'documents') > 0 THEN
        FOR v_doc IN SELECT * FROM jsonb_array_elements(p_payload->'documents')
        LOOP
            v_doc_type := coalesce(v_doc->>'idType', v_doc->>'documentType', 'Government ID');
            v_doc_num := coalesce(v_doc->>'idNumber', '');
            v_doc_file := coalesce(v_doc->>'filename', v_doc->>'idFileName', 'document.jpg');
            v_doc_status := coalesce(v_doc->>'status', 'Submitted');
            v_doc_size := coalesce(v_doc->>'fileSize', '');

            INSERT INTO public.application_documents (
                application_id,
                document_type,
                id_number,
                file_name,
                file_size_formatted,
                status,
                is_skipped_id,
                uploaded_at
            ) VALUES (
                v_app_id,
                v_doc_type,
                v_doc_num,
                v_doc_file,
                v_doc_size,
                v_doc_status,
                coalesce((v_doc->>'isSkippedId')::boolean, false),
                v_now
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- Upsert Payment if provided
    IF p_payload ? 'payment' AND (p_payload->'payment') IS NOT NULL THEN
        INSERT INTO public.application_payments (
            application_id,
            payment_method,
            payment_method_category,
            assessed_amount,
            amount_paid,
            currency,
            transaction_reference,
            fee_breakdown,
            assessment_status,
            assessment_notes,
            gateway_provider,
            payment_status,
            receipt_number,
            receipt_filename,
            receipt_file_type,
            receipt_file_size,
            receipt_uploaded_at,
            payment_date,
            verified_by,
            verified_at
        ) VALUES (
            v_app_id,
            coalesce(p_payload->'payment'->>'paymentMethod', 'GCash — Pay Online'),
            coalesce(p_payload->'payment'->>'paymentMethodCategory', 'e_wallet'),
            coalesce((p_payload->'payment'->>'assessedAmount')::numeric, 0),
            coalesce((p_payload->'payment'->>'amountPaid')::numeric, 0),
            'PHP',
            p_payload->'payment'->>'transactionReference',
            coalesce(p_payload->'payment'->'feeBreakdown', '[]'::jsonb),
            coalesce(p_payload->'payment'->>'assessmentStatus', 'assessed'),
            p_payload->'payment'->>'assessmentNotes',
            p_payload->'payment'->>'gatewayProvider',
            coalesce(p_payload->'payment'->>'status', 'unpaid'),
            p_payload->'payment'->>'receiptNumber',
            p_payload->'payment'->>'receiptFilename',
            p_payload->'payment'->>'receiptFileType',
            (p_payload->'payment'->>'receiptFileSize')::bigint,
            (p_payload->'payment'->>'receiptUploadedAt')::timestamptz,
            (p_payload->'payment'->>'paymentDate')::timestamptz,
            p_payload->'payment'->>'verifiedBy',
            (p_payload->'payment'->>'verifiedAt')::timestamptz
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- Add initial status history if new
    IF v_existing.id IS NULL THEN
        INSERT INTO public.application_status_history (
            application_id,
            previous_status,
            new_status,
            action,
            action_by,
            remark,
            created_at
        ) VALUES (
            v_app_id,
            NULL,
            v_updated.status,
            'Application Submitted',
            'Vendor',
            'Vendor registration submitted via online portal.',
            v_now
        );
    END IF;

    RETURN public.format_application_json(v_updated);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5. Admin Application Update & Verification Operations
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_admin_update_application(
    p_app_number TEXT,
    p_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_app public.vendor_applications;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_prev_status TEXT;
    v_new_status TEXT;
    v_remarks TEXT;
    v_action TEXT;
    v_action_by TEXT;
BEGIN
    PERFORM public.check_server_auth();

    SELECT * INTO v_app FROM public.vendor_applications
    WHERE lower(application_number) = lower(trim(p_app_number))
       OR id::text = trim(p_app_number);

    IF v_app.id IS NULL THEN
        RAISE EXCEPTION 'Application not found: %', p_app_number;
    END IF;

    v_prev_status := v_app.status;
    v_new_status := coalesce(p_updates->>'status', v_app.status);
    v_remarks := coalesce(p_updates->>'adminRemarks', p_updates->>'remarks', v_app.admin_remarks);
    v_action_by := coalesce(p_updates->>'actionBy', 'Admin');

    UPDATE public.vendor_applications SET
        status = v_new_status,
        verification_status = coalesce(p_updates->>'verificationStatus', v_app.verification_status),
        is_verified = coalesce((p_updates->>'isVerified')::boolean, v_app.is_verified),
        current_stage = coalesce((p_updates->>'currentStage')::integer, v_app.current_stage),
        admin_remarks = v_remarks,
        vendor_id = coalesce(p_updates->>'vendorId', v_app.vendor_id),
        updated_at = v_now
    WHERE id = v_app.id
    RETURNING * INTO v_app;

    -- Add status history entry if status changed or remarks provided
    IF v_new_status <> v_prev_status OR (p_updates ? 'remarks' AND trim(v_remarks) <> '') THEN
        v_action := coalesce(p_updates->>'action', 'Status updated to ' || v_new_status);
        INSERT INTO public.application_status_history (
            application_id,
            previous_status,
            new_status,
            action,
            action_by,
            remark,
            created_at
        ) VALUES (
            v_app.id,
            v_prev_status,
            v_new_status,
            v_action,
            v_action_by,
            v_remarks,
            v_now
        );
    END IF;

    -- Update Payment if updates include payment details
    IF p_updates ? 'payment' OR p_updates ? 'paymentStatus' THEN
        UPDATE public.application_payments SET
            payment_status = coalesce(p_updates->'payment'->>'status', p_updates->>'paymentStatus', payment_status),
            amount_paid = coalesce((p_updates->'payment'->>'amountPaid')::numeric, (p_updates->>'amountPaid')::numeric, amount_paid),
            receipt_number = coalesce(p_updates->'payment'->>'receiptNumber', p_updates->>'receiptNumber', receipt_number),
            verified_by = coalesce(p_updates->'payment'->>'verifiedBy', p_updates->>'verifiedBy', verified_by),
            verified_at = coalesce((p_updates->'payment'->>'verifiedAt')::timestamptz, (p_updates->>'verifiedAt')::timestamptz, v_now),
            rejection_reason = coalesce(p_updates->'payment'->>'rejectionReason', p_updates->>'rejectionReason', rejection_reason),
            updated_at = v_now
        WHERE application_id = v_app.id;
    END IF;

    -- If approved and certificate not yet issued, auto-generate official certificate
    IF v_new_status = 'approved' THEN
        INSERT INTO public.vendor_certificates (
            application_id,
            certificate_number,
            vendor_id,
            business_name,
            owner_name,
            barangay,
            business_category,
            issued_at,
            expires_at,
            status,
            issued_by
        ) VALUES (
            v_app.id,
            'CERT-' || to_char(v_now, 'YYYY') || '-' || substring(v_app.application_number from '(\d+)$'),
            coalesce(v_app.vendor_id, 'BUT-V-' || substring(v_app.application_number from '(\d+)$')),
            v_app.business_name,
            v_app.owner_name,
            v_app.barangay,
            v_app.business_category,
            v_now,
            (v_now + INTERVAL '1 year'),
            'Active',
            'City Business Permits and Licensing Department (CBPLD)'
        )
        ON CONFLICT (application_id) DO NOTHING;
    END IF;

    RETURN public.format_application_json(v_app);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6. Notifications API
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_get_notifications(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
    res JSONB;
BEGIN
    PERFORM public.check_server_auth();

    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', n.id::text,
        'type', n.type,
        'category', n.category,
        'priority', n.priority,
        'title', n.title,
        'message', n.message,
        'fullMessage', coalesce(n.full_message, n.message),
        'applicationNumber', coalesce(n.application_number, ''),
        'actionLabel', coalesce(n.action_label, ''),
        'actionUrl', coalesce(n.action_url, ''),
        'href', coalesce(n.href, n.action_url, ''),
        'read', n.is_read,
        'createdAt', to_char(n.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) ORDER BY n.created_at DESC), '[]'::jsonb)
    INTO res
    FROM public.notifications n
    WHERE n.recipient_user_id = p_user_id
       OR n.recipient_user_id = 'admin';

    RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.api_create_notification(
    p_recipient_user_id TEXT,
    p_app_number TEXT,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'system',
    p_category TEXT DEFAULT 'application',
    p_priority TEXT DEFAULT 'normal',
    p_action_label TEXT DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_app_id UUID;
    v_notif public.notifications;
BEGIN
    PERFORM public.check_server_auth();

    SELECT id INTO v_app_id FROM public.vendor_applications
    WHERE application_number = p_app_number LIMIT 1;

    INSERT INTO public.notifications (
        recipient_user_id,
        application_id,
        application_number,
        title,
        message,
        full_message,
        type,
        category,
        priority,
        action_label,
        action_url,
        href,
        is_read,
        created_at
    ) VALUES (
        p_recipient_user_id,
        v_app_id,
        p_app_number,
        p_title,
        p_message,
        p_message,
        p_type,
        p_category,
        p_priority,
        p_action_label,
        p_action_url,
        p_action_url,
        false,
        timezone('utc'::text, now())
    )
    RETURNING * INTO v_notif;

    RETURN to_jsonb(v_notif);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.api_mark_notification_read(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    PERFORM public.check_server_auth();
    UPDATE public.notifications
    SET is_read = true, read_at = timezone('utc'::text, now())
    WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 7. Audit Log Recording
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_add_audit_log(
    p_actor_user_id TEXT,
    p_actor_name TEXT,
    p_actor_role TEXT,
    p_app_number TEXT,
    p_action TEXT,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_app_id UUID;
BEGIN
    PERFORM public.check_server_auth();

    SELECT id INTO v_app_id FROM public.vendor_applications
    WHERE application_number = p_app_number LIMIT 1;

    INSERT INTO public.audit_logs (
        actor_user_id,
        actor_name,
        actor_role,
        application_id,
        application_number,
        action,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        p_actor_user_id,
        p_actor_name,
        p_actor_role,
        v_app_id,
        p_app_number,
        p_action,
        coalesce(p_details, '{}'::jsonb),
        p_ip,
        p_user_agent,
        timezone('utc'::text, now())
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 8. Grant Execution to anon and service_role (Enforced via check_server_auth)
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.check_server_auth() TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_sync_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_get_profile(TEXT) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_get_vendor_applications(TEXT) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_get_application_by_number(TEXT) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_admin_get_all_applications() TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_save_vendor_application(JSONB) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_admin_update_application(TEXT, JSONB) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_get_notifications(TEXT) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_create_notification(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_mark_notification_read(UUID) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.api_add_audit_log(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) TO anon, service_role;
