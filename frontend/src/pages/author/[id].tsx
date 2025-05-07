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
import {
  PencilSquareIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { setFlashMessage } from "@/features/flash/reducer";

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

  const [editAuthor, setEditAuthor] = useState(false);

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

    const handleSave = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const newname = event.currentTarget.author.value.trim();

      // update author
      api.put(`/author/${name}`, { author: newname }, user?.token).then((data) => {
        if (data.message != `Author updated from ${name} to ${newname}`) {
          dispatch(
            setFlashMessage({ severity: "danger", message: data.message })
          );
          return;
        }
        dispatch(
          setFlashMessage({
            severity: "success",
            message: `Author "${name}" was renamed to ${newname}.`,
          })
        );
        setEditAuthor(false);
        router.replace(`/author/${newname}`);
      });
    };


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

        <span className='mr-4'>
        {editAuthor ? (
          <form className="mt-8 space-y-6" onSubmit={handleSave}>
            <label htmlFor="author" className="sr-only">
              Rename Author
            </label>
            <input
              id="author"
              name="author"
              type="author"
              autoComplete="author"
              required
              className="pl-1.5 py-1.5 ring-1 mr-4"
              placeholder="author"
              defaultValue={name}
            />

            <button
              type="submit"
              className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Update Author
            </button>
          </form>
        ) : (
          <>
            <span className="mr-4">{name}</span>
            <button
              onClick={() => setEditAuthor(true)}
              className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center"
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Edit Author
            </button>
          </>
        )}
        </span>

      </div>

      <ul role="list">
      {!data ? (
        <div>Loading illustrations...</div>
      ) : data && data.length > 0 ? (
        data.map((d, i) => (
          <li key={i} className="group/item hover:bg-slate-200">
            <Link
        className="block pb-1 group-hover/item:underline"
        href={`/illustration/${d.id}`}
            >
        {d.title}
            </Link>
            <div className="invisible h-0 group-hover/item:h-auto group-hover/item:visible">
        {d.content.slice(0, 256)}...
            </div>
          </li>
        ))
      ) : (
        <div>No illustrations found</div>
      )}
      </ul>
    </Layout>
  )
}
