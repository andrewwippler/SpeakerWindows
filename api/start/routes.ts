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
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const HealthChecksController = () => import('#controllers/health_checks_controller')
const UsersController = () => import('#controllers/http/UsersController')
const IllustrationsController = () => import('#controllers/http/IllustrationsController')
const AuthorsController = () => import('#controllers/http/AuthorsController')
const SettingsController = () => import('#controllers/http/SettingsController')
const TagsController = () => import('#controllers/http/TagsController')
const PlacesController = () => import('#controllers/http/PlacesController')
const SearchesController = () => import('#controllers/http/SearchesController')
const UploadsController = () => import('#controllers/http/UploadsController')
const ContactsController = () => import('#controllers/http/ContactsController')



router.post('contact', [ContactsController, 'store'])

//auth
router.post('register', [UsersController, 'store'])
router.post('login', [UsersController, 'login'])
router.get('/healthz', [HealthChecksController])
router
  .get('users/:uid', [UsersController, 'show'])
  .use([middleware.auth({
    guards: ['api']
  })])

router.group(() =>{
  // illustrations
  router.get('/illustrations', [IllustrationsController, 'index'])
  router.post('/illustration', [IllustrationsController, 'store'])
  router.get('/illustration/authors', [AuthorsController, 'index'])
  router.get('/illustration/:id', [IllustrationsController, 'show'])
  router.get('/illustrations/:id', [IllustrationsController, 'showOld'])
  router.put('/illustration/:id', [IllustrationsController, 'update'])
  router.delete('/illustration/:id', [IllustrationsController, 'destroy'])

  router.get('/author/:name', [AuthorsController, 'show'])

  router.get('/settings', [SettingsController,'index'])
  router.post('/settings', [SettingsController,'update'])

  //tags
  //are created on new illustrations only
  router.get('/tags', [TagsController, 'index'])
  router.get('/tags/:name', [TagsController, 'search'])
  router.get('/tag/:name', [TagsController, 'illustrations'])
  router.put('/tags/:id', [TagsController, 'update'])
  router.delete('/tags/:id', [TagsController, 'destroy'])

  // places
  router.get('/places/:illustration_id', [PlacesController, 'show'])
  router.post('/places/:illustration_id', [PlacesController, 'store'])
  router.put('/places/:id', [PlacesController, 'update'])
  router.delete('/places/:id', [PlacesController, 'destroy'])

  //search
  router.post('/search', [SearchesController, 'search'])

  // Images
  router.post('/upload',[UploadsController, 'store'])
}).use([middleware.auth({
    guards: ['api']
  })])
