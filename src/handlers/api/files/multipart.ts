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

  const uploadId = await context.env.R2_BUCKET.createMultipartUpload(key);
  
  return new Response(JSON.stringify({ uploadId, key }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function handleMultipartUpload(context: Context): Promise<Response> {
  const { searchParams } = new URL(context.request.url);
  const key = searchParams.get('key');
  const uploadId = searchParams.get('uploadId');
  const partNumber = parseInt(searchParams.get('partNumber') || '0');

  if (!key || !uploadId || !partNumber) {
    return new Response('Missing required parameters', { status: 400 });
  }

  const chunk = await context.request.arrayBuffer();
  const part = await context.env.R2_BUCKET.uploadPart(
    key,
    uploadId,
    partNumber,
    chunk
  );

  return new Response(JSON.stringify({ etag: part.etag }), {
    headers: { 'Content-Type': 'application/json' }
  });
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

  await context.env.R2_BUCKET.completeMultipartUpload(key, uploadId, parts);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 
