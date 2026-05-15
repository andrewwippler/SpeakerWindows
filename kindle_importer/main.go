package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/ledongthuc/pdf"
)

type Illustration struct {
	Title   string   `json:"title"`
	Author  string   `json:"author"`
	Source  string   `json:"source"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

type highlight struct {
	page  int
	color string
	lines []string
}

func main() {
	if len(os.Args) < 2 {
		fmt.Printf("Usage: %s <kindle-notes-pdf> [--print]\n", filepath.Base(os.Args[0]))
		return
	}
	path := os.Args[1]
	printOnly := len(os.Args) > 2 && os.Args[2] == "--print"

	f, r, err := pdf.Open(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error opening PDF: %v\n", err)
		os.Exit(1)
	}
	defer f.Close()

	var buf bytes.Buffer
	b, err := r.GetPlainText()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error extracting PDF text: %v\n", err)
		os.Exit(1)
	}
	buf.ReadFrom(b)
	text := buf.String()

	title, author, highlights := parseText(text)
	if title == "" {
		fmt.Fprintln(os.Stderr, "Could not find book title in PDF")
		os.Exit(1)
	}

	fmt.Printf("Book: %s\n", title)
	fmt.Printf("Author: %s\n", author)
	fmt.Printf("Highlights found: %d\n", len(highlights))

	illustrations := buildIllustrations(title, author, highlights)

	unique := make(map[string]bool)
	var deduped []Illustration
	for _, ill := range illustrations {
		key := ill.Content + "::" + ill.Source
		if !unique[key] {
			unique[key] = true
			deduped = append(deduped, ill)
		}
	}
	fmt.Printf("Unique illustrations: %d\n", len(deduped))

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
			fmt.Printf("Posted illustration: %s (status %s)\n", ill.Title, resp.Status)
			continue
		}

		fmt.Printf("Error posting %s: status %d body: %s\n", ill.Title, resp.StatusCode, string(bodyBytes))
	}
}

func tidyText(s string) string {
	re := regexp.MustCompile(`\s+`)
	return strings.TrimSpace(re.ReplaceAllString(s, " "))
}

func buildIllustrations(title, author string, highlights []*highlight) []Illustration {
	var result []Illustration
	for _, h := range highlights {
		content := tidyText(strings.Join(h.lines, " "))
		if content == "" {
			continue
		}

		source := title
		if h.page != 0 {
			source += fmt.Sprintf(" p. %d", h.page)
		}

		titleField := content
		if len(titleField) > 100 {
			titleField = titleField[:100]
		}

		tags := []string{h.color, "To Fix"}
		if len(content) < 150 {
			tags = append(tags, "Quotes")
		}

		result = append(result, Illustration{
			Title:   titleField,
			Author:  author,
			Source:  source,
			Content: content,
			Tags:    tags,
		})
	}
	return result
}

func parseText(text string) (string, string, []*highlight) {
	text = strings.ReplaceAll(text, "\ufffd", "")

	var title, author string
	var highlights []*highlight
	var cur *highlight
	var pendingPage int
	var hasPendingPage bool

	rePage := regexp.MustCompile(`^Page\s+(\d+)$`)
	reHighlight := regexp.MustCompile(`^\|\s*Highlight\s+\(([^)]+)\)$`)
	reContinued := regexp.MustCompile(`^\|\s*Highlight\s+Continued$`)
	reDate := regexp.MustCompile(`^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,\s+\d{4}$`)
	rePageNum := regexp.MustCompile(`^\d+$`)

	lines := strings.Split(text, "\n")

	for _, raw := range lines {
		line := strings.TrimSpace(raw)
		if line == "" {
			continue
		}

		if title == "" {
			if rePageNum.MatchString(line) || rePage.MatchString(line) {
				continue
			}
			title = line
			continue
		}

		if author == "" && strings.HasPrefix(strings.ToLower(line), "by ") {
			author = strings.TrimSpace(line[3:])
			continue
		}

		if m := rePage.FindStringSubmatch(line); m != nil {
			pendingPage, _ = strconv.Atoi(m[1])
			hasPendingPage = true
			continue
		}

		if hasPendingPage {
			hasPendingPage = false
			if m := reHighlight.FindStringSubmatch(line); m != nil {
				if cur != nil {
					highlights = append(highlights, cur)
				}
				cur = &highlight{page: pendingPage, color: m[1]}
				continue
			}
			if reContinued.MatchString(line) {
				continue
			}
		}

		if reDate.MatchString(line) {
			if cur != nil {
				highlights = append(highlights, cur)
				cur = nil
			}
			continue
		}

		if rePageNum.MatchString(line) {
			continue
		}

		if cur != nil {
			cur.lines = append(cur.lines, line)
		}
	}

	if cur != nil {
		highlights = append(highlights, cur)
	}

	return title, author, highlights
}
