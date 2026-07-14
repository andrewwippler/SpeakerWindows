import React from 'react'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function processInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Inline code (must come before bold/italic to avoid conflicts)
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
        >
          {codeMatch[1]}
        </code>,
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      parts.push(
        <strong key={key++} className="font-semibold text-gray-900">
          {boldMatch[1]}
        </strong>,
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic
    const italicMatch = remaining.match(/^\*([^*]+)\*/)
    if (italicMatch) {
      parts.push(
        <em key={key++} className="italic">
          {italicMatch[1]}
        </em>,
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Plain text - consume until next special character
    const nextSpecial = remaining.search(/[`*]/)
    if (nextSpecial === -1) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }
    if (nextSpecial === 0) {
      // Special char not matched by any rule above, consume it as plain text
      parts.push(<span key={key++}>{remaining[0]}</span>)
      remaining = remaining.slice(1)
      continue
    }
    parts.push(<span key={key++}>{remaining.slice(0, nextSpecial)}</span>)
    remaining = remaining.slice(nextSpecial)
  }

  return parts
}

function parseTable(lines: string[]): React.ReactNode {
  if (lines.length < 2) return null

  const parseRow = (line: string) =>
    line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0)

  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow)

  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-gray-900 bg-gray-50"
              >
                {processInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-gray-700">
                  {processInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Table detection
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      elements.push(<div key={key++}>{parseTable(tableLines)}</div>)
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={key++} className="my-6 border-gray-200" />)
      i++
      continue
    }

    // Headings
    const h4Match = line.match(/^#{4,} (.+)/)
    if (h4Match) {
      elements.push(
        <h4
          key={key++}
          className="text-base font-semibold text-sky-900 mt-4 mb-2"
        >
          {processInline(h4Match[1])}
        </h4>,
      )
      i++
      continue
    }

    const h3Match = line.match(/^### (.+)/)
    if (h3Match) {
      elements.push(
        <h3
          key={key++}
          className="text-lg font-bold text-sky-900 mt-6 mb-2"
        >
          {processInline(h3Match[1])}
        </h3>,
      )
      i++
      continue
    }

    const h2Match = line.match(/^## (.+)/)
    if (h2Match) {
      elements.push(
        <h2
          key={key++}
          className="text-xl font-bold text-sky-900 mt-8 mb-3"
        >
          {processInline(h2Match[1])}
        </h2>,
      )
      i++
      continue
    }

    const h1Match = line.match(/^# (.+)/)
    if (h1Match) {
      elements.push(
        <h1
          key={key++}
          className="text-2xl font-bold text-sky-900 mb-4"
        >
          {processInline(h1Match[1])}
        </h1>,
      )
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <blockquote
          key={key++}
          className="border-l-4 border-sky-300 pl-4 py-2 my-4 bg-sky-50 text-sm text-gray-700"
        >
          {quoteLines.map((ql, qi) => (
            <p key={qi}>{processInline(ql)}</p>
          ))}
        </blockquote>,
      )
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 my-3 text-gray-700">
          {listItems.map((item, li) => (
            <li key={li}>{processInline(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    // Unordered list
    if (line.startsWith('- ')) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-3 text-gray-700">
          {listItems.map((item, li) => (
            <li key={li}>{processInline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    // Paragraph - collect consecutive non-empty, non-special lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,6} /.test(lines[i]) &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('- ') &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].includes('|')
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      elements.push(
        <p key={key++} className="my-3 text-gray-700 leading-relaxed">
          {processInline(paraLines.join(' '))}
        </p>,
      )
    }
  }

  return <>{elements}</>
}
