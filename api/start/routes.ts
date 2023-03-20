/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'
// import Upload from 'App/Models/Upload'

//auth
Route.post('register', 'UsersController.store')
Route.post('login', 'UsersController.login')

Route
  .get('users/:uid', 'UsersController.show')
  .middleware('auth')

Route.group(() =>{
  // illustrations
  Route.get('/illustrations', 'IllustrationsController.index')
  Route.post('/illustration', 'IllustrationsController.store')
  Route.get('/illustration/:id', 'IllustrationsController.show')
  Route.get('/illustrations/:id', 'IllustrationsController.showOld')
  Route.put('/illustration/:id', 'IllustrationsController.update')
  Route.delete('/illustration/:id', 'IllustrationsController.destroy')

  //tags
  //are created on new illustrations only
  Route.get('/tags', 'TagsController.index')
  Route.get('/tags/:name', 'TagsController.search')
  Route.get('/tag/:name', 'TagsController.illustrations')
  Route.put('/tags/:id', 'TagsController.update')
  Route.delete('/tags/:id', 'TagsController.destroy')

  // places
  Route.get('/places/:illustration_id', 'PlacesController.show')
  Route.post('/places/:illustration_id', 'PlacesController.store')
  Route.put('/places/:id', 'PlacesController.update')
  Route.delete('/places/:id', 'PlacesController.destroy')

  // Images
//   Route.post('/upload', async ({ request }: ) => {
// // to read: https://docs.adonisjs.com/guides/file-uploads
//     const { illustration_id } = request.all()
//     request.multipart.file('illustration_image', {}, async (file) => {
//       const imagePath = `${auth.user.uid}/${illustration_id}/${file.clientName}`
//       await Drive.disk('s3').put(imagePath, file.stream)

//       Upload.create({ illustration_id, name: imagePath, type: file.type })

//     })

//     await request.multipart.process()
//   })

}).middleware('auth')
