import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Illustration from 'App/Models/Illustration'
import Place from 'App/Models/Place'
import Tag from 'App/Models/Tag'
import { _ } from 'lodash'

export default class SearchesController {

  public async search({ auth, request, response }: HttpContextContract) {

    const { search } = request.all()

    if (!search) {
      return response.noContent()
    }

    const illustrations = await Illustration.query()
      .where('title', search)
      .orWhere('content', 'LIKE', `%${search}%`)
      .orWhere('author', 'LIKE', `%${search}%`)
      .andWhere('user_id', `${auth.user?.id}`)
    const tagSanitizedSearch = _.startCase(search).replace(/ /g, '-')
    const tags = await Tag.query().where('name',tagSanitizedSearch).andWhere('user_id', `${auth.user?.id}`)
    const places = await Place.query().preload('illustration').where('place',search).andWhere('user_id', `${auth.user?.id}`)

    // console.log({ message: 'success',user_id: `${auth.user?.id}`, searchString: search, data: { illustrations, places, tags } })

    return response.send({ message: 'success', searchString: search, data: { illustrations, places, tags } })
  }
}
