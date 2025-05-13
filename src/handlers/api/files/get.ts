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

import { Context } from '../../../router/context';
import { createLogger, LogScope } from '../../../utils/logger';
import Bootstrapper from '../../../bootstrap';
import { APIContext } from '../../../router/context';

const logger = createLogger('filesGetApi', LogScope.R2);

export async function handleFilesGet(context: APIContext): Promise<Response> {
  logger.info('Processing GET /api/files/get');

  try {
    const key = context.getRequiredQueryParam('key');
    const r2Service = Bootstrapper.getInitialized().getR2Service();
    const object = await r2Service.getObject(key);
    
    if (!object) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File not found'
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Required')) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    logger.error('Failed to get file', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get file'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 