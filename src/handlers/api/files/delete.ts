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

import { APIContext } from '../../../router/context';
import { createLogger, LogScope } from '../../../utils/logger';
import Bootstrapper from '../../../bootstrap';

const logger = createLogger('filesDeleteApi', LogScope.R2);

export async function handleFilesDelete(context: APIContext): Promise<Response> {
  logger.info('Processing DELETE /api/files/delete');

  try {
    const key = context.getRequiredQueryParam('key');
    const r2Service = Bootstrapper.getInitialized().getR2Service();
    await r2Service.deleteObject(key);
    
    logger.info('File deleted successfully', { key });
    return new Response(JSON.stringify({
      success: true
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
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

    logger.error('Failed to delete file', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete file'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 