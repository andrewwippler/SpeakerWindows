package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
)

func parseReadwise(path string) ([]Illustration, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("error opening file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	headers, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("error reading CSV headers: %w", err)
	}

	indices := map[string]int{}
	for i, header := range headers {
		indices[header] = i
	}

	var illustrations []Illustration

	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Println("Error reading row:", err)
			continue
		}

		highlight := row[indices["Highlight"]]
		bookTitle := row[indices["Book Title"]]
		author := row[indices["Book Author"]]
		amazonID := row[indices["Amazon Book ID"]]
		color := row[indices["Color"]]
		locationType := row[indices["Location Type"]]
		location := row[indices["Location"]]

		title := highlight
		if len(highlight) > 100 {
			title = highlight[:100]
		}

		source := fmt.Sprintf("%s %s %s", bookTitle, locationType, location)

		tags := []string{amazonID, color, "To Fix"}
		if len(highlight) < 150 {
			tags = append(tags, "Quotes")
		}

		illustrations = append(illustrations, Illustration{
			Title:   title,
			Author:  author,
			Source:  source,
			Content: highlight,
			Tags:    tags,
		})
	}

	return illustrations, nil
}
