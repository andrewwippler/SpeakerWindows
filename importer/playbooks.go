package main

import (
	"archive/zip"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

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

func getFirstText(doc *goquery.Document, selectors []string) string {
	for _, sel := range selectors {
		if text := tidyText(doc.Find(sel).First().Text()); text != "" {
			return text
		}
	}
	return ""
}

func parsePlaybooksHTML(path string) ([]Illustration, error) {
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

func parsePlaybooksDOCX(path string) ([]Illustration, error) {
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

	bookSource := extractTextFromP(xmldoc.Body.Tables[0].Rows[0].Cells[1].Ps[0])
	bookAuthor := extractTextFromP(xmldoc.Body.Tables[0].Rows[0].Cells[1].Ps[1])

	for _, tbl := range xmldoc.Body.Tables {
		for _, row := range tbl.Rows {
			for _, cell := range row.Cells {
				for _, p := range cell.Tables {
					text := extractTextFromP(p.Rows[0].Cells[1].Ps[0])
					if text == "" || isBoilerplate(text) {
						continue
					}

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

func parsePlaybooks(path string) ([]Illustration, error) {
	ext := strings.ToLower(filepath.Ext(path))

	var illustrations []Illustration
	var err error

	switch ext {
	case ".html":
		illustrations, err = parsePlaybooksHTML(path)
	case ".docx":
		illustrations, err = parsePlaybooksDOCX(path)
	default:
		return nil, fmt.Errorf("unsupported file type: %s", ext)
	}
	if err != nil {
		return nil, err
	}

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

	return deduped, nil
}
