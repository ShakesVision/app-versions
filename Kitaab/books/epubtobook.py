import os
import json
import shutil
from datetime import datetime
from ebooklib import epub
from pathlib import Path

# === Config ===
EPUB_FOLDER = Path(".")       # Current directory for input EPUBs
OUTPUT_BASE = Path(".")       # Current directory for output folders and books.json
ADDED_AT = datetime.now().strftime("%Y-%m-%d")
HARDCODED_LANGUAGE = "ur"     # as per your requirement


def extract_metadata(epub_path, output_dir):
    book = epub.read_epub(str(epub_path))

    # Title
    title_meta = book.get_metadata('DC', 'title')
    title_text = title_meta[0][0] if title_meta else "Unknown Title"

    # Author
    author_meta = book.get_metadata('DC', 'creator')
    author_text = author_meta[0][0] if author_meta else "Unknown Author"

    # Description or subtitle
    desc_meta = book.get_metadata('DC', 'description')
    description_text = desc_meta[0][0] if desc_meta else ""

    # Extract cover image
    cover_file_name = None

    # Try to get cover by id 'cover'
    cover_item = book.get_item_with_id('cover')
    if cover_item:
        ext = os.path.splitext(cover_item.file_name)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png']:
            ext = '.jpg'
        cover_file_name = f"cover{ext}"
        cover_path = output_dir / cover_file_name
        with open(cover_path, 'wb') as f:
            f.write(cover_item.get_content())
    else:
        # fallback: look for image items with "cover" in id or file_name
        for item in book.get_items_of_type(epub.ITEM_IMAGE):
            if 'cover' in item.id.lower() or 'cover' in item.file_name.lower():
                ext = os.path.splitext(item.file_name)[1].lower()
                if ext not in ['.jpg', '.jpeg', '.png']:
                    ext = '.jpg'
                cover_file_name = f"cover{ext}"
                cover_path = output_dir / cover_file_name
                with open(cover_path, 'wb') as f:
                    f.write(item.get_content())
                break

    return {
        "title": title_text,
        "author": author_text,
        "description": description_text,
        "coverFileName": cover_file_name
    }


def process_epubs(epub_folder, output_base):
    books = []

    for file in epub_folder.iterdir():
        if file.is_file() and file.suffix.lower() == '.epub':
            base_name = file.stem
            output_dir = output_base / base_name
            output_dir.mkdir(exist_ok=True)

            # Copy epub file
            shutil.copy2(file, output_dir / file.name)

            # Extract metadata and cover
            try:
                meta = extract_metadata(file, output_dir)
            except Exception as e:
                print(f"Warning: Failed to process {file.name} due to: {e}")
                # Skip this book but continue processing others
                continue

            size = file.stat().st_size

            book_obj = {
                "id": base_name,
                "title": {
                    "en": meta["title"],
                    "ur": meta["title"],
                    "fa": meta["title"],
                    "ar": meta["title"],
                },
                "author": {
                    "en": meta["author"],
                    "ur": meta["author"],
                },
                "language": HARDCODED_LANGUAGE,
                "categories": [],
                "tags": [],
                "coverUrl": f"books/{base_name}/{meta['coverFileName']}" if meta["coverFileName"] else "",
                "epubUrl": f"books/{base_name}/{file.name}",
                "size": size,
                "featured": False,
                "addedAt": ADDED_AT,
                "description": {
                    "ur": meta["description"],
                    "en": meta["description"],
                },
                "poetId": "",
            }

            books.append(book_obj)
            print(f"Processed: {file.name}")

    # Write JSON output to books.json
    with open(output_base / "books.json", "w", encoding="utf-8") as f:
        json.dump(books, f, indent=4, ensure_ascii=False)

    print(f"All done! {len(books)} books processed.")
    print(f"JSON saved to {output_base / 'books.json'}")


if __name__ == "__main__":
    process_epubs(EPUB_FOLDER, OUTPUT_BASE)
