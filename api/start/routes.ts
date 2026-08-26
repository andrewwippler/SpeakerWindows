/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { sep, normalize, join } from 'node:path'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { authThrottle, contactThrottle, importThrottle, uploadThrottle } from '#start/limiter'

// API Controllers
const HealthChecksController = () => import('#controllers/health_checks_controller')
const UsersController = () => import('#controllers/http/users_controller')
const IllustrationsController = () => import('#controllers/http/illustrations_controller')
const AuthorsController = () => import('#controllers/http/authors_controller')
const SettingsController = () => import('#controllers/http/settings_controller')
const TagsController = () => import('#controllers/http/tags_controller')
const PlacesController = () => import('#controllers/http/places_controller')
const HybridSearchController = () => import('#controllers/http/hybrid_search_controller')
const UploadsController = () => import('#controllers/http/uploads_controller')
const ContactsController = () => import('#controllers/http/contacts_controller')
const TeamsController = () => import('#controllers/http/teams_controller')
const ImportsController = () => import('#controllers/http/imports_controller')

// View Controllers
const AuthController = () => import('#controllers/view/auth_controller')
const DashboardController = () => import('#controllers/view/dashboard_controller')
const IllustrationViewController = () => import('#controllers/view/illustration_controller')
const TagViewController = () => import('#controllers/view/tag_controller')
const AuthorViewController = () => import('#controllers/view/author_controller')
const SearchViewController = () => import('#controllers/view/search_controller')
const SettingsViewController = () => import('#controllers/view/settings_controller')
const InvitationViewController = () => import('#controllers/view/invitation_controller')
const ArticlesViewController = () => import('#controllers/view/articles_controller')
const ContactViewController = () => import('#controllers/view/contact_controller')
const HelpViewController = () => import('#controllers/view/help_controller')
const LegalViewController = () => import('#controllers/view/legal_controller')

const PATH_TRAVERSAL_REGEX = /(?:^|[\\/])\.\.(?:[\\/]|$)/

/*
|--------------------------------------------------------------------------
| View Routes (web guard - session auth)
|--------------------------------------------------------------------------
*/
router.get('/login', [AuthController, 'showLogin']).as('auth.login')
router.post('/login', [AuthController, 'login']).as('auth.doLogin').use(authThrottle)
router.get('/register', [AuthController, 'showRegister']).as('auth.register')
router.post('/register', [AuthController, 'register']).as('auth.doRegister').use(authThrottle)
router.get('/logout', [AuthController, 'logout']).as('auth.logout')

router
  .group(() => {
    router.get('/', [DashboardController, 'index']).as('dashboard')
    router.get('/dashboard', [DashboardController, 'index']).as('dashboard.index')
    router.get('/settings', [SettingsViewController, 'index']).as('settings')
    router.post('/settings', [SettingsViewController, 'update']).as('settings.update')
    router.get('/search', [SearchViewController, 'index']).as('search')

    router.get('/illustrations', [IllustrationViewController, 'index']).as('illustrations')
    router.get('/illustrations/new', [IllustrationViewController, 'new']).as('illustrations.new')
    router.post('/illustrations', [IllustrationViewController, 'store']).as('illustrations.create')
    router.get('/illustrations/:id', [IllustrationViewController, 'show']).as('illustrations.show')
    router
      .get('/illustrations/:id/edit', [IllustrationViewController, 'edit'])
      .as('illustrations.edit')
    router
      .put('/illustrations/:id', [IllustrationViewController, 'update'])
      .as('illustrations.update')
    router
      .delete('/illustrations/:id', [IllustrationViewController, 'destroy'])
      .as('illustrations.destroy')

    router.get('/tags', [TagViewController, 'index']).as('tags.index')
    router.get('/tags/:name', [TagViewController, 'show']).as('tags.show')

    router.get('/authors', [AuthorViewController, 'index']).as('authors.index')
    router.get('/authors/:name', [AuthorViewController, 'show']).as('authors.show')

    router.get('/articles', [ArticlesViewController, 'index']).as('articles')
    router.get('/invitations', [InvitationViewController, 'index']).as('invitations')
    router.get('/help', [HelpViewController, 'index']).as('help')
    router.get('/help/search', [HelpViewController, 'search']).as('help.search')
    router.get('/help/create', [HelpViewController, 'create']).as('help.create')
    router.get('/help/import', [HelpViewController, 'importHelp']).as('help.import')
    router.get('/tos', [LegalViewController, 'tos']).as('legal.tos')
    router.get('/privacy-policy', [LegalViewController, 'privacy']).as('legal.privacy')
  })
  .use(
    middleware.auth({
      guards: ['web'],
    })
  )

router.get('/contact', [ContactViewController, 'index']).as('contact')
router.post('/contact', [ContactViewController, 'store']).as('contact.store')

/*
|--------------------------------------------------------------------------
| API Routes (token guard - API auth)
|--------------------------------------------------------------------------
*/
router.post('api/contact', [ContactsController, 'store']).use(contactThrottle)

// Auth
router.post('api/register', [UsersController, 'store']).use(authThrottle)
router.post('/api/login', [UsersController, 'login']).use(authThrottle)
router.get('/api/healthz', [HealthChecksController])
router.get('/api/users/:uid', [UsersController, 'show']).use([
  middleware.auth({
    guards: ['api'],
  }),
])

