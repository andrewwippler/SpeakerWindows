package main

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"

	"net/http"

	"github.com/PuerkitoBio/goquery"
)

// Illustration struct for API submission
type Illustration struct {
	Title   string   `json:"title"`
	Author  string   `json:"author"`
	Source  string   `json:"source"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

func tidyText(s string) string {
	// Collapse whitespace and strip newlines
	re := regexp.MustCompile(`\s+`)
	return strings.TrimSpace(re.ReplaceAllString(s, " "))
}

// getFirstText tries multiple selectors until one returns text
func getFirstText(doc *goquery.Document, selectors []string) string {
	for _, sel := range selectors {
		if text := tidyText(doc.Find(sel).First().Text()); text != "" {
			return text
		}
	}
	return ""
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: ./playbooks_importer <path-to-html-file>")
		return
	}

	htmlFile := os.Args[1]

	// Open HTML file
	file, err := os.Open(htmlFile)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	doc, err := goquery.NewDocumentFromReader(file)
	if err != nil {
		fmt.Println("Error parsing HTML:", err)
		return
	}

	// Extract book title and author with fallback selectors
	bookTitle := getFirstText(doc, []string{
		"h1 span.c33", // primary selector
		"h1",          // fallback plain h1
		".title",      // some exports may use .title
	})
	author := getFirstText(doc, []string{
		"p span.c17", // primary selector
		"p",          // fallback any paragraph near title
		".subtitle",  // sometimes author appears here
	})

	if bookTitle == "" || author == "" {
		fmt.Printf("Warning: could not extract book title/author reliably (title='%s', author='%s')\n", bookTitle, author)
	}

	var illustrations []Illustration

	// Each highlight is inside a table with class "c4"
	doc.Find("table.c4").Each(func(i int, table *goquery.Selection) {
		// Highlight text
		content := tidyText(table.Find("span.c9").Text())
		if content == "" {
			return
		}

		// Page number (from <a class="c10">)
		page := strings.TrimSpace(table.Find("a.c10").Text())
		if page == "" {
			return
		}
		source := fmt.Sprintf("%s p. %s", bookTitle, page)

		// Title is first 100 chars of content
		title := content
		if len(title) > 100 {
			title = title[:100]
		}

		// Tags: always "To Fix"; add "Quotes" if content < 150 chars
		tags := []string{"To Fix"}
		if len(content) < 150 {
			tags = append(tags, "Quotes")
		}

		ill := Illustration{
			Title:   title,
			Author:  author,
			Source:  source,
			Content: content,
			Tags:    tags,
		}
		illustrations = append(illustrations, ill)
	})

	// Post to API
	apiToken := os.Getenv("API_TOKEN")
	if apiToken == "" {
		fmt.Println("API_TOKEN environment variable not set")
		return
	}

	for _, ill := range illustrations {
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
		fmt.Printf("Posted illustration: %s (status %s)\n", ill.Title, resp.Status)
		resp.Body.Close()
	}
}
