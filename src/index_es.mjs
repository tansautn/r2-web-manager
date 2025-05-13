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

import { Router } from './router';
import { Logger, LogScope } from './utils/logger';
import { handleWebhook } from './webhook_handlers';
import Bootstrapper from './bootstrap';

const logger = new Logger('App', LogScope.SYSTEM);
const router = new Router();

// Register routes
router.post('/webhook', handleWebhook);

// API routes
router.get('/api/status', async (context) => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

export default {
  async fetch(request, env, ctx) {
    const bootstrapper = Bootstrapper.getInstance(env, ctx);
    try {
      // Initialize environment variables
      Object.assign(globalThis, env);

      // Ensure services are initialized
      if (!bootstrapper.initialized) {
        await bootstrapper.init();
      }

      // Handle request
      return await router.matchThenDispatch(request);
    } catch (error) {
      logger.error('Unhandled error', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  async scheduled(event, env, ctx) {
    logger.info('Running scheduled task', event);
    const bootstrapper = Bootstrapper.getInstance(env, ctx);
    try {
      // Initialize environment variables
      Object.assign(globalThis, env);

      // Handle scheduled tasks
      // ...

    } catch (error) {
      logger.error('Scheduled task failed', error);
      throw error;
    }
  }
}; 
