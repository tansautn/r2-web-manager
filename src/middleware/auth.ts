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

import { Context } from "../router";
import { createLogger, LogScope } from '../utils/logger';

const logger = createLogger('AuthMiddleware', LogScope.AUTH);

export function apiTokenAuth(token: string) {
  return async (context: Context, next: (ctx: any) => Promise<Response | void>) => {
    // Check token from header
    const authHeader = context.request.headers.get('X-API-Token');
    if (authHeader === token) {
      return next(context);
    }

    // Check token from query string
    const url = new URL(context.request.url);
    const queryToken = url.searchParams.get('token');
    if (queryToken === token) {
      return next(context);
    }

    logger.warn('Invalid or missing API token');
    return new Response('Unauthorized', { status: 401 });
  };
}

export function basicAuth(username: string, password: string) {
  return async (context: Context, next: () => Promise<Response | void>) => {
    const authHeader = context.request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      logger.warn('Missing or invalid auth header');
      return new Response('Unauthorized', { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="R2 File Manager"'
        }
      });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = atob(base64Credentials).split(':');
    const providedUsername = credentials[0];
    const providedPassword = credentials[1];

    if (username !== providedUsername || password !== providedPassword) {
      logger.warn('Invalid credentials');
      return new Response('Unauthorized', { status: 401 });
    }

    return next();
  };
}

export function debugOnly() {
  return async (context: Context, next: () => Promise<Response | void>) => {
    if(!(new URL(context.request.url)).pathname.startsWith('/dev')) {
      return next();
    }
    
    if(!context.request.headers.get('X-Zuko-Debug')) {
      logger.warn('Debug header missing');
      return new Response('Unauthorized', { status: 401 });
    }

    return next();
  };
} 
