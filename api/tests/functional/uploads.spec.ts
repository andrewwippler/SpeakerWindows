import { test } from '@japa/runner'
import { join } from 'path'
import app from '@adonisjs/core/services/app'
import fs from 'fs/promises'
import path from 'path';
import { fileURLToPath } from 'url'
import UserFactory from '#database/factories/UserFactory'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user';
import IllustrationFactory from '#database/factories/IllustrationFactory';
import Illustration from '#models/illustration';
let goodUser: User, illustration: Illustration

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

test.group('UploadsController', (group) => {

  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  group.each.teardown(async () => {
    // Cleanup the uploads directory after each test
    const uploadsPath = app.makePath('uploads', 'test')
    await fs.rm(uploadsPath, { recursive: true, force: true })
  })

  group.setup(async () => {
    goodUser = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    illustration = await IllustrationFactory.merge({ title: 'Illustrations Test', user_id: goodUser.id }).create()
  })

  group.teardown(async () => {
    await goodUser.delete()
  })

  test('should upload a file successfully', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const filePath = join(__dirname, '..', 'assets', '1kb.png')
    const response = await client.post('/upload').file('illustration_image', filePath)
    .fields({
      illustration_id: illustration.id
    })
  .bearerToken(loggedInUser.body().token).send()

    response.assertStatus(200)
    response.assertBodyContains({ message: 'File uploaded successfully' })


    const verify = await client.get(`/illustration/${illustration.id}`).bearerToken(loggedInUser.body().token)

    const uploadsPath = app.makePath('uploads', 'test', verify.body().uploads[0].name)
    const fileExists = await fs.access(uploadsPath).then(() => true).catch(() => false)
    assert.isTrue(fileExists)
  })

  test('should fail when no file is uploaded', async ({ client }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })

    const response = await client.post('/upload').fields({
      illustration_id: illustration.id
    }).bearerToken(loggedInUser.body().token).send()

    response.assertStatus(400)
    response.assertBodyContains({ message: 'No file uploaded' })
  })

  test('should fail when an invalid file is uploaded', async ({ client }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })

    const filePath = join(__dirname, '..', 'assets', 'sample.txt')
    const response = await client.post('/upload').file('illustration_image', filePath).fields({
      illustration_id: illustration.id
    }).bearerToken(loggedInUser.body().token).send()

    response.assertStatus(400)
    response.assertBodyContains([{ message: 'Invalid file extension txt. Only jpg, png, gif, pdf are allowed' }])
  })
})
