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

    // const illustrations = await Illustration.search(search)
    //   .where('user_id', auth.user?.id).get()

    const illustrations = await Illustration.query((query) => {
        query.where('title', search)
          .orWhere('content', 'LIKE', `%${search}%`)
          .orWhere('author', 'LIKE', `%${search}%`)
      })
      .andWhere('user_id', `${auth.user?.id}`)
    const tagSanitizedSearch = _.startCase(search).replace(/ /g, '-')
    const tags = await Tag.query().where('name', tagSanitizedSearch).andWhere('user_id', `${auth.user?.id}`)
    // const tags = await Tag.search(tagSanitizedSearch).where('user_id', `${auth.user?.id}`).get()
    const places = await Place.query().preload('illustration').where('place',search).andWhere('user_id', `${auth.user?.id}`)

    // console.log({ message: 'success',user_id: `${auth.user?.id}`, searchString: search, tagSanitizedSearch, data: { illustrations, places, tags } })

    return response.send({ message: 'success', searchString: search, data: { illustrations, places, tags } })
  }
}
