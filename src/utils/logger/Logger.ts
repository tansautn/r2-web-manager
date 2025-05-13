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
import { LogScope, LogScopeType } from './LogScope';
import { ScopeManager } from './ScopeManager';

export class Logger {
  private context: string;
  private scope: LogScopeType;
  private scopeManager: ScopeManager;

  constructor(context: string = 'App', scope: LogScopeType = LogScope.SYSTEM) {
    this.context = context;
    this.scope = scope;
    this.scopeManager = ScopeManager.getInstance();
  }

  /**
   * Format log message
   * @private
   */
  private _format(level: LogLevelType, message: string, data: any = null): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level} [${this.scope}:${this.context}]`;
    
    let logMessage = `${prefix}: ${message}`;
    if (data) {
      // Handle different data types
      if (data instanceof Error) {
        logMessage += `\n${data.stack || data.message}`;
      } else if (typeof data === 'object') {
        try {
          logMessage += `\n${JSON.stringify(data, null, 2)}`;
        } catch (e) {
          logMessage += `\n[Circular or Non-Serializable Object]`;
        }
      } else {
        logMessage += `\n${data}`;
      }
    }
    return logMessage;
  }

  /**
   * Log message if scope is enabled
   * @private
   */
  private _log(level: LogLevelType, message: string, data: any = null): void {
    if (!this.scopeManager.isEnabled(this.scope, level)) return;

    const formattedMessage = this._format(level, message, data);
    switch (level) {
      case LogLevel.DEBUG:
        console.log(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  public debug(message: string, data: any = null): void {
    this._log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data: any = null): void {
    this._log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data: any = null): void {
    this._log(LogLevel.WARN, message, data);
  }

  public error(message: string, error: any = null): void {
    this._log(LogLevel.ERROR, message, error);
  }

  /**
   * Create child logger with sub-context but same scope
   */
  public child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`, this.scope);
  }

  /**
   * Create logger with different scope
   */
  public withScope(scope: LogScopeType): Logger {
    return new Logger(this.context, scope);
  }
} 
