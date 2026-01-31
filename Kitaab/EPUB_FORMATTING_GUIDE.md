# EPUB Formatting Guide for Kitaab

This guide explains how to format EPUB files for optimal display in the Kitaab reader, especially for RTL (Right-to-Left) languages like Urdu, Farsi, Arabic, and Punjabi.

## Basic Structure

Each book should follow this structure:

```
book-id/
├── book.epub        # The EPUB file
├── cover.jpg        # Cover image (600x900 recommended)
└── metadata.json    # Optional: Additional metadata
```

## EPUB Requirements

### 1. RTL Direction

All HTML files in the EPUB must specify RTL direction:

```html
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" dir="rtl" xml:lang="ur">
  <head>
    <meta charset="UTF-8" />
    <title>Chapter Title</title>
    <link rel="stylesheet" type="text/css" href="styles.css" />
  </head>
  <body dir="rtl">
    <!-- Content here -->
  </body>
</html>
```

### 2. CSS Styling

Use minimal CSS. The app will override most styles. Include only:

```css
body {
  direction: rtl;
  text-align: right;
}

/* Poetry/Verse formatting */
.verse,
.sher,
.misra {
  display: block;
  margin-bottom: 0.5em;
}

.hemistich {
  display: inline-block;
  width: 48%;
  text-align: center;
}

/* Headings */
h1,
h2,
h3 {
  text-align: center;
}

/* Don't specify font-family - let the app handle it */
```

### 3. Poetry Formatting

For ghazals and poetry, use this structure:

```html
<div class="ghazal">
  <div class="sher">
    <span class="misra">پہلا مصرع یہاں لکھیں</span>
    <span class="misra">دوسرا مصرع یہاں لکھیں</span>
  </div>

  <div class="sher">
    <span class="misra">اگلا شعر کا پہلا مصرع</span>
    <span class="misra">اگلا شعر کا دوسرا مصرع</span>
  </div>
</div>
```

### 4. Font Considerations

**Do NOT embed fonts** in the EPUB. The app provides optimized fonts:

- Jameel Noori Nastaliq (Urdu, Punjabi)
- Vazirmatn (Farsi)
- Amiri (Arabic)

The app will inject the appropriate font based on the book's language.

### 5. Metadata

Include proper metadata in `content.opf`:

```xml
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>دیوان غالب</dc:title>
  <dc:creator>مرزا غالب</dc:creator>
  <dc:language>ur</dc:language>
  <dc:identifier id="uuid">unique-book-id</dc:identifier>
  <meta property="dcterms:modified">2026-01-30T00:00:00Z</meta>
</metadata>
```

### 6. Navigation (TOC)

Use proper `nav.xhtml` for table of contents:

```html
<nav epub:type="toc" id="toc">
  <h1>فہرست</h1>
  <ol>
    <li><a href="chapter01.xhtml">پہلا باب</a></li>
    <li><a href="chapter02.xhtml">دوسرا باب</a></li>
  </ol>
</nav>
```

## Cover Image

- Format: JPEG or PNG
- Size: 600 x 900 pixels (2:3 aspect ratio)
- Keep file size under 500KB
- Use high contrast for text on cover

## Testing

Before submitting:

1. Validate the EPUB using [EPUB Validator](https://validator.idpf.org/)
2. Test in the Kitaab app on multiple screen sizes
3. Verify RTL text renders correctly
4. Check that poetry line breaks appear properly
5. Ensure navigation/TOC works

## Common Issues

### Ligature Problems

- Don't use plain text files converted to EPUB
- Use proper Unicode for Urdu/Arabic characters
- Avoid mixing different Unicode normalization forms

### Line Breaking

- Use `<br />` sparingly
- Let the reader handle line wrapping
- Use CSS `white-space: pre-wrap` for specific formatting needs

### Search Issues

- Use searchable text, not images
- Avoid excessive nested tags
- Keep paragraph structure simple

## File Size Guidelines

| Content Type      | Max Size |
| ----------------- | -------- |
| Poetry Collection | 3 MB     |
| Novel             | 5 MB     |
| With Images       | 10 MB    |

## Submitting Books

To add a book to the Kitaab library:

1. Create a pull request to the content repository
2. Include the EPUB, cover, and any metadata
3. Ensure you have rights to distribute the content
4. Follow the formatting guidelines above

---

For questions, contact: admin@sarbakaf.com
