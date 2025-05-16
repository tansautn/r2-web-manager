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

import logger from './utils/logger';
import { ExtendedExecutionContext, FetchEvent } from "./types/cloudflare";
import { R2Service } from './services/r2/R2Service';

declare global {
    var __bootstrapper: Bootstrapper | undefined;
}

export class Bootstrapper {
    private logger: any;
    public initialized: boolean;
    private env: Record<string, any>;
    private ctx: ExtendedExecutionContext | FetchEvent;
    public r2Service?: R2Service;

    private constructor(env: Record<string, any>, ctx: ExtendedExecutionContext | FetchEvent) {
        this.logger = logger.child('Bootstrap');
        this.initialized = false;
        this.env = env;
        this.ctx = ctx;
    }
    public getEnv(): Record<string, any> {
        return this.env;
    }
    public static getInstance(env: Record<string, any>, ctx: ExtendedExecutionContext | FetchEvent): Bootstrapper {
        if (!globalThis.__bootstrapper) {
            if (!env || !ctx) {
                logger.error('Environment and context are required. App boot failed');
                throw new Error('Environment and context are required');
            }
            globalThis.__bootstrapper = new Bootstrapper(env, ctx);
        }
        return globalThis.__bootstrapper;
    }

    public static getInitialized(): Bootstrapper {
        if (!globalThis.__bootstrapper?.initialized) {
            throw new Error('Bootstrapper not initialized');
        }
        return globalThis.__bootstrapper;
    }

    /**
     * Initialize all required services
     */
    public async init(): Promise<void> {
        if (this.initialized) {
            this.logger.warn('Already initialized');
            return;
        }

        try {
            // Initialize R2 service
            this.logger.info('Initializing R2 service...');
            if (!this.env.R2_BUCKET) {
                throw new Error('R2_BUCKET binding is required');
            }
            this.r2Service = new R2Service(this.env.R2_BUCKET);
            
            // Verify ASSETS binding
            this.logger.info('Verifying ASSETS binding...');
            if (!this.env.ASSETS) {
                this.logger.warn('ASSETS binding is not available - static file serving will not work');
            } else {
                try {
                    // Attempt to log the available methods on ASSETS
                    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.env.ASSETS));
                    this.logger.info(`ASSETS binding is available with methods: ${methods.join(', ')}`);
                    
                    // Verify get method exists
                    if (!methods.includes('get')) {
                        this.logger.warn('ASSETS binding does not have a get method - static file serving may not work correctly');
                    }
                } catch (assetsError) {
                    this.logger.error('Error inspecting ASSETS binding:', assetsError);
                }
            }
            
            this.initialized = true;
            this.logger.info('Bootstrap completed successfully');
        } catch (error) {
            this.logger.error('Bootstrap failed', error);
            throw error;
        }
    }

    /**
     * Get R2 service instance
     */
    public getR2Service(): R2Service {
        if (!this.r2Service) {
            throw new Error('R2 service not initialized');
        }
        return this.r2Service;
    }

    /**
     * Cleanup resources before shutdown
     */
    public async cleanup(): Promise<void> {
        this.logger.info('Cleaning up...');
        // Add cleanup logic here
    }
}

export default Bootstrapper; 
