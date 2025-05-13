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

const logger = createLogger('filesSearchApi', LogScope.R2);

export async function handleFilesSearch(context: APIContext): Promise<Response> {
  logger.info('Processing GET /api/files/search');

  try {
    const query = context.getRequiredQueryParam('query');
    const prefix = context.getQueryParam('prefix') || '';
    
    const r2Service = Bootstrapper.getInitialized().getR2Service();
    const result = await r2Service.searchObjects(query, prefix);
    
    logger.info('Files searched successfully', { query, prefix });
    return new Response(JSON.stringify({
      success: true,
      data: result
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

    logger.error('Failed to search files', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to search files'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 