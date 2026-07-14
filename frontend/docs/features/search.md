---
page_id: "search"
title: "Finding Your Illustrations"
last_updated: "2026-07-14"
category: "Search & Retrieval"
audience: "Speakers & Writers"
---
# Finding Your Illustrations & Notes

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
- **Tag Your Illustrations:** Organize your notes with topic tags like `#leadership`, `#humor`, or `#opening-remark` for quick filtering from the home page Tag Index.
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

> **Pro Tip:** The search is team-scoped. If you are part of a team, you will only see illustrations, tags, and places belonging to you or your team.
