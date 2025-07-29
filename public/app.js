// HEIC to JPG Converter - Node.js Version
// Frontend JavaScript for Express.js backend

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const outputFormat = document.getElementById('outputFormat');
const stripExif = document.getElementById('stripExif');
const uploadedFilesStack = document.getElementById('uploadedFilesStack');
const convertedFilesStack = document.getElementById('convertedFilesStack');
const downloadAllSection = document.getElementById('downloadAllSection');
const convertedFilesList = document.getElementById('convertedFilesList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const errorDisplay = document.getElementById('errorDisplay');
const errorMessage = document.getElementById('errorMessage');
const successDisplay = document.getElementById('successDisplay');
const successMessage = document.getElementById('successMessage');
const loadingOverlay = document.getElementById('loadingOverlay');
const seoToggle = document.getElementById('seoToggle');
const seoContentInner = document.getElementById('seoContentInner');
const seoIcon = document.getElementById('seoIcon');

// State
let uploadedFiles = [];
let convertedFiles = [];
let isConverting = false;

// API Base URL
const API_BASE = window.location.origin;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadFiles();
});

function setupEventListeners() {
    // Upload area events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Button events
    downloadAllBtn.addEventListener('click', downloadAllFiles);
    
    // SEO toggle
    seoToggle.addEventListener('click', toggleSEOContent);
}

// File Upload Functions
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    const heicFiles = files.filter(file => 
        file.type === 'image/heic' || 
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif')
    );
    
    if (heicFiles.length === 0) {
        showError('Please select valid HEIC/HEIF files.');
        return;
    }
    
    uploadFiles(heicFiles);
}

async function uploadFiles(files) {
    showLoading(true);
    
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    
    try {
        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            uploadedFiles = uploadedFiles.concat(result.files);
            updateFileList();
            showSuccess('Files uploaded successfully!');
        } else {
            showError(result.error || 'Upload failed.');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError('Upload failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

// File Conversion Functions
async function convertSingleFile(fileId) {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) {
        showError('File not found.');
        return;
    }
    
    isConverting = true;
    updateUI();
    
    const data = {
        fileIds: [fileId],
        outputFormat: outputFormat.value,
        stripExif: stripExif.checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update file status
            const item = result.results[0];
            if (item && item.success) {
                file.status = 'converted';
                file.convertedFilename = item.convertedFilename;
                file.outputFormat = outputFormat.value;
            }
            
            updateFileList();
            showSuccess('File converted successfully!');
        } else {
            showError(result.error || 'Conversion failed.');
        }
    } catch (error) {
        console.error('Conversion error:', error);
        showError('Conversion failed. Please try again.');
    } finally {
        isConverting = false;
        updateUI();
    }
}

async function convertFiles() {
    if (uploadedFiles.length === 0) {
        showError('No files to convert.');
        return;
    }
    
    isConverting = true;
    updateUI();
    
    const fileIds = uploadedFiles.map(file => file.id);
    const data = {
        fileIds: fileIds,
        outputFormat: outputFormat.value,
        stripExif: stripExif.checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update file statuses
            result.results.forEach(item => {
                const file = uploadedFiles.find(f => f.id === item.fileId);
                if (file && item.success) {
                    file.status = 'converted';
                    file.convertedFilename = item.convertedFilename;
                    file.outputFormat = outputFormat.value;
                }
            });
            
            updateFileList();
            showSuccess('Files converted successfully!');
        } else {
            showError(result.error || 'Conversion failed.');
        }
    } catch (error) {
        console.error('Conversion error:', error);
        showError('Conversion failed. Please try again.');
    } finally {
        isConverting = false;
        updateUI();
    }
}

// File Management Functions
function updateFileList() {
    if (uploadedFiles.length === 0) {
        uploadedFilesStack.classList.add('hidden');
        convertedFilesStack.classList.add('hidden');
        downloadAllSection.classList.add('hidden');
        // Reset upload area size
        uploadArea.style.minHeight = '400px';
        uploadArea.style.padding = '4rem';
        return;
    }
    
    // Show uploaded files stack
    uploadedFilesStack.classList.remove('hidden');
    uploadedFilesStack.innerHTML = '';
    
    // Create individual file stacks
    uploadedFiles.forEach(file => {
        const fileElement = createUploadedFileElement(file);
        uploadedFilesStack.appendChild(fileElement);
    });
    
    // Update converted files stack
    const converted = uploadedFiles.filter(f => f.status === 'converted');
    if (converted.length > 0) {
        convertedFilesStack.classList.remove('hidden');
        convertedFilesList.innerHTML = '';
        
        // Add individual converted files
        converted.forEach(file => {
            const convertedElement = createConvertedFileElement(file);
            convertedFilesList.appendChild(convertedElement);
        });
        
        // Show download all section if multiple files
        if (converted.length > 1) {
            downloadAllSection.classList.remove('hidden');
        } else {
            downloadAllSection.classList.add('hidden');
        }
        
        // Shrink upload area
        uploadArea.style.minHeight = '200px';
        uploadArea.style.padding = '2rem';
    } else {
        convertedFilesStack.classList.add('hidden');
        downloadAllSection.classList.add('hidden');
    }
}

