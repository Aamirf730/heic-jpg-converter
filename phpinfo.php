<?php
// PHP Info file to check server settings
// Upload this to your server and access it via browser
// Then delete it for security

echo "<h2>PHP Settings for HEIC Converter</h2>";
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Setting</th><th>Value</th></tr>";

$settings = [
    'upload_max_filesize',
    'post_max_size', 
    'max_execution_time',
    'memory_limit',
    'max_file_uploads'
];

foreach ($settings as $setting) {
    $value = ini_get($setting);
    echo "<tr><td>$setting</td><td>$value</td></tr>";
}

echo "</table>";

echo "<h3>All PHP Settings:</h3>";
phpinfo();
?> 