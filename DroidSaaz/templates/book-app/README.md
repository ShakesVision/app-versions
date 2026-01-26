# Book App Template

A minimal, offline-ready book reading app template for DroidSaaz.

## Structure

```
book-template/
├── index.html          # Main HTML (uses Tailwind-like utility classes)
├── template.json       # Schema for DroidSaaz editor
├── config.json.example # Theme/font configuration example
├── content.json.example# Book content example
├── styles/
│   ├── utils.css       # Minimal Tailwind-like utilities (offline)
│   └── book.css        # Book-specific component styles
└── scripts/
    └── app.js          # Minimal JavaScript (~4KB)
```

## Features

- 📖 Chapter-based navigation with TOC
- 🎨 Theme support (Light, Dark, Sepia)
- 📏 Adjustable font size
- 🌐 RTL/LTR support per chapter
- 📱 Mobile-first, responsive design
- ✈️ Works completely offline
- 🎯 Minimal file size (~15KB total)

## Customization

The `config.json` controls:
- Primary, background, text, and accent colors
- Heading and body fonts
- Default text direction

The `content.json` contains:
- Book title and author
- Cover image URL
- Dedication text
- Chapters with title and HTML content

## Fonts Supported

- Roboto, Open Sans (Latin)
- Merriweather, Lora (Serif)
- Amiri, Cairo (Arabic)
- Noto Nastaliq Urdu (Urdu/Persian)

## Usage with DroidSaaz

1. Upload this template to your GitHub repo
2. Add it to `templates.json` catalog
3. Users can create books using the DroidSaaz app

