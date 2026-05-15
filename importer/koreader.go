package main

import (
	"encoding/json"
	"fmt"
	"os"
)

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

type AllBooks struct {
	CreatedOn int64  `json:"created_on"`
	Version   string `json:"version"`
	Documents []Book `json:"documents"`
}

func getDocType(data []byte) string {
	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		fmt.Println(string(data))
		return "Raw"
	}

	if _, ok := raw["documents"]; ok {
		var ab AllBooks
		if err := json.Unmarshal(data, &ab); err == nil {
			fmt.Println("AllBooks")
			return "AllBooks"
		}
		fmt.Println("AllBooks-like JSON (failed to decode into AllBooks)")
		return "Unknown"
	}

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

		illustrations = append(illustrations, Illustration{
			Title:   b.Title,
			Author:  b.Author,
			Source:  source,
			Content: tidyText(entry.Text),
			Tags:    tags,
		})
	}
	return illustrations
}

func parseKoreader(path string) ([]Illustration, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	bookType := getDocType(data)
	fmt.Printf("Detected document type: %s\n", bookType)

	var illustrations []Illustration
	switch bookType {
	case "AllBooks":
		var ab AllBooks
		if err := json.Unmarshal(data, &ab); err != nil {
			return nil, fmt.Errorf("error decoding AllBooks JSON: %w", err)
		}
		fmt.Printf("AllBooks contains %d documents\n", len(ab.Documents))
		for _, doc := range ab.Documents {
			fmt.Printf("- Title: %s, Author: %s, Entries: %d\n", doc.Title, doc.Author, len(doc.Entries))
			illustrations = append(illustrations, bookToIllustrations(doc)...)
		}
	case "Book":
		var b Book
		if err := json.Unmarshal(data, &b); err != nil {
			return nil, fmt.Errorf("error decoding Book JSON: %w", err)
		}
		fmt.Printf("Book title: %s, author: %s, entries: %d\n", b.Title, b.Author, len(b.Entries))
		illustrations = bookToIllustrations(b)
	default:
		return nil, fmt.Errorf("unhandled document type: %s", bookType)
	}

	// Deduplicate within koreader parser
	dedup := make(map[string]Illustration)
	for _, ill := range illustrations {
		key := ill.Content + "::" + ill.Source
		dedup[key] = ill
	}

	var result []Illustration
	for _, ill := range dedup {
		result = append(result, ill)
	}
	fmt.Printf("Total unique illustrations: %d\n", len(result))

	return result, nil
}

