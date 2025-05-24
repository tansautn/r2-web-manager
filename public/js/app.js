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

let CDN_URL = 'https://your.r2.dev/';

// Configure NProgress
NProgress.configure({
  minimum: 0.1,
  showSpinner: true,
  trickleSpeed: 200,
  easing: 'ease',
  speed: 500
});

class FileManager {
  constructor() {
    this.api = new API();
    this.currentPath = '';
    this.isSearchMode = false;
    this.searchQuery = '';
    this.initApp();
  }

  async initApp() {
    try {
      await this.loadConfig();
      this.initElements();
      this.initEventListeners();
      this.loadFolders();
      this.loadFiles();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      alert('Failed to initialize app. Please try refreshing the page.');
    }
  }

  async loadConfig() {
    try {
      const { data } = await this.api.getConfig();
      if (data && data.cdnBaseUrl) {
        CDN_URL = data.cdnBaseUrl;
        console.log('Loaded CDN_URL from config:', CDN_URL);
      }
    } catch (error) {
      console.error('Failed to load config, using default CDN_URL:', error);
    }
  }

  initElements() {
    this.fileExplorer = document.getElementById('fileExplorer');
    this.foldersList = document.getElementById('foldersList');
    this.breadcrumb = document.getElementById('breadcrumb');
    this.uploadBtn = document.getElementById('uploadBtn');
    this.fileInput = document.getElementById('fileInput');
    this.newFolderBtn = document.getElementById('newFolderBtn');
    this.preview = document.getElementById('preview');
    this.previewBody = document.getElementById('previewBody');
    this.closePreview = document.getElementById('closePreview');
    this.searchInput = document.getElementById('searchInput');
    this.searchBtn = document.getElementById('searchBtn');
  }

