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

import { createLogger, LogScope } from '../../utils/logger';

const logger = createLogger('R2Service', LogScope.SYSTEM);

export class R2Service {
  private bucket: R2Bucket;
  
  constructor(bucket: R2Bucket) {
    this.bucket = bucket;
  }

  async listObjects(prefix?: string) {
    try {
      const options: R2ListOptions = {
        prefix,
        delimiter: '/',
      };
      
      const result = await this.bucket.list(options);
      logger.info('Listed objects', { prefix, count: result.objects.length });
      
      return result;
    } catch (error) {
      logger.error('Failed to list objects', error);
      throw error;
    }
  }

  async listFolders() {
    try {
      const result = await this.bucket.list({ delimiter: '/' });
      const folders = result.delimitedPrefixes || [];
      
      logger.info('Listed folders', { count: folders.length });
      return folders;
    } catch (error) {
      logger.error('Failed to list folders', error);
      throw error;
    }
  }

  async searchObjects(query: string, prefix?: string) {
    try {
      // Get all objects with the given prefix
      const options: R2ListOptions = { 
        prefix,
        // Use a large limit to get as many objects as possible
        limit: 1000,
      };
      
      const result = await this.bucket.list(options);
      
      // Filter objects based on the search query (case-insensitive)
      const lowercaseQuery = query.toLowerCase();
      const filteredObjects = result.objects.filter(obj => 
        obj.key.toLowerCase().includes(lowercaseQuery)
      );
      
      logger.info('Searched objects', { 
        query, 
        prefix, 
        totalResults: result.objects.length,
        matchedResults: filteredObjects.length 
      });
      
      return {
        objects: filteredObjects,
        delimitedPrefixes: result.delimitedPrefixes
      };
    } catch (error) {
      logger.error('Failed to search objects', error);
      throw error;
    }
  }

  async getObject(key: string) {
    try {
      const object = await this.bucket.get(key);
      if (!object) {
        logger.warn('Object not found', { key });
        return null;
      }
      
      logger.info('Got object', { key });
      return object;
    } catch (error) {
      logger.error('Failed to get object', error);
      throw error;
    }
  }

  async putObject(key: string, data: ReadableStream | ArrayBuffer | string) {
    try {
      await this.bucket.put(key, data);
      logger.info('Put object', { key });
    } catch (error) {
      logger.error('Failed to put object', error);
      throw error;
    }
  }

  async deleteObject(key: string) {
    try {
      await this.bucket.delete(key);
      logger.info('Deleted object', { key });
    } catch (error) {
      logger.error('Failed to delete object', error);
      throw error;
    }
  }
} 