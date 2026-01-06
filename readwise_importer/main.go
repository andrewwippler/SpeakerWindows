package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

type Illustration struct {
	Title   string   `json:"title"`
	Author  string   `json:"author"`
	Source  string   `json:"source"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

func main() {

	if len(os.Args) < 2 {
		fmt.Println("Usage: ./readwise-import-script <path-to-html-file>")
		return
	}
	csvFile := os.Args[1]
	// Open CSV file
	file, err := os.Open(csvFile)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	// Read CSV
	reader := csv.NewReader(file)
	headers, err := reader.Read()
	if err != nil {
		fmt.Println("Error reading CSV headers:", err)
		return
	}

	// Find indexes of required fields
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

		// Generate title from first 100 chars of highlight
		title := highlight
		if len(highlight) > 100 {
			title = highlight[:100]
		}

		// Construct source
		source := fmt.Sprintf("%s %s %s", bookTitle, locationType, location)

		// Construct tags
		tags := []string{amazonID, color, "To Fix"}
		if len(highlight) < 150 {
			tags = append(tags, "Quotes")
		}

		illustration := Illustration{
			Title:   title,
			Author:  author,
			Source:  source,
			Content: highlight,
			Tags:    tags,
		}
		illustrations = append(illustrations, illustration)
	}

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
		// parse response to handle duplicates
		var respBody map[string]interface{}
		bodyBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode == 409 {
			if err := json.Unmarshal(bodyBytes, &respBody); err == nil {
				if id, ok := respBody["id"]; ok {
					fmt.Printf("Skipped duplicate: %v (id: %v)\n", ill.Title, id)
					continue
				}
			}
			fmt.Printf("Skipped duplicate: %s (status %d)\n", ill.Title, resp.StatusCode)
			continue
		}
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
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
