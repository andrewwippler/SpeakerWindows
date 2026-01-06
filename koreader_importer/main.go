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

func tidyText(s string) string {
	re := regexp.MustCompile(`\s+`)
	return strings.TrimSpace(re.ReplaceAllString(s, " "))
}

// try to extract a string value from many common keys
func pickString(m map[string]interface{}, keys []string) string {
	for _, k := range keys {
		if v, ok := m[k]; ok && v != nil {
			switch t := v.(type) {
			case string:
				return tidyText(t)
			}
		}
	}
	return ""
}

func parseKoreaderFile(path string) ([]Illustration, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var out []Illustration

	// try as array of objects
	var arr []map[string]interface{}
	if err := json.Unmarshal(data, &arr); err == nil {
		for _, item := range arr {
			content := pickString(item, []string{"text", "highlight", "content", "annotation"})
			content = tidyText(content)
			if content == "" {
				// maybe nested under "highlights"
				if h, ok := item["highlights"].([]interface{}); ok {
					for _, hh := range h {
						if hm, ok := hh.(map[string]interface{}); ok {
							c := pickString(hm, []string{"text", "highlight", "content", "annotation"})
							c = tidyText(c)
							if c != "" {
								// Title should be first 100 chars of the highlight
								t := c
								if len(t) > 100 {
									t = t[:100]
								}
								author := pickString(item, []string{"author", "bookAuthor", "book_author"})
								// Construct source
								bookTitle := pickString(item, []string{"title", "bookTitle", "book_title", "book"})
								locationType := pickString(item, []string{"locationType", "location_type"})
								location := pickString(item, []string{"location", "page", "position"})
								source := fmt.Sprintf("%s %s %s", bookTitle, locationType, location)

								// Construct tags
								color := pickString(item, []string{"color", "highlightColor"})
								tags := []string{color, "To Fix"}
								if len(c) < 150 {
									tags = append(tags, "Quotes")
								}

								out = append(out, Illustration{Title: t, Author: author, Source: source, Content: c, Tags: tags})
							}
						}
					}
					continue
				}
				continue
			}
			// Title should be first 100 chars of the highlight
			title := content
			if len(title) > 100 {
				title = title[:100]
			}
			author := pickString(item, []string{"author", "bookAuthor", "book_author"})
			// Construct source
			bookTitle := pickString(item, []string{"title", "bookTitle", "book_title", "file", "book"})
			locationType := pickString(item, []string{"locationType", "location_type"})
			location := pickString(item, []string{"location", "page", "position"})
			source := fmt.Sprintf("%s %s %s", bookTitle, locationType, location)
			// Construct tags
			amazonID := pickString(item, []string{"amazonID", "amazon_book_id", "amazon"})
			color := pickString(item, []string{"color", "highlightColor"})
			tags := []string{amazonID, color, "To Fix"}
			if len(content) < 150 {
				tags = append(tags, "Quotes")
			}
			out = append(out, Illustration{Title: title, Author: author, Source: source, Content: content, Tags: tags})
		}
		return out, nil
	}

	// try as top-level object with books
	var obj map[string]interface{}
	if err := json.Unmarshal(data, &obj); err != nil {
		return nil, err
	}

	// iterate values and look for highlights arrays
	for _, v := range obj {
		switch t := v.(type) {
		case []interface{}:
			for _, e := range t {
				if em, ok := e.(map[string]interface{}); ok {
					content := pickString(em, []string{"text", "highlight", "content", "annotation"})
					content = tidyText(content)
					if content == "" {
						continue
					}
					// Title should be first 100 chars of the highlight
					title := content
					if len(title) > 100 {
						title = title[:100]
					}
					author := pickString(em, []string{"author", "bookAuthor", "book_author"})
					// Construct source
					bookTitle := pickString(em, []string{"title", "bookTitle", "book_title", "file", "book"})
					locationType := pickString(em, []string{"locationType", "location_type"})
					location := pickString(em, []string{"location", "page", "position"})
					source := fmt.Sprintf("%s %s %s", bookTitle, locationType, location)
					// Construct tags
					amazonID := pickString(em, []string{"amazonID", "amazon_book_id", "amazon"})
					color := pickString(em, []string{"color", "highlightColor"})
					tags := []string{amazonID, color, "To Fix"}
					if len(content) < 150 {
						tags = append(tags, "Quotes")
					}
					out = append(out, Illustration{Title: title, Author: author, Source: source, Content: content, Tags: tags})
				}
			}
		case map[string]interface{}:
			// maybe a book object with highlights
			if h, ok := t["highlights"].([]interface{}); ok {
				title := pickString(t, []string{"title", "bookTitle", "book_title", "file"})
				author := pickString(t, []string{"author", "bookAuthor", "book_author"})
				for _, hh := range h {
					if hm, ok := hh.(map[string]interface{}); ok {
						content := pickString(hm, []string{"text", "highlight", "content", "annotation"})
						content = tidyText(content)
						if content == "" {
							continue
						}
						// Title should be first 100 chars of the highlight
						t := content
						if len(t) > 100 {
							t = t[:100]
						}
						source := title
						// Construct tags
						amazonID := ""
						color := ""
						if hmVal, ok := hm["amazonID"]; ok {
							if s, ok2 := hmVal.(string); ok2 {
								amazonID = tidyText(s)
							}
						}
						if hmVal, ok := hm["color"]; ok {
							if s, ok2 := hmVal.(string); ok2 {
								color = tidyText(s)
							}
						}
						tags := []string{amazonID, color, "To Fix"}
						if len(content) < 150 {
							tags = append(tags, "Quotes")
						}
						out = append(out, Illustration{Title: t, Author: author, Source: source, Content: content, Tags: tags})
					}
				}
			}
		}
	}

	return out, nil
}

func main() {
	if len(os.Args) < 2 {
		fmt.Printf("Usage: %s <koreader-json-file> [--print]\n", filepath.Base(os.Args[0]))
		return
	}

	path := os.Args[1]
	printOnly := len(os.Args) > 2 && os.Args[2] == "--print"

	ills, err := parseKoreaderFile(path)
	if err != nil {
		fmt.Println("Error parsing file:", err)
		return
	}

	// dedupe by content+source
	unique := make(map[string]bool)
	var deduped []Illustration
	for _, ill := range ills {
		key := tidyText(ill.Content) + "::" + tidyText(ill.Source)
		if !unique[key] {
			unique[key] = true
			deduped = append(deduped, ill)
		}
	}

	fmt.Printf("Found %d entries, reduced to %d after deduplication\n", len(ills), len(deduped))

	if printOnly {
		data, _ := json.MarshalIndent(deduped, "", "  ")
		fmt.Println(string(data))
		return
	}

	apiToken := os.Getenv("API_TOKEN")
	if apiToken == "" {
		fmt.Println("API_TOKEN environment variable not set")
		return
	}

	for _, ill := range deduped {
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
			fmt.Printf("Posted illustration: %s (status %d)\n", ill.Title, resp.StatusCode)
			continue
		}

		fmt.Printf("Error posting %s: status %d body: %s\n", ill.Title, resp.StatusCode, string(bodyBytes))
	}
}
