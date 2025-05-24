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
    if(context.isAuthPassed){
      return next(context);
    }
    const cookie = context.request.headers.get('Cookie') || '';
    const tokenMatch = cookie.match(/api_token=([a-z0-9]+)/i);
    const reqToken = tokenMatch?.[1];

    if (reqToken === token) {
      context.isApiAuthPassed = true;
      return next(context);
    }
    // Check token from header
    const authHeader = context.request.headers.get('X-API-Token');
    if (authHeader === token) {
      context.isApiAuthPassed = true;
      return next(context);
    }

    // Check token from query string
    const url = new URL(context.request.url);
    const queryToken = url.searchParams.get('token');
    if (queryToken === token) {
      context.isApiAuthPassed = true;
      return next(context);
    }

    logger.warn('Invalid or missing API token');
    return new Response('Unauthorized', { status: 401 });
  };
}

export function basicAuth(username: string, password: string) {
  return async (context: Context, next: (ctx: any) => Promise<Response | void>) => {
    if(context.isApiAuthPassed){
      return next(context);
    }
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
    context.isAuthPassed = true;
    return next(context);
  };
}

import { createHmac } from 'crypto';

function generateDailyToken(secret: string, username: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return createHmac('sha256', secret).update(username + date).digest('hex');
}
export async function sendSessionCookie(context: Context, next: (ctx: any) => Promise<Response|void>):Promise<Response|void> {
  const res = await next(context);
  if (context.isAuthPassed && res) {
    const usr = (globalThis as any).ADMIN_AUTH_BASIC_USR_PWD.split(':')[0];
    const secret = (globalThis as any).API_SECRET || 'default_secret';

    const token = generateDailyToken(secret, usr);

    const expires = new Date();
    expires.setHours(23, 59, 59, 999); // End of day

    res.headers.append('Set-Cookie',
                       `api_token=${token}; Path=/api; HttpOnly; Secure; SameSite=Strict; Expires=${expires.toUTCString()}`);
  }
  return res;
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
