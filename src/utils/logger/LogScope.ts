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

export type LogScopeType = 'system' | 'bot' | 'router' | 'sheet' | 'webhook' | 'r2' | 'auth' | 'api_handler';

export const LogScope: Record<string, LogScopeType> = {
  SYSTEM: 'system',
  BOT: 'bot',
  ROUTER: 'router',
  SHEET: 'sheet',
  WEBHOOK: 'webhook',
  R2: 'r2',
  AUTH: 'auth',
  API_HANDLER: 'api_handler'
}; 