function createUploadedFileElement(file) {
    const div = document.createElement('div');
    div.className = 'bg-white border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow';
    
    const status = file.status === 'converted' ? '✅ Converted' : '📁 Ready to Convert';
    const statusColor = file.status === 'converted' ? 'text-green-600' : 'text-blue-600';
    const buttonText = file.status === 'converted' ? 'Download' : 'Convert';
    const buttonClass = file.status === 'converted' ? 'btn-success' : 'btn-primary';
    
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div>
                    <p class="font-medium text-gray-800 text-lg">${file.originalName}</p>
                    <p class="text-sm text-gray-500">${formatFileSize(file.size)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <span class="text-sm ${statusColor} font-medium">${status}</span>
                <button class="${buttonClass} text-lg px-6 py-3 action-button" data-file-id="${file.id}" data-action="${file.status === 'converted' ? 'download' : 'convert'}">
                    ${buttonText}
                </button>
            </div>
        </div>
    `;
    
    // Add event listener to the button
    const button = div.querySelector('.action-button');
    button.addEventListener('click', function() {
        const fileId = this.getAttribute('data-file-id');
        const action = this.getAttribute('data-action');
        
        if (action === 'convert') {
            convertSingleFile(fileId);
        } else if (action === 'download') {
            downloadFile(fileId);
        }
    });
    
    return div;
}

function createConvertedFileElement(file) {
    const div = document.createElement('div');
    div.className = 'bg-white border border-green-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow';
    
    const outputName = file.originalName.replace(/\.(heic|heif)$/i, `.${file.outputFormat}`);
    
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div>
                    <p class="font-medium text-gray-800 text-lg">${outputName}</p>
                    <p class="text-sm text-gray-500">Converted from ${file.originalName} to ${file.outputFormat.toUpperCase()}</p>
                </div>
            </div>
            <button class="btn-success text-lg px-6 py-3 download-button" data-file-id="${file.id}">
                Download
            </button>
        </div>
    `;
    
    // Add event listener to the button
    const button = div.querySelector('.download-button');
    button.addEventListener('click', function() {
        const fileId = this.getAttribute('data-file-id');
        downloadFile(fileId);
    });
    
    return div;
}

// Download Functions
function downloadFile(fileId) {
    window.location.href = `${API_BASE}/api/download/${fileId}`;
}

function downloadAllFiles() {
    const converted = uploadedFiles.filter(f => f.status === 'converted');
    if (converted.length === 0) {
        showError('No converted files to download.');
        return;
    }
    
    if (converted.length === 1) {
        downloadFile(converted[0].id);
    } else {
        window.location.href = `${API_BASE}/api/download-all`;
    }
}

// Utility Functions
async function loadFiles() {
    try {
        const response = await fetch(`${API_BASE}/api/files`);
        const result = await response.json();
        
        uploadedFiles = result.files || [];
        convertedFiles = result.convertedFiles || [];
        
        updateFileList();
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

async function clearAllFiles() {
    try {
        const response = await fetch(`${API_BASE}/api/clear`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            uploadedFiles = [];
            convertedFiles = [];
            updateFileList();
            showSuccess('All files cleared.');
        } else {
            showError('Failed to clear files.');
        }
    } catch (error) {
        console.error('Clear error:', error);
        showError('Failed to clear files.');
    }
}

function updateUI() {
    // No convert button to update since it's removed
    // Just update loading state if needed
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// UI Functions
function showError(message) {
    errorMessage.textContent = message;
    errorDisplay.classList.remove('hidden');
    setTimeout(() => hideError(), 5000);
}

function hideError() {
    errorDisplay.classList.add('hidden');
}

function showSuccess(message) {
    successMessage.textContent = message;
    successDisplay.classList.remove('hidden');
    setTimeout(() => hideSuccess(), 5000);
}

function hideSuccess() {
    successDisplay.classList.add('hidden');
}

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

function toggleSEOContent() {
    const isVisible = !seoContentInner.classList.contains('hidden');
    
    if (isVisible) {
        seoContentInner.classList.add('hidden');
        seoIcon.style.transform = 'rotate(0deg)';
    } else {
        seoContentInner.classList.remove('hidden');
        seoIcon.style.transform = 'rotate(180deg)';
    }
}

// Toggle Learn More section
function toggleLearnMore() {
    const content = document.getElementById('learnMoreContent');
    const icon = document.getElementById('learnMoreIcon');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
} 