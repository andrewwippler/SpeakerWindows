---
page_id: "import"
title: "Importing Highlights from Reading Apps"
last_updated: "2026-07-14"
category: "Data Sync"
audience: "Speakers & Writers"
---
# Importing Highlights from Reading Apps

Speaker Windows allows you to centralize notes and highlights from your e-readers into a single searchable repository. After import, each highlight becomes an illustration that is automatically indexed for hybrid search — including semantic vector search.

The import interface is located on the **Settings** page under the **Import Highlights** section.

### Supported Formats

| Source | File Extension | How to Export |
| :--- | :--- | :--- |
| **Readwise** | `.csv` | From your Readwise dashboard, go to **Settings > Export** and download a CSV export. The file should contain columns for `Highlight`, `Book Title`, `Book Author`, `Amazon Book ID`, `Color`, `Location Type`, and `Location`. |
| **KOReader** | `.json` | In KOReader, use the **Sync** or **Export** menu to save your book notes as JSON. The file can be a single-book export (with `entries` array) or a multi-book export (with `documents` array containing multiple books). |
| **Play Books** | `.html` or `.docx` | Use Google Takeout to export your Play Books notes, or find the note in the Google Drive folder "Play Book Notes" - either option works. The HTML export is a structured document with tables. The DOCX export is a Word document with nested table structures.
| **Kindle** | `.pdf` | From your Kindle device or app, export your notes as a PDF. The file should contain page markers, highlight indicators (with color labels like "Yellow", "Pink"), and the highlighted text. |

### Step-by-Step Import Process

1. **Navigate to Settings:** Click **Settings** in the top navigation bar.
2. **Scroll to Import Highlights:** Find the **Import Highlights** section near the bottom of the page.
3. **Select Source:** Use the **Source** dropdown to choose your reading app (Readwise, KOReader, Play Books, or Kindle). The file type filter on the upload field updates automatically.
4. **Choose File:** Click the file input and select your exported file. The accepted file extensions change based on the source you selected.
5. **Click Import Highlights:** Click the **Import Highlights** button. The button shows "Importing..." while processing.
6. **Review Results:** After processing completes, you will see a summary message indicating how many highlights were imported.

### How Highlights Become Illustrations

Each highlight from your export file is transformed into an illustration with the following mapping:

| Export Field | Illustration Field |
| :--- | :--- |
| Highlight text (first 100 chars) | **Title** |
| Book Author | **Author** |
| Book title + page/location info | **Source** |
| Full highlight text | **Content** |
| Color label, book ID, special tags | **Tags** |

### Auto-Tagging

Imports are automatically tagged to help you organize and clean up later:

- **`To-Fix`** or **`To Do`**: Added to all imported illustrations as a reminder to review and refine.
- **`Quotes`**: Added to highlights shorter than 150 characters (likely direct quotes rather than longer passages).
- **Color labels**: KOReader and Kindle highlight colors (e.g., "Yellow", "Pink") are preserved as tags.
- **Book IDs**: Readwise Amazon Book IDs are added as tags for cross-referencing.

### Deduplication

If you import the same file (or the same highlights) twice, Speaker Windows automatically skips duplicates. The deduplication uses a SHA-256 hash of the normalized content (trimmed, whitespace-collapsed, lowercased). If an illustration with the same `(user_id, source, content_hash)` already exists, it is counted as a duplicate and skipped.

The import result message reports: `Imported X of Y highlights`, along with separate counts for duplicates and errors.

### Privacy Settings

- If your team role is **Owner** or **Creator**, imported illustrations are **public** by default (visible to your team).
- If your team role is **Editor** or **Read-Only**, imported illustrations are **private** by default (visible only to you).

### Troubleshooting

| Problem | Solution |
| :--- | :--- |
| **"Failed to parse file" error** | Ensure you selected the correct source type matching your file format. A Kindle file must be PDF, a KOReader file must be JSON, etc. |
| **Highlights not appearing** | Check the import result message for duplicate counts. If highlights were already imported, they are skipped automatically. Search for them by book title or author. |
| **Wrong file format** | The file input filters accepted extensions based on your source selection. If your file is rejected, verify you chose the correct source in the dropdown. |
| **Missing tags or metadata** | Some export formats contain more metadata than others. Readwise CSV exports include color and location data; KOReader JSON includes page numbers and colors. Ensure your export file contains the expected columns or fields. |
| **Import is slow** | Large files (thousands of highlights) may take a moment to process. Each highlight is parsed, deduplicated, and individually indexed for hybrid search. Try breaking up your highlights into smaller chunks if necessary. |

> **Pro Tip:** After importing, use the Search page to find your new illustrations. Because they are automatically indexed for semantic search, you can find them using natural language queries even if the exact words don't match.
