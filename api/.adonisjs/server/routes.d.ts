import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'contacts.store': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.login': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'uid': ParamValue} }
    'illustrations.index': { paramsTuple?: []; params?: {} }
    'illustrations.store': { paramsTuple?: []; params?: {} }
    'authors.index': { paramsTuple?: []; params?: {} }
    'illustrations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.show_old': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.bulk': { paramsTuple?: []; params?: {} }
    'authors.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'authors.update': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'settings.index': { paramsTuple?: []; params?: {} }
    'settings.update': { paramsTuple?: []; params?: {} }
    'tags.index': { paramsTuple?: []; params?: {} }
    'tags.search': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'tags.illustrations': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'tags.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.remove_illustrations': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'places.show': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'places.store': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'places.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'places.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'hybrid_search.search': { paramsTuple?: []; params?: {} }
    'uploads.store': { paramsTuple?: []; params?: {} }
    'uploads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'teams.get_team': { paramsTuple?: []; params?: {} }
    'teams.update_team': { paramsTuple?: []; params?: {} }
    'teams.get_members': { paramsTuple?: []; params?: {} }
    'teams.add_member': { paramsTuple?: []; params?: {} }
    'teams.update_member': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'teams.remove_member': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'teams.join_team': { paramsTuple: [ParamValue]; params: {'inviteCode': ParamValue} }
    'teams.get_team_illustrations': { paramsTuple?: []; params?: {} }
    'teams.get_memberships': { paramsTuple?: []; params?: {} }
    'teams.leave_team': { paramsTuple: [ParamValue]; params: {'teamId': ParamValue} }
    'teams.get_team_invitations': { paramsTuple?: []; params?: {} }
    'teams.create_invitation': { paramsTuple?: []; params?: {} }
    'teams.cancel_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'teams.accept_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'teams.decline_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'teams.get_user_invitations': { paramsTuple?: []; params?: {} }
    'teams.get_user_blocks': { paramsTuple?: []; params?: {} }
    'teams.block_team': { paramsTuple?: []; params?: {} }
    'teams.unblock_team': { paramsTuple: [ParamValue]; params: {'teamId': ParamValue} }
  }
  POST: {
    'contacts.store': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.login': { paramsTuple?: []; params?: {} }
    'illustrations.store': { paramsTuple?: []; params?: {} }
    'settings.update': { paramsTuple?: []; params?: {} }
    'places.store': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'hybrid_search.search': { paramsTuple?: []; params?: {} }
    'uploads.store': { paramsTuple?: []; params?: {} }
    'teams.add_member': { paramsTuple?: []; params?: {} }
    'teams.join_team': { paramsTuple: [ParamValue]; params: {'inviteCode': ParamValue} }
    'teams.create_invitation': { paramsTuple?: []; params?: {} }
    'teams.accept_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'teams.decline_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'teams.block_team': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'health_checks': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'uid': ParamValue} }
    'illustrations.index': { paramsTuple?: []; params?: {} }
    'authors.index': { paramsTuple?: []; params?: {} }
    'illustrations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.show_old': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'authors.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'settings.index': { paramsTuple?: []; params?: {} }
    'tags.index': { paramsTuple?: []; params?: {} }
    'tags.search': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'tags.illustrations': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'places.show': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'teams.get_team': { paramsTuple?: []; params?: {} }
    'teams.get_members': { paramsTuple?: []; params?: {} }
    'teams.get_team_illustrations': { paramsTuple?: []; params?: {} }
    'teams.get_memberships': { paramsTuple?: []; params?: {} }
    'teams.get_team_invitations': { paramsTuple?: []; params?: {} }
    'teams.get_user_invitations': { paramsTuple?: []; params?: {} }
    'teams.get_user_blocks': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'health_checks': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'uid': ParamValue} }
    'illustrations.index': { paramsTuple?: []; params?: {} }
    'authors.index': { paramsTuple?: []; params?: {} }
    'illustrations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.show_old': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'authors.show': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'settings.index': { paramsTuple?: []; params?: {} }
    'tags.index': { paramsTuple?: []; params?: {} }
    'tags.search': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'tags.illustrations': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'places.show': { paramsTuple: [ParamValue]; params: {'illustration_id': ParamValue} }
    'teams.get_team': { paramsTuple?: []; params?: {} }
    'teams.get_members': { paramsTuple?: []; params?: {} }
    'teams.get_team_illustrations': { paramsTuple?: []; params?: {} }
    'teams.get_memberships': { paramsTuple?: []; params?: {} }
    'teams.get_team_invitations': { paramsTuple?: []; params?: {} }
    'teams.get_user_invitations': { paramsTuple?: []; params?: {} }
    'teams.get_user_blocks': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'illustrations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'illustrations.bulk': { paramsTuple?: []; params?: {} }
    'authors.update': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
    'tags.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'places.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'teams.update_team': { paramsTuple?: []; params?: {} }
    'teams.update_member': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
  }
  DELETE: {
    'illustrations.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tags.remove_illustrations': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'places.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'uploads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'teams.remove_member': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'teams.leave_team': { paramsTuple: [ParamValue]; params: {'teamId': ParamValue} }
    'teams.cancel_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'teams.unblock_team': { paramsTuple: [ParamValue]; params: {'teamId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}