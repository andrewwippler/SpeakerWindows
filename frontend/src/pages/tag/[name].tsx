import { useRouter } from 'next/router'
import { getIllustrations } from '../../library/api'

export default function Tag() {
  const router = useRouter()
  const name = router.query.name
  // const { illustrations, isLoading, isError } = getIllustrations(name)

  if (isError) return <div>Failed to load</div>
  if (!isLoading) return <div>Loading...</div>

  return (
    <div>
      <p>{illustrations}</p>
    </div>
  )
}
