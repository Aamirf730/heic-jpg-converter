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
    
    // Set file status to converting
    file.status = 'converting';
    updateFileList();
    
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
            } else {
                file.status = 'ready'; // Reset to ready if conversion failed
            }
            
            updateFileList();
            if (item && item.success) {
                showSuccess('File converted successfully!');
            } else {
                showError(result.error || 'Conversion failed.');
            }
        } else {
            file.status = 'ready'; // Reset to ready if conversion failed
            updateFileList();
            showError(result.error || 'Conversion failed.');
        }
    } catch (error) {
        console.error('Conversion error:', error);
        file.status = 'ready'; // Reset to ready if conversion failed
        updateFileList();
        showError('Conversion failed. Please try again.');
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
        downloadAllSection.classList.add('hidden');
        // Reset upload area size
        uploadArea.style.minHeight = '400px';
        uploadArea.style.padding = '4rem';
        return;
    }
    
    // Show uploaded files stack
    uploadedFilesStack.classList.remove('hidden');
    uploadedFilesStack.innerHTML = '';
    
    // Create individual file stacks (only one per file)
    uploadedFiles.forEach(file => {
        const fileElement = createFileElement(file);
        uploadedFilesStack.appendChild(fileElement);
    });
    
    // Show download all section if multiple converted files
    const converted = uploadedFiles.filter(f => f.status === 'converted');
    if (converted.length > 1) {
        downloadAllSection.classList.remove('hidden');
    } else {
        downloadAllSection.classList.add('hidden');
    }
    
    // Shrink upload area if files exist
    if (uploadedFiles.length > 0) {
        uploadArea.style.minHeight = '200px';
        uploadArea.style.padding = '2rem';
    }
}

function createFileElement(file) {
    const div = document.createElement('div');
    div.className = 'bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300';
    div.setAttribute('data-file-id', file.id);
    
    // Set border color based on status
    if (file.status === 'converted') {
        div.classList.add('border-green-200');
    } else if (file.status === 'converting') {
        div.classList.add('border-yellow-200');
    } else {
        div.classList.add('border-blue-200');
    }
    
    const status = file.status === 'converted' ? '✅ Converted' : 
                   file.status === 'converting' ? '⏳ Converting...' : '📁 Ready to Convert';
    const statusColor = file.status === 'converted' ? 'text-green-600' : 
                       file.status === 'converting' ? 'text-yellow-600' : 'text-blue-600';
    
    let buttonContent = '';
    if (file.status === 'converted') {
        buttonContent = `
            <button class="btn-success text-lg px-6 py-3 download-button animate-pulse" data-file-id="${file.id}">
                Download
            </button>
        `;
    } else if (file.status === 'converting') {
        buttonContent = `
            <button class="bg-yellow-500 text-white text-lg px-6 py-3 rounded-lg font-medium" disabled>
                Converting...
            </button>
        `;
    } else {
        buttonContent = `
            <button class="btn-primary text-lg px-6 py-3 convert-button hover:scale-105 transition-transform" data-file-id="${file.id}">
                Convert
            </button>
        `;
    }
    
    // Show converted filename if available
    let fileName = file.originalName;
    let fileInfo = formatFileSize(file.size);
    if (file.status === 'converted' && file.convertedFilename) {
        const outputName = file.originalName.replace(/\.(heic|heif)$/i, `.${file.outputFormat || 'jpeg'}`);
        fileName = outputName;
        fileInfo = `Converted from ${file.originalName} to ${(file.outputFormat || 'jpeg').toUpperCase()}`;
    }
    
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                    file.status === 'converted' ? 'bg-green-100' : 
                    file.status === 'converting' ? 'bg-yellow-100' : 'bg-blue-100'
                }">
                    <svg class="w-6 h-6 transition-colors duration-300 ${
                        file.status === 'converted' ? 'text-green-600' : 
                        file.status === 'converting' ? 'text-yellow-600' : 'text-blue-600'
                    }" fill="currentColor" viewBox="0 0 20 20">
                        ${file.status === 'converted' ? 
                            '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>' :
                            '<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>'
                        }
                    </svg>
                </div>
                <div>
                    <p class="font-medium text-gray-800 text-lg">${fileName}</p>
                    <p class="text-sm text-gray-500">${fileInfo}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <span class="text-sm ${statusColor} font-medium">${status}</span>
                ${buttonContent}
            </div>
        </div>
    `;
    
    // Add event listeners
    const convertButton = div.querySelector('.convert-button');
    const downloadButton = div.querySelector('.download-button');
    
    if (convertButton) {
        convertButton.addEventListener('click', function() {
            const fileId = this.getAttribute('data-file-id');
            convertSingleFile(fileId);
        });
    }
    
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            const fileId = this.getAttribute('data-file-id');
            downloadFile(fileId);
        });
    }
    
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