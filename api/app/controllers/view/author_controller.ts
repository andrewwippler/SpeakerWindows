import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'
import _ from 'lodash'
import { buildAuthorColumns } from '#app/helpers/tag'

export default class AuthorController {
  public async index({ view, auth }: HttpContext) {
    const authors = await Illustration.query()
      .where('user_id', auth.user!.id)
      .select('author')
      .distinct()
      .orderBy('author')
    return view.render('authors/index', { authors, columns: buildAuthorColumns(authors) })
  }

  public async show({ params, auth, response, view }: HttpContext) {
    const authorName = decodeURI(_.get(params, 'name', ''))
    const userId = auth.user?.id

    try {
      const illustrations = await Illustration.query()
        .where('author', authorName)
        .andWhere('user_id', `${userId}`)
        .preload('tags', (builder) => {
          builder.orderBy('name', 'asc')
        })
        .orderBy('title', 'asc')

      if (illustrations.length === 0) {
        return response.notFound({ message: 'Author not found' })
      }

      return view.render('authors/show', {
        author: authorName,
        illustrations,
      })
    } catch (error) {
      console.error('Author show error:', error)
      return response.internalServerError({ message: 'Database error' })
    }
  }

  public async edit({ params, auth, response, view }: HttpContext) {
    const authorName = decodeURI(_.get(params, 'name', ''))
    const userId = auth.user?.id

    const illustration = await Illustration.query()
      .where('author', authorName)
      .andWhere('user_id', `${userId}`)
      .first()

    if (!illustration) {
      return response.notFound({ message: 'Author not found' })
    }

    return view.render('authors/edit', { author: authorName })
  }

  public async update({ params, auth, request, response, session }: HttpContext) {
    const authorName = decodeURI(_.get(params, 'name', ''))
    const newName = String(_.get(request.all(), 'name', '')).trim()

    if (newName === '' || newName === authorName) {
      session.flash('error', newName === '' ? 'Author name cannot be empty' : 'No changes made')
      return response.redirect(`/authors/${encodeURIComponent(authorName)}/edit`)
    }

    const count = await Illustration.query()
      .where('author', authorName)
      .andWhere('user_id', `${auth.user!.id}`)
      .update({ author: newName })

    if (count === 0) {
      return response.notFound({ message: 'Author not found' })
    }

    session.flash('success', `Author renamed to ${newName}`)
    return response.redirect(`/authors/${encodeURIComponent(newName)}`)
  }
}
