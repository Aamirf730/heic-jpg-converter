# HEIC to JPG Converter

A modern, privacy-focused web application for converting HEIC images to JPG format. Built with Node.js, Express.js, and a beautiful responsive UI.

## Features

- 🖼️ **HEIC to JPG/PNG Conversion** - Convert HEIC files to widely-compatible formats
- 🔒 **Privacy First** - Files processed securely, automatically deleted after conversion
- ⚡ **Fast & Free** - Instant conversion, no registration required
- 📱 **Mobile Friendly** - Works perfectly on all devices
- 🎯 **Batch Processing** - Convert multiple files simultaneously
- 🛡️ **EXIF Removal** - Optional metadata stripping for privacy

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Tailwind CSS
- **Image Processing**: Sharp, heic-convert
- **File Handling**: Multer, fs-extra
- **Security**: Helmet.js, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd heic-to-jpg-converter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and visit `http://localhost:3000`

## Usage

1. **Upload Files**: Drag and drop HEIC files or click to browse
2. **Configure Settings**: Choose output format (JPG/PNG) and EXIF options
3. **Convert**: Click individual convert buttons for each file
4. **Download**: Download converted files individually or all at once

## Deployment

### AWS Amplify

This project is configured for easy deployment on AWS Amplify:

1. Push your code to GitHub
2. Connect your repository to AWS Amplify
3. Amplify will automatically build and deploy your application

### Environment Variables

Set these environment variables in your Amplify app:

- `NODE_ENV`: `production`
- `PORT`: `8080` (Amplify default)

## Project Structure

```
├── public/                 # Static files
│   ├── index.html         # Main HTML file
│   ├── app.js             # Frontend JavaScript
│   ├── styles.css         # Custom styles
│   └── images/            # Images and icons
├── server.js              # Express server
├── package.json           # Dependencies and scripts
├── amplify.yml            # Amplify build configuration
└── README.md              # This file
```

## API Endpoints

- `POST /api/upload` - Upload HEIC files
- `POST /api/convert` - Convert uploaded files
- `GET /api/files` - Get list of uploaded files
- `GET /api/download/:fileId` - Download individual file
- `GET /api/download-all` - Download all files as ZIP
- `POST /api/clear` - Clear all files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support, please open an issue on GitHub or contact the development team.
