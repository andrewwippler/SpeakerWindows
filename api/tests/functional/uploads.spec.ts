// import { test } from '@japa/runner'
// import { join } from 'path'
// import Application from '@ioc:Adonis/Core/Application'
// import fs from 'fs/promises'

// test.group('UploadsController', (group) => {
//   group.each.teardown(async () => {
//     // Cleanup the uploads directory after each test
//     const uploadsPath = Application.tmpPath('uploads')
//     await fs.rm(uploadsPath, { recursive: true, force: true })
//   })

//   test('should upload a file successfully', async ({ client, assert }) => {
//     const filePath = join(__dirname, '..', 'assets', '1kb.png')
//     const response = await client.post('/upload').file('file', filePath).send()

//     response.assertStatus(200)
//     response.assertBodyContains({ message: 'File uploaded successfully' })

//     const uploadsPath = Application.tmpPath('uploads', '1kb.png')
//     const fileExists = await fs.access(uploadsPath).then(() => true).catch(() => false)

//     assert.isTrue(fileExists)
//   })

//   test('should fail when no file is uploaded', async ({ client }) => {
//     const response = await client.post('/upload').send()

//     response.assertStatus(400)
//     response.assertBodyContains({ errors: [{ message: 'No file uploaded' }] })
//   })

//   test('should fail when an invalid file is uploaded', async ({ client }) => {
//     const filePath = join(__dirname, '..', 'assets', 'sample.txt')
//     const response = await client.post('/upload').file('file', filePath).send()

//     response.assertStatus(400)
//     response.assertBodyContains({ errors: [{ message: 'Invalid file extension' }] })
//   })
// })
