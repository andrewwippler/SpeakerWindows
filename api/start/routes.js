'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')
const Drive = use('Drive')
const Upload = use('App/Models/Upload')


//auth
Route.post('register', 'UserController.store').validator('User').middleware('guest')
Route.post('login', 'UserController.login').middleware('throttle:5,120')

Route
  .get('users/:uid', 'UserController.show')
  .middleware('auth')

Route.group(() =>{
  // illustrations
  Route.get('/illustrations', 'IllustrationController.index')
  Route.post('/illustrations', 'IllustrationController.store')
  Route.get('/illustrations/:id', 'IllustrationController.show')
  Route.put('/illustrations/:id', 'IllustrationController.update')
  Route.delete('/illustrations/:id', 'IllustrationController.destroy')

  //tags
  //are created on new illustrations only
  Route.get('/tags', 'TagController.index')
  Route.get('/tags/:name', 'TagController.search')
  Route.put('/tags/:id', 'TagController.update')
  Route.delete('/tags/:id', 'TagController.destroy')

  // places
  Route.get('/places/:illustration_id', 'PlaceController.show')
  Route.post('/places/:illustration_id', 'PlaceController.store')
  Route.put('/places/:id', 'PlaceController.update')
  Route.delete('/places/:id', 'PlaceController.destroy')

  // Images
  Route.post('/upload', async ({ request }) => {

    const { illustration_id } = request.post()
    request.multipart.file('illustration_image', {}, async (file) => {
      const imagePath = `${auth.user.uid}/${illustration_id}/${file.clientName}`
      await Drive.disk('s3').put(imagePath, file.stream)

      Upload.create({ illustration_id, name: imagePath, type: file.type })

    })

    await request.multipart.process()
  })

}).middleware('auth')
