// @ts-nocheck
import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect } from 'react'
import Link from 'next/link'
import useUser from '@/library/useUser';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { setRedirect } from '@/features/ui/reducer';
import { useAppSelector, useAppDispatch } from '@/hooks'


export default function Author() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useUser({
    redirectTo: '/login',
  })
  // remove - for visual representation
  let name = _.get(router.query, 'id', '')

  const [data, setData] = useState([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.token) dispatch(setRedirect(`/author/${name}`))
    if (!name) {
      setLoading(true)
      return
    }
    // add - for data fetching
    api.get(`/author/${name}`, '', user?.token)
      .then(data => {
        // console.log(data)
        setData(data); // illustrations
        setLoading(false)
    });
  }, [name, dispatch, user?.token]);


  if (!user?.token) return
  if (isLoading) return (
    <Layout>
      <div>Loading...</div>
    </Layout>
  )

  return (
    <Layout>
      <Head>
        <title>SW | Author: {name}</title>
      </Head>
      <div className="text-xl font-bold pb-4 text-sky-900">

        <span className='mr-4'>{name}</span>

      </div>

      <ul role="list">

        {data ? data.map((d,i) => (

          <li key={i} className="group/item hover:bg-slate-200">
          <Link className="block pb-1 group-hover/item:underline" href={`/illustration/${d.id}`}>{d.title}</Link>
          <div className='invisible h-0 group-hover/item:h-auto group-hover/item:visible'>
            {d.content.slice(0,256)}...
          </div>
        </li>
        ))
          :
          <div>No illustrations found</div>
      }
      </ul>
    </Layout>
  )
}
