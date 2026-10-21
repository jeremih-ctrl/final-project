-- ============================================================================
-- Butuan Vendors Registration System: Soft Delete & Multi-Application Support
-- Migration: 20261016000001_vendor_soft_delete_and_multi_application.sql
-- Description: Add soft-delete archival columns, update JSON formatting,
--              add admin soft-delete RPC, and support multiple applications per user.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add Soft Delete Columns to vendor_applications
-- ----------------------------------------------------------------------------
ALTER TABLE public.vendor_applications
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT,
    ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_vendor_applications_is_deleted 
    ON public.vendor_applications(is_deleted);

-- ----------------------------------------------------------------------------
-- 2. Update format_application_json to include Soft-Delete fields
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.format_application_json(app public.vendor_applications)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    docs JSONB;
    pay JSONB;
    hist JSONB;
    cert JSONB;
BEGIN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', coalesce(ad.id::text, ''),
        'idType', ad.document_type,
        'idNumber', coalesce(ad.id_number, ''),
        'filename', ad.file_name,
        'idFileName', ad.file_name,
        'storagePath', coalesce(ad.storage_path, ''),
        'fileSize', coalesce(ad.file_size_formatted, ''),
        'uploadedAt', to_char(ad.uploaded_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'status', ad.status,
        'isSkippedId', ad.is_skipped_id
    )), '[]'::jsonb)
    INTO docs
    FROM public.application_documents ad
    WHERE ad.application_id = app.id;

    SELECT coalesce(jsonb_build_object(
        'status', ap.payment_status,
        'assessedAmount', ap.assessed_amount,
        'amountPaid', ap.amount_paid,
        'currency', ap.currency,
        'paymentMethod', ap.payment_method,
        'paymentMethodCategory', ap.payment_method_category,
        'transactionReference', coalesce(ap.transaction_reference, ''),
        'feeBreakdown', coalesce(ap.fee_breakdown, '[]'::jsonb),
        'assessmentStatus', coalesce(ap.assessment_status, 'assessed'),
        'assessmentNotes', coalesce(ap.assessment_notes, ''),
        'gatewayProvider', coalesce(ap.gateway_provider, ''),
        'receiptNumber', coalesce(ap.receipt_number, ''),
        'receiptFilename', coalesce(ap.receipt_filename, ''),
        'receiptFileType', coalesce(ap.receipt_file_type, ''),
        'receiptFileSize', coalesce(ap.receipt_file_size, 0),
        'receiptUploadedAt', to_char(ap.receipt_uploaded_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'paymentDate', to_char(ap.payment_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'verifiedBy', coalesce(ap.verified_by, ''),
        'verifiedAt', to_char(ap.verified_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'rejectionReason', coalesce(ap.rejection_reason, '')
    ), jsonb_build_object(
        'status', 'unpaid',
        'assessedAmount', 0,
        'amountPaid', 0,
        'currency', 'PHP'
    ))
    INTO pay
    FROM public.application_payments ap
    WHERE ap.application_id = app.id;

    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', ash.id::text,
        'previousStatus', ash.previous_status,
        'newStatus', ash.new_status,
        'action', coalesce(ash.action, ''),
        'actionBy', coalesce(ash.action_by, 'System'),
        'remark', coalesce(ash.remark, ''),
        'timestamp', to_char(ash.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) ORDER BY ash.created_at ASC), '[]'::jsonb)
    INTO hist
    FROM public.application_status_history ash
    WHERE ash.application_id = app.id;

    SELECT jsonb_build_object(
        'certificateNumber', vc.certificate_number,
        'vendorId', vc.vendor_id,
        'businessName', vc.business_name,
        'ownerName', vc.owner_name,
        'issuedAt', to_char(vc.issued_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'expiresAt', to_char(vc.expires_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'status', vc.status,
        'issuedBy', vc.issued_by
    )
    INTO cert
    FROM public.vendor_certificates vc
    WHERE vc.application_id = app.id;

    RETURN jsonb_build_object(
        'id', app.application_number,
        'applicationNumber', app.application_number,
        'vendorId', coalesce(app.vendor_id, ''),
        'userId', app.clerk_user_id,
        'verifiedEmail', app.verified_email,
        'status', app.status,
        'verificationStatus', coalesce(app.verification_status, 'Pending'),
        'isVerified', app.is_verified,
        'currentStage', app.current_stage,
        'isDeleted', app.is_deleted,
        'deletedAt', to_char(app.deleted_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'deletedBy', coalesce(app.deleted_by, ''),
        'deletedReason', coalesce(app.deleted_reason, ''),
        'business', jsonb_build_object(
            'businessName', app.business_name,
            'businessDescription', coalesce(app.business_description, ''),
            'category', coalesce(app.business_category, '')
        ),
        'owner', jsonb_build_object(
            'ownerName', app.owner_name,
            'firstName', coalesce(app.owner_first_name, ''),
            'lastName', coalesce(app.owner_last_name, ''),
            'middleName', coalesce(app.owner_middle_name, '')
        ),
        'contact', jsonb_build_object(
            'contactNumber', app.contact_number,
            'emailAddress', app.email_address
        ),
        'address', jsonb_build_object(
            'houseNo', coalesce(app.house_no, ''),
            'street', coalesce(app.street, ''),
            'barangay', app.barangay,
            'city', app.city,
            'province', app.province,
            'region', app.region,
            'country', app.country
        ),
        'documents', coalesce(docs, '[]'::jsonb),
        'payment', coalesce(pay, '{}'::jsonb),
        'paymentStatus', coalesce(pay->>'status', 'unpaid'),
        'amountPaid', coalesce((pay->>'amountPaid')::numeric, 0),
        'adminRemarks', coalesce(app.admin_remarks, ''),
        'statusHistory', coalesce(hist, '[]'::jsonb),
        'certificate', cert,
        'submittedAt', to_char(app.submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'createdAt', to_char(app.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'updatedAt', to_char(app.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
END;
$function$;

-- ----------------------------------------------------------------------------
-- 3. Admin Soft-Delete / Archival RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_admin_delete_application(
    p_app_number TEXT,
    p_deleted_by TEXT DEFAULT 'Administrator',
    p_reason TEXT DEFAULT 'Archived by Administrator'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_app public.vendor_applications;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    PERFORM public.check_server_auth();

    SELECT * INTO v_app FROM public.vendor_applications
    WHERE lower(application_number) = lower(trim(p_app_number))
       OR id::text = trim(p_app_number);

    IF v_app.id IS NULL THEN
        RAISE EXCEPTION 'Application not found: %', p_app_number;
    END IF;

    UPDATE public.vendor_applications SET
        is_deleted = true,
        deleted_at = v_now,
        deleted_by = coalesce(p_deleted_by, 'Administrator'),
        deleted_reason = coalesce(p_reason, 'Archived by Administrator'),
        updated_at = v_now
    WHERE id = v_app.id
    RETURNING * INTO v_app;

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
        v_app.status,
        v_app.status,
        'Application Deleted by Administrator',
        coalesce(p_deleted_by, 'Administrator'),
        coalesce(p_reason, 'Application record archived and deleted by administrator.'),
        v_now
    );

    RETURN public.format_application_json(v_app);
END;
$$;

GRANT EXECUTE ON FUNCTION public.api_admin_delete_application(TEXT, TEXT, TEXT) TO anon, service_role;

-- ----------------------------------------------------------------------------
-- 4. Update api_save_vendor_application to support multiple applications
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_save_vendor_application(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

    -- Only match an existing record if a specific application number was supplied
    IF v_app_num IS NOT NULL AND trim(v_app_num) <> '' THEN
        SELECT * INTO v_existing FROM public.vendor_applications
        WHERE lower(application_number) = lower(trim(v_app_num))
           OR id::text = trim(v_app_num)
        LIMIT 1;
    ELSE
        v_existing := NULL;
    END IF;

    -- If no existing application matched, generate a brand new unique application number
    IF v_existing.id IS NULL THEN
        IF v_app_num IS NULL OR trim(v_app_num) = '' THEN
            v_app_num := 'BVR-' || to_char(v_now, 'YYYY') || '-' || lpad((nextval('public.application_number_seq'::regclass))::text, 6, '0');
        END IF;
    ELSE
        v_app_num := v_existing.application_number;
    END IF;

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
        -- Insert brand new application
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
            is_deleted,
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
            false,
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
$$;