  initEventListeners() {
    this.uploadBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    this.newFolderBtn.addEventListener('click', () => this.createFolder());
    this.closePreview.addEventListener('click', () => this.closePreviewModal());
    this.searchBtn.addEventListener('click', () => this.handleSearch());
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch();
      }
    });
  }

  async loadFolders() {
    try {
      NProgress.start();
      const folders = await listFolders();
      this.renderFolders(folders);
      NProgress.done();
    } catch (error) {
      console.error('Failed to load folders:', error);
      this.showError('Failed to load folders');
      NProgress.done();
    }
  }

  async loadFiles() {
    try {
      NProgress.start();
      const {data} = await this.api.listFiles(this.currentPath);
      this.renderFiles(data);
      this.updateBreadcrumb();
      NProgress.done();
    }
    catch(error) {
      console.error('Failed to load files:', error);
      this.showError('Failed to load files');
      NProgress.done();
    }
  }

  async handleSearch() {
    const query = this.searchInput.value.trim();
    if (!query) {
      this.isSearchMode = false;
      this.loadFiles();
      return;
    }

    try {
      NProgress.start();
      this.isSearchMode = true;
      this.searchQuery = query;
      const results = await searchFiles(query, this.currentPath);
      this.renderSearchResults(results);
      NProgress.done();
    } catch (error) {
      console.error('Failed to search files:', error);
      this.showError('Failed to search files');
      NProgress.done();
    }
  }

  renderSearchResults(results) {
    const files = results.objects || [];
    
    this.fileExplorer.innerHTML = `
      <div class="search-results-header">
        <h3>Search results for "${this.searchQuery}"</h3>
        <button class="btn clear-search" id="clearSearch">Clear Search</button>
      </div>
    `;

    if (files.length === 0) {
      this.fileExplorer.innerHTML += '<div class="no-results">No files found</div>';
    } else {
      this.fileExplorer.innerHTML += files.map(file => `
        <div class="file-item" data-key="${file.key}">
          <span class="file-icon">${this.getFileIcon(file)}</span>
          <span class="file-name">${file.key.split('/').pop()}</span>
          <div class="file-actions">
            ${this.getFileActions(file)}
          </div>
        </div>
      `).join('');
    }

    document.getElementById('clearSearch').addEventListener('click', () => {
      this.searchInput.value = '';
      this.isSearchMode = false;
      this.loadFiles();
    });

    this.attachFileEventListeners();
  }

  renderFolders(folders) {
    if (!folders || folders.length === 0) {
      this.foldersList.innerHTML = '<div class="no-folders">No folders found</div>';
      return;
    }

    this.foldersList.innerHTML = folders.map(folder => `
      <div class="folder-item" data-path="${folder}">
        <span class="folder-icon">📁</span>
        <span class="folder-name">${folder.split('/').filter(Boolean).pop() || 'Root'}</span>
      </div>
    `).join('');

    // Add event listeners to folder items
    const folderItems = this.foldersList.querySelectorAll('.folder-item');
    folderItems.forEach(item => {
      item.addEventListener('click', () => {
        this.currentPath = item.dataset.path;
        this.loadFiles();
      });
    });
  }

  renderFiles(data) {
    const files = data.objects || [];
    const delimitedPrefixes = data.delimitedPrefixes || [];

    // Render files
    this.fileExplorer.innerHTML = '';
    
    // Add folders from current listing
    if (delimitedPrefixes.length > 0) {
      delimitedPrefixes.forEach(prefix => {
        this.fileExplorer.innerHTML += `
          <div class="file-item folder" data-key="${prefix}">
            <span class="file-icon">📁</span>
            <span class="file-name">${prefix.split('/').filter(Boolean).pop()}</span>
          </div>
        `;
      });
    }

    // Add files (excluding folders)
    const filteredFiles = files.filter(file => !file.key.endsWith('/'));
    if (filteredFiles.length > 0) {
      filteredFiles.forEach(file => {
        this.fileExplorer.innerHTML += `
          <div class="file-item" data-key="${file.key}">
            <span class="file-icon">${this.getFileIcon(file)}</span>
            <span class="file-name">${file.key.split('/').pop()}</span>
            <div class="file-actions">
              ${this.getFileActions(file)}
            </div>
          </div>
        `;
      });
    }

    // Show message if no files
    if (delimitedPrefixes.length === 0 && filteredFiles.length === 0) {
      this.fileExplorer.innerHTML = '<div class="no-files">No files found</div>';
    }

    this.attachFileEventListeners();
  }

  attachFileEventListeners() {
    // Remove previous event listeners by cloning and replacing the element
    const fileExplorerClone = this.fileExplorer.cloneNode(true);
    this.fileExplorer.parentNode.replaceChild(fileExplorerClone, this.fileExplorer);
    this.fileExplorer = fileExplorerClone;

    // Add event listeners to file items
    const fileItems = this.fileExplorer.querySelectorAll('.file-item');
    fileItems.forEach(item => {
      const key = item.dataset.key;
      
      // Find action buttons in this item
      const deleteBtn = item.querySelector('.delete-btn');
      const downloadBtn = item.querySelector('.download-btn');
      const uriBtn = item.querySelector('.download-uri');
      
      // Add specific listeners to each button
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteFile(key);
        });
      }
      
      if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.downloadFile(key);
        });
      }
      
      if (uriBtn) {
        uriBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const fullUrl = CDN_URL + key;
          this.copyToClipboard(fullUrl);
        });
      }
      
      // Add click event to the item itself
      item.addEventListener('click', () => this.handleFileClick(key));
    });
  }

  getFileIcon(file) {
    // Add more file type icons as needed
    if(file.key.endsWith('/')) {
      return '📁';
    }
    if(file.key.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return '🖼️';
    }
    if(file.key.match(/\.(txt|md|json)$/i)) {
      return '📄';
    }
    return '📎';
  }

  getFileActions(file) {
    if(file.key.endsWith('/')) {
      return '';
    }
    return `
            <button class="btn download-uri">🔗</button>
            <button class="btn download-btn">⬇️</button>
            <button class="btn delete-btn">🗑️</button>
        `;
  }

  updateBreadcrumb() {
    const parts = this.currentPath.split('/').filter(Boolean);
    let path = '';

    this.breadcrumb.innerHTML = `
            <span class="breadcrumb-item" data-path="">root</span>
            ${parts.map(part => {
      path += part + '/';
      return `<span>/</span><span class="breadcrumb-item" data-path="${path}">${part}</span>`;
    }).join('')}
        `;

    this.breadcrumb.addEventListener('click', (e) => {
      const item = e.target.closest('.breadcrumb-item');
      if(item) {
        this.currentPath = item.dataset.path;
        this.isSearchMode = false;
        this.searchInput.value = '';
        this.loadFiles();
      }
    });
  }

  async handleFileUpload(event) {
    const files = Array.from(event.target.files);
    const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks
    
    if (files.length === 0) return;
    
    // Start NProgress
    NProgress.start();
    
    // Calculate total size for all files
    const totalSize = files.reduce((total, file) => total + file.size, 0);
    let uploadedSize = 0;
    
    for (const file of files) {
      try {
        const key = this.currentPath + file.name;
        
        // Initiate multipart upload
        const { uploadId } = await this.api.initiateMultipartUpload(key);
        
        // Upload parts
        const parts = [];
        let partNumber = 1;
        let fileUploadedSize = 0;
        
        for (let start = 0; start < file.size; start += CHUNK_SIZE) {
          const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
          const { etag } = await this.api.uploadPart(key, uploadId, partNumber, chunk);
          
          parts.push({
            partNumber: partNumber,
            etag: etag
          });
          
          partNumber++;
          
          // Update progress
          fileUploadedSize += chunk.size;
          uploadedSize += chunk.size;
          const totalProgress = uploadedSize / totalSize;
          
          // Update NProgress
          NProgress.set(totalProgress);
                    // Update progress (optional)
                    const progress = Math.round((start + chunk.size) / file.size * 100);
                    console.log(`Upload progress: ${progress}%`);
          console.log(`N progress for ${file.name}: ${totalProgress}%`);
        }
        
        // Complete upload
        await this.api.completeMultipartUpload(key, uploadId, parts);
      } catch (error) {
        console.error('Failed to upload file:', error);
        this.showError(`Failed to upload ${file.name}`);
        // Don't stop NProgress here, continue with other files
      }
    }

    // Complete NProgress
    NProgress.done();
    
    this.fileInput.value = '';
    this.loadFiles();
    this.loadFolders(); // Refresh folders list
  }

  async createFolder() {
    const name = prompt('Enter folder name:');
    if(!name) {
      return;
    }

    const path = this.currentPath + name + '/';
    try {
      await this.api.uploadFile(new File([''], '.keep'), path);
      this.loadFiles();
      this.loadFolders(); // Refresh folders list
    }
    catch(error) {
      console.error('Failed to create folder:', error);
      this.showError('Failed to create folder');
    }
  }

  async deleteFile(key) {
    if(!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      NProgress.start();
      await this.api.deleteFile(key);
      
      // Refresh files display
      if (this.isSearchMode) {
        this.handleSearch(); // Re-run search if in search mode
      } else {
        this.loadFiles();
      }
      
      // Refresh folders if needed
      if (key.endsWith('/')) {
        this.loadFolders();
      }
      NProgress.done();
    }
    catch(error) {
      console.error('Failed to delete file:', error);
      this.showError('Failed to delete file');
      NProgress.done();
    }
  }

  async downloadFile(key) {
    try {
      NProgress.start();
      const response = await this.api.getFile(key);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = key.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      NProgress.done();
    }
    catch(error) {
      console.error('Failed to download file:', error);
      this.showError('Failed to download file');
      NProgress.done();
    }
  }

  async handleFileClick(key) {
    if(key.endsWith('/')) {
      this.currentPath = key;
      this.isSearchMode = false;
      this.searchInput.value = '';
      this.loadFiles();
      return;
    }

    if(this.isPreviewable(key)) {
      this.showPreview(key);
    }
    else {
      this.downloadFile(key);
    }
  }

  isPreviewable(key) {
    const fileExtension = key.split('.').pop().toLowerCase();
    
    return /\.(jpg|jpeg|png|gif|svg|webp|txt|md|json|js|css|html|xml|csv|pdf|mp3|m4a|wav|ogg|aac|mp4|mov|mpeg4|mpeg|webm|avi|mkv)$/i.test(key);
  }

  async showPreview(key) {
    try {
      NProgress.start();
      const fileExtension = key.split('.').pop().toLowerCase();      
      const isAudio = /^(mp3|m4a|wav|ogg|aac)$/i.test(fileExtension);
      const isVideo = /^(mp4|mov|mpeg4|mpeg|webm|avi|mkv)$/i.test(fileExtension);      
      const fileName = key.split('/').pop();
      document.getElementById('previewTitle').textContent = fileName;
      this.previewBody.innerHTML = '<div class="loading-preview">Loading preview...</div>';
      const encodedKey = encodeURIComponent(key);
      
      if (isAudio) {
        const audioSrc = CDN_URL + key;
        this.previewBody.innerHTML = `
          <div class="audio-preview">
            <audio controls style="width: 100%">
              <source src="${audioSrc}" type="audio/${fileExtension}">
              Your browser does not support the audio element.
            </audio>
            <div class="audio-download">
              <button class="btn primary" id="audioDownloadBtn">Download Audio</button>
              <button class="btn" id="audioCopyBtn">Copy Link</button>
            </div>
          </div>
        `;
        
        document.getElementById('audioDownloadBtn').addEventListener('click', (e) => {
          e.preventDefault();
          this.downloadFile(key);
        });
        
        document.getElementById('audioCopyBtn').addEventListener('click', (e) => {
          e.preventDefault();
          this.copyToClipboard(audioSrc);
          alert('Link copied to clipboard!');
        });
        NProgress.done();
      } 
      else if (isVideo) {
        const videoSrc = CDN_URL + key;
        this.previewBody.innerHTML = `
          <div class="video-preview">
            <video controls style="max-width: 100%; max-height: 70vh">
              <source src="${videoSrc}" type="video/${fileExtension === 'mov' ? 'mp4' : fileExtension}">
              Your browser does not support the video element.
            </video>
            <div class="video-download">
              <button class="btn primary" id="videoDownloadBtn">Download Video</button>
              <button class="btn" id="videoCopyBtn">Copy Link</button>
            </div>
          </div>
        `;
        
        document.getElementById('videoDownloadBtn').addEventListener('click', (e) => {
          e.preventDefault();
          this.downloadFile(key);
        });
        
        document.getElementById('videoCopyBtn').addEventListener('click', (e) => {
          e.preventDefault();
          this.copyToClipboard(videoSrc);
          alert('Link copied to clipboard!');
        });
        NProgress.done();
      }
      else {
        const response = await this.api.getFile(key);
        const contentType = response.headers.get('content-type');
        
        if (contentType.startsWith('image/') || /^(jpg|jpeg|png|gif|svg|webp)$/i.test(fileExtension)) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          this.previewBody.innerHTML = `
            <div class="image-preview">
              <img src="${url}" alt="${fileName}">
              <div class="image-download">
                <button class="btn primary" id="imageDownloadBtn">Download Image</button>
                <button class="btn" id="imageCopyBtn">Copy Link</button>
              </div>
            </div>
          `;
          
          document.getElementById('imageDownloadBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadFile(key);
          });
          
          document.getElementById('imageCopyBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.copyToClipboard(CDN_URL + key);
            alert('Link copied to clipboard!');
          });
          NProgress.done();
        } 
        else if (/^(txt|md|json|js|css|html|xml|csv)$/i.test(fileExtension) || 
                contentType.includes('text/') || 
                contentType.includes('application/json')) {
          const text = await response.text();
          this.previewBody.innerHTML = `
            <pre>${this.escapeHtml(text)}</pre>
            <div class="text-download">
              <button class="btn primary" id="textDownloadBtn">Download File</button>
              <button class="btn" id="textCopyBtn">Copy Link</button>
            </div>
          `;
          
          document.getElementById('textDownloadBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadFile(key);
          });
          
          document.getElementById('textCopyBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.copyToClipboard(CDN_URL + key);
            alert('Link copied to clipboard!');
          });
          NProgress.done();
        } 
        else if (/^(pdf)$/i.test(fileExtension) || contentType.includes('application/pdf')) {
          const pdfSrc = CDN_URL + key;
          this.previewBody.innerHTML = `
            <object data="${pdfSrc}" type="application/pdf" width="100%" height="600px">
              <p>Unable to display PDF. <a href="${pdfSrc}" target="_blank">Download</a> instead.</p>
            </object>
            <div class="pdf-download">
              <button class="btn primary" id="pdfDownloadBtn">Download PDF</button>
              <button class="btn" id="pdfCopyBtn">Copy Link</button>
            </div>
          `;
          
          document.getElementById('pdfDownloadBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadFile(key);
          });
          
          document.getElementById('pdfCopyBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.copyToClipboard(pdfSrc);
            alert('Link copied to clipboard!');
          });
          NProgress.done();
        } 
        else {
          this.previewBody.innerHTML = `
            <div class="unsupported-format">
              <p>Cannot preview this file format.</p>
              <div class="unsupported-actions">
                <button class="btn primary" id="previewDownloadBtn">Download File</button>
                <button class="btn" id="previewCopyBtn">Copy Link</button>
              </div>
            </div>
          `;
          
          document.getElementById('previewDownloadBtn').addEventListener('click', () => {
            this.closePreviewModal();
            this.downloadFile(key);
          });
          
          document.getElementById('previewCopyBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.copyToClipboard(CDN_URL + key);
            alert('Link copied to clipboard!');
          });
          NProgress.done();
        }
      }
      this.preview.style.display = 'block';
    }
    catch(error) {
      console.error('Failed to preview file:', error);
      this.showError('Failed to preview file');
      NProgress.done();
    }
  }
  
  // Helper method to escape HTML content
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  closePreviewModal() {
    this.preview.style.display = 'none';
    this.previewBody.innerHTML = '';
  }

  showError(message) {
    alert(message); // You can replace this with a better error UI
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    }
    catch(error) {
      console.error('Failed to copy to clipboard:', error);
      this.showError('Failed to copy to clipboard');
    }
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new FileManager();
});
