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

import { Context } from '../../router/context';
import { createLogger, LogScope } from '../../utils/logger';
import { authCheck } from './basicAuthMiddleware';

const logger = createLogger('AdminWebhook', LogScope.ADMIN);

async function setWebhook(URL: string, SECRET_TOKEN?: string, DROP_PENDING_UPDATES?: string): Promise<any> {
  let HOOK_URL = `https://api.telegram.org/bot${(globalThis as any).TELEGRAM_BOT_TOKEN}/setWebhook?url=${URL}`;

  if (SECRET_TOKEN) {
    HOOK_URL = `${HOOK_URL}&secret_token=${SECRET_TOKEN}`;
  }

  if (DROP_PENDING_UPDATES === "True") {
    HOOK_URL = `${HOOK_URL}&drop_pending_updates=true`;
  }

  try {
    logger.debug('Setting webhook', { url: HOOK_URL });
    const response = await fetch(HOOK_URL, { method: 'POST' });
    const data = await response.json();
    logger.info('Webhook set successfully', data);
    return data;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to set webhook', err);
    throw err;
  }
}

export async function setWebhookHandler(context: Context): Promise<Response> {
  try {
   const middlewareResult = authCheck(context);
   if (middlewareResult instanceof Response) {
       return middlewareResult;
   }
    const res = await setWebhook(
      (globalThis as any).WEBHOOK_URL,
      (globalThis as any).SECRET_TOKEN,
      (globalThis as any).DROP_PENDING_UPDATES
    );
    return new Response(JSON.stringify(res), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 
