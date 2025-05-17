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

import { APIContext } from '../../router/context';
import { createLogger, LogScope } from '../../utils/logger';

const logger = createLogger('api.config', LogScope.API_HANDLER);

export async function handleGetConfig(context: APIContext): Promise<Response> {
  logger.info('Processing GET /api/config');

  try {
    const cdnBaseUrl = (globalThis as any).CDN_BASE_URL || 'https://your-cdn.r2.dev/';
    
    const config = {
      cdnBaseUrl: cdnBaseUrl,
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: config
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache trong 1 giờ
      }
    });
  } catch (error) {
    logger.error('Failed to get config', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get config'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 