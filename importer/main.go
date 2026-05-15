package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

type ParserFunc func(string) ([]Illustration, error)

var parsers = map[string]ParserFunc{
	"readwise":  parseReadwise,
	"koreader":  parseKoreader,
	"playbooks": parsePlaybooks,
	"kindle":    parseKindle,
}

func main() {
	importerName := flag.String("importer", "", "Importer type: readwise|koreader|playbooks|kindle")
	printOnly := flag.Bool("print", false, "Print JSON output instead of posting")
	flag.Parse()

	if *importerName == "" {
		fmt.Println("Usage: sw-importer --importer=<type> [--print] <file>")
		fmt.Println("Available importers: readwise, koreader, playbooks, kindle")
		os.Exit(1)
	}

	if flag.NArg() < 1 {
		fmt.Println("Error: missing input file path")
		os.Exit(1)
	}
	path := flag.Arg(0)

	parser, ok := parsers[*importerName]
	if !ok {
		fmt.Printf("Unknown importer: %s\n", *importerName)
		os.Exit(1)
	}

	illustrations, err := parser(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Found %d illustrations\n", len(illustrations))

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

	if *printOnly {
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
