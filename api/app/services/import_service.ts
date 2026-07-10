import fs from 'node:fs/promises'
import Papa from 'papaparse'
import * as cheerio from 'cheerio'
import JSZip from 'jszip'
import { PDFParse } from 'pdf-parse'

export interface ImportIllustration {
  title: string
  author: string
  source: string
  content: string
  tags: string[]
}

export class ImportService {
  static tidyText(s: string): string {
    return s.trim().replace(/\s+/g, ' ')
  }

  static async parseReadwise(filePath: string): Promise<ImportIllustration[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true })
    const headers = parsed.meta.fields || []
    const indices: Record<string, number> = {}
    headers.forEach((h, i) => {
      indices[h] = i
    })

    const rows = parsed.data as Record<string, string>[]
    const illustrations: ImportIllustration[] = []

    for (const row of rows) {
      const highlight = row['Highlight'] || ''
      const bookTitle = row['Book Title'] || ''
      const author = row['Book Author'] || ''
      const amazonID = row['Amazon Book ID'] || ''
      const color = row['Color'] || ''
      const locationType = row['Location Type'] || ''
      const location = row['Location'] || ''

      if (!highlight) continue

      const title = highlight.length > 100 ? highlight.slice(0, 100) : highlight
      const source = `${bookTitle} ${locationType} ${location}`.trim()

      const tags: string[] = [amazonID, color, 'To Fix'].filter(Boolean)
      if (highlight.length < 150) {
        tags.push('Quotes')
      }

      illustrations.push({ title, author, source, content: highlight, tags })
    }

    return illustrations
  }

  static async parseKoreader(filePath: string): Promise<ImportIllustration[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    const raw = JSON.parse(content)

    let illustrations: ImportIllustration[] = []

    if (raw.documents) {
      const allBooks = raw as { documents: any[] }
      for (const doc of allBooks.documents) {
        illustrations = illustrations.concat(this.bookToIllustrations(doc))
      }
    } else if (raw.entries) {
      illustrations = this.bookToIllustrations(raw)
    }

    const dedup = new Map<string, ImportIllustration>()
    for (const ill of illustrations) {
      const key = ill.content + '::' + ill.source
      dedup.set(key, ill)
    }

    return [...dedup.values()]
  }

  private static bookToIllustrations(book: any): ImportIllustration[] {
    const result: ImportIllustration[] = []
    const entries = book.entries || []

    for (const entry of entries) {
      let source = book.title || ''
      if (entry.page && entry.page !== 0) {
        source += ` p. ${entry.page}`
      }

      const content = this.tidyText(entry.text || '')
      if (!content) continue

      const titleField = content.length > 100 ? content.slice(0, 100) : content

      const tags: string[] = [entry.color || '', 'To-Fix'].filter(Boolean)
      if (content.length < 150) {
        tags.push('Quotes')
      }

      result.push({
        title: book.title || '',
        author: book.author || '',
        source,
        content,
        tags,
      })
    }

    return result
  }

  static async parsePlaybooks(filePath: string): Promise<ImportIllustration[]> {
    const ext = filePath.toLowerCase().split('.').pop()

    if (ext === 'html') {
      return this.parsePlaybooksHTML(filePath)
    } else if (ext === 'docx') {
      return this.parsePlaybooksDOCX(filePath)
    }
    throw new Error(`Unsupported file type: .${ext}`)
  }

  private static async parsePlaybooksHTML(filePath: string): Promise<ImportIllustration[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    const $ = cheerio.load(content)

    const bookTitle =
      $('h1 span.c33').first().text().trim() ||
      $('h1').first().text().trim() ||
      $('.title').first().text().trim()

    const author =
      $('p span.c17').first().text().trim() ||
      $('p').first().text().trim() ||
      $('.subtitle').first().text().trim()

    const illustrations: ImportIllustration[] = []

    $('table.c4').each((_i, table) => {
      const $table = $(table)
      const contentText = this.tidyText($table.find('span.c9').text())
      if (!contentText) return

      const page = $table.find('a.c10').text().trim()
      if (!page) return

      const source = bookTitle ? `${bookTitle} p. ${page}` : `p. ${page}`

      const title = contentText.length > 100 ? contentText.slice(0, 100) : contentText

      const tags: string[] = ['To Do']
      if (contentText.length < 150) {
        tags.push('Quotes')
      }

      illustrations.push({
        title,
        author,
        source,
        content: contentText,
        tags,
      })
    })

    return this.dedupIllustrations(illustrations)
  }

  private static async parsePlaybooksDOCX(filePath: string): Promise<ImportIllustration[]> {
    const data = await fs.readFile(filePath)
    const zip = await JSZip.loadAsync(data)
    const docFile = zip.file('word/document.xml')
    if (!docFile) throw new Error('document.xml not found in DOCX')

    const xmlContent = await docFile.async('string')

    const extractText = (xml: string): string => {
      const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
      let m: RegExpExecArray | null
      let result = ''
      while ((m = tRegex.exec(xml)) !== null) {
        result += m[1]
      }
      return result
    }

    const balancedExtract = (xml: string, tag: string): string[] => {
      const results: string[] = []
      const openTag = `<${tag}`
      const closeTag = `</${tag}>`
      let pos = 0

      while (pos < xml.length) {
        const openIdx = xml.indexOf(openTag, pos)
        if (openIdx === -1) break

        let depth = 1
        let searchPos = openIdx + openTag.length

        while (depth > 0 && searchPos < xml.length) {
          const nextOpen = xml.indexOf(openTag, searchPos)
          const nextClose = xml.indexOf(closeTag, searchPos)

          if (nextClose === -1) break

          if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++
            searchPos = nextOpen + openTag.length
          } else {
            depth--
            searchPos = nextClose + closeTag.length
            if (depth === 0) {
              results.push(xml.slice(openIdx, searchPos))
            }
          }
        }
        pos = searchPos
      }

      return results
    }

    const tableXmls = balancedExtract(xmlContent, 'w:tbl')

    if (tableXmls.length === 0) {
      return []
    }

    let bookSource = ''
    let bookAuthor = ''

    const firstTableRows = balancedExtract(tableXmls[0], 'w:tr')
    if (firstTableRows.length > 0) {
      const rowCells = balancedExtract(firstTableRows[0], 'w:tc')
      if (rowCells.length > 1) {
        const cellP = balancedExtract(rowCells[1], 'w:p')
        if (cellP.length > 0) bookSource = this.tidyText(extractText(cellP[0]))
        if (cellP.length > 1) bookAuthor = this.tidyText(extractText(cellP[1]))
      }
    }

    const boilerplate = [
      'Created by',
      'Last synced',
      'This document is overwritten',
      'You should make a copy',
    ]
    const isBoilerplate = (text: string) => boilerplate.some((b) => text.includes(b))

    const illustrations: ImportIllustration[] = []

    for (const tblXml of tableXmls) {
      const rows = balancedExtract(tblXml, 'w:tr')
      for (const rowXml of rows) {
        const cells = balancedExtract(rowXml, 'w:tc')
        for (const cellXml of cells) {
          const nestedTables = balancedExtract(cellXml, 'w:tbl')
          for (const ntXml of nestedTables) {
            const ntRows = balancedExtract(ntXml, 'w:tr')
            for (const ntRowXml of ntRows) {
              const ntCells = balancedExtract(ntRowXml, 'w:tc')
              const text = this.tidyText(extractText(ntCells[1] || ''))
              if (!text || isBoilerplate(text)) continue

              const page = this.tidyText(extractText(ntCells[2] || ''))
              let source = bookSource
              if (page) {
                source += ` p. ${page}`
              }

              const title = text.length > 100 ? text.slice(0, 100) : text
              const tags: string[] = ['To Fix']
              if (text.length < 150) {
                tags.push('Quotes')
              }

              illustrations.push({
                title,
                author: bookAuthor,
                source,
                content: text,
                tags,
              })
            }
          }
        }
      }
    }

    return this.dedupIllustrations(illustrations)
  }

  static async parseKindle(filePath: string): Promise<ImportIllustration[]> {
    const dataBuffer = await fs.readFile(filePath)
    const parser = new PDFParse({ data: dataBuffer })
    await parser.load()
    const textResult = await parser.getText()
    const text = textResult.text.replace(/\ufffd/g, '')

    let title = ''
    let author = ''
    const highlights: { page: number; color: string; lines: string[] }[] = []
    let cur: { page: number; color: string; lines: string[] } | null = null
    let pendingPage = 0
    let hasPendingPage = false

    const rePage = /^Page\s+(\d+)$/
    const reHighlight = /^\|\s*Highlight\s+\(([^)]+)\)$/
    const reContinued = /^\|\s*Highlight\s+Continued$/
    const reDate =
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,\s+\d{4}$/
    const rePageNum = /^\d+$/

    const lines = text.split('\n')

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue

      if (!title) {
        if (rePageNum.test(line) || rePage.test(line)) continue
        title = line
        continue
      }

      if (!author && line.toLowerCase().startsWith('by ')) {
        author = line.slice(3).trim()
        continue
      }

      const pageMatch = line.match(rePage)
      if (pageMatch) {
        pendingPage = Number.parseInt(pageMatch[1], 10)
        hasPendingPage = true
        continue
      }

      if (hasPendingPage) {
        hasPendingPage = false
        const hlMatch = line.match(reHighlight)
        if (hlMatch) {
          if (cur) highlights.push(cur)
          cur = { page: pendingPage, color: hlMatch[1], lines: [] }
          continue
        }
        if (reContinued.test(line)) continue
      }

      if (reDate.test(line)) {
        if (cur) {
          highlights.push(cur)
          cur = null
        }
        continue
      }

      if (rePageNum.test(line)) continue

      if (cur) {
        cur.lines.push(line)
      }
    }

    if (cur) highlights.push(cur)

    if (!title) throw new Error('Could not find book title in PDF')

    const result: ImportIllustration[] = []
    for (const h of highlights) {
      const content = this.tidyText(h.lines.join(' '))
      if (!content) continue

      let source = title
      if (h.page !== 0) {
        source += ` p. ${h.page}`
      }

      const titleField = content.length > 100 ? content.slice(0, 100) : content
      const tags: string[] = [h.color, 'To Fix'].filter(Boolean)
      if (content.length < 150) {
        tags.push('Quotes')
      }

      result.push({ title: titleField, author, source, content, tags })
    }

    return result
  }

  static async parse(filePath: string, importer: string): Promise<ImportIllustration[]> {
    switch (importer) {
      case 'readwise':
        return this.parseReadwise(filePath)
      case 'koreader':
        return this.parseKoreader(filePath)
      case 'playbooks':
        return this.parsePlaybooks(filePath)
      case 'kindle':
        return this.parseKindle(filePath)
      default:
        throw new Error(`Unknown importer: ${importer}`)
    }
  }

  private static dedupIllustrations(illustrations: ImportIllustration[]): ImportIllustration[] {
    const seen = new Set<string>()
    const result: ImportIllustration[] = []
    for (const ill of illustrations) {
      const key = ill.content + '::' + ill.source
      if (!seen.has(key)) {
        seen.add(key)
        result.push(ill)
      }
    }
    return result
  }
}
