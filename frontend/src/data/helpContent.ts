export interface TourStep {
  step: number
  targetSelector: string
  title: string
  content: string
  placement: 'top' | 'bottom' | 'left' | 'right'
}

export interface HelpTopic {
  id: string
  title: string
  category: string
  audience: string
  shortDescription: string
  panelContent: string
  fullContent: string
  tourSteps?: TourStep[]
  tourMeta?: { componentId: string; page: string }
}

export const helpTopics: HelpTopic[] = [
  {
    id: 'search',
    title: 'Finding Your Illustrations',
    category: 'Search & Retrieval',
    audience: 'Speakers & Writers',
    shortDescription:
      'Use the Hybrid Search Engine to find quotes, stories, and illustrations across your titles, content, tags, and places — even if you cannot remember the exact wording.',
    panelContent: `## Quick Search Guide

Type any word, phrase, or concept into the search bar. Your query is processed through four retrieval layers:

- **Keyword matching** on titles and content
- **Fuzzy matching** that forgives typos
- **Semantic search** that understands meaning (e.g., "bravery" finds "courage")

Results are grouped into **Places**, **Tags**, and **Illustrations**. Hover over illustration results to preview content with your search terms highlighted.

**Tip:** The search is team-scoped — you only see illustrations belonging to you or your team.`,
    fullContent: `# Finding Your Illustrations & Notes

Speaker Windows features a **Hybrid Search Engine** designed to find the exact quote, story, or illustration you need for your next presentation — even if you cannot remember the exact wording. Access the search from the **Search** link in the top navigation bar.

### How Search Works

Our search processes your query using four distinct retrieval layers, then fuses the results into a single ranked list:

1. **Keyword Match (Full-Text Search on Title):** Looks for exact words in your illustration titles using PostgreSQL full-text search with English stemming. A query for "running" will also match "run" and "ran."
2. **Keyword Match (Full-Text Search on Content):** Same stemming-based matching, but against the full body text of your illustrations.
3. **Fuzzy Matching:** Uses trigram similarity to forgive typos and spelling mistakes. Searching for "bravrity" will still surface notes containing "bravery."
4. **Semantic (Vector) Search:** Understands the meaning of your query. Searching for *"bravery"* will surface notes containing *"courage"* or *"valor"* even if the word "bravery" is never used. This uses a local 384-dimensional embedding model — no data leaves your server.

Results from all four methods are combined using **Reciprocal Rank Fusion (RRF)**, then boosted by recency (illustrations you created recently rank higher) and user affinity. Finally, illustrations whose titles contain your exact search string are sorted to the top.

### Understanding the Results

Results are grouped into three sections:

| Section | What It Shows | Click Behavior |
| :--- | :--- | :--- |
| **Places** | Locations where you have used an illustration (e.g., "Podium, Stage 1") | Opens the linked illustration |
| **Tags** | Tag names matching your query | Opens the tag detail page showing all illustrations with that tag |
| **Illustrations** | Illustration titles and content matching your query | Opens the illustration detail page |

Illustration results include a **content preview** that appears on hover, with your search terms highlighted in bold within the matching text.

### Pro-Tips for Speakers

- **Use Natural Language:** Because of semantic search, you can describe what you are looking for instead of guessing exact keywords. Try "overcoming failure" instead of hunting for a specific quote.
- **Filter by Author:** After finding illustrations, use the Author detail page to browse all illustrations from a specific source.
- **Tag Your Illustrations:** Organize your notes with topic tags like \`#leadership\`, \`#humor\`, or \`#opening-remark\` for quick filtering from the home page Tag Index.
- **Check Your Places:** After copying an illustration's content, Speaker Windows automatically logs where and when you used it. Search for a place name to recall which illustration you used at a specific event.

### Action Guide

1. **Navigate to Search:** Click **Search** in the top navigation bar.
2. **Enter Your Query:** Type a word, phrase, or concept into the search field. You can search by:
   - Illustration title or content
   - Tag name
   - Place name (where you used an illustration)
3. **Submit the Search:** Click the **Search** button or press Enter.
4. **Browse Results:** Review the grouped results. Hover over illustration results to preview content.
5. **Open a Result:** Click any result to navigate to the full illustration, tag, or place detail.

> **Pro Tip:** The search is team-scoped. If you are part of a team, you will only see illustrations, tags, and places belonging to you or your team.`,
    tourSteps: [
      {
        step: 1,
        targetSelector: '#search',
        title: 'Enter Your Search Query',
        content:
          'Type a word, phrase, or concept. Search looks across illustration titles, content, tags, and place names. The hybrid engine also understands meaning — try searching for "courage" to find notes about "bravery" even if that exact word was never used.',
        placement: 'bottom',
      },
      {
        step: 2,
        targetSelector: "button[type='submit']",
        title: 'Run the Search',
        content:
          'Click the Search button or press Enter. Your query is processed through four retrieval methods: full-text keyword matching on titles, full-text matching on content, fuzzy typo-tolerant matching, and semantic vector search. Results are ranked and deduplicated automatically.',
        placement: 'left',
      },
      {
        step: 3,
        targetSelector: "ul[role='list']",
        title: 'Browse Grouped Results',
        content:
          'Results appear in three sections: Places (where you used an illustration), Tags (matching tag names), and Illustrations (matching titles and content). Click any result to open it. Hover over illustration results to preview the first 256 characters of content with your search terms highlighted in bold.',
        placement: 'right',
      },
    ],
    tourMeta: { componentId: 'hybrid_search_wizard', page: '/search' },
  },
  {
    id: 'create',
    title: 'Creating & Editing Illustrations',
    category: 'Media',
    audience: 'Speakers & Writers',
    shortDescription:
      'Create, tag, and organize illustrations — the core content units that represent quotes, stories, and notes for your presentations.',
    panelContent: `## Creating an Illustration

Click **New Illustration** in the nav bar. The form has these fields:

- **Title** (required): A short descriptive name.
- **Author**: The original author or source person.
- **Source**: Where the illustration came from (book, URL, article).
- **Tags**: Type and press Enter/Comma/Tab to add. Autocomplete suggestions appear after 2+ characters.
- **Content**: The full text of the quote, story, or note.

### Editing

Click **Edit Illustration** on any illustration detail page. You can also upload image attachments (PNG, JPG, GIF, PDF up to 20MB) in edit mode.

### Role Restrictions

- **Owner/Creator:** Full access to all fields and privacy.
- **Editor:** Title, Author, Source, Tags only.
- **Read-Only:** View only — Edit button is disabled.`,
    fullContent: `# Creating & Editing Illustrations

An **illustration** is the core content unit in Speaker Windows. It represents a quote, story, anecdote, or note that you want to catalog and reuse in your speaking or writing. This guide covers how to create a new illustration and how to edit an existing one.

### Creating a New Illustration

Navigate to **New Illustration** from the top navigation bar to open the creation form.

#### Form Fields

| Field | Required | Description |
| :--- | :--- | :--- |
| **Private/Personal** | No | Checkbox that marks the illustration as private. Only visible to you. Only shown if you are the owner. |
| **Title** | **Yes** | A short descriptive title for the illustration (e.g., "Nelson Mandela on Courage"). |
| **Author** | No | The original author or source person (e.g., "Brené Brown"). |
| **Source** | No | Where this illustration came from — a book title, URL, article, etc. HTTP/HTTPS URLs become clickable links on the detail page. |
| **Tags** | No | Categorization labels. See the Tag Input section below. |
| **Content** | No | The full text of the illustration — the quote, story, or note itself. Displayed in a 16-row textarea. |

#### Tag Input

The tag field uses an autocomplete widget:

- **Add a tag:** Type a tag name and press **Comma**, **Enter**, or **Tab** to confirm.
- **Autocomplete suggestions:** After typing 2 or more characters, existing tags matching your input appear as clickable suggestions below the field.
- **Accept first suggestion:** Press **Tab** to accept the top autocomplete suggestion.
- **Remove a tag:** Click the **✕** on any tag chip to remove it.
- **Formatting:** Tag names are automatically formatted to Title Case (e.g., "overcoming fear" becomes "Overcoming Fear").

#### Creating the Illustration

1. Fill in the **Title** field (required).
2. Optionally fill in Author, Source, Tags, and Content.
3. Click **Create Illustration**.
4. You are redirected to the new illustration's detail page.

> **Note:** You can also attach images after creating the illustration by editing it and using the file upload zone.

### Editing an Existing Illustration

From any illustration's detail page, click the **Edit Illustration** button (green) to switch to edit mode.

#### Edit Mode Differences

- **Existing attachments** are displayed with individual **Delete Upload** buttons.
- **File upload zone** appears for adding new image attachments.
- **Private checkbox** is only visible if you are the illustration's owner.
- The form submits with **Update Illustration** instead of Create.

#### Role Restrictions

| Your Role | What You Can Edit |
| :--- | :--- |
| **Owner** | All fields including privacy toggle |
| **Creator** | All fields including privacy toggle |
| **Editor** | Title, Author, Source, Tags only (not content or privacy) |
| **Read-Only** | Nothing — Edit button is disabled |

#### File Attachments

- **Supported formats:** PNG, PDF, JPG, GIF
- **Maximum size:** 20 MB per file
- **How to upload:** In edit mode, click **Upload a file** in the dashed upload zone, or drag a file onto it.
- **Delete an attachment:** Click the red **Delete Upload** button next to any existing attachment.

### Action Guide: Creating Your First Illustration

1. Click **New Illustration** in the top navigation bar.
2. Enter a descriptive **Title** (required).
3. Add an **Author** if quoting or referencing someone.
4. Enter a **Source** (book, article, or URL).
5. Add **Tags** by typing and pressing Enter after each one.
6. Paste or type the full **Content** text.
7. Click **Create Illustration**.
8. Optionally, click **Edit Illustration** to attach images.

> **Pro Tip:** After creating an illustration, copying its content from the detail page automatically logs a "Place" entry with your default location and today's date. You can set your default Place and Location in **Settings** to speed this up.

### Action Guide: Editing an Illustration

1. Navigate to the illustration's detail page.
2. Click **Edit Illustration** (green button).
3. Modify any fields you are permitted to edit.
4. To add an image, click **Upload a file** and select a PNG, JPG, GIF, or PDF.
5. Click **Update Illustration**.
6. You are redirected back to the updated illustration detail page.

> **Warning:** If you are a team **Editor**, you cannot modify the illustration content or privacy settings. Only the title, author, source, and tags are editable for your role.`,
  },
  {
    id: 'import',
    title: 'Importing Highlights from Reading Apps',
    category: 'Data Sync',
    audience: 'Speakers & Writers',
    shortDescription:
      'Centralize notes from Kindle, KOReader, Readwise, and Google Play Books into a single searchable repository.',
    panelContent: `## Importing Highlights

The import tool is on the **Settings** page under **Import Highlights**.

### Quick Steps

1. Select your reading app from the **Source** dropdown.
2. Choose the exported file (format auto-detected).
3. Click **Import Highlights**.

### Supported Sources

| Source | File Type |
| :--- | :--- |
| **Readwise** | \`.csv\` |
| **KOReader** | \`.json\` |
| **Play Books** | \`.html\` or \`.docx\` |
| **Kindle** | \`.pdf\` |

### What Happens

Each highlight becomes an illustration, automatically tagged with \`To-Fix\` for review. Short highlights (<150 chars) also get a \`Quotes\` tag. Duplicate highlights are detected via content hash and skipped.

**Tip:** After importing, use Search to find your new illustrations — they are indexed for semantic search automatically.`,
    fullContent: `# Importing Highlights from Reading Apps

Speaker Windows allows you to centralize notes and highlights from your e-readers into a single searchable repository. After import, each highlight becomes an illustration that is automatically indexed for hybrid search — including semantic vector search.

The import interface is located on the **Settings** page under the **Import Highlights** section.

### Supported Formats

| Source | File Extension | How to Export |
| :--- | :--- | :--- |
| **Readwise** | \`.csv\` | From your Readwise dashboard, go to **Settings > Export** and download a CSV export. The file should contain columns for \`Highlight\`, \`Book Title\`, \`Book Author\`, \`Amazon Book ID\`, \`Color\`, \`Location Type\`, and \`Location\`. |
| **KOReader** | \`.json\` | In KOReader, use the **Sync** or **Export** menu to save your book notes as JSON. The file can be a single-book export (with \`entries\` array) or a multi-book export (with \`documents\` array containing multiple books). |
| **Play Books** | \`.html\` or \`.docx\` | Use Google Takeout to export your Play Books notes, or find the note in the Google Drive folder "Play Book Notes" - either option works. The HTML export is a structured document with tables. The DOCX export is a Word document with nested table structures.
| **Kindle** | \`.pdf\` | From your Kindle device or app, export your notes as a PDF. The file should contain page markers, highlight indicators (with color labels like "Yellow", "Pink"), and the highlighted text. |

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

- **\`To-Fix\`** or **\`To Do\`**: Added to all imported illustrations as a reminder to review and refine.
- **\`Quotes\`**: Added to highlights shorter than 150 characters (likely direct quotes rather than longer passages).
- **Color labels**: KOReader and Kindle highlight colors (e.g., "Yellow", "Pink") are preserved as tags.
- **Book IDs**: Readwise Amazon Book IDs are added as tags for cross-referencing.

### Deduplication

If you import the same file (or the same highlights) twice, Speaker Windows automatically skips duplicates. The deduplication uses a SHA-256 hash of the normalized content (trimmed, whitespace-collapsed, lowercased). If an illustration with the same \`(user_id, source, content_hash)\` already exists, it is counted as a duplicate and skipped.

The import result message reports: \`Imported X of Y highlights\`, along with separate counts for duplicates and errors.

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

> **Pro Tip:** After importing, use the Search page to find your new illustrations. Because they are automatically indexed for semantic search, you can find them using natural language queries even if the exact words don't match.`,
    tourSteps: [
      {
        step: 1,
        targetSelector: '#importer',
        title: 'Select Your Reading App',
        content:
          'Choose where your highlights are coming from. We currently support Readwise (CSV), KOReader (JSON), Play Books (HTML/DOCX), and Kindle (PDF). The file type filter below updates automatically based on your selection.',
        placement: 'bottom',
      },
      {
        step: 2,
        targetSelector: '#import-file',
        title: 'Upload Your Export File',
        content:
          'Select the exported file from your computer. Accepted file types depend on the source you chose: .csv for Readwise, .json for KOReader, .html or .docx for Play Books, and .pdf for Kindle. Maximum file size is 50MB.',
        placement: 'top',
      },
      {
        step: 3,
        targetSelector: "button:has-text('Import Highlights')",
        title: 'Start the Import',
        content:
          'Click to upload and process your file. Each highlight is parsed into an illustration, deduplicated against your existing library, and automatically indexed for hybrid search — including semantic vector search.',
        placement: 'top',
      },
      {
        step: 4,
        targetSelector: '.text-sm.text-gray-600',
        title: 'Review Import Results',
        content:
          'After processing completes, you will see a summary like "Imported 42 of 50 highlights". The message also shows how many were skipped as duplicates and how many encountered errors.',
        placement: 'bottom',
      },
      {
        step: 5,
        targetSelector: '#place',
        title: 'Set Your Default Place',
        content:
          'While you are on the Settings page, consider setting a default Place and Location. These values pre-fill the Place form when you copy an illustration\'s content, saving you time when logging where you used a quote.',
        placement: 'top',
      },
    ],
    tourMeta: { componentId: 'highlight_importer_wizard', page: '/settings' },
  },
]

export function getHelpTopic(id: string): HelpTopic | undefined {
  return helpTopics.find((t) => t.id === id)
}
