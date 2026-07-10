import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/user_factory'
import Illustration from '#models/illustration'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import JSZip from 'jszip'

const dirname = fileURLToPath(import.meta.url)
  .split('/')
  .slice(0, -2)
  .join('/')
const assetsDir = join(dirname, 'assets', 'import')

async function login(client: any, email: string, password: string) {
  const response = await client.post('/login').json({ email, password })
  return response.body().token
}

function generateMinimalPDF(textLines: string[]): Buffer {
  const text = textLines.join('\n')
  const contentStream = `BT /F1 12 Tf 100 700 Td (${text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\n/g, ') Tj\n0 -14 Td (')}) Tj\nET`

  const objects = [
    `1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`,
    `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj`,
    `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj`,
    `4 0 obj<</Length ${Buffer.byteLength(contentStream)}>>stream\n${contentStream}\nendstream\nendobj`,
    `5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj`,
  ]

  const body = objects.join('\n')
  const xrefOffset = '%PDF-1.4\n'.length + Buffer.byteLength(body, 'utf-8') + '\n'.length

  const xref = `xref\n0 ${objects.length + 1}\n${'0000000000 65535 f \n'}${objects
    .map((_, i) => {
      let offset = '%PDF-1.4\n'.length
      for (let j = 0; j < i; j++) {
        offset += Buffer.byteLength(objects[j], 'utf-8') + '\n'.length
      }
      return `${String(offset).padStart(10, '0')} 00000 n \n`
    })
    .join('')}`

  const trailer = `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(`%PDF-1.4\n${body}\n${xref}${trailer}\n`, 'utf-8')
}

test.group('Import', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  group.each.teardown(async () => {
    const tmpPath = join(dirname, '..', 'tmp', 'imports')
    await fs.rm(tmpPath, { recursive: true, force: true }).catch(() => {})
  })

  test('unauthenticated user receives 401', async ({ client }) => {
    const response = await client.post('/import').send()

    response.assertStatus(401)
  })

  test('returns 400 for invalid importer type', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const csvPath = join(assetsDir, 'test_readwise.csv')
    const response = await client
      .post('/import')
      .file('file', csvPath)
      .fields({ importer: 'invalid_type' })
      .bearerToken(token)
      .send()

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Invalid importer type. Must be one of: readwise, koreader, playbooks, kindle',
    })
  })

  test('returns 400 when no file is uploaded', async ({ client }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const response = await client
      .post('/import')
      .fields({ importer: 'readwise' })
      .bearerToken(token)
      .send()

    response.assertStatus(400)
    response.assertBodyContains({ message: 'No file uploaded' })
  })

  test('returns 400 for wrong file extension', async ({ client }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const txtPath = join(dirname, 'assets', 'sample.txt')
    const response = await client
      .post('/import')
      .file('file', txtPath)
      .fields({ importer: 'readwise' })
      .bearerToken(token)
      .send()

    response.assertStatus(400)
  })

  test('returns 200 with 0 imported for file with no valid data', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const tmpFile = join(dirname, 'tmp', `invalid_${Date.now()}.csv`)
    await fs.mkdir(join(dirname, 'tmp'), { recursive: true })
    await fs.writeFile(tmpFile, 'not,a,valid,csv,header')
    const response = await client
      .post('/import')
      .file('file', tmpFile)
      .fields({ importer: 'readwise' })
      .bearerToken(token)
      .send()
    await fs.unlink(tmpFile).catch(() => {})

    response.assertStatus(200)
    assert.equal(response.body().imported, 0)
    assert.equal(response.body().total, 0)
  })

  test('successfully imports Readwise CSV', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const csvPath = join(assetsDir, 'test_readwise.csv')
    const response = await client
      .post('/import')
      .file('file', csvPath)
      .fields({ importer: 'readwise' })
      .bearerToken(token)
      .send()

    response.assertStatus(200)
    assert.equal(response.body().imported, 2)
    assert.equal(response.body().duplicates, 0)
    assert.equal(response.body().total, 2)

    const illustrations = await Illustration.query().where('user_id', user.id)
    assert.equal(illustrations.length, 2)
  })

  test('successfully imports KOReader JSON', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const jsonPath = join(assetsDir, 'test_koreader.json')
    const response = await client
      .post('/import')
      .file('file', jsonPath)
      .fields({ importer: 'koreader' })
      .bearerToken(token)
      .send()

    response.assertStatus(200)
    assert.equal(response.body().imported, 2)
    assert.equal(response.body().total, 2)

    const illustrations = await Illustration.query().where('user_id', user.id)
    assert.equal(illustrations.length, 2)
  })

  test('successfully imports Play Books HTML', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const htmlPath = join(assetsDir, 'test_playbooks.html')
    const response = await client
      .post('/import')
      .file('file', htmlPath)
      .fields({ importer: 'playbooks' })
      .bearerToken(token)
      .send()

    response.assertStatus(200)
    assert.equal(response.body().imported, 2)
    assert.equal(response.body().total, 2)

    const illustrations = await Illustration.query().where('user_id', user.id)
    assert.equal(illustrations.length, 2)
  })

  test('successfully imports Play Books DOCX', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const docxPath = join(dirname, 'tmp', `test_${Date.now()}.docx`)
    await fs.mkdir(join(dirname, 'tmp'), { recursive: true })

    // Header table: row with 2 cells (cell 0 = label, cell 1 = book info with 2 paragraphs)
    // Content table: cell with nested table where each row has cells[0]=placeholder, cells[1]=text, cells[2]=page
    // Must include [Content_Types].xml so file-type detects it as docx, not zip
    const zip = new JSZip()
    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    )
    zip.file(
      'word/document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Book:</w:t></w:r></w:p></w:tc>
        <w:tc>
          <w:p><w:r><w:t>Test Book</w:t></w:r></w:p>
          <w:p><w:r><w:t>Test Author</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:tbl>
      <w:tr>
        <w:tc>
          <w:tbl>
            <w:tr>
              <w:tc><w:p><w:r><w:t> </w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>Test highlight one.</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>42</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`
    )
    const docxBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    await fs.writeFile(docxPath, docxBuffer)

    const response = await client
      .post('/import')
      .file('file', docxPath)
      .fields({ importer: 'playbooks' })
      .bearerToken(token)
      .send()
    await fs.unlink(docxPath).catch(() => {})

    response.assertStatus(200)
    assert.equal(response.body().imported, 1)
    assert.equal(response.body().total, 1)
  })

  test('successfully imports Kindle PDF', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const pdfPath = join(dirname, 'tmp', `test_${Date.now()}.pdf`)
    await fs.mkdir(join(dirname, 'tmp'), { recursive: true })

    const pdfContent = generateMinimalPDF([
      'Test Book',
      'by Test Author',
      '',
      'Page 1',
      '| Highlight (yellow)',
      'Test highlight one.',
      '',
      'January 1, 2024',
    ])
    await fs.writeFile(pdfPath, pdfContent)

    const response = await client
      .post('/import')
      .file('file', pdfPath)
      .fields({ importer: 'kindle' })
      .bearerToken(token)
      .send()
    await fs.unlink(pdfPath).catch(() => {})

    response.assertStatus(200)
    assert.equal(response.body().imported, 1)
    assert.equal(response.body().total, 1)
  })

  test('skips duplicate illustrations on re-import', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const token = await login(client, user.email, 'oasssadfasdf')

    const csvPath = join(assetsDir, 'test_readwise.csv')
    const firstResponse = await client
      .post('/import')
      .file('file', csvPath)
      .fields({ importer: 'readwise' })
      .bearerToken(token)
      .send()

    assert.equal(firstResponse.body().imported, 2)

    const secondResponse = await client
      .post('/import')
      .file('file', csvPath)
      .fields({ importer: 'readwise' })
      .bearerToken(token)
      .send()

    secondResponse.assertStatus(200)
    assert.equal(secondResponse.body().imported, 0)
    assert.equal(secondResponse.body().duplicates, 2)
  })
})
