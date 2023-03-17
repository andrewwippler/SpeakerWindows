import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect } from 'react'
import Link from 'next/link'
import useUser from '@/library/useUser';
import Layout from '@/components/Layout';

export default function Tag() {
  const router = useRouter()
  const { user } = useUser({
    redirectTo: '/login',
  })
  const name = _.get(router.query, 'name', '')

  const [data, setData] = useState([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    if (!name) {
      setLoading(true)
      return
    }
    api.get(`/tag/${name}`, '')
      .then(data => {
        setData(data);
        console.log(data)
      setLoading(false)
    });
  },[name])

  if (isLoading) return (
    <Layout>
      <div>Loading...</div>
    </Layout>
  )

  return (
    <Layout>
      <div className="text-xl font-bold pb-4">{name}</div>
      <ul role="list">

        {data && data.map((d) => (

        <li className="group/item hover:bg-slate-200">
          <Link className="block pb-1" href={`/illustration/${d.id}`}>{d.title}</Link>
          <div className='invisible h-0 group-hover/item:h-auto group-hover/item:visible'>
            {d.content.substr(0,256)}...
          </div>
        </li>
      ))}
        <li className="group/item">
        <Link className="block" href={`/illustrations/123`}>DELETE ME: 123 Illus</Link>
        </li>
      </ul>
    </Layout>
  )
}
