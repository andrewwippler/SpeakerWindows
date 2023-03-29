import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link';
import Layout from '@/components/Layout';
import useUser from '@/library/useUser';
import { ClipboardDocumentListIcon, ArrowLeftIcon, PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid'
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAppSelector, useAppDispatch } from '@/hooks'
import { selectModal, setModal } from '@/features/modal/reducer'
import { setFlashMessage } from '@/features/flash/reducer'
import IllustrationForm from '@/components/IllustrationForm';
import { illustrationType } from '@/library/illustrationType';
import { selectIllustrationEdit, setIllustrationEdit, selectUpdateUI, setUpdateUI } from '@/features/ui/reducer';
import format from 'date-fns/format';
import PlaceConfirmDialog from '@/components/PlaceConfirmDialog';
import { placeType } from '@/library/placeType';

export default function IllustrationWrapper() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const editIllustration = useAppSelector(selectIllustrationEdit)
  const refreshUI = useAppSelector(selectUpdateUI)

  const { user } = useUser({
    redirectTo: '/login',
  })

  const [illustration, setData] = useState<illustrationType>()
  const [deletePlace, setdeletePlace] = useState<placeType | null>()
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (!router.query.id) {
      return
    }
    api.get(`/illustration/${router.query.id}`, '')
      .then(data => {
      setData(data);
        setLoading(false)
        dispatch(setUpdateUI(false))
    });
  },[router.query.id,refreshUI, dispatch])

  if (isLoading) return <Layout>Loading...</Layout>

// https://stackoverflow.com/a/43467144
  function isValidHttpUrl(string: string) {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

  // delete illustration
  const handleDelete = () => {
    api.delete(`/illustration/${illustration?.id}`, '')
    .then(data => {
      dispatch(setModal(false))
      dispatch(setFlashMessage({severity: 'danger', message: `Illustration: "${illustration?.title}" was deleted.`}))
      router.back()
  });
  };

  const handleDeletePlace = (place: placeType) => {
    setdeletePlace(place)
    dispatch(setModal(true))
  }

  const handleDeleteIllustration = () => {
    setdeletePlace(null)
    dispatch(setModal(true))
  }

  const handlePlaceAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let form = grabAndReturnObject(event.currentTarget)
    api.post(`/places/${illustration?.id}`, form)
      .then(data => {
        if (data.message != 'Created successfully') {
          dispatch(setFlashMessage({ severity: 'danger', message: data.message }))
          return
        }
      dispatch(setUpdateUI(true))
      dispatch(setFlashMessage({severity: 'success', message: `Added ${form.place}, ${form.location} to "${illustration?.title}"`}))
  });
  };

  const grabAndReturnObject = (form: EventTarget & HTMLFormElement) => {
    return {
      place: form.Place.value.trim() || 'Someplace',
      location: form.Location.value.trim() || 'Somewhere',
      used: form.Used.value.trim(),
    }
    }

  return (
    <Layout>
      {editIllustration ?
        <IllustrationForm illustration={illustration} />
        :
        <>
      <div className="p-4 bg-gray-50 columns-1 md:columns-2">
        <div>
          <span className="font-bold pr-2">Title:</span>
          {illustration?.title ? illustration.title : 'Default Title'}
        </div>
        <div>
          <span className="font-bold pr-2">Author:</span>
          {illustration?.author ? illustration.author : 'Default Title'}
        </div>
        <div>
          <span className="font-bold pr-2">Source:</span>
          {illustration?.source ?
            isValidHttpUrl(illustration.source) ? <Link href={illustration.source}>{illustration.source}</Link> : illustration.source
            : 'Default Title'}
        </div>
        <div>
          <span className="font-bold pr-2">Tags:</span>
          {illustration?.tags ? illustration.tags.map((tag, index, arr) => (
            <Link key={index} className="inline-block mr-2 text-sky-500" href={`/tag/${tag.name}`}>{tag.name.replace(/-/g, " ")}{index != (arr.length-1) ? ', ' : ''}</Link>
            ))
            : 'no tags'}
    </div>
      </div>
      <div className="columns-1">
    {illustration?.content && <button type="button" data-toggle="tooltip" data-placement="bottom" title="Copy to clipboard"
      className="flex w-full justify-center px-4 py-2 my-4 font-semibold text-medium bg-gray-300 hover:bg-gray-500 text-white rounded-md shadow-sm"
      onClick={() => { navigator.clipboard.writeText(illustration.content) }}><ClipboardDocumentListIcon className="h-6 w-6 mr-2" /> <span>Copy Illustration Content</span></button>}
    <div className="py-4">
    {illustration?.content ? illustration.content : 'No Content'}
    </div>

        <div className="columns-1 pt-2">
        <button
        className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-cyan-300 hover:bg-cyan-500 text-white rounded-full inline-flex items-center shadow-sm"
        onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />Back
      </button>
          <button onClick={() => dispatch(setIllustrationEdit(true))} className='px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center' >
            <PencilSquareIcon className="h-4 w-4 mr-2" />Edit Illustration</button>

          <button onClick={() => handleDeleteIllustration()} className='px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white rounded-full shadow-sm inline-flex items-center'>
            <TrashIcon className="h-4 w-4 mr-2" />Delete Illustration</button>
        </div>
    </div>
        </>
      }
          {!editIllustration &&
      <>
      <div className="text-xl font-bold pt-8 text-sky-900">
          <span className='mr-4'>Illustration Use:</span>
        </div>
        <div className='grid grid-cols-3 text-sky-500'>
          {illustration && illustration?.places.length > 0 ? illustration.places.map((p, index) => (

            <div key={index} className='w-full gap-2 pb-2'>
              <span className='mr-2'>{p.place}, {p.location} - {p.used}</span>
              <button
                onClick={() => handleDeletePlace(p)}
                className='rounded-md p-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white shadow-sm inline-flex items-center'>
            <TrashIcon className="h-4 w-4" /></button>
            </div>
            ))
            :
            <div className='pb-2'>No places found.</div>
          }
          </div>
            <form className='mt-4' onSubmit={handlePlaceAdd}>
          <div className="grid grid-cols-6">
          <div className="col-span-2">
            <label htmlFor="Place" className="sr-only block text-sm font-medium leading-6 text-gray-900">
              Place
            </label>
            <input
              type="text"
              name="Place"
              id="Place"
              placeholder="Place"
              className="block w-full rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="Location" className="sr-only block text-sm font-medium leading-6 text-gray-900">
                Location
              </label>
              <input
                type="text"
                name="Location"
                id="Location"
                placeholder="Location"
                className="block w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
            </div>
            <div className="col-span-1">
              <label htmlFor="Used" className="sr-only block text-sm font-medium leading-6 text-gray-900">
                Used
              </label>
              <input
                type="date"
                name="Used"
                id="Used"
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
                className="form-input block w-full border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
            </div>
            <button type='submit'
              className="inline-flex justify-center rounded-r-md bg-indigo-300 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
              <PlusIcon className='h-5 w-5 mr-2'/>
              Add Place</button>
        </div>
</form>
        </>

}
{deletePlace &&
  <PlaceConfirmDialog title={deletePlace.place} id={deletePlace.id} />
}
{!deletePlace &&
  <ConfirmDialog handleAgree={handleDelete} title={illustration?.title} deleteName="Illustration" />
}
  </Layout>
  )
}
