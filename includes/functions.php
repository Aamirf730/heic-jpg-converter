<?php
// Functions file for HEIC to JPG Converter

// Handle file upload
function handleFileUpload() {
    if (!isset($_FILES['files']) || empty($_FILES['files']['name'][0])) {
        setError('No files were uploaded.');
        return;
    }
    
    $files = $_FILES['files'];
    $uploadedFiles = [];
    $errors = [];
    
    // Process each uploaded file
    for ($i = 0; $i < count($files['name']); $i++) {
        if ($files['error'][$i] === UPLOAD_ERR_OK) {
            $fileName = $files['name'][$i];
            $fileSize = $files['size'][$i];
            $fileTmp = $files['tmp_name'][$i];
            
            // Validate file
            $validation = validateFile($fileName, $fileSize, $fileTmp);
            if ($validation['valid']) {
                // Move file to upload directory
                $uploadPath = UPLOAD_DIR . uniqid() . '_' . $fileName;
                if (move_uploaded_file($fileTmp, $uploadPath)) {
                    $uploadedFiles[] = [
                        'original_name' => $fileName,
                        'upload_path' => $uploadPath,
                        'size' => $fileSize
                    ];
                } else {
                    $errors[] = "Failed to move uploaded file: $fileName";
                }
            } else {
                $errors[] = $validation['error'];
            }
        } else {
            $errors[] = "Upload error for file: " . $files['name'][$i];
        }
    }
    
    // Store uploaded files in session
    if (!empty($uploadedFiles)) {
        if (!isset($_SESSION['uploaded_files'])) {
            $_SESSION['uploaded_files'] = [];
        }
        $_SESSION['uploaded_files'] = array_merge($_SESSION['uploaded_files'], $uploadedFiles);
        setSuccess('Files uploaded successfully. Processing...');
    }
    
    if (!empty($errors)) {
        setError(implode(', ', $errors));
    }
}

// Validate uploaded file
function validateFile($fileName, $fileSize, $fileTmp) {
    // Check file size
    if ($fileSize > MAX_FILE_SIZE) {
        return ['valid' => false, 'error' => "$fileName is too large (max " . (MAX_FILE_SIZE / 1024 / 1024) . "MB)"];
    }
    
    // Check file extension
    $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        return ['valid' => false, 'error' => "$fileName is not a valid HEIC/HEIF file"];
    }
    
    // Check if file is actually an image
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $fileTmp);
    finfo_close($finfo);
    
    if (!in_array($mimeType, ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])) {
        return ['valid' => false, 'error' => "$fileName is not a valid HEIC/HEIF image"];
    }
    
    return ['valid' => true];
}

// Convert HEIC files
function convertFiles() {
    if (!isset($_SESSION['uploaded_files']) || empty($_SESSION['uploaded_files'])) {
        return ['success' => false, 'message' => 'No files to convert'];
    }
    
    $outputFormat = $_POST['outputFormat'] ?? 'jpeg';
    $stripExif = isset($_POST['stripExif']) && $_POST['stripExif'] === 'on';
    
    $convertedFiles = [];
    $errors = [];
    
    // Get available methods for debugging
    $availableMethods = getAvailableConversionMethods();
    
    foreach ($_SESSION['uploaded_files'] as $file) {
        $result = convertHeicFile($file, $outputFormat, $stripExif);
        if ($result['success']) {
            $convertedFiles[] = $result['file'];
        } else {
            $errors[] = $result['error'];
        }
    }
    
    // Store converted files in session
    if (!empty($convertedFiles)) {
        $_SESSION['converted_files'] = $convertedFiles;
    }
    
    // Add detailed error reporting
    if (!empty($errors)) {
        setError('Conversion failed: ' . implode(', ', $errors));
    } elseif (empty($convertedFiles)) {
        setError('No files were converted. Available methods: ' . implode(', ', $availableMethods));
    } else {
        setSuccess('Files converted successfully!');
    }
    
    return [
        'success' => !empty($convertedFiles),
        'files' => $convertedFiles,
        'errors' => $errors,
        'debug' => [
            'available_methods' => $availableMethods,
            'output_format' => $outputFormat,
            'strip_exif' => $stripExif,
            'total_files' => count($_SESSION['uploaded_files']),
            'converted_count' => count($convertedFiles)
        ]
    ];
}

