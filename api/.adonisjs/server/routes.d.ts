import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.doLogin': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.doRegister': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'settings': { paramsTuple?: []; params?: {} }
    'settings.update': { paramsTuple?: []; params?: {} }
    'settings.team.add': { paramsTuple?: []; params?: {} }
    'settings.team.update': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'settings.team.remove': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'settings.apiKey.rotate': { paramsTuple?: []; params?: {} }
    'settings.import': { paramsTuple?: []; params?: {} }
    'search': { paramsTuple?: []; params?: {} }
    'search.query': { paramsTuple?: []; params?: {} }
    'illustrations': { paramsTuple?: []; params?: {} }
    'illustrations.new': { paramsTuple?: []; params?: {} }
    'illustrations.create': { paramsTuple?: []; params?: {} }
    'illustrations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.upload': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.upload.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'uploadId': ParamValue} }
    'illustrations.place.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.place.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'placeId': ParamValue} }
    'tags.index': { paramsTuple?: []; params?: {} }
    'tags.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'tags.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.bulk': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'authors.index': { paramsTuple?: []; params?: {} }
    'authors.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'articles': { paramsTuple?: []; params?: {} }
    'invitations': { paramsTuple?: []; params?: {} }
    'help': { paramsTuple?: []; params?: {} }
    'help.search': { paramsTuple?: []; params?: {} }
    'help.create': { paramsTuple?: []; params?: {} }
    'help.import': { paramsTuple?: []; params?: {} }
    'legal.tos': { paramsTuple?: []; params?: {} }
    'legal.privacy': { paramsTuple?: []; params?: {} }
    'contact': { paramsTuple?: []; params?: {} }
    'contact.store': { paramsTuple?: []; params?: {} }
    'contacts.store': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.login': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'uid': ParamValue} }
    'api.illustrations.index': { paramsTuple?: []; params?: {} }
    'api.illustrations.store': { paramsTuple?: []; params?: {} }
    'api.authors.index': { paramsTuple?: []; params?: {} }
    'api.illustrations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.illustrations.showOld': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.illustrations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.illustrations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.illustrations.bulk': { paramsTuple?: []; params?: {} }
    'api.authors.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.authors.update': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.settings.index': { paramsTuple?: []; params?: {} }
    'api.settings.update': { paramsTuple?: []; params?: {} }
    'api.tags.index': { paramsTuple?: []; params?: {} }
    'api.tags.search': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.tags.illustrations': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.tags.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.tags.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.tags.removeIllustrations': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.places.show': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'api.places.store': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'api.places.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.places.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.search': { paramsTuple?: []; params?: {} }
    'api.imports.store': { paramsTuple?: []; params?: {} }
    'api.uploads.store': { paramsTuple?: []; params?: {} }
    'api.uploads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.team.get': { paramsTuple?: []; params?: {} }
    'api.team.update': { paramsTuple?: []; params?: {} }
    'api.team.members.index': { paramsTuple?: []; params?: {} }
    'api.team.members.add': { paramsTuple?: []; params?: {} }
    'api.team.members.update': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'api.team.members.remove': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'api.teams.join': { paramsTuple: [ParamValue]; params: {'inviteCode': ParamValue} }
    'api.team.illustrations': { paramsTuple?: []; params?: {} }
    'api.team.memberships': { paramsTuple?: []; params?: {} }
    'api.team.memberships.leave': { paramsTuple: [ParamValue]; params: {'teamId': ParamValue} }
    'api.team.invitations.index': { paramsTuple?: []; params?: {} }
    'api.team.invitations.create': { paramsTuple?: []; params?: {} }
    'api.team.invitations.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.team.invitations.accept': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.team.invitations.decline': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.user.invitations': { paramsTuple?: []; params?: {} }
    'api.user.blocks': { paramsTuple?: []; params?: {} }
    'api.user.blocks.create': { paramsTuple?: []; params?: {} }
    'api.user.blocks.delete': { paramsTuple: [ParamValue]; params: {'teamId': ParamValue} }
  }
  GET: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'settings': { paramsTuple?: []; params?: {} }
    'search': { paramsTuple?: []; params?: {} }
    'illustrations': { paramsTuple?: []; params?: {} }
    'illustrations.new': { paramsTuple?: []; params?: {} }
    'illustrations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.index': { paramsTuple?: []; params?: {} }
    'tags.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'authors.index': { paramsTuple?: []; params?: {} }
    'authors.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'articles': { paramsTuple?: []; params?: {} }
    'invitations': { paramsTuple?: []; params?: {} }
    'help': { paramsTuple?: []; params?: {} }
    'help.search': { paramsTuple?: []; params?: {} }
    'help.create': { paramsTuple?: []; params?: {} }
    'help.import': { paramsTuple?: []; params?: {} }
    'legal.tos': { paramsTuple?: []; params?: {} }
    'legal.privacy': { paramsTuple?: []; params?: {} }
    'contact': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'uid': ParamValue} }
    'api.illustrations.index': { paramsTuple?: []; params?: {} }
    'api.authors.index': { paramsTuple?: []; params?: {} }
    'api.illustrations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.illustrations.showOld': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.authors.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.settings.index': { paramsTuple?: []; params?: {} }
    'api.tags.index': { paramsTuple?: []; params?: {} }
    'api.tags.search': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.tags.illustrations': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.places.show': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'api.team.get': { paramsTuple?: []; params?: {} }
    'api.team.members.index': { paramsTuple?: []; params?: {} }
    'api.team.illustrations': { paramsTuple?: []; params?: {} }
    'api.team.memberships': { paramsTuple?: []; params?: {} }
    'api.team.invitations.index': { paramsTuple?: []; params?: {} }
    'api.user.invitations': { paramsTuple?: []; params?: {} }
    'api.user.blocks': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'settings': { paramsTuple?: []; params?: {} }
    'search': { paramsTuple?: []; params?: {} }
    'illustrations': { paramsTuple?: []; params?: {} }
    'illustrations.new': { paramsTuple?: []; params?: {} }
    'illustrations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.index': { paramsTuple?: []; params?: {} }
    'tags.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'authors.index': { paramsTuple?: []; params?: {} }
    'authors.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'articles': { paramsTuple?: []; params?: {} }
    'invitations': { paramsTuple?: []; params?: {} }
    'help': { paramsTuple?: []; params?: {} }
    'help.search': { paramsTuple?: []; params?: {} }
    'help.create': { paramsTuple?: []; params?: {} }
    'help.import': { paramsTuple?: []; params?: {} }
    'legal.tos': { paramsTuple?: []; params?: {} }
    'legal.privacy': { paramsTuple?: []; params?: {} }
    'contact': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'uid': ParamValue} }
    'api.illustrations.index': { paramsTuple?: []; params?: {} }
    'api.authors.index': { paramsTuple?: []; params?: {} }
    'api.illustrations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.illustrations.showOld': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.authors.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.settings.index': { paramsTuple?: []; params?: {} }
    'api.tags.index': { paramsTuple?: []; params?: {} }
    'api.tags.search': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.tags.illustrations': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.places.show': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'api.team.get': { paramsTuple?: []; params?: {} }
    'api.team.members.index': { paramsTuple?: []; params?: {} }
    'api.team.illustrations': { paramsTuple?: []; params?: {} }
    'api.team.memberships': { paramsTuple?: []; params?: {} }
    'api.team.invitations.index': { paramsTuple?: []; params?: {} }
    'api.user.invitations': { paramsTuple?: []; params?: {} }
    'api.user.blocks': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.doLogin': { paramsTuple?: []; params?: {} }
    'auth.doRegister': { paramsTuple?: []; params?: {} }
    'settings.update': { paramsTuple?: []; params?: {} }
    'settings.team.add': { paramsTuple?: []; params?: {} }
    'settings.team.update': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'settings.team.remove': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'settings.apiKey.rotate': { paramsTuple?: []; params?: {} }
    'settings.import': { paramsTuple?: []; params?: {} }
    'search.query': { paramsTuple?: []; params?: {} }
    'illustrations.create': { paramsTuple?: []; params?: {} }
    'illustrations.upload': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.place.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.bulk': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'contact.store': { paramsTuple?: []; params?: {} }
    'contacts.store': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.login': { paramsTuple?: []; params?: {} }
    'api.illustrations.store': { paramsTuple?: []; params?: {} }
    'api.settings.update': { paramsTuple?: []; params?: {} }
    'api.places.store': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'api.search': { paramsTuple?: []; params?: {} }
    'api.imports.store': { paramsTuple?: []; params?: {} }
    'api.uploads.store': { paramsTuple?: []; params?: {} }
    'api.team.members.add': { paramsTuple?: []; params?: {} }
    'api.teams.join': { paramsTuple: [ParamValue]; params: {'inviteCode': ParamValue} }
    'api.team.invitations.create': { paramsTuple?: []; params?: {} }
    'api.team.invitations.accept': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.team.invitations.decline': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.user.blocks.create': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'illustrations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.illustrations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.illustrations.bulk': { paramsTuple?: []; params?: {} }
    'api.authors.update': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'api.tags.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.places.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.team.update': { paramsTuple?: []; params?: {} }
    'api.team.members.update': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
  }
  DELETE: {
    'illustrations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.upload.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'uploadId': ParamValue} }
    'illustrations.place.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'placeId': ParamValue} }
    'api.illustrations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.tags.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.tags.removeIllustrations': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.places.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.uploads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.team.members.remove': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'api.team.memberships.leave': { paramsTuple: [ParamValue]; params: {'teamId': ParamValue} }
    'api.team.invitations.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.user.blocks.delete': { paramsTuple: [ParamValue]; params: {'teamId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}