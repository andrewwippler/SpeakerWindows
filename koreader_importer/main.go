package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type Illustration struct {
	Title   string   `json:"title"`
	Author  string   `json:"author"`
	Source  string   `json:"source"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

// OneBook represents the structure of one.json
// Book represents a document/book (used for both one.json and all.json entries)
type Book struct {
	Author        string  `json:"author"`
	Title         string  `json:"title"`
	NumberOfPages int     `json:"number_of_pages,omitempty"`
	CreatedOn     int64   `json:"created_on,omitempty"`
	File          string  `json:"file"`
	Entries       []Entry `json:"entries,omitempty"`
	Version       string  `json:"version,omitempty"`
	MD5Sum        string  `json:"md5sum,omitempty"`
}

type Entry struct {
	Drawer  string `json:"drawer"`
	Time    int64  `json:"time"`
	Color   string `json:"color"`
	Sort    string `json:"sort"`
	Chapter string `json:"chapter"`
	Page    int    `json:"page"`
	Text    string `json:"text"`
}

// AllBooks represents the structure of all.json
type AllBooks struct {
	CreatedOn int64  `json:"created_on"`
	Version   string `json:"version"`
	Documents []Book `json:"documents"`
}

func tidyText(s string) string {
	re := regexp.MustCompile(`\s+`)
	return strings.TrimSpace(re.ReplaceAllString(s, " "))
}

func getDocType(data []byte) string {

	// Try to parse JSON into a generic map to detect structure.
	var raw map[string]interface{}

	if err := json.Unmarshal(data, &raw); err != nil {
		// Not valid JSON, just print raw
		fmt.Println(string(data))
		return "Raw"
	}

	// Heuristic: presence of top-level "documents" -> AllBooks
	if _, ok := raw["documents"]; ok {
		var ab AllBooks
		if err := json.Unmarshal(data, &ab); err == nil {
			fmt.Println("AllBooks")
			return "AllBooks"
		}
		fmt.Println("AllBooks-like JSON (failed to decode into AllBooks)")
		return "Unknown"
	}

	// Presence of top-level "entries" -> Book
	if _, ok := raw["entries"]; ok {
		var b Book
		if err := json.Unmarshal(data, &b); err == nil {
			fmt.Println("Book")
			return "Book"
		}
		fmt.Println("Book-like JSON (failed to decode into Book)")
		return "Unknown"
	}

	fmt.Println("Unknown JSON structure")
	return "Unknown"
}

func bookToIllustrations(b Book) []Illustration {
	var illustrations []Illustration
	for _, entry := range b.Entries {

		source := b.Title
		if entry.Page != 0 {
			source += fmt.Sprintf(" p. %d", entry.Page)
		}

		title := entry.Text
		if len(title) > 100 {
			title = title[:100]
		}
		tags := []string{entry.Color, "To-Fix"}
		if len(entry.Text) < 150 {
			tags = append(tags, "Quotes")
		}

		ill := Illustration{
			Title:   b.Title,
			Author:  b.Author,
			Source:  source,
			Content: tidyText(entry.Text),
			Tags:    tags,
		}
		illustrations = append(illustrations, ill)
	}
	return illustrations
}

func main() {
	if len(os.Args) < 2 {
		fmt.Printf("Usage: %s <koreader-json-file> [--print]\n", filepath.Base(os.Args[0]))
		return
	}
	printOnly := len(os.Args) > 2 && os.Args[2] == "--print"

	path := os.Args[1]

	data, err := os.ReadFile(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading file '%s': %v\n", path, err)
		os.Exit(1)
	}

	bookType := getDocType(data)

	fmt.Printf("Detected document type: %s\n", bookType)

	// Further processing can be added here based on the detected type
	// if unknown or raw, exit with error
	var illustrations []Illustration
	switch bookType {
	case "AllBooks":
		var ab AllBooks
		if err := json.Unmarshal(data, &ab); err != nil {
			fmt.Fprintf(os.Stderr, "Error decoding AllBooks JSON: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("AllBooks contains %d documents\n", len(ab.Documents))
		for _, doc := range ab.Documents {
			fmt.Printf("- Title: %s, Author: %s, Entries: %d\n", doc.Title, doc.Author, len(doc.Entries))
			illustrations = append(illustrations, bookToIllustrations(doc)...)
		}
	case "Book":
		var b Book
		if err := json.Unmarshal(data, &b); err != nil {
			fmt.Fprintf(os.Stderr, "Error decoding Book JSON: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Book title: %s, author: %s, entries: %d\n", b.Title, b.Author, len(b.Entries))
		illustrations = bookToIllustrations(b)
	default:
		fmt.Fprintf(os.Stderr, "Unhandled document type: %s\n", bookType)
		os.Exit(1)
	}

	// dedupe illustrations and print summary
	dedupIllustrations := make(map[string]Illustration)
	for _, ill := range illustrations {
		key := ill.Content + "::" + ill.Source
		dedupIllustrations[key] = ill
	}
	fmt.Printf("Total unique illustrations: %d\n", len(dedupIllustrations))

	if printOnly {
		data, _ := json.MarshalIndent(dedupIllustrations, "", "  ")
		fmt.Println(string(data))
		return
	}

	// Post to API
	apiToken := os.Getenv("API_TOKEN")
	if apiToken == "" {
		fmt.Println("API_TOKEN environment variable not set")
		return
	}

	for _, ill := range dedupIllustrations {
		jsonData, _ := json.Marshal(ill)
		req, err := http.NewRequest("POST", "https://sw-api.wplr.rocks/illustration", strings.NewReader(string(jsonData)))
		if err != nil {
			fmt.Println("Error creating request:", err)
			continue
		}
		req.Header.Set("Authorization", "Bearer "+apiToken)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			fmt.Println("Error making request:", err)
			continue
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		// handle duplicate (409)
		if resp.StatusCode == 409 {
			var respBody map[string]interface{}
			if err := json.Unmarshal(bodyBytes, &respBody); err == nil {
				if id, ok := respBody["id"]; ok {
					fmt.Printf("Skipped duplicate: %s (id: %v)\n", ill.Title, id)
					continue
				}
			}
			fmt.Printf("Skipped duplicate: %s (status %d)\n", ill.Title, resp.StatusCode)
			continue
		}

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			var respBody map[string]interface{}
			if err := json.Unmarshal(bodyBytes, &respBody); err == nil {
				if id, ok := respBody["id"]; ok {
					fmt.Printf("Created illustration: %s (id: %v)\n", ill.Title, id)
					continue
				}
			}
			fmt.Printf("Posted illustration: %s (status %s)\n", ill.Title, resp.Status)
			continue
		}

		fmt.Printf("Error posting %s: status %d body: %s\n", ill.Title, resp.StatusCode, string(bodyBytes))
	}
	fmt.Println("Processing completed.")
}
