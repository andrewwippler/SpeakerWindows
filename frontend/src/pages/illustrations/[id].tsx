import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect } from 'react'
import useUser from '@/library/useUser';
import Layout from '@/components/Layout';
import Link from 'next/link';

import { useAppDispatch } from '@/hooks'
import { setFlashMessage } from '@/features/flash/reducer'
import { illustrationType } from '@/library/illustrationType';

// Note: Function to redirect old URLs to the new format.
export default function LegacyIllustration() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isLoading, setLoading] = useState(false)
  const [data, setData] = useState<illustrationType>()
  const { user } = useUser({
    redirectTo: '/login',
  })

  const id = _.get(router.query, 'id', '')

  useEffect(() => {

    if (!id) {
      setLoading(true)
      return
    }

    api.get(`/illustrations/${id}`, '', user?.token)
      .then(data => {
        setData(data);
        dispatch(setFlashMessage({severity: 'info', message: 'You were rediected from an old link. Be sure to update your bookmark.'}))
        router.replace(`/illustration/${data.id}`)
        setLoading(false)
    });
  },[id, dispatch, router])

  if (isLoading) return (
    <Layout>
      <div>Redirecting...</div>
    </Layout>
  )

  return (
    <Layout>
      { data &&
         <Link href={`/illustration/${data.id}`}>Redirect is not working. Click here to continue...</Link>
      }
    </Layout>
  )

}
