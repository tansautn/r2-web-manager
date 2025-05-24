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

import {createLogger, LogScope} from "../utils/logger";
import {APIContext, Context} from "./context";

type Middleware = (context: Context, next: (ctx?: any) => Promise<Response|void>) => Promise<Response|void>
type RouteHandler = (context: APIContext) => Promise<Response>;


export class Router
{
  private routes: Map<string, RouteHandler>;
  private middlewares: Middleware[];
  private fallbackHandler: RouteHandler | null;
  private logger: any;

  constructor()
  {
    this.routes = new Map();
    this.middlewares = [];
    this.fallbackHandler = null;
    this.logger = createLogger('Router', LogScope.ROUTER);
  }

  /**
   * Add middleware to router
   */
  public use(middleware: Middleware): Router
  {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Register route handler
   */
  public register(path: string, handler: RouteHandler, method: string = 'ANY'): Router
  {
    const key = `${method}:${path}`;
    this.logger.debug(`Registering route: ${key}`);
    this.routes.set(key, handler);
    return this;
  }

  /**
   * Register ANY route
   */
  public any(path: string, handler: RouteHandler): Router
  {
    return this.register(path, handler, 'ANY');
  }

  /**
   * Register GET route
   */
  public get(path: string, handler: RouteHandler): Router
  {
    return this.register(path, handler, 'GET');
  }

  /**
   * Register POST route
   */
  public post(path: string, handler: RouteHandler): Router
  {
    return this.register(path, handler, 'POST');
  }

  /**
   * Register PUT route
   */
  public put(path: string, handler: RouteHandler): Router
  {
    return this.register(path, handler, 'PUT');
  }

  /**
   * Register PATCH route
   */
  public patch(path: string, handler: RouteHandler): Router
  {
    return this.register(path, handler, 'PATCH');
  }

  /**
   * Register DELETE route
   */
  public delete(path: string, handler: RouteHandler): Router
  {
    return this.register(path, handler, 'DELETE');
  }

  /**
   * Set fallback handler
   */
  public setFallback(handler: RouteHandler): Router
  {
    this.fallbackHandler = handler;
    return this;
  }

  /**
   * Match route pattern
   * @private
   */
  private _matchRoute(pattern: string, path: string): RegExpMatchArray | null
  {
    const normalizedPattern = pattern.replace(/\/+$/, '');
    const normalizedPath = path.replace(/\/+$/, '');
    const patternHasLeadingSlash = normalizedPattern.startsWith('/');
    const pathHasLeadingSlash = normalizedPath.startsWith('/');
    let finalPattern = normalizedPattern;
    let finalPath = normalizedPath;
    if (patternHasLeadingSlash && !pathHasLeadingSlash) {
      finalPath = '/' + finalPath;
    } else if (!patternHasLeadingSlash && pathHasLeadingSlash) {
      finalPattern = '/' + finalPattern;
    }

    this.logger.debug(`Matching pattern: "${finalPattern}" against path: "${finalPath}"`);

    // Convert pattern to regex
    const regexPattern = finalPattern
      .replace(/\//g, '\\/') // Escape forward slashes
      .replace(/\*/g, '.*') // Convert * to .*
      .replace(/:(\w+)/g, '([^/]+)'); // Convert :param to capture group

    const regex = new RegExp(`^${regexPattern}$`);
    return finalPath.match(regex);
  }

  /**
   * Try to serve static file with proper content type
   */
  private async _tryServeStaticFile(context: Context): Promise<Response | null>
  {
    if (context.env?.DISABLE_STATIC_FILE_SERVING || context.request.method !== 'GET') {
      return null;
    }

    const url = new URL(context.request.url);
    let filePath = url.pathname;

    // Skip static file serving for API routes
    if (filePath.startsWith('/api/') || filePath.startsWith('/dev/')) {
      this.logger.debug(`Skipping static file serving for non-static route: ${filePath}`);
      return null;
    }

    // Handle root path
    if (filePath === '/') {
      filePath = '/index.html';
      this.logger.debug(`Converted root path to: ${filePath}`);
    }

    try {
      // Try to fetch file from assets directory
      this.logger.debug(`Trying to fetch file from assets directory: ${filePath}`);

      // Remove leading slash for ASSETS.get() - this is crucial!
      // Cloudflare ASSETS binding doesn't expect a leading slash
      const normalizedPath = filePath.replace(/^\//, '');
      this.logger.debug(`Normalized path (removed leading slash): ${normalizedPath}`);

      // Check if ASSETS is defined
      if (!context.env.ASSETS) {
        this.logger.error('ASSETS binding is not properly configured');
        return null;
      }

      // Try to get file from ASSETS - two possible methods
      let file;

      try {
        // First try the get() method
        this.logger.debug(`Getting file from ASSETS.get(): ${normalizedPath}`);
        file = await context.env.ASSETS.get(normalizedPath);
      }
      catch (getError: any) {
        this.logger.error(`Error with ASSETS.get(): ${getError.message}`);

        // If get() fails, try fetch() method
        try {
          this.logger.debug(`Trying ASSETS.fetch() method: ${normalizedPath}`);
          const response = await context.env.ASSETS.fetch(`http://placeholder/${normalizedPath}`);

          if (response.status === 200) {
            file = await response.blob();
            this.logger.debug(`Successfully fetched file via fetch(): ${normalizedPath}`);
          } else {
            this.logger.debug(`File not found via fetch(): ${normalizedPath} (${response.status})`);
          }
        }
        catch (fetchError: any) {
          this.logger.error(`Error with both get() and fetch() methods: ${fetchError.message}`);
        }
      }

      // Check if file exists
      if (!file) {
        this.logger.debug(`File not found in ASSETS: ${normalizedPath}`);
        return null;
      }

      this.logger.info(`Successfully retrieved file from ASSETS: ${normalizedPath}`);

      // Get content type based on file extension
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      const contentTypes: Record<string, string> = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf'
      };

      const headers = new Headers({
                                    'Content-Type': contentTypes[ext] || 'text/plain',
                                    'Cache-Control': 'public, max-age=3600'
                                  });

      return new Response(file, {headers});
    }
    catch (error) {
      this.logger.error(`Static file serving error for path ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Find matching route
   * @private
   */
  private _findRoute(method: string, path: string): RouteHandler | null
  {
//    this.logger.debug(`Finding route for ${method} ${path}`);
    for (const [key, handler] of this.routes) {
      const [routeMethod, routePath] = key.split(':');
      const match = this._matchRoute(routePath, path);
//      this.logger.debug(`Checking route: ${routeMethod}:${routePath} - Match: ${match !== null}`);
      if ((routeMethod === 'ANY' || routeMethod === method) && match) {
//        this.logger.debug(`Route matched: ${routeMethod}:${routePath}`);
        return handler;
      }
    }

    this.logger.debug('No matching route found');
    return null;
  }

  public async createApiContext(request: Request, env: Record<string, any>): Promise<APIContext>
  {
    const {pathname} = new URL(request.url);
    const context = new APIContext(request, env);
    await context.parse();
    return context;
  }

  /**
   * Execute middleware chain with container
   * @private
   */
  private async _executeMiddleware(context: Context, middlewares: Middleware[]): Promise<Response | void>
  {
    let index = 0;

    const next = async (): Promise<void | Response> => {
      if (index >= middlewares.length) {
        return;
      }

      const middleware = middlewares[index++];
      return await middleware(context, next);
    };

    return await next();
  }

  /**
   * Handle incoming request
   */
  public async matchThenDispatch(request: Request, env: Record<string, any>): Promise<Response>
  {
    const {pathname} = new URL(request.url);
    const startTime = Date.now();

    this.logger.debug(`Incoming request: ${request.method} ${pathname}`);
    this.logger.debug(`Registered routes: ${Array.from(this.routes.keys()).join(', ')}`);

    try {
      const context = await this.createApiContext(request, env);

      // Execute middlewares first (including auth middlewares)
      const midRes = await this._executeMiddleware(context, this.middlewares);
      if (midRes) {
        return midRes;
      }

      // Try to serve static file only after middlewares have been executed (and auth has passed)
      const staticResponse = await this._tryServeStaticFile(context);
      if (staticResponse) {
        const duration = Date.now() - startTime;
        this.logger.info(`${request.method} ${pathname} - ${staticResponse.status} (${duration}ms) [static]`);
        return staticResponse;
      }

      // If no static file found, find and execute route handler
      const handler = this._findRoute(request.method, pathname) || this.fallbackHandler;
      if (!handler) {
        this.logger.warn(`No handler found for ${request.method} ${pathname}`);
        return new Response('Not Found', {status: 404});
      }

      const response = await handler(context as APIContext);

      const duration = Date.now() - startTime;
      this.logger.info(`${request.method} ${pathname} - ${response.status} (${duration}ms)`);

      return response;
    }
    catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`${request.method} ${pathname} - Error (${duration}ms)`, error);

      return new Response('Internal Server Error', {status: 500});
    }
  }
} 
