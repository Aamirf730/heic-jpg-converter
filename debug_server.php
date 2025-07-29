<?php
// Debug script to check server capabilities
// Upload this to your server and access it via browser
// Then delete it for security

echo "<h1>🔍 Server Debug Information</h1>";

// Include configuration
require_once 'includes/config.php';

echo "<h2>📋 PHP Information</h2>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>Server Software:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>";

echo "<h2>🖼️ Image Processing Extensions</h2>";

// Check ImageMagick
if (extension_loaded('imagick')) {
    echo "<p style='color: green;'>✅ ImageMagick extension is loaded</p>";
    try {
        $imagick = new Imagick();
        $formats = $imagick->queryFormats();
        if (in_array('HEIC', $formats) || in_array('HEIF', $formats)) {
            echo "<p style='color: green;'>✅ ImageMagick supports HEIC/HEIF</p>";
        } else {
            echo "<p style='color: orange;'>⚠️ ImageMagick loaded but no HEIC support</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ ImageMagick error: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p style='color: red;'>❌ ImageMagick extension not loaded</p>";
}

// Check GD
if (extension_loaded('gd')) {
    echo "<p style='color: green;'>✅ GD extension is loaded</p>";
    $gdInfo = gd_info();
    echo "<p><strong>GD Version:</strong> " . $gdInfo['GD Version'] . "</p>";
    echo "<p><strong>Supported Formats:</strong> " . implode(', ', array_keys(array_filter($gdInfo, function($v) { return $v === true; }))) . "</p>";
} else {
    echo "<p style='color: red;'>❌ GD extension not loaded</p>";
}

// Check command line tools
echo "<h2>🛠️ Command Line Tools</h2>";

$magickPath = exec('which magick 2>/dev/null');
if ($magickPath) {
    echo "<p style='color: green;'>✅ ImageMagick CLI found: $magickPath</p>";
} else {
    echo "<p style='color: red;'>❌ ImageMagick CLI not found</p>";
}

$heifConvertPath = exec('which heif-convert 2>/dev/null');
if ($heifConvertPath) {
    echo "<p style='color: green;'>✅ heif-convert found: $heifConvertPath</p>";
} else {
    echo "<p style='color: red;'>❌ heif-convert not found</p>";
}

echo "<h2>📁 Directory Permissions</h2>";

$uploadDir = 'uploads/';
$convertedDir = 'converted/';

if (is_dir($uploadDir)) {
    echo "<p style='color: green;'>✅ Uploads directory exists</p>";
    if (is_writable($uploadDir)) {
        echo "<p style='color: green;'>✅ Uploads directory is writable</p>";
    } else {
        echo "<p style='color: red;'>❌ Uploads directory is not writable</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Uploads directory does not exist</p>";
}

if (is_dir($convertedDir)) {
    echo "<p style='color: green;'>✅ Converted directory exists</p>";
    if (is_writable($convertedDir)) {
        echo "<p style='color: green;'>✅ Converted directory is writable</p>";
    } else {
        echo "<p style='color: red;'>❌ Converted directory is not writable</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Converted directory does not exist</p>";
}

echo "<h2>🔧 Available Conversion Methods</h2>";
$methods = getAvailableConversionMethods();
echo "<p><strong>Available Methods:</strong> " . implode(', ', $methods) . "</p>";

echo "<h2>📊 PHP Settings</h2>";
$settings = [
    'upload_max_filesize',
    'post_max_size',
    'max_execution_time',
    'memory_limit',
    'max_file_uploads'
];

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Setting</th><th>Value</th></tr>";
foreach ($settings as $setting) {
    $value = ini_get($setting);
    echo "<tr><td>$setting</td><td>$value</td></tr>";
}
echo "</table>";

echo "<h2>🧪 Test Conversion</h2>";
echo "<p>Let's test if the conversion process works:</p>";

// Test the conversion process
if (function_exists('convertUsingTest')) {
    echo "<p style='color: green;'>✅ Test conversion function exists</p>";
    
    // Create a test file
    $testInput = 'uploads/test.heic';
    $testOutput = 'converted/test.jpg';
    
    if (file_exists($testInput)) {
        $result = convertUsingTest($testInput, $testOutput, 'jpeg', false);
        if ($result['success']) {
            echo "<p style='color: green;'>✅ Test conversion successful</p>";
        } else {
            echo "<p style='color: red;'>❌ Test conversion failed</p>";
        }
    } else {
        echo "<p style='color: orange;'>⚠️ No test file found to test conversion</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Test conversion function not found</p>";
}

echo "<h2>📝 Session Information</h2>";
if (session_status() === PHP_SESSION_ACTIVE) {
    echo "<p style='color: green;'>✅ Sessions are active</p>";
    echo "<p><strong>Session ID:</strong> " . session_id() . "</p>";
    echo "<p><strong>Session Data:</strong></p>";
    echo "<pre>" . print_r($_SESSION, true) . "</pre>";
} else {
    echo "<p style='color: red;'>❌ Sessions are not active</p>";
}

echo "<hr>";
echo "<p><strong>🔒 Security Note:</strong> Delete this file after debugging!</p>";
?> 