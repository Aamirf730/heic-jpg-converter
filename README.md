# 🖼️ HEIC to JPG Converter

A modern, responsive web application for converting HEIC images to JPG format. Built with Next.js, TypeScript, and Tailwind CSS.

## ✨ Features

- **🔄 Instant Conversion**: Convert HEIC files to JPG/PNG format in seconds
- **📱 Mobile-First Design**: Fully responsive design optimized for all devices
- **🌙 Dark Mode**: Built-in dark/light theme toggle
- **🌍 Multi-Language Support**: Available in English, Spanish, German, and Polish
- **🔒 Privacy First**: All conversions happen locally in your browser
- **📁 Batch Processing**: Convert multiple files simultaneously
- **⚙️ EXIF Stripping**: Optional metadata removal for enhanced privacy
- **💾 Multiple Formats**: Support for JPG and PNG output formats

## 🚀 Live Demo

Visit the live application: [HEIC to JPG Converter](https://your-domain.com)

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Image Processing**: heic2any library
- **Deployment**: AWS Amplify
- **Build Tool**: Next.js built-in bundler

## 📱 Mobile Responsiveness

The application features a mobile-first design with:
- **Slide-in Sidebar**: Access tool settings on mobile devices
- **Responsive Layout**: Optimized for all screen sizes
- **Touch-Friendly**: Proper touch targets and mobile gestures
- **Language Selector**: Mobile-optimized language dropdown

## 🌍 Supported Languages

- 🇺🇸 **English** - `/`
- 🇪🇸 **Español** - `/es/heic-a-jpg`
- 🇩🇪 **Deutsch** - `/de/heic-zu-jpg`
- 🇵🇱 **Polski** - `/pl/heic-na-jpg`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aamirf730/heic-jpg-converter.git
   cd heic-jpg-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
heic-jpg-converter/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── api/               # API routes
│   ├── [lang]/            # Language-specific pages
│   └── globals.css        # Global styles
├── public/                 # Static assets
├── types/                  # TypeScript type definitions
├── docs/                   # Documentation
└── amplify.yaml           # AWS Amplify configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Optional: Add any environment variables here
NEXT_PUBLIC_APP_NAME="HEIC to JPG Converter"
```

### AWS Amplify

The project includes `amplify.yaml` for easy deployment to AWS Amplify.

## 📱 Mobile Features

### Mobile Sidebar
- **Toggle Button**: Arrow icon that slides in from the left
- **Settings Panel**: Access tool configuration on mobile
- **Responsive Design**: Optimized for small screens

### Language Selector
- **Dropdown Menu**: Mobile-friendly language selection
- **Flag Icons**: Visual language representation
- **Smooth Navigation**: Seamless page transitions

## 🎨 Customization

### Styling
The application uses Tailwind CSS for styling. Customize colors, spacing, and components in:
- `app/globals.css` - Global styles and custom CSS
- Component files - Inline Tailwind classes

### Themes
Dark mode is implemented using CSS variables and React context. Modify theme colors in:
- `app/contexts/ThemeContext.tsx`
- `app/globals.css`

## 🚀 Deployment

### AWS Amplify
1. Connect your GitHub repository to AWS Amplify
2. The `amplify.yaml` file will automatically configure the build
3. Deploy with automatic builds on every push

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Vercel
- Netlify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **heic2any**: For HEIC image conversion capabilities
- **Next.js Team**: For the amazing framework
- **Tailwind CSS**: For the utility-first CSS framework
- **React Team**: For the component-based architecture

## 📞 Support

If you have any questions or need support:
- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the API documentation in `docs/README-API.md`

## 🔄 Changelog

### v1.0.0
- Initial release with HEIC to JPG conversion
- Mobile-responsive design
- Multi-language support
- Dark mode toggle
- EXIF stripping option
- Batch file processing

---

**Made with ❤️ for the community**
