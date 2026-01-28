/**
 * Secure File Upload Handler
 * 
 * Validates, sanitizes, and stores files securely.
 * Features:
 * - Magic bytes validation
 * - User/org quota enforcement
 * - EXIF stripping for images
 * - SHA-256 hash for deduplication
 * - Signed URL generation
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { 
  isBlockedContent, 
  isAllowedMimeType,
  isAllowedExtension,
  detectFileType,
  stripExifFromJpeg,
  calculateHash,
  generateSecureFilename,
  FILE_LIMITS,
  ALLOWED_MIME_TYPES,
} from "../_shared/file-validator.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('secure-upload');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client for auth verification
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin client for storage and quota operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's org_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('org_id')
      .eq('user_id', user.id)
      .single();
    
    const orgId = profile?.org_id;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'documents';
    const folder = (formData.get('folder') as string) || '';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Processing upload', { 
      fileName: file.name, 
      size: file.size, 
      type: file.type,
      userId: user.id 
    });

    // 1. Validate file size
    if (file.size > FILE_LIMITS.MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo: 25MB` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (file.size === 0) {
      return new Response(
        JSON.stringify({ error: 'Arquivo vazio não é permitido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate extension
    if (!isAllowedExtension(file.name)) {
      return new Response(
        JSON.stringify({ 
          error: 'Extensão não permitida. Permitidos: PDF, PNG, JPG, DOCX, XLSX, CSV' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check user daily quota
    const { data: userQuota } = await supabaseAdmin
      .rpc('check_user_daily_quota', { _user_id: user.id });

    if (userQuota && userQuota.length > 0) {
      const quota = userQuota[0];
      if (!quota.can_upload || quota.remaining_bytes < file.size) {
        return new Response(
          JSON.stringify({ 
            error: 'Quota diária excedida (100MB/dia)',
            used: quota.used_bytes,
            limit: quota.limit_bytes,
            remaining: quota.remaining_bytes
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Check org quota
    if (orgId) {
      const { data: orgQuota } = await supabaseAdmin
        .rpc('check_org_total_quota', { _org_id: orgId });

      if (orgQuota && orgQuota.length > 0) {
        const quota = orgQuota[0];
        if (!quota.can_upload || quota.remaining_bytes < file.size) {
          return new Response(
            JSON.stringify({ 
              error: 'Quota da organização excedida (1GB total)',
              used: quota.used_bytes,
              limit: quota.limit_bytes,
              remaining: quota.remaining_bytes
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 5. Read file content
    const arrayBuffer = await file.arrayBuffer();
    let fileData = new Uint8Array(arrayBuffer);
    const header = fileData.slice(0, 32);

    // 6. Check for blocked content (executables, scripts)
    if (isBlockedContent(header)) {
      logger.warn('Blocked content detected', { fileName: file.name, userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Arquivo bloqueado: conteúdo executável ou script detectado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Detect and validate file type from magic bytes
    const detectedType = detectFileType(header);
    if (!detectedType && file.type !== 'text/csv' && file.type !== 'text/plain') {
      return new Response(
        JSON.stringify({ error: 'Tipo de arquivo não reconhecido pelos magic bytes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Strip EXIF from JPEG images
    let exifStripped = false;
    if (file.type === 'image/jpeg' || detectedType === 'image/jpeg') {
      const originalSize = fileData.length;
      fileData = stripExifFromJpeg(fileData);
      exifStripped = fileData.length < originalSize;
      if (exifStripped) {
        logger.info('EXIF stripped from JPEG', { 
          originalSize, 
          newSize: fileData.length,
          saved: originalSize - fileData.length 
        });
      }
    }

    // 9. Calculate SHA-256 hash
    const fileHash = await calculateHash(fileData);

    // 10. Check for duplicates
    if (orgId) {
      const { data: duplicate } = await supabaseAdmin
        .rpc('find_duplicate_file', { _org_id: orgId, _file_hash: fileHash });

      if (duplicate && duplicate.length > 0) {
        // Return existing file instead of re-uploading
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from(bucket)
          .createSignedUrl(duplicate[0].storage_path, 3600);

        logger.info('Duplicate file found, returning existing', { 
          fileId: duplicate[0].id,
          hash: fileHash 
        });

        return new Response(
          JSON.stringify({
            success: true,
            duplicate: true,
            fileId: duplicate[0].id,
            signedUrl: signedUrlData?.signedUrl,
            originalName: duplicate[0].original_name,
            hash: fileHash
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 11. Generate secure filename (UUID)
    const secureFilename = generateSecureFilename(file.name);
    const storagePath = folder 
      ? `${user.id}/${folder}/${secureFilename}`
      : `${user.id}/${secureFilename}`;

    // 12. Upload to private bucket
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, fileData, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      logger.error('Storage upload failed', uploadError);
      return new Response(
        JSON.stringify({ error: `Falha no upload: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 13. Record upload in tracking table
    const { data: uploadRecord, error: recordError } = await supabaseAdmin
      .from('file_uploads')
      .insert({
        user_id: user.id,
        org_id: orgId,
        original_name: file.name,
        storage_path: storagePath,
        bucket,
        mime_type: file.type,
        detected_type: detectedType || file.type,
        file_hash: fileHash,
        size_bytes: fileData.length,
        exif_stripped: exifStripped
      })
      .select('id')
      .single();

    if (recordError) {
      logger.error('Failed to record upload', recordError);
      // Cleanup: delete uploaded file
      await supabaseAdmin.storage.from(bucket).remove([storagePath]);
      return new Response(
        JSON.stringify({ error: 'Falha ao registrar upload' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 14. Generate signed URL (1 hour expiry)
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600);

    logger.info('Upload successful', { 
      fileId: uploadRecord.id,
      hash: fileHash,
      size: fileData.length,
      exifStripped 
    });

    return new Response(
      JSON.stringify({
        success: true,
        fileId: uploadRecord.id,
        storagePath,
        signedUrl: signedUrlData?.signedUrl,
        hash: fileHash,
        size: fileData.length,
        originalName: file.name,
        exifStripped
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Unexpected error in secure-upload', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
