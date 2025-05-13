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

class API {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }
  async post(path, data, options = {}) {
    options.method = 'POST';
    if(!data instanceof FormData){
      if(data instanceof String){
        // Later
      }
    }
    options.body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(path, options);
  }
  async request(path, options = {}) {
    options.headers = {
      'X-Api-Token' : 'your-api-token',
      ...options.headers
    };
    const url = this.baseUrl + path;
    const response = await fetch(url, options);

    if(!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response;
  }

  async listFiles(prefix = '') {
    const response = await this.request(`/api/files/list?prefix=${encodeURIComponent(prefix)}`);
    return response.json();
  }

  async listFolders() {
    const response = await this.request('/api/files/folders');
    return response.json();
  }

  async searchFiles(query, prefix = '') {
    const params = new URLSearchParams({
      query: query
    });
    
    if (prefix) {
      params.append('prefix', prefix);
    }
    
    const response = await this.request(`/api/files/search?${params.toString()}`);
    return response.json();
  }

  async getFile(key) {
    return this.request(`/api/files/get?key=${encodeURIComponent(key)}`);
  }

  async uploadFile(file, path = '') {
    const formData = new FormData();
    formData.append('file', file);
    if(path) {
      formData.append('path', path);
    }

    return this.request('/api/files/upload', {
      method : 'POST',
      body   : formData
    }).then(r => r.json());
  }

  async deleteFile(key) {
    return this.request(`/api/files/delete?key=${encodeURIComponent(key)}`, {
      method : 'DELETE'
    }).then(r => r.json());
  }

  async initiateMultipartUpload(key) {
    return this.request(`/api/files/multipart/init?key=${encodeURIComponent(key)}`, {
      method : 'POST',
    })
      .then(r => r.json());
  }

  async uploadPart(key, uploadId, partNumber, chunk) {
    // my url is : breadcrumb >>> https://r2m.tansautn.workers.dev/
    return this.request(
      `/api/files/multipart/upload?key=${encodeURIComponent(key)}&uploadId=${uploadId}&partNumber=${partNumber}`,
      {
        method: 'POST',
        body: chunk
      }
    ).then(r => r.json());
  }

  async completeMultipartUpload(key, uploadId, parts) {
    return this.request('/api/files/multipart/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key, uploadId, parts })
    }).then(r => r.json());
  }
}

/**
 * Fetches the list of folders from the server.
 * @returns {Promise<Array<string>>} A promise resolving to the list of folders.
 */
async function listFolders() {
    const api = new API();
    try {
        const response = await api.listFolders();
        return response.data || [];
    } catch (error) {
        console.error('Error fetching folders:', error);
        return [];
    }
}

/**
 * Searches for files matching the query.
 * @param {string} query - The search query
 * @param {string} prefix - Optional prefix to limit search scope
 * @returns {Promise<Object>} A promise resolving to the search results
 */
async function searchFiles(query, prefix = '') {
    const api = new API();
    try {
        const response = await api.searchFiles(query, prefix);
        return response.data || { objects: [], delimitedPrefixes: [] };
    } catch (error) {
        console.error('Error searching files:', error);
        return { objects: [], delimitedPrefixes: [] };
    }
}
