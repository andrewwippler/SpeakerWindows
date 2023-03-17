import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect } from 'react'
import useUser from '@/library/useUser';
import Layout from '@/components/Layout';
import Link from 'next/link';

// Note: Function to redirect old URLs to the new format.
export default function LegacyIllustration() {
  const router = useRouter()
  const [isLoading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const { user } = useUser({
    redirectTo: '/login',
  })

  const id = _.get(router.query, 'id', '')

  useEffect(() => {

    console.log(router.query, id, !id)
    if (!id) {
      setLoading(true)
      return
    }

    api.get(`/illustrations/${id}`, '')
      .then(data => {
        setData(data);
        router.replace(`/illustration/${data.id}`)
        setLoading(false)
    });
  },[])

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
