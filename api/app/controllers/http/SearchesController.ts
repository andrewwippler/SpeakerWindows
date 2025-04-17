import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'
import Place from '#models/place'
import Tag from '#models/tag'
import _ from 'lodash'

export default class SearchesController {

  public async search({ auth, request, response }: HttpContext) {

    const { search } = request.all()

    if (!search) {
      return response.noContent()
    }

    const illustrations = await Illustration.query()
      .where((query) => {
        query
          .where('title', 'LIKE', `%${search}%`)
          .orWhere('content', 'LIKE', `%${search}%`)
          .orWhere('author', 'LIKE', `%${search}%`)
      })
      .andWhere('user_id', auth.user?.id)
    const tagSanitizedSearch = _.startCase(search).replace(/ /g, '-') + '-' + (auth.user?.id || '0')
    const tags = await Tag.query().where((query) => {
      query
        .where('name', 'LIKE', `%${search}%`)
        .orWhere('slug', 'LIKE', `%${tagSanitizedSearch}%`)
    }).andWhere('user_id', `${auth.user?.id}`)
    const places = await Place.query().preload('illustration').where('place', search).andWhere('user_id', `${auth.user?.id}`)

    // console.log({ message: 'success', user_id: `${auth.user?.id}`, searchString: search, tagSanitizedSearch, data: { illustrations, places, tags } })

    return response.send({ message: 'success', searchString: search, data: { illustrations, places, tags } })
  }
}