router
  .group(() => {
    // illustrations
    router.get('/illustrations', [IllustrationsController, 'index']).as('api.illustrations.index')
    router.post('/illustration', [IllustrationsController, 'store']).as('api.illustrations.store')
    router.get('/illustration/authors', [AuthorsController, 'index']).as('api.authors.index')
    router.get('/illustration/:id', [IllustrationsController, 'show']).as('api.illustrations.show')
    router
      .get('/illustrations/:id', [IllustrationsController, 'showOld'])
      .as('api.illustrations.showOld')
    router
      .put('/illustration/:id', [IllustrationsController, 'update'])
      .as('api.illustrations.update')
    router
      .delete('/illustration/:id', [IllustrationsController, 'destroy'])
      .as('api.illustrations.destroy')
    router
      .put('/illustrations/bulk', [IllustrationsController, 'bulk'])
      .as('api.illustrations.bulk')

    router.get('/author/:name', [AuthorsController, 'show']).as('api.authors.show')
    router.put('/author/:name', [AuthorsController, 'update']).as('api.authors.update')

    router.get('/settings', [SettingsController, 'index']).as('api.settings.index')
    router.post('/settings', [SettingsController, 'update']).as('api.settings.update')

    // tags
    router.get('/tags', [TagsController, 'index']).as('api.tags.index')
    router.get('/tags/:name', [TagsController, 'search']).as('api.tags.search')
    router.get('/tag/:name', [TagsController, 'illustrations']).as('api.tags.illustrations')
    router.put('/tags/:id', [TagsController, 'update']).as('api.tags.update')
    router.delete('/tags/:id', [TagsController, 'destroy']).as('api.tags.destroy')
    router
      .delete('/tags/:id/illustrations', [TagsController, 'removeIllustrations'])
      .as('api.tags.removeIllustrations')

    // places
    router.get('/places/:illustration_id', [PlacesController, 'show']).as('api.places.show')
    router.post('/places/:illustration_id', [PlacesController, 'store']).as('api.places.store')
    router.put('/places/:id', [PlacesController, 'update']).as('api.places.update')
    router.delete('/places/:id', [PlacesController, 'destroy']).as('api.places.destroy')

    // search
    router.post('/search', [HybridSearchController, 'search']).as('api.search')

    // Import highlights
    router.post('/import', [ImportsController, 'store']).use(importThrottle).as('api.imports.store')

    // Images
    router.post('/upload', [UploadsController, 'store']).use(uploadThrottle).as('api.uploads.store')
    router.delete('/upload/:id', [UploadsController, 'destroy']).as('api.uploads.destroy')

    // Teams
    router.get('/team', [TeamsController, 'getTeam']).as('api.team.get')
    router.put('/team', [TeamsController, 'updateTeam']).as('api.team.update')
    router.get('/team/members', [TeamsController, 'getMembers']).as('api.team.members.index')
    router.post('/team/members', [TeamsController, 'addMember']).as('api.team.members.add')
    router
      .put('/team/members/:userId', [TeamsController, 'updateMember'])
      .as('api.team.members.update')
    router
      .delete('/team/members/:userId', [TeamsController, 'removeMember'])
      .as('api.team.members.remove')
    router.post('/teams/join/:inviteCode', [TeamsController, 'joinTeam']).as('api.teams.join')
    router
      .get('/team/illustrations', [TeamsController, 'getTeamIllustrations'])
      .as('api.team.illustrations')
    router.get('/team/memberships', [TeamsController, 'getMemberships']).as('api.team.memberships')
    router
      .delete('/team/memberships/:teamId', [TeamsController, 'leaveTeam'])
      .as('api.team.memberships.leave')
    router
      .get('/team/invitations', [TeamsController, 'getTeamInvitations'])
      .as('api.team.invitations.index')
    router
      .post('/team/invitations', [TeamsController, 'createInvitation'])
      .as('api.team.invitations.create')
    router
      .delete('/team/invitations/:id', [TeamsController, 'cancelInvitation'])
      .as('api.team.invitations.cancel')
    router
      .post('/team/invitations/:id/accept', [TeamsController, 'acceptInvitation'])
      .as('api.team.invitations.accept')
    router
      .post('/team/invitations/:id/decline', [TeamsController, 'declineInvitation'])
      .as('api.team.invitations.decline')
    router
      .get('/user/invitations', [TeamsController, 'getUserInvitations'])
      .as('api.user.invitations')
    router.get('/user/blocks', [TeamsController, 'getUserBlocks']).as('api.user.blocks')
    router.post('/user/blocks', [TeamsController, 'blockTeam']).as('api.user.blocks.create')
    router
      .delete('/user/blocks/:teamId', [TeamsController, 'unblockTeam'])
      .as('api.user.blocks.delete')
  })
  .prefix('/api')
  .use([
    middleware.auth({
      guards: ['api'],
    }),
  ])

// Public - file uploads
router.get('/uploads/*', ({ request, response }) => {
  const pathEnv = env.get('NODE_ENV')
  const filePath = join(pathEnv, request.param('*').join(sep))
  const normalizedPath = normalize(filePath)

  if (PATH_TRAVERSAL_REGEX.test(normalizedPath)) {
    return response.badRequest('Malformed path')
  }

  const absolutePath = app.makePath('uploads', normalizedPath)
  return response.download(absolutePath)
})
