// @ts-nocheck
import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect } from 'react'
import Link from 'next/link'
import useUser from '@/library/useUser';
import Layout from '@/components/Layout';
import ConfirmDialog from '@/components/ConfirmDialog';
import { PencilSquareIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/solid'
import { FormEvent } from 'react';
import Head from 'next/head';

import { useAppSelector, useAppDispatch } from '@/hooks'
import { selectModal, setModal } from '@/features/modal/reducer'
import { setFlashMessage } from '@/features/flash/reducer'

export default function Tag() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useUser({
    redirectTo: '/login',
  })
  // remove - for visual representation
  let name = _.get(router.query, 'name', '').replace(/-/g, ' ')

  const [data, setData] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [editTag, setEditTag] = useState(false)

  useEffect(() => {
    if (!name) {
      setLoading(true)
      return
    }
    // add - for data fetching
    api.get(`/tag/${name}`.replace(/ /g, '-'), '')
      .then(data => {
        setData(data); // illustrations
      setLoading(false)
    });
  }, [name]);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newname = event.currentTarget.tag.value.trim();

    // update tag
    api.put(`/tags/${data.id}`, {name: newname})
      .then(data => {

        if (data.message != 'Updated successfully') {
          dispatch(setFlashMessage({ severity: 'danger', message: data.message }))
          return
        }
        dispatch(setFlashMessage({ severity: 'success', message: `Tag "${name}" was renamed to ${newname}.` }))
        setEditTag(false)
        router.replace(`/tag/${newname}`)
  });
  };

  const handleDelete = () => {

    // delete tag
    api.delete(`/tags/${data.id}`, '')
      .then(data => {
        dispatch(setModal(false))
        if (data.message == 'You do not have permission to access this resource') {
          dispatch(setFlashMessage({ severity: 'danger', message: data.message }))
          return
        }
        dispatch(setFlashMessage({severity: 'danger', message: `Tag "${name}" was deleted.`}))
        router.replace('/') // go home
  });
  };

  if (isLoading) return (
    <Layout>
      <div>Loading...</div>
    </Layout>
  )

  return (
    <Layout>
      <Head>
        <title>SW | {name}</title>
      </Head>
      <div className="text-xl font-bold pb-4 text-sky-900">
        {editTag ?
          <form className="mt-8 space-y-6" onSubmit={handleSave}>
                <label htmlFor="tag" className="sr-only">
                  Rename Tag
                </label>
                <input
                  id="tag"
                  name="tag"
                  type="tag"
                  autoComplete="tag"
                  required
                  className="pl-1.5 py-1.5 ring-1 mr-4"
                  placeholder="tag"
                  defaultValue={name}
                />

          <button type="submit" className='px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center' >
          <CheckCircleIcon className="h-4 w-4 mr-2" />Update Tag</button>
          </form>
      :
        <>
        <span className='mr-4'>{name}</span>
        <button onClick={() => setEditTag(true)} className='px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center' >
        <PencilSquareIcon className="h-4 w-4 mr-2" />Edit Tag</button>
        <button onClick={() => dispatch(setModal(true))} className='px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white rounded-full shadow-sm inline-flex items-center'>
        <TrashIcon className="h-4 w-4 mr-2" />Delete Tag</button>
        </>
          }
      </div>

      <ul role="list">

        {data.illustrations ? data.illustrations.map((d,i) => (

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
      <ConfirmDialog handleAgree={handleDelete} title={name} deleteName="Tag" />
    </Layout>
  )
}
