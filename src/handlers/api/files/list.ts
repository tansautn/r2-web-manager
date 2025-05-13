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

const logger = createLogger('filesListApi', LogScope.API_HANDLER);

export async function handleFilesList(context: APIContext): Promise<Response> {
  logger.info('Processing GET /api/files/list');

  try {
    const prefix = context.getQueryParam('prefix') || '';
    const r2Service = Bootstrapper.getInitialized().getR2Service();
    const result = await r2Service.listObjects(prefix);
    
    logger.info('Files listed successfully', { prefix });
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
    logger.error('Failed to list files', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to list files'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 