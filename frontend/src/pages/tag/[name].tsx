import { useRouter } from 'next/router'
import { getIllustrations } from '../../library/api'
import { useAppSelector, useAppDispatch } from '../../hooks'

import { loginAsync, selectLoginStatus } from '@/features/user/reducer';

export default function Tag() {
  const router = useRouter()
  const name = router.query.name
  let { illustrations, isLoading, isError } = getIllustrations(name)

  if (isError) return <div>Failed to load</div>
  if (!isLoading) return <div>Loading...</div>

  return (
    <div>
      { illustrations.map((d) => (
        <div>{d.name}</div>
      ))}
    </div>
  )
}
