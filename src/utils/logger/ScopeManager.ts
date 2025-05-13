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

import { LogLevel, LogLevelType } from './LogLevel';
import { LogScopeType } from './LogScope';

export class ScopeManager {
  private static instance: ScopeManager;
  private enabledScopes: Set<LogScopeType>;
  private minLevel: LogLevelType;

  public static getInstance(): ScopeManager {
    if (!ScopeManager.instance) {
      ScopeManager.instance = new ScopeManager();
    }
    return ScopeManager.instance;
  }

  private constructor() {
    this.enabledScopes = new Set();
    this.minLevel = LogLevel.DEBUG;
  }

  public enableScope(scope: LogScopeType): void {
    this.enabledScopes.add(scope);
  }

  public disableScope(scope: LogScopeType): void {
    this.enabledScopes.delete(scope);
  }

  public setMinLevel(level: LogLevelType): void {
    this.minLevel = level;
  }

  public isEnabled(scope: LogScopeType, level: LogLevelType): boolean {
    if (!this.enabledScopes.has(scope)) return false;

    const levels = Object.values(LogLevel);
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }
} 