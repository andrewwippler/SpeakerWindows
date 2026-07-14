/**
 * generate-help-docs.ts
 *
 * Reads helpContent.ts (the single source of truth) and generates:
 *   - docs/pages/{topicId}.md   (Markdown page guides with frontmatter)
 *   - docs/features/{topicId}.md (aliases for feature docs)
 *   - docs/tours/{topicId}_tour.json (interactive tour steps)
 *
 * Run via: npm run generate:help
 * Also runs automatically before `next build` via the prebuild hook.
 *
 * Dependencies: ts-node (devDependency, already present)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// We need to import the TS data file. Since this runs via ts-node,
// we can import it directly after transpilation.
// For the prebuild hook, we use: node --import tsx scripts/generate-help-docs.ts
// which handles TS natively.

const helpContentPath = path.resolve(__dirname, '../src/data/helpContent.ts')

// Dynamic import of the TypeScript file (works with tsx/ts-node loaders)
const { helpTopics } = await import(helpContentPath) as typeof import('../src/data/helpContent.ts')

const docsDir = path.resolve(__dirname, '../docs')
const pagesDir = path.join(docsDir, 'pages')
const featuresDir = path.join(docsDir, 'features')
const toursDir = path.join(docsDir, 'tours')

// Ensure directories exist
for (const dir of [pagesDir, featuresDir, toursDir]) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeMarkdown(filePath: string, topic: typeof helpTopics[number]) {
  const frontmatter = [
    '---',
    `page_id: "${topic.id}"`,
    `title: "${topic.title}"`,
    `last_updated: "${new Date().toISOString().split('T')[0]}"`,
    `category: "${topic.category}"`,
    `audience: "${topic.audience}"`,
    '---',
    '',
  ].join('\n')

  fs.writeFileSync(filePath, frontmatter + topic.fullContent + '\n', 'utf-8')
}

function writeTour(filePath: string, topic: typeof helpTopics[number]) {
  if (!topic.tourSteps || !topic.tourMeta) return

  const tour = {
    component_id: topic.tourMeta.componentId,
    version: '1.0.0',
    page: topic.tourMeta.page,
    steps: topic.tourSteps.map((s) => ({
      step: s.step,
      target_selector: s.targetSelector,
      title: s.title,
      content: s.content,
      placement: s.placement,
    })),
  }

  fs.writeFileSync(filePath, JSON.stringify(tour, null, 2) + '\n', 'utf-8')
}

console.log('Generating help documentation from src/data/helpContent.ts...')

for (const topic of helpTopics) {
  // Write page doc
  const pagePath = path.join(pagesDir, `${topic.id}.md`)
  writeMarkdown(pagePath, topic)
  console.log(`  -> ${path.relative(process.cwd(), pagePath)}`)

  // Write feature doc (alias)
  const featurePath = path.join(featuresDir, `${topic.id}.md`)
  writeMarkdown(featurePath, topic)
  console.log(`  -> ${path.relative(process.cwd(), featurePath)}`)

  // Write tour JSON (if tour steps exist)
  if (topic.tourSteps && topic.tourSteps.length > 0) {
    const tourPath = path.join(toursDir, `${topic.id}_tour.json`)
    writeTour(tourPath, topic)
    console.log(`  -> ${path.relative(process.cwd(), tourPath)}`)
  }
}

console.log(`\nDone. Generated docs for ${helpTopics.length} topics.`)
