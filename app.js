// Global state
let files = [];
let isConverting = false;

// DOM elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileListContainer = document.getElementById('fileListContainer');
const dropZoneContainer = document.getElementById('dropZoneContainer');
const headerActions = document.getElementById('headerActions');
const clearAllBtn = document.getElementById('clearAllBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const errorDisplay = document.getElementById('errorDisplay');
const errorMessage = document.getElementById('errorMessage');
const closeError = document.getElementById('closeError');
const successDisplay = document.getElementById('successDisplay');
const successMessage = document.getElementById('successMessage');
const closeSuccess = document.getElementById('closeSuccess');
const fileCount = document.getElementById('fileCount');
const outputFormat = document.getElementById('outputFormat');
const stripExif = document.getElementById('stripExif');
const toggleSwitch = document.getElementById('toggleSwitch');
const toggleThumb = document.getElementById('toggleThumb');
const uploadForm = document.getElementById('uploadForm');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateUI();
    initializeSEOToggle();
    checkMessages();
});

function initializeEventListeners() {
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', () => fileInput.click());
    
    // Settings
    outputFormat.addEventListener('change', handleFormatChange);
    stripExif.addEventListener('change', updateUI);
    toggleSwitch.addEventListener('click', toggleStripExif);
    
    // Buttons
    clearAllBtn.addEventListener('click', clearAllFiles);
    downloadAllBtn.addEventListener('click', downloadAllFiles);
    closeError.addEventListener('click', hideError);
    closeSuccess.addEventListener('click', hideSuccess);
    
    // Form submission
    uploadForm.addEventListener('submit', handleFormSubmit);
    
    // Keyboard navigation
    dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });
}

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
    dropZone.classList.add('scale-105');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    dropZone.classList.remove('scale-105');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    dropZone.classList.remove('scale-105');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
}

function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
    // Reset input to allow selecting the same file again
    e.target.value = '';
}

function handleFiles(fileList) {
    const validFiles = validateFiles(fileList);
    if (validFiles.length > 0) {
        // Add files to the form
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
        
        // Submit the form
        uploadForm.submit();
    }
}

function validateFiles(fileList) {
    const validFiles = [];
    const errors = [];
    
    fileList.forEach(file => {
        // Check file type
        const isValidType = file.name.toLowerCase().match(/\.(heic|heif)$/);
        if (!isValidType) {
            errors.push(`${file.name} is not a valid HEIC/HEIF file`);
            return;
        }
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            errors.push(`${file.name} is too large (max 10MB)`);
            return;
        }
        
        validFiles.push(file);
    });
    
    if (errors.length > 0) {
        showError(errors.join(', '));
        return [];
    }
    
    return validFiles;
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (fileInput.files.length === 0) {
        showError('Please select files to upload.');
        return;
    }
    
    // Show loading state
    isConverting = true;
    updateUI();
    
    // Submit form via AJAX
    const formData = new FormData(uploadForm);
    
    fetch('index.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(html => {
        // Reload the page to show results
        window.location.reload();
    })
    .catch(error => {
        console.error('Upload error:', error);
        showError('Upload failed. Please try again.');
        isConverting = false;
        updateUI();
    });
}

function convertFiles() {
    if (files.length === 0) {
        return;
    }
    
    isConverting = true;
    updateUI();
    
    const formData = new FormData();
    formData.append('action', 'convert');
    formData.append('outputFormat', outputFormat.value);
    formData.append('stripExif', stripExif.checked ? 'on' : 'off');
    
    fetch('index.php?ajax=convert', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Files converted successfully!');
            updateFileList();
        } else {
            showError(data.message || 'Conversion failed.');
        }
        isConverting = false;
        updateUI();
    })
    .catch(error => {
        console.error('Conversion error:', error);
        showError('Conversion failed. Please try again.');
        isConverting = false;
        updateUI();
    });
}

function downloadFile(fileId) {
    window.location.href = `download.php?id=${fileId}`;
}

function downloadAllFiles() {
    window.location.href = 'download.php?action=all';
}

function clearAllFiles() {
    const formData = new FormData();
    formData.append('action', 'clear');
    
    fetch('index.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(() => {
        window.location.reload();
    })
    .catch(error => {
        console.error('Clear error:', error);
        showError('Failed to clear files.');
    });
}

function toggleStripExif() {
    stripExif.checked = !stripExif.checked;
    updateToggleUI();
}

function updateToggleUI() {
    if (stripExif.checked) {
        toggleSwitch.classList.remove('bg-gray-300');
        toggleSwitch.classList.add('bg-red-500');
        toggleThumb.classList.remove('translate-x-0.5');
        toggleThumb.classList.add('translate-x-5');
    } else {
        toggleSwitch.classList.remove('bg-red-500');
        toggleSwitch.classList.add('bg-gray-300');
        toggleThumb.classList.remove('translate-x-5');
        toggleThumb.classList.add('translate-x-0.5');
    }
}

