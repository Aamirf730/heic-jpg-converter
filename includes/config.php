<?php
// Configuration file for HEIC to JPG Converter

// File upload settings
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_EXTENSIONS', ['heic', 'heif']);
define('UPLOAD_DIR', 'uploads/');
define('CONVERTED_DIR', 'converted/');

// Conversion settings
define('DEFAULT_QUALITY', 90);
define('DEFAULT_FORMAT', 'jpeg');

// Session settings
define('SESSION_TIMEOUT', 3600); // 1 hour

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Create directories if they don't exist
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
if (!file_exists(CONVERTED_DIR)) {
    mkdir(CONVERTED_DIR, 0755, true);
}

// Check if ImageMagick is available
function checkImageMagick() {
    $imagick = new Imagick();
    $formats = $imagick->queryFormats();
    return in_array('HEIC', $formats) || in_array('HEIF', $formats);
}

// Check if GD is available
function checkGD() {
    return extension_loaded('gd');
}

// Get available conversion methods
function getAvailableConversionMethods() {
    $methods = [];
    
    if (checkImageMagick()) {
        $methods[] = 'imagick';
    }
    
    if (checkGD()) {
        $methods[] = 'gd';
    }
    
    // Check for command line tools
    $magickPath = exec('which magick 2>/dev/null');
    if ($magickPath) {
        $methods[] = 'magick';
    }
    
    $heifConvertPath = exec('which heif-convert 2>/dev/null');
    if ($heifConvertPath) {
        $methods[] = 'heif-convert';
    }
    
    // For local development, if no methods are available, add test method
    if (empty($methods)) {
        $methods[] = 'test';
    }
    
    return $methods;
}

// Clean up old files
function cleanupOldFiles() {
    $uploadDir = UPLOAD_DIR;
    $convertedDir = CONVERTED_DIR;
    $timeout = time() - SESSION_TIMEOUT;
    
    // Clean uploads directory
    if (is_dir($uploadDir)) {
        $files = glob($uploadDir . '*');
        foreach ($files as $file) {
            if (is_file($file) && filemtime($file) < $timeout) {
                unlink($file);
            }
        }
    }
    
    // Clean converted directory
    if (is_dir($convertedDir)) {
        $files = glob($convertedDir . '*');
        foreach ($files as $file) {
            if (is_file($file) && filemtime($file) < $timeout) {
                unlink($file);
            }
        }
    }
}

// Run cleanup on every request
cleanupOldFiles();
?> 