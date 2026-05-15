package main

import (
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

var wsRegex = regexp.MustCompile(`\s+`)

func tidyText(s string) string {
	return strings.TrimSpace(wsRegex.ReplaceAllString(s, " "))
}
