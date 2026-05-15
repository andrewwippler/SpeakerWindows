# sw-importer

Unified Go binary for importing illustrations from various sources into the SpeakerWindows API.

## Build

```bash
cd importer
go build -o sw-importer .
```

## Usage

```
API_TOKEN=<token> ./sw-importer --importer=<type> [--print] <file>
```

### Importers

| `--importer` | Source | File Format |
|---|---|---|
| `readwise` | Readwise | CSV |
| `koreader` | KOReader | JSON (`one.json` or `all.json`) |
| `playbooks` | Google Play Books | HTML or DOCX |
| `kindle` | Kindle for Mac/PC | PDF (annotations export) |

### Options

- `--print` — Print parsed JSON to stdout without posting to the API.

### Environment

- `API_TOKEN` — Bearer token for the SpeakerWindows API (`https://sw-api.wplr.rocks/illustration`). Required unless `--print` is used.

## Examples

```bash
# Preview Kindle highlights
./sw-importer --importer=kindle --print my-clippings.pdf

# Import KOReader highlights
API_TOKEN=abc123 ./sw-importer --importer=koreader koreader-notes.json

# Import Readwise CSV export
API_TOKEN=abc123 ./sw-importer --importer=readwise readwise.csv

# Import Google Play Books HTML export
./sw-importer --importer=playbooks --print my-notes.html
```

## How it works

Each importer parses its respective file format and extracts illustrations with the following fields:

- `title` — First 100 characters of the highlight
- `author` — Book author
- `source` — Book title and page/location reference
- `content` — Full highlight text
- `tags` — Color, "To Fix"/"To Do", and "Quotes" for short highlights

Illustrations are deduplicated by content + source before being posted to the API. Duplicates (409 responses) are silently skipped.
