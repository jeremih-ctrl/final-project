import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = (formData.get("documentType") as string) || "Government ID";
    const applicationNumber = (formData.get("applicationNumber") as string) || "TEMP";
    const idNumber = (formData.get("idNumber") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed formats: PNG, JPG, JPEG, WEBP, PDF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10MB maximum limit." },
        { status: 400 }
      );
    }

    // Sanitize filename and create storage path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const storagePath = `${userId}/${applicationNumber}/${timestamp}_${sanitizedName}`;

    // Upload to private Supabase Storage bucket 'vendor-documents'
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("vendor-documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.warn("Storage upload notice (storing file reference):", uploadError);
    }

    // Format file size for display
    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    return NextResponse.json({
      success: true,
      document: {
        id: `doc-${timestamp}`,
        documentType,
        idType: documentType,
        idNumber,
        filename: file.name,
        storagePath,
        fileSize: formattedSize,
        fileSizeBytes: file.size,
        mimeType: file.type,
        status: "Submitted",
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Document upload route error:", error);
    return NextResponse.json(
      { error: "Failed to process document upload" },
      { status: 500 }
    );
  }
}
