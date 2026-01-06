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

	var root interface{}
	if err := json.Unmarshal(data, &root); err != nil {
		return nil, err
	}

	var out []Illustration

	// recursive collector: walk the JSON tree and extract any object that looks like a highlight
	var collect func(interface{})
	collect = func(node interface{}) {
		switch v := node.(type) {
		case []interface{}:
			for _, e := range v {
				collect(e)
			}
		case map[string]interface{}:
			// If this map itself contains highlight text, treat it as a highlight
			content := pickString(v, []string{"text", "highlight", "content", "annotation"})
			content = tidyText(content)
			if content != "" {
				title := content
				if len(title) > 100 {
					title = title[:100]
				}
				author := pickString(v, []string{"author", "bookAuthor", "book_author"})
				bookTitle := pickString(v, []string{"title", "bookTitle", "book_title", "file", "book"})
				locationType := pickString(v, []string{"locationType", "location_type"})
				location := pickString(v, []string{"location", "page", "position"})
				source := fmt.Sprintf("%s %s %s", bookTitle, locationType, location)

				amazonID := pickString(v, []string{"amazonID", "amazon_book_id", "amazon"})
				color := pickString(v, []string{"color", "highlightColor"})
				tags := []string{amazonID, color, "To Fix"}
				if len(content) < 150 {
					tags = append(tags, "Quotes")
				}
				out = append(out, Illustration{Title: title, Author: author, Source: source, Content: content, Tags: tags})
				// continue traversal to find nested highlights as well
			}

			// If this map has a "highlights" array, process those specifically
			if h, ok := v["highlights"].([]interface{}); ok {
				// book-level metadata
				bookTitle := pickString(v, []string{"title", "bookTitle", "book_title", "file", "book"})
				author := pickString(v, []string{"author", "bookAuthor", "book_author"})
				for _, hh := range h {
					if hm, ok := hh.(map[string]interface{}); ok {
						content := pickString(hm, []string{"text", "highlight", "content", "annotation"})
						content = tidyText(content)
						if content == "" {
							continue
						}
						t := content
						if len(t) > 100 {
							t = t[:100]
						}
						source := bookTitle
						color := pickString(hm, []string{"color", "highlightColor"})
						tags := []string{color, "To Fix"}
						if len(content) < 150 {
							tags = append(tags, "Quotes")
						}
						out = append(out, Illustration{Title: t, Author: author, Source: source, Content: content, Tags: tags})
					} else {
						// recurse in case highlights array contains nested structures
						collect(hh)
					}
				}
			}

			// recurse into child values
			for _, child := range v {
				collect(child)
			}
		}
	}

	collect(root)

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
