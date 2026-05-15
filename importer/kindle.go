package main

import (
	"bytes"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/ledongthuc/pdf"
)

type highlight struct {
	page  int
	color string
	lines []string
}

func parseKindle(path string) ([]Illustration, error) {
	f, r, err := pdf.Open(path)
	if err != nil {
		return nil, fmt.Errorf("error opening PDF: %w", err)
	}
	defer f.Close()

	var buf bytes.Buffer
	b, err := r.GetPlainText()
	if err != nil {
		return nil, fmt.Errorf("error extracting PDF text: %w", err)
	}
	buf.ReadFrom(b)
	text := buf.String()

	title, author, highlights := parseKindleText(text)
	if title == "" {
		return nil, fmt.Errorf("could not find book title in PDF")
	}

	fmt.Printf("Book: %s\n", title)
	fmt.Printf("Author: %s\n", author)
	fmt.Printf("Highlights found: %d\n", len(highlights))

	illustrations := buildKindleIllustrations(title, author, highlights)
	return illustrations, nil
}

func parseKindleText(text string) (string, string, []*highlight) {
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

func buildKindleIllustrations(title, author string, highlights []*highlight) []Illustration {
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
