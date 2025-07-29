<?php
session_start();

// Include configuration and functions
require_once 'includes/config.php';
require_once 'includes/functions.php';

// Handle download requests
if (isset($_GET['action']) && $_GET['action'] === 'all') {
    // Download all files as zip
    downloadAllFiles();
    exit;
}

if (isset($_GET['id'])) {
    // Download single file
    $fileId = (int)$_GET['id'];
    downloadFile($fileId);
    exit;
}

// Invalid request
header('HTTP/1.1 400 Bad Request');
echo 'Invalid download request.';
exit;
?> 