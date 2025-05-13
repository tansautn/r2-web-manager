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

import Bootstrapper from './bootstrap';
import router from './router';
import logger from './utils/logger';
import { ExtendedExecutionContext } from './types/cloudflare';
import type { Context } from './router';
import { apiTokenAuth, basicAuth, debugOnly } from './middleware/auth';
import { handleFilesList } from './handlers/api/files/list';
import { handleFilesGet } from './handlers/api/files/get';
import { handleFilesUpload } from './handlers/api/files/upload';
import { handleFilesDelete } from './handlers/api/files/delete';
import { handleMultipartInit, handleMultipartUpload, handleMultipartComplete } from './handlers/api/files/multipart';
import { handleFilesFolders } from './handlers/api/files/folders';
import { handleFilesSearch } from './handlers/api/files/search';
import {apiHandlers} from "@/handlers/__generated";

const mainLogger = logger.child('Main');

// Global middleware
router.use(debugOnly());

// Protected API routes with token auth
router.use(async (context: Context, next: () => Promise<Response | void>) => {
  if ((new URL(context.request.url)).pathname.startsWith('/api')) {
    return apiTokenAuth((globalThis as any).API_TOKEN)(context, next);
  }
  return next();
});

// Protected web interface with basic auth
router.use(async (context: Context, next: () => Promise<Response | void>) => {
  const url = new URL(context.request.url);
  // Only apply basic auth to root and static files
  if (url.pathname === '/' || url.pathname.startsWith('/public')) {
    const usr = (globalThis as any).ADMIN_AUTH_BASIC_USR_PWD.split(':')[0];
    const pwd = (globalThis as any).ADMIN_AUTH_BASIC_USR_PWD.split(':')[1];
    return basicAuth(
      usr,
      pwd
    )(context, next);
  }
  return next();
});

// Register API routes
router.get('/api/files/list', handleFilesList);
router.get('/api/files/get', handleFilesGet);
router.post('/api/files/upload', handleFilesUpload);
router.delete('/api/files/delete', handleFilesDelete);
router.get('/api/files/folders', handleFilesFolders);
router.get('/api/files/search', handleFilesSearch);

// Add multipart upload routes
router.post('/api/files/multipart/init', handleMultipartInit);
router.post('/api/files/multipart/upload', handleMultipartUpload);
router.post('/api/files/multipart/complete', handleMultipartComplete);

//// API routes will be registered here
//router.register('/api/*', async (context: Context) => {
//    // API handling logic
//    return new Response('OK');
//});

// LOAD GENERATED API HANDLERS
for (const hKey in apiHandlers) {
    const handler = apiHandlers[hKey];
    router.register(hKey, handler.handler, handler.method);
}

// Main request handler
async function handleRequest(
  request: Request,
  env: Record<string, any>,
  ctx: ExtendedExecutionContext
): Promise<Response> {
  try {
    const bootstrapper = Bootstrapper.getInstance(env, ctx);
    if (!bootstrapper.initialized) {
      await bootstrapper.init();
    }
    
    return await router.matchThenDispatch(request, env);
  } catch (error) {
    mainLogger.error('Request handling failed', error instanceof Error ? error : new Error(String(error)));
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Export the fetch handler for module-worker format
export default {
  async fetch(
    request: Request,
    env: Record<string, any>,
    ctx: ExtendedExecutionContext
  ): Promise<Response> {
    mainLogger.info('Request received');
    Object.assign(globalThis, env);
    return handleRequest(request, env, { ...ctx, props: {} });
  }
}; 
