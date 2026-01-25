# PDF / Image Book Template

A beautiful, feature-rich document viewer for image-based documents. Perfect for:
- E-books
- Magazines
- Comics & Manga
- Photo albums
- Manuals & Guides
- PDF pages (converted to images)

## Features

✨ **Core Features**
- Smooth page navigation (swipe, tap, keyboard)
- Pinch-to-zoom support
- Page thumbnails sidebar
- Bookmarks with local storage
- Remember last read page
- Dark, Light, and Sepia themes

📱 **Mobile-First Design**
- Responsive layout for all screen sizes
- Touch-friendly controls
- Safe area support (notch, home indicator)
- Fullscreen mode

🎨 **Customization**
- Custom primary color
- RTL language support
- Optional page numbers
- Show/hide thumbnails panel

## How to Use

1. **Prepare your images**
   - Export PDF pages as images (JPG or PNG)
   - Or use any image sequence
   - Recommended: 1080px wide for best quality/size balance

2. **Create content.json**
   ```json
   {
     "title": "My Book",
     "author": "Author Name",
     "cover": "images/cover.jpg",
     "pages": [
       { "image": "images/page-001.jpg", "label": "Chapter 1" },
       { "image": "images/page-002.jpg" }
     ]
   }
   ```

3. **Upload to DroidSaaz Template Editor**
   - Fill in the form fields
   - Upload your page images
   - Preview and build!

## Configuration Options

| Field | Type | Description |
|-------|------|-------------|
| title | string | Document title |
| author | string | Author or publisher name |
| description | string | Brief description |
| cover | string | Cover image URL/path |
| direction | "ltr" \| "rtl" | Reading direction |
| pages | array | Array of page objects |

### Page Object
| Field | Type | Description |
|-------|------|-------------|
| image | string | Image URL or path (required) |
| label | string | Optional label (shown in thumbnails) |

### Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| showPageNumbers | boolean | true | Show page numbers in navbar |
| showThumbnails | boolean | true | Enable thumbnail panel |
| enableZoom | boolean | true | Allow pinch-to-zoom |
| rememberPage | boolean | true | Remember last page on revisit |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← / → | Previous / Next page |
| ↑ / ↓ | Previous / Next page |
| Home | Go to first page |
| End | Go to last page |
| + / - | Zoom in / out |
| 0 | Reset zoom |
| F | Toggle fullscreen |
| B | Add bookmark |
| Esc | Close panels |

## File Structure

```
pdf-template/
├── index.html
├── content.json
├── styles/
│   ├── utils.css
│   └── pdf.css
├── scripts/
│   └── app.js
└── images/
    ├── cover.jpg
    ├── page-001.jpg
    ├── page-002.jpg
    └── ...
```

## Tips for Best Results

1. **Image Size**: Use 1080-1440px width for good quality on most devices
2. **Compression**: Use JPEG at 80-85% quality for photos, PNG for text-heavy pages
3. **Cover Image**: Use 3:4 aspect ratio for best display
4. **Page Labels**: Add labels to important pages for easy navigation
5. **RTL Support**: Set `direction: "rtl"` for Arabic, Hebrew, Urdu content

## License

This template is part of DroidSaaz and is free to use for creating apps.

