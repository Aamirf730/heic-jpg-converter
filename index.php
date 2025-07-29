<?php
session_start();

// Include configuration and functions
require_once 'includes/config.php';
require_once 'includes/functions.php';

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'upload':
                handleFileUpload();
                break;
            case 'clear':
                clearAllFiles();
                break;
            case 'download_all':
                downloadAllFiles();
                break;
        }
    }
}

// Handle AJAX requests
if (isset($_GET['ajax'])) {
    header('Content-Type: application/json');
    switch ($_GET['ajax']) {
        case 'convert':
            echo json_encode(convertFiles());
            exit;
        case 'progress':
            echo json_encode(getProgress());
            exit;
        case 'files':
            echo json_encode([
                'files' => $_SESSION['uploaded_files'] ?? [],
                'converted_files' => $_SESSION['converted_files'] ?? []
            ]);
            exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>Free HEIC to JPG Converter - Convert HEIC to JPEG Online | No Registration</title>
    <meta name="title" content="Free HEIC to JPG Converter - Convert HEIC to JPEG Online | No Registration">
    <meta name="description" content="Convert HEIC to JPG online for free. Fast, secure HEIC to JPEG converter with batch processing. No registration required. Convert iPhone photos instantly. Support for HEIC, HEIF files.">
    <meta name="keywords" content="heic to jpg, convert heic to jpg, heic to jpg converter, heic to jpeg, .heic to jpg, free heic converter, heic to jpg online, heic converter online, convert heic to jpeg, heic to jpg free">
    <meta name="author" content="HEIC to JPG Converter">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://heic-to-jpg.io/">
    <link rel="icon" type="image/x-icon" href="images/favicon.ico">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://heic-to-jpg.io/">
    <meta property="og:title" content="Free HEIC to JPG Converter - Convert HEIC to JPEG Online">
    <meta property="og:description" content="Convert HEIC to JPG online for free. Fast, secure HEIC to JPEG converter with batch processing. No registration required.">
    <meta property="og:image" content="https://heic-to-jpg.io/og-image.jpg">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://heic-to-jpg.io/">
    <meta property="twitter:title" content="Free HEIC to JPG Converter - Convert HEIC to JPEG Online">
    <meta property="twitter:description" content="Convert HEIC to JPG online for free. Fast, secure HEIC to JPEG converter with batch processing.">
    <meta property="twitter:image" content="https://heic-to-jpg.io/og-image.jpg">
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Performance Optimizations -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Lazy Loading for Images -->
    <script>
        // Lazy loading implementation
        document.addEventListener("DOMContentLoaded", function() {
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        });
    </script>
    
    <!-- Structured Data / Schema Markup -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Free HEIC to JPG Converter",
        "description": "Convert HEIC to JPG online for free. Fast, secure HEIC to JPEG converter with batch processing. No registration required.",
        "url": "https://heic-to-jpg.io/",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "featureList": [
            "Convert HEIC to JPG",
            "Convert HEIC to PNG",
            "Remove EXIF data",
            "Batch conversion",
            "No registration required",
            "Privacy-focused",
            "Free online converter"
        ],
        "author": {
            "@type": "Organization",
            "name": "HEIC to JPG Converter"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250",
            "bestRating": "5",
            "worstRating": "1"
        }
    }
    </script>
    
    <!-- FAQ Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How do I convert HEIC to JPG?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To convert HEIC to JPG, simply drag and drop your HEIC files onto our converter, select your preferred output format (JPG or PNG), and click convert. The process is free and requires no registration."
                }
            },
            {
                "@type": "Question",
                "name": "Is HEIC to JPG conversion free?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our HEIC to JPG converter is completely free to use. No registration, no hidden fees, and no watermarks on converted images."
                }
            },
            {
                "@type": "Question",
                "name": "What is HEIC format?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "HEIC (High Efficiency Image Container) is an image format used by Apple devices. It provides better compression than JPEG but is not widely supported by other devices and software, which is why converting HEIC to JPG is often necessary."
                }
            },
            {
                "@type": "Question",
                "name": "Can I convert multiple HEIC files at once?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our HEIC to JPG converter supports batch processing. You can upload multiple HEIC files and convert them all to JPG format simultaneously."
                }
            },
            {
                "@type": "Question",
                "name": "Are my files safe when converting HEIC to JPG?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. Your files are processed securely on our server and automatically deleted after conversion. We do not store or access your personal data."
                }
            }
        ]
    }
    </script>
    
    <!-- Breadcrumb Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://heic-to-jpg.io/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "HEIC to JPG Converter",
                "item": "https://heic-to-jpg.io/"
            }
        ]
    }
    </script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        red: {
                            50: '#fef2f2',
                            100: '#fee2e2',
                            200: '#fecaca',
                            400: '#f87171',
                            500: '#ef4444',
                            600: '#dc2626',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        .drop-zone {
            @apply border-2 border-dashed border-red-400 rounded-xl p-16 text-center transition-all duration-300;
            border-style: dashed !important;
            border-width: 2px !important;
            border-color: #f87171 !important;
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .drop-zone.drag-over {
            @apply border-red-500 bg-red-50 scale-105;
            border-color: #ef4444 !important;
        }
        .drop-zone:hover:not(.drag-over) {
            @apply border-red-500 bg-red-50;
            border-color: #ef4444 !important;
        }
        .progress-bar {
            @apply w-full bg-gray-200 rounded-full h-2;
        }
        .progress-fill {
            @apply bg-red-600 h-2 rounded-full transition-all duration-300;
        }
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="bg-gray-50 flex">
        
        <!-- Sidebar -->
        <div class="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <div class="space-y-8">
                <!-- Header -->
                <div class="text-center pb-6 border-b border-gray-200">
                    <div class="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 class="text-lg font-bold text-gray-800">HEIC to JPG</h2>
                    <p class="text-sm text-gray-600">Privacy-first converter</p>
                </div>

                <!-- Settings -->
                <div class="space-y-6">
                    <h3 class="text-sm font-semibold text-gray-800 flex items-center">
                        <svg class="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </h3>
                    
                    <!-- Output Format Selection -->
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-gray-800">Output Format</label>
                        <select id="outputFormat" name="outputFormat" class="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <option value="jpeg">HEIC → JPEG</option>
                            <option value="png">HEIC → PNG</option>
                        </select>
                        <p class="text-xs text-gray-600">Choose your preferred output format</p>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                            <label class="text-sm font-semibold text-gray-800">Strip EXIF data</label>
                            <p class="text-xs text-gray-600 mt-1">Remove metadata for privacy</p>
                        </div>
                        <div class="relative">
                            <input type="checkbox" id="stripExif" name="stripExif" class="sr-only">
                            <div id="toggleSwitch" class="w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center bg-gray-300">
                                <div id="toggleThumb" class="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 translate-x-0.5"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info -->
                <div class="space-y-4 pt-6 border-t border-gray-200">
                    <h3 class="text-sm font-semibold text-gray-800 flex items-center">
                        <svg class="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        How it works
                    </h3>
                    
                    <div class="space-y-3 text-xs text-gray-600">
                        <div class="flex items-start space-x-2">
                            <div class="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">Privacy First</p>
                                <p>Files processed securely on our server</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-2">
                            <div class="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">Fast & Free</p>
                                <p>Quick conversion, no registration needed</p>
                            </div>
                        </div>

                        <div class="flex items-start space-x-2">
                            <div class="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">Works Everywhere</p>
                                <p>All modern browsers, HEIC/HEIF support</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
            <!-- Breadcrumb Navigation -->
            <nav class="bg-white border-b border-gray-200 px-8 py-3">
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                    <a href="/" class="hover:text-red-500 transition-colors">Home</a>
                    <span>/</span>
                    <span class="text-gray-800 font-medium">HEIC to JPG Converter</span>
                </div>
            </nav>
            
            <!-- Header -->
            <header class="bg-white border-b border-gray-200 px-8 py-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800">Free HEIC to JPG Converter</h1>
                        <p class="text-gray-600">Convert HEIC to JPG online - Transform your iPhone photos instantly. Fast, secure, and completely free.</p>
                    </div>
                    
                    <div id="headerActions" class="flex space-x-3" style="display: none;">
                        <button id="clearAllBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all duration-200">
                            Clear All
                        </button>
                        <button id="downloadAllBtn" class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200">
                            Download All
                        </button>
                    </div>
                </div>
            </header>

            <!-- Main Area -->
            <main class="flex-1 p-8">
                <div class="flex flex-col">
                    <!-- Error Display -->
                    <div id="errorDisplay" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl" style="display: none;">
                        <div class="flex items-center">
                            <svg class="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                            <p id="errorMessage" class="text-red-800 font-medium"></p>
                            <button id="closeError" class="ml-auto text-red-500 hover:text-red-700 transition-colors">
                                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Success Display -->
                    <div id="successDisplay" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl" style="display: none;">
                        <div class="flex items-center">
                            <svg class="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <p id="successMessage" class="text-green-800 font-medium"></p>
                            <button id="closeSuccess" class="ml-auto text-green-500 hover:text-green-700 transition-colors">
                                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- PHP Session Messages -->
                    <?php if ($error = getError()): ?>
                    <div data-error="<?php echo htmlspecialchars($error); ?>"></div>
                    <?php endif; ?>
                    
                    <?php if ($success = getSuccess()): ?>
                    <div data-success="<?php echo htmlspecialchars($success); ?>"></div>
                    <?php endif; ?>

                    <!-- Drop Zone -->
                    <div id="dropZoneContainer" class="flex-1 flex items-center justify-center">
                        <div class="w-full max-w-2xl mx-auto text-center">
                            <form id="uploadForm" enctype="multipart/form-data" method="POST" action="">
                                <input type="hidden" name="action" value="upload">
                                <div id="dropZone" class="drop-zone group cursor-pointer mx-auto">
                                    <div class="space-y-8 flex flex-col items-center">
                                        <!-- Icon -->
                                        <div class="flex justify-center">
                                            <div id="dropIcon" class="w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300 bg-red-100 group-hover:bg-red-200">
                                                <svg id="dropIconSvg" class="w-10 h-10 transition-all duration-300 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                        </div>

                                        <!-- Text -->
                                        <div class="space-y-4 text-center">
                                            <h3 id="dropTitle" class="text-2xl font-bold transition-colors duration-300 text-red-600">
                                                Drop your HEIC files here
                                            </h3>
                                            <p id="dropSubtitle" class="text-lg transition-colors duration-300 text-red-500">
                                                or click to browse files
                                            </p>
                                        </div>

                                        <!-- File info -->
                                        <div class="text-sm text-gray-500 text-center mt-4">
                                            Supports .heic and .heif files up to 10MB
                                        </div>

                                        <!-- Browse button -->
                                        <button type="button" id="browseBtn" class="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 bg-red-500 text-white hover:bg-red-600">
                                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Choose Files
                                        </button>
                                    </div>
                                </div>
                                <input type="file" id="fileInput" name="files[]" accept=".heic,.heif" multiple style="display: none;">
                            </form>
                        </div>
                    </div>

                    <!-- File List -->
                    <div id="fileListContainer" class="flex-1 flex flex-col" style="display: none;">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-lg font-semibold text-gray-800 flex items-center">
                                <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Files (<span id="fileCount">0</span>)
                            </h2>
                        </div>

                        <div id="fileList" class="flex-1 overflow-y-auto space-y-3">
                            <!-- Files will be dynamically added here -->
                        </div>
                    </div>
                    
                    <!-- SEO Content Section - Collapsible -->
                    <div id="seoContent" class="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <button id="seoToggle" class="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between text-left">
                            <span class="text-lg font-semibold text-gray-800">Complete Guide: Convert HEIC to JPG</span>
                            <svg id="seoIcon" class="w-5 h-5 text-gray-600 transform transition-transform duration-200 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        
                        <div id="seoContentInner" class="px-6 py-4 space-y-6">
                            <!-- What is HEIC Section -->
                            <div>
                                <h2 class="text-xl font-bold text-gray-800 mb-3">What is HEIC Format?</h2>
                                <p class="text-gray-700 mb-3">
                                    HEIC (High Efficiency Image Container) is an image format developed by Apple that provides superior compression compared to JPEG. 
                                    While HEIC files are smaller and maintain better quality, they're not widely supported by other devices and software, 
                                    which is why converting HEIC to JPG is often necessary.
                                </p>
                                <div class="bg-blue-50 p-4 rounded-lg">
                                    <h3 class="font-semibold text-blue-800 mb-2">Key Benefits of Converting HEIC to JPG:</h3>
                                    <ul class="text-sm text-blue-700 space-y-1">
                                        <li>• Universal compatibility across all devices and platforms</li>
                                        <li>• Smaller file sizes for easier sharing and storage</li>
                                        <li>• Support by all photo editing software</li>
                                        <li>• No special software required to view images</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- How to Convert Section -->
                            <div>
                                <h2 class="text-xl font-bold text-gray-800 mb-3">How to Convert HEIC to JPG</h2>
                                <div class="grid md:grid-cols-3 gap-4">
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <div class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">1</div>
                                        <h4 class="font-semibold text-gray-800 mb-2">Upload Files</h4>
                                        <p class="text-sm text-gray-600">Drag and drop your HEIC files or click to browse. Support for multiple files at once.</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <div class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">2</div>
                                        <h4 class="font-semibold text-gray-800 mb-2">Choose Format</h4>
                                        <p class="text-sm text-gray-600">Select JPG or PNG output format. Option to remove EXIF data for privacy.</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <div class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">3</div>
                                        <h4 class="font-semibold text-gray-800 mb-2">Download</h4>
                                        <p class="text-sm text-gray-600">Download individual files or all at once. Files are automatically processed.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Features Section -->
                            <div>
                                <h2 class="text-xl font-bold text-gray-800 mb-3">Why Choose Our HEIC to JPG Converter?</h2>
                                <div class="grid md:grid-cols-2 gap-4">
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <h4 class="font-semibold text-gray-800 mb-1 text-sm">🔄 Multiple Formats</h4>
                                        <p class="text-xs text-gray-600">Convert HEIC to JPG, PNG, or WebP format</p>
                                    </div>
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <h4 class="font-semibold text-gray-800 mb-1 text-sm">🛡️ Privacy Focused</h4>
                                        <p class="text-xs text-gray-600">Files processed securely, no data stored</p>
                                    </div>
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <h4 class="font-semibold text-gray-800 mb-1 text-sm">⚡ Fast Conversion</h4>
                                        <p class="text-xs text-gray-600">Instant HEIC to JPG conversion</p>
                                    </div>
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <h4 class="font-semibold text-gray-800 mb-1 text-sm">📱 Mobile Friendly</h4>
                                        <p class="text-xs text-gray-600">Works perfectly on all devices</p>
                                    </div>
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <h4 class="font-semibold text-gray-800 mb-1 text-sm">🎯 Batch Processing</h4>
                                        <p class="text-xs text-gray-600">Convert multiple HEIC files at once</p>
                                    </div>
                                    <div class="bg-gray-50 p-3 rounded-lg">
                                        <h4 class="font-semibold text-gray-800 mb-1 text-sm">💯 Completely Free</h4>
                                        <p class="text-xs text-gray-600">No registration, no hidden fees</p>
                                    </div>
                                </div>
                            </div>

                            <!-- FAQ Section -->
                            <div>
                                <h2 class="text-xl font-bold text-gray-800 mb-3">Frequently Asked Questions</h2>
                                <div class="space-y-3">
                                    <div class="border-l-4 border-red-500 pl-4">
                                        <h4 class="font-semibold text-gray-800">How do I convert HEIC to JPG?</h4>
                                        <p class="text-sm text-gray-600 mt-1">Simply drag and drop your HEIC files onto our converter, select your preferred output format (JPG or PNG), and click convert. The process is free and requires no registration.</p>
                                    </div>
                                    <div class="border-l-4 border-red-500 pl-4">
                                        <h4 class="font-semibold text-gray-800">Is HEIC to JPG conversion free?</h4>
                                        <p class="text-sm text-gray-600 mt-1">Yes, our HEIC to JPG converter is completely free to use. No registration, no hidden fees, and no watermarks on converted images.</p>
                                    </div>
                                    <div class="border-l-4 border-red-500 pl-4">
                                        <h4 class="font-semibold text-gray-800">What is HEIC format?</h4>
                                        <p class="text-sm text-gray-600 mt-1">HEIC (High Efficiency Image Container) is an image format used by Apple devices. It provides better compression than JPEG but is not widely supported by other devices and software.</p>
                                    </div>
                                    <div class="border-l-4 border-red-500 pl-4">
                                        <h4 class="font-semibold text-gray-800">Can I convert multiple HEIC files at once?</h4>
                                        <p class="text-sm text-gray-600 mt-1">Yes, our HEIC to JPG converter supports batch processing. You can upload multiple HEIC files and convert them all to JPG format simultaneously.</p>
                                    </div>
                                    <div class="border-l-4 border-red-500 pl-4">
                                        <h4 class="font-semibold text-gray-800">Are my files safe when converting HEIC to JPG?</h4>
                                        <p class="text-sm text-gray-600 mt-1">Absolutely. Your files are processed securely on our server and automatically deleted after conversion. We do not store or access your personal data.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Technical Info -->
                            <div>
                                <h2 class="text-xl font-bold text-gray-800 mb-3">Technical Information</h2>
                                <div class="text-sm text-gray-600 space-y-2">
                                    <p><strong>Supported Input Formats:</strong> HEIC, HEIF</p>
                                    <p><strong>Output Formats:</strong> JPG, PNG</p>
                                    <p><strong>Maximum File Size:</strong> 10MB per file</p>
                                    <p><strong>Processing:</strong> Server-side conversion for optimal quality</p>
                                    <p><strong>Privacy:</strong> Files automatically deleted after 1 hour</p>
                                    <p><strong>Compatibility:</strong> Works on all modern browsers and devices</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html> 