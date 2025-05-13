/*
 *          M""""""""`M            dP
 *          Mmmmmm   .M            88
 *          MMMMP  .MMM  dP    dP  88  .dP   .d8888b.
 *          MMP  .MMMMM  88    88  88888"    88'  `88
 *          M' .MMMMMMM  88.  .88  88  `8b.  88.  .88
 *          M         M  `88888P'  dP   `YP  `88888P'
 *          MMMMMMMMMMM    -*-  Created by Zuko  -*-
 *
 *          * * * * * * * * * * * * * * * * * * * * *
 *          * -    - -   F.R.E.E.M.I.N.D   - -    - *
 *          * -  Copyright © 2025 (Z) Programing  - *
 *          *    -  -  All Rights Reserved  -  -    *
 *          * * * * * * * * * * * * * * * * * * * * *
 */

import {Context} from "@/router";


interface MultipartUploadInit {
  uploadId: string;
  key: string;
}

interface PartUpload {
  partNumber: number;
  etag: string;
}

export async function handleMultipartInit(context: Context): Promise<Response> {
  const { searchParams } = new URL(context.request.url);
  const key = searchParams.get('key');
  
  if (!key) {
    return new Response('Missing key parameter', { status: 400 });
  }

  try {
    // Create a multipart upload and get the uploadId
    const multipartUpload = await context.env.R2_BUCKET.createMultipartUpload(key);
    
    // Return the proper multipartUpload object format according to Cloudflare API
    return new Response(JSON.stringify({
      uploadId: multipartUpload.uploadId,
      key: multipartUpload.key
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to initialize multipart upload:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to initialize multipart upload' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function handleMultipartUpload(context: Context): Promise<Response> {
  const { searchParams } = new URL(context.request.url);
  const key = searchParams.get('key');
  const uploadId = searchParams.get('uploadId');
  const partNumber = parseInt(searchParams.get('partNumber') || '0');

  if (!key || !uploadId || !partNumber) {
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    // Get the multipart upload object from uploadId
    const multipartUpload = context.env.R2_BUCKET.resumeMultipartUpload(key, uploadId);
    
    const chunk = await context.request.arrayBuffer();
    
    // Call uploadPart on the multipartUpload object, not directly on R2_BUCKET
    const part = await multipartUpload.uploadPart(partNumber, chunk);

    return new Response(JSON.stringify({ etag: part.etag }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to upload part:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload part' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function handleMultipartComplete(context: Context): Promise<Response> {
  const { key, uploadId, parts } = await context.request.json() as {
    key: string;
    uploadId: string;
    parts: PartUpload[];
  };

  if (!key || !uploadId || !parts.length) {
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    // Get the multipart upload object from uploadId
    const multipartUpload = context.env.R2_BUCKET.resumeMultipartUpload(key, uploadId);
    
    // Call complete on the multipartUpload object
    const object = await multipartUpload.complete(parts);
    
    return new Response(JSON.stringify({ 
      success: true,
      etag: object.etag,
      key: object.key 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to complete multipart upload:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to complete multipart upload' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 