// Convert single HEIC file
function convertHeicFile($file, $outputFormat, $stripExif) {
    $inputPath = $file['upload_path'];
    $outputFileName = getOutputFileName($file['original_name'], $outputFormat);
    $outputPath = CONVERTED_DIR . uniqid() . '_' . $outputFileName;
    
    // Try different conversion methods
    $methods = getAvailableConversionMethods();
    
    foreach ($methods as $method) {
        $result = convertUsingMethod($inputPath, $outputPath, $outputFormat, $method, $stripExif);
        if ($result['success']) {
            return [
                'success' => true,
                'file' => [
                    'original_name' => $file['original_name'],
                    'converted_name' => $outputFileName,
                    'converted_path' => $outputPath,
                    'format' => $outputFormat,
                    'size' => filesize($outputPath)
                ]
            ];
        }
    }
    
    return [
        'success' => false,
        'error' => "Failed to convert {$file['original_name']} using all available methods"
    ];
}

// Convert using specific method
function convertUsingMethod($inputPath, $outputPath, $outputFormat, $method, $stripExif) {
    try {
        switch ($method) {
            case 'imagick':
                return convertUsingImageMagick($inputPath, $outputPath, $outputFormat, $stripExif);
            
            case 'magick':
                return convertUsingMagickCommand($inputPath, $outputPath, $outputFormat, $stripExif);
            
            case 'heif-convert':
                return convertUsingHeifConvert($inputPath, $outputPath, $outputFormat, $stripExif);
            
            case 'gd':
                return convertUsingGD($inputPath, $outputPath, $outputFormat, $stripExif);
            
            case 'test':
                return convertUsingTest($inputPath, $outputPath, $outputFormat, $stripExif);
            
            default:
                return ['success' => false, 'error' => "Unknown conversion method: $method"];
        }
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Convert using ImageMagick
function convertUsingImageMagick($inputPath, $outputPath, $outputFormat, $stripExif) {
    $imagick = new Imagick($inputPath);
    
    // Set format
    $imagick->setImageFormat($outputFormat);
    
    // Set quality
    $imagick->setImageCompressionQuality(DEFAULT_QUALITY);
    
    // Strip EXIF if requested
    if ($stripExif) {
        $imagick->stripImage();
    }
    
    // Write to file
    $imagick->writeImage($outputPath);
    $imagick->destroy();
    
    return ['success' => file_exists($outputPath)];
}

// Convert using ImageMagick command line
function convertUsingMagickCommand($inputPath, $outputPath, $outputFormat, $stripExif) {
    $stripOption = $stripExif ? '-strip' : '';
    $command = "magick $stripOption -quality " . DEFAULT_QUALITY . " \"$inputPath\" \"$outputPath\"";
    
    exec($command, $output, $returnCode);
    
    return ['success' => $returnCode === 0 && file_exists($outputPath)];
}

// Convert using heif-convert command
function convertUsingHeifConvert($inputPath, $outputPath, $outputFormat, $stripExif) {
    $command = "heif-convert \"$inputPath\" \"$outputPath\"";
    
    exec($command, $output, $returnCode);
    
    return ['success' => $returnCode === 0 && file_exists($outputPath)];
}

// Convert using GD (fallback, limited HEIC support)
function convertUsingGD($inputPath, $outputPath, $outputFormat, $stripExif) {
    // GD has limited HEIC support, this is mainly a fallback
    $image = imagecreatefromstring(file_get_contents($inputPath));
    
    if (!$image) {
        return ['success' => false, 'error' => 'GD cannot read HEIC file'];
    }
    
    $success = false;
    
    if ($outputFormat === 'jpeg') {
        $success = imagejpeg($image, $outputPath, DEFAULT_QUALITY);
    } elseif ($outputFormat === 'png') {
        $success = imagepng($image, $outputPath, 9);
    }
    
    imagedestroy($image);
    
    return ['success' => $success];
}

// Test conversion method for local development
function convertUsingTest($inputPath, $outputPath, $outputFormat, $stripExif) {
    // Create a test image for demonstration purposes
    $width = 800;
    $height = 600;

    $image = imagecreatetruecolor($width, $height);

    // Create a gradient background
    for ($x = 0; $x < $width; $x++) {
        for ($y = 0; $y < $height; $y++) {
            $red = ($x / $width) * 255;
            $green = ($y / $height) * 255;
            $blue = 128;
            $color = imagecolorallocate($image, $red, $green, $blue);
            imagesetpixel($image, $x, $y, $color);
        }
    }

    // Add text
    $text = "Test Conversion\nHEIC to " . strtoupper($outputFormat);
    $fontSize = 5;
    $textColor = imagecolorallocate($image, 255, 255, 255);
    imagestring($image, $fontSize, 50, 50, $text, $textColor);

    $success = false;

    if ($outputFormat === 'jpeg') {
        $success = imagejpeg($image, $outputPath, DEFAULT_QUALITY);
    } elseif ($outputFormat === 'png') {
        $success = imagepng($image, $outputPath, 9);
    }

    imagedestroy($image);

    // Add error logging
    if (!$success) {
        error_log("Test conversion failed for: $outputPath");
        return ['success' => false, 'error' => 'Failed to create test image'];
    }

    return ['success' => $success];
}

// Get output filename
function getOutputFileName($originalName, $outputFormat) {
    $baseName = pathinfo($originalName, PATHINFO_FILENAME);
    $extension = $outputFormat === 'jpeg' ? 'jpg' : $outputFormat;
    return $baseName . '.' . $extension;
}

// Download converted file
function downloadFile($fileId) {
    if (!isset($_SESSION['converted_files'][$fileId])) {
        return false;
    }
    
    $file = $_SESSION['converted_files'][$fileId];
    $filePath = $file['converted_path'];
    
    if (!file_exists($filePath)) {
        return false;
    }
    
    // Set headers for download
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $file['converted_name'] . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    
    // Output file
    readfile($filePath);
    return true;
}

// Download all converted files
function downloadAllFiles() {
    if (!isset($_SESSION['converted_files']) || empty($_SESSION['converted_files'])) {
        return false;
    }
    
    // Create zip file
    $zipPath = CONVERTED_DIR . 'converted_files_' . uniqid() . '.zip';
    $zip = new ZipArchive();
    
    if ($zip->open($zipPath, ZipArchive::CREATE) !== TRUE) {
        return false;
    }
    
    foreach ($_SESSION['converted_files'] as $file) {
        if (file_exists($file['converted_path'])) {
            $zip->addFile($file['converted_path'], $file['converted_name']);
        }
    }
    
    $zip->close();
    
    // Download zip file
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="converted_files.zip"');
    header('Content-Length: ' . filesize($zipPath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    
    readfile($zipPath);
    
    // Clean up zip file
    unlink($zipPath);
    return true;
}

// Clear all files
function clearAllFiles() {
    // Clean up uploaded files
    if (isset($_SESSION['uploaded_files'])) {
        foreach ($_SESSION['uploaded_files'] as $file) {
            if (file_exists($file['upload_path'])) {
                unlink($file['upload_path']);
            }
        }
        unset($_SESSION['uploaded_files']);
    }
    
    // Clean up converted files
    if (isset($_SESSION['converted_files'])) {
        foreach ($_SESSION['converted_files'] as $file) {
            if (file_exists($file['converted_path'])) {
                unlink($file['converted_path']);
            }
        }
        unset($_SESSION['converted_files']);
    }
    
    return true;
}

// Set error message
function setError($message) {
    $_SESSION['error'] = $message;
}

// Set success message
function setSuccess($message) {
    $_SESSION['success'] = $message;
}

// Get error message
function getError() {
    $error = $_SESSION['error'] ?? null;
    unset($_SESSION['error']);
    return $error;
}

// Get success message
function getSuccess() {
    $success = $_SESSION['success'] ?? null;
    unset($_SESSION['success']);
    return $success;
}

// Get progress information
function getProgress() {
    $totalFiles = isset($_SESSION['uploaded_files']) ? count($_SESSION['uploaded_files']) : 0;
    $convertedFiles = isset($_SESSION['converted_files']) ? count($_SESSION['converted_files']) : 0;
    
    return [
        'total' => $totalFiles,
        'converted' => $convertedFiles,
        'progress' => $totalFiles > 0 ? ($convertedFiles / $totalFiles) * 100 : 0
    ];
}
?> 