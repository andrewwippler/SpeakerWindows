package main

import (
	"archive/zip"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"net/http"

	"github.com/PuerkitoBio/goquery"
)

type Illustration struct {
	Title   string   `json:"title"`
	Author  string   `json:"author"`
	Source  string   `json:"source"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

type Document struct {
	XMLName xml.Name `xml:"document"`
	Body    Body     `xml:"body"`
}

type Body struct {
	XMLName xml.Name `xml:"body"`
	Ps      []P      `xml:"p"`
	Tables  []Table  `xml:"tbl"`
}

type Table struct {
	XMLName xml.Name `xml:"tbl"`
	Rows    []TR     `xml:"tr"`
}

type TR struct {
	XMLName xml.Name `xml:"tr"`
	Cells   []TD     `xml:"tc"`
}

type TD struct {
	XMLName xml.Name `xml:"tc"`
	Ps      []P      `xml:"p"`
	Tables  []Table  `xml:"tbl"`
}

type P struct {
	XMLName   xml.Name `xml:"p"`
	Texts     []R      `xml:"r"`
	Hyperlink []HL     `xml:"hyperlink"`
}

type R struct {
	XMLName xml.Name `xml:"r"`
	T       string   `xml:"t"`
}

type HL struct {
	XMLName xml.Name `xml:"hyperlink"`
	R       R        `xml:"r"`
}

var boilerplate = []string{
	"Created by", "Last synced", "This document is overwritten", "You should make a copy",
}

func isBoilerplate(text string) bool {
	for _, b := range boilerplate {
		if strings.Contains(text, b) {
			return true
		}
	}
	return false
}

// tidyText collapses whitespace
func tidyText(s string) string {
	re := regexp.MustCompile(`\s+`)
	return strings.TrimSpace(re.ReplaceAllString(s, " "))
}

// extract text from paragraph
func extractTextFromP(p P) string {
	var sb strings.Builder
	for _, r := range p.Texts {
		sb.WriteString(r.T)
	}
	if p.Hyperlink != nil {
		for _, hl := range p.Hyperlink {
			sb.WriteString(hl.R.T)
		}
	}
	return tidyText(sb.String())
}

// getFirstText tries multiple selectors for HTML
func getFirstText(doc *goquery.Document, selectors []string) string {
	for _, sel := range selectors {
		if text := tidyText(doc.Find(sel).First().Text()); text != "" {
			return text
		}
	}
	return ""
}

// parseHTML extracts Illustrations from Google Play Books HTML export
func parseHTML(path string) ([]Illustration, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	doc, err := goquery.NewDocumentFromReader(file)
	if err != nil {
		return nil, err
	}

	bookTitle := getFirstText(doc, []string{"h1 span.c33", "h1", ".title"})
	author := getFirstText(doc, []string{"p span.c17", "p", ".subtitle"})

	var illustrations []Illustration

	doc.Find("table.c4").Each(func(i int, table *goquery.Selection) {
		content := tidyText(table.Find("span.c9").Text())
		if content == "" {
			return
		}
		page := strings.TrimSpace(table.Find("a.c10").Text())
		if page == "" {
			return
		}
		source := fmt.Sprintf("%s p. %s", bookTitle, page)

		title := content
		if len(title) > 100 {
			title = title[:100]
		}

		tags := []string{"To Do"}
		if len(content) < 150 {
			tags = append(tags, "Quotes")
		}

		illustrations = append(illustrations, Illustration{
			Title:   title,
			Author:  author,
			Source:  source,
			Content: content,
			Tags:    tags,
		})
	})

	return illustrations, nil
}

func parseDOCX(path string) ([]Illustration, error) {
	// Open the DOCX as a ZIP
	r, err := zip.OpenReader(path)
	if err != nil {
		return nil, err
	}
	defer r.Close()

	var content []byte
	for _, f := range r.File {
		if f.Name == "word/document.xml" {
			rc, err := f.Open()
			if err != nil {
				return nil, err
			}
			content, err = io.ReadAll(rc)
			rc.Close()
			if err != nil {
				return nil, err
			}
			break
		}
	}
	if len(content) == 0 {
		return nil, fmt.Errorf("document.xml not found in DOCX")
	}

	var xmldoc Document
	err = xml.Unmarshal(content, &xmldoc)
	if err != nil {
		return nil, err
	}

	var illustrations []Illustration

	// Flatten all paragraphs from body
	var bookSource = extractTextFromP(xmldoc.Body.Tables[0].Rows[0].Cells[1].Ps[0])
	var bookAuthor = extractTextFromP(xmldoc.Body.Tables[0].Rows[0].Cells[1].Ps[1])

	// Extract text from tables
	for _, tbl := range xmldoc.Body.Tables {
		for _, row := range tbl.Rows {
			for _, cell := range row.Cells {
				for _, p := range cell.Tables {
					text := extractTextFromP(p.Rows[0].Cells[1].Ps[0])
					if text == "" || isBoilerplate(text) {
						// TODO: skip empty or boilerplate or if text is book title/author
						continue
					}

					// debug print the current table tree
					fmt.Printf("Table text content: %s\n", text)

					page := extractTextFromP(p.Rows[0].Cells[2].Ps[0])
					contentText := text
					fmt.Printf("Table text page: %s\n", page)

					source := bookSource
					if page != "" {
						source += " p. " + page
					}

					title := contentText
					if len(title) > 100 {
						title = title[:100]
					}
					tags := []string{"To Fix"}
					if len(contentText) < 150 {
						tags = append(tags, "Quotes")
					}

					illustrations = append(illustrations, Illustration{
						Title:   title,
						Author:  bookAuthor,
						Source:  source,
						Content: contentText,
						Tags:    tags,
					})
				}
			}
		}
	}

	return illustrations, nil
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: ./playbooks_importer <path-to-file> [--print]")
		return
	}
	filePath := os.Args[1]
	printOnly := len(os.Args) > 2 && os.Args[2] == "--print"

	ext := strings.ToLower(filepath.Ext(filePath))

	var illustrations []Illustration
	var err error

	switch ext {
	case ".html":
		illustrations, err = parseHTML(filePath)
	case ".docx":
		illustrations, err = parseDOCX(filePath)
	default:
		fmt.Printf("Unsupported file type: %s\n", ext)
		return
	}
	if err != nil {
		fmt.Println("Error parsing file:", err)
		return
	}

	// Deduplicate
	unique := make(map[string]bool)
	var deduped []Illustration
	for _, ill := range illustrations {
		key := ill.Content + "::" + ill.Source
		if !unique[key] {
			unique[key] = true
			deduped = append(deduped, ill)
		}
	}
	fmt.Printf("Found %d highlights, reduced to %d after deduplication\n", len(illustrations), len(deduped))

	if printOnly {
		data, _ := json.MarshalIndent(deduped, "", "  ")
		fmt.Println(string(data))
		return
	}

	// Post to API
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
}
