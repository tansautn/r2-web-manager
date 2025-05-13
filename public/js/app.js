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

class FileManager {
  constructor() {
    this.api = new API();
    this.currentPath = '';
    this.isSearchMode = false;
    this.searchQuery = '';
    this.initElements();
    this.initEventListeners();
    this.loadFolders();
    this.loadFiles();
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
      const folders = await listFolders();
      this.renderFolders(folders);
    } catch (error) {
      console.error('Failed to load folders:', error);
      this.showError('Failed to load folders');
    }
  }

  async loadFiles() {
    try {
      const {data} = await this.api.listFiles(this.currentPath);
      this.renderFiles(data);
      this.updateBreadcrumb();
    }
    catch(error) {
      console.error('Failed to load files:', error);
      this.showError('Failed to load files');
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
      this.isSearchMode = true;
      this.searchQuery = query;
      const results = await searchFiles(query, this.currentPath);
      this.renderSearchResults(results);
    } catch (error) {
      console.error('Failed to search files:', error);
      this.showError('Failed to search files');
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
          const fullUrl = 'https://cdn.zuko.pro/' + key;
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

    for (const file of files) {
      try {
        const key = this.currentPath + file.name;
        
        // Initiate multipart upload
        const { uploadId } = await this.api.initiateMultipartUpload(key);
        
        // Upload parts
        const parts = [];
        let partNumber = 1;
        
        for (let start = 0; start < file.size; start += CHUNK_SIZE) {
          const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
          const { etag } = await this.api.uploadPart(key, uploadId, partNumber, chunk);
          
          parts.push({
            partNumber: partNumber,
            etag: etag
          });
          
          partNumber++;
          
          // Update progress (optional)
          const progress = Math.round((start + chunk.size) / file.size * 100);
          console.log(`Upload progress: ${progress}%`);
        }
        
        // Complete upload
        await this.api.completeMultipartUpload(key, uploadId, parts);
      } catch (error) {
        console.error('Failed to upload file:', error);
        this.showError(`Failed to upload ${file.name}`);
      }
    }

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
    }
    catch(error) {
      console.error('Failed to delete file:', error);
      this.showError('Failed to delete file');
    }
  }

  async downloadFile(key) {
    try {
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
    }
    catch(error) {
      console.error('Failed to download file:', error);
      this.showError('Failed to download file');
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
    return key.match(/\.(jpg|jpeg|png|gif|txt|md|json)$/i);
  }

  async showPreview(key) {
    try {
      const fileExtension = key.split('.').pop().toLowerCase();
      const response = await this.api.getFile(key);
      const contentType = response.headers.get('content-type');
      
      // Set preview title
      const fileName = key.split('/').pop();
      document.getElementById('previewTitle').textContent = fileName;
      
      if (contentType.startsWith('image/') || /^(jpg|jpeg|png|gif|svg|webp)$/i.test(fileExtension)) {
        // Image preview
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        this.previewBody.innerHTML = `<img src="${url}" alt="${fileName}">`;
      } 
      else if (/^(txt|md|json|js|css|html|xml|csv)$/i.test(fileExtension) || 
              contentType.includes('text/') || 
              contentType.includes('application/json')) {
        // Text preview
        const text = await response.text();
        this.previewBody.innerHTML = `<pre>${this.escapeHtml(text)}</pre>`;
      } 
      else if (/^(pdf)$/i.test(fileExtension) || contentType.includes('application/pdf')) {
        // PDF preview
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        this.previewBody.innerHTML = `
          <object data="${url}" type="application/pdf" width="100%" height="600px">
            <p>Unable to display PDF. <a href="${url}" target="_blank">Download</a> instead.</p>
          </object>
        `;
      } 
      else if (/^(mp3|m4a|wav)$/i.test(fileExtension) || contentType.includes('audio/')) {
        // Audio preview
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        this.previewBody.innerHTML = `
          <audio controls style="width: 100%">
            <source src="${url}" type="${contentType}">
            Your browser does not support the audio element.
          </audio>
        `;
      }
      else if (/^(mp4|mov|mpeg4|mpeg)$/i.test(fileExtension) || contentType.includes('video/')) {
        // Video preview
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        this.previewBody.innerHTML = `
          <video controls style="max-width: 100%; max-height: 500px">
            <source src="${url}" type="${contentType}">
            Your browser does not support the video element.
          </video>
        `;
      }
      else {
        // Unsupported format
        this.previewBody.innerHTML = `
          <div class="unsupported-format">
            <p>Cannot preview this file format.</p>
            <button class="btn primary" id="previewDownloadBtn">Download File</button>
          </div>
        `;
        
        document.getElementById('previewDownloadBtn').addEventListener('click', () => {
          this.closePreviewModal();
          this.downloadFile(key);
        });
      }

      this.preview.style.display = 'block';
    }
    catch(error) {
      console.error('Failed to preview file:', error);
      this.showError('Failed to preview file');
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

// Initialize the app
new FileManager();
