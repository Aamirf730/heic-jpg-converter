<?php
// Simple session test
echo "<h1>🔍 Session Test</h1>";

// Test 1: Check if sessions can be started
echo "<h2>Test 1: Starting Session</h2>";
$sessionStarted = @session_start();
if ($sessionStarted) {
    echo "<p style='color: green;'>✅ Session started successfully</p>";
} else {
    echo "<p style='color: red;'>❌ Failed to start session</p>";
}

// Test 2: Check session status
echo "<h2>Test 2: Session Status</h2>";
$sessionStatus = session_status();
switch ($sessionStatus) {
    case PHP_SESSION_DISABLED:
        echo "<p style='color: red;'>❌ Sessions are disabled</p>";
        break;
    case PHP_SESSION_NONE:
        echo "<p style='color: orange;'>⚠️ Sessions are enabled but none exists</p>";
        break;
    case PHP_SESSION_ACTIVE:
        echo "<p style='color: green;'>✅ Sessions are active</p>";
        break;
}

// Test 3: Try to set and get session data
echo "<h2>Test 3: Session Data Test</h2>";
if ($sessionStatus === PHP_SESSION_ACTIVE) {
    $_SESSION['test'] = 'Hello World ' . time();
    echo "<p style='color: green;'>✅ Set session data: " . $_SESSION['test'] . "</p>";
    
    if (isset($_SESSION['test'])) {
        echo "<p style='color: green;'>✅ Retrieved session data: " . $_SESSION['test'] . "</p>";
    } else {
        echo "<p style='color: red;'>❌ Could not retrieve session data</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Cannot test session data - sessions not active</p>";
}

// Test 4: Check session configuration
echo "<h2>Test 4: Session Configuration</h2>";
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Setting</th><th>Value</th></tr>";

$sessionSettings = [
    'session.save_handler',
    'session.save_path',
    'session.use_cookies',
    'session.use_only_cookies',
    'session.cookie_httponly',
    'session.auto_start',
    'session.gc_maxlifetime'
];

foreach ($sessionSettings as $setting) {
    $value = ini_get($setting);
    echo "<tr><td>$setting</td><td>$value</td></tr>";
}
echo "</table>";

// Test 5: Check session save path
echo "<h2>Test 5: Session Save Path</h2>";
$savePath = ini_get('session.save_path');
if ($savePath) {
    if (is_dir($savePath)) {
        if (is_writable($savePath)) {
            echo "<p style='color: green;'>✅ Session save path exists and is writable: $savePath</p>";
        } else {
            echo "<p style='color: red;'>❌ Session save path exists but is not writable: $savePath</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Session save path does not exist: $savePath</p>";
    }
} else {
    echo "<p style='color: orange;'>⚠️ Session save path not set (using default)</p>";
}

echo "<hr>";
echo "<p><strong>🔒 Security Note:</strong> Delete this file after testing!</p>";
?> 