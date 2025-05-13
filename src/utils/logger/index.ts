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

import { Logger } from './Logger';
import { LogLevel, LogLevelType } from './LogLevel';
import { LogScope, LogScopeType } from './LogScope';
import { ScopeManager } from './ScopeManager';

// Create singleton instance
export const logManager = ScopeManager.getInstance();

// Enable all scopes by default
Object.values(LogScope).forEach(scope => {
  logManager.enableScope(scope as LogScopeType);
});

const logger = createLogger('default', LogScope.SYSTEM);

export function createLogger(context: string, scope: LogScopeType): Logger {
  return new Logger(context, scope);
}

export { Logger, LogLevel, LogScope, ScopeManager as LogManager, logManager as manager };
export default logger; 