function handleFormatChange() {
    const selectedFormat = outputFormat.value;
    console.log('Format changed to:', selectedFormat);
    updateUI();
}

function updateUI() {
    updateFileList();
    updateHeaderActions();
    updateDropZone();
    updateToggleUI();
}

function updateFileList() {
    // Get files from PHP session via AJAX
    fetch('index.php?ajax=files')
    .then(response => response.json())
    .then(data => {
        files = data.files || [];
        
        if (files.length === 0) {
            fileListContainer.style.display = 'none';
            dropZoneContainer.style.display = 'flex';
            return;
        }
        
        fileListContainer.style.display = 'flex';
        dropZoneContainer.style.display = 'none';
        
        fileCount.textContent = files.length;
        
        fileList.innerHTML = '';
        files.forEach((file, index) => {
            const fileElement = createFileElement(file, index);
            fileList.appendChild(fileElement);
        });
    })
    .catch(error => {
        console.error('Error fetching files:', error);
    });
}

function createFileElement(fileData, index) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100';
    
    const statusText = {
        'pending': '⏳ Waiting to convert...',
        'converting': '🔄 Converting...',
        'completed': '✅ Ready for download',
        'error': `❌ Error: ${fileData.error || 'Unknown error'}`
    };
    
    const statusClass = {
        'pending': 'text-gray-500',
        'converting': 'text-yellow-500',
        'completed': 'text-green-500',
        'error': 'text-red-500'
    };
    
    const status = fileData.converted_path ? 'completed' : 'pending';
    
    fileDiv.innerHTML = `
        <div class="flex-1 min-w-0">
            <div class="flex items-center">
                <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <p class="font-medium text-gray-900 truncate">${fileData.original_name}</p>
                    <p class="text-sm ${statusClass[status]}">
                        ${statusText[status]}
                    </p>
                </div>
            </div>
        </div>
        
        <div class="flex items-center space-x-3">
            ${status === 'completed' ? `
                <button class="download-btn px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200" data-file-id="${index}">
                    Download
                </button>
            ` : ''}
            
            ${status === 'error' ? `
                <span class="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-lg">Failed</span>
            ` : ''}
        </div>
    `;
    
    // Add download button event listener
    const downloadBtn = fileDiv.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => downloadFile(index));
    }
    
    return fileDiv;
}

function updateHeaderActions() {
    const completedFiles = files.filter(f => f.converted_path);
    const hasFiles = files.length > 0;
    
    if (hasFiles) {
        headerActions.style.display = 'flex';
        downloadAllBtn.textContent = completedFiles.length > 1 ? `Download All (${completedFiles.length})` : 'Download File';
        downloadAllBtn.disabled = completedFiles.length === 0 || isConverting;
        clearAllBtn.disabled = isConverting;
    } else {
        headerActions.style.display = 'none';
    }
}

function updateDropZone() {
    const isDisabled = isConverting;
    
    if (isDisabled) {
        dropZone.classList.add('opacity-50', 'cursor-not-allowed');
        dropZone.classList.remove('cursor-pointer');
    } else {
        dropZone.classList.remove('opacity-50', 'cursor-not-allowed');
        dropZone.classList.add('cursor-pointer');
    }
    
    // Update settings
    outputFormat.disabled = isDisabled;
    stripExif.disabled = isDisabled;
    toggleSwitch.classList.toggle('cursor-not-allowed', isDisabled);
}

function checkMessages() {
    // Check for PHP session messages
    const errorMsg = document.querySelector('[data-error]');
    const successMsg = document.querySelector('[data-success]');
    
    if (errorMsg) {
        showError(errorMsg.getAttribute('data-error'));
    }
    
    if (successMsg) {
        showSuccess(successMsg.getAttribute('data-success'));
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorDisplay.style.display = 'block';
    successDisplay.style.display = 'none';
}

function hideError() {
    errorDisplay.style.display = 'none';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successDisplay.style.display = 'block';
    errorDisplay.style.display = 'none';
}

function hideSuccess() {
    successDisplay.style.display = 'none';
}

// SEO Content Toggle
function initializeSEOToggle() {
    const seoToggle = document.getElementById('seoToggle');
    const seoContentInner = document.getElementById('seoContentInner');
    const seoIcon = document.getElementById('seoIcon');
    
    if (seoToggle && seoContentInner && seoIcon) {
        seoToggle.addEventListener('click', function() {
            const isVisible = seoContentInner.style.display !== 'none';
            
            if (isVisible) {
                seoContentInner.style.display = 'none';
                seoIcon.style.transform = 'rotate(0deg)';
            } else {
                seoContentInner.style.display = 'block';
                seoIcon.style.transform = 'rotate(180deg)';
            }
        });
    }
} 