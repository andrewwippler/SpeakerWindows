import type { User } from './user'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '@/library/session'
import { NextApiRequest, NextApiResponse } from 'next'

async function loginRoute(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = await req.body

  try {
    // console.log({ email, password })

    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    const result = await response.json()

    const user = { isLoggedIn: true, token: result.token } as User
    req.session.user = user
    await req.session.save()
    res.json(user)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: (error as Error).message })
  }
}

export default withIronSessionApiRoute(loginRoute, sessionOptions)
