import { FormEvent } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import api from '@/library/api'
import { useAppSelector, useAppDispatch } from '@/hooks'
import { setFlashMessage } from '@/features/flash/reducer'
import useUser from '@/library/useUser';
import { useRouter } from 'next/router'
import { illustrationType } from '@/library/illustrationType'
import { setIllustrationEdit, setUpdateUI } from '@/features/ui/reducer'
import TagSelect from './TagSelect/TagSelect'
import { getFormattedTags } from '@/features/tags/reducer';

export default function IllustrationForm({ illustration }: {
  illustration?: illustrationType
  }) {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const formattedTags = useAppSelector(getFormattedTags)
    const { user } = useUser({
      redirectTo: '/login',
    })
    let edit = false
    if (illustration) {
      edit = true
    }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (edit) {
      return handleEditSave(event)
    }
    return handleNewSave(event)
  }

  const handleEditSave = (event: FormEvent<HTMLFormElement>) => {
    let form = grabAndReturnObject(event.currentTarget)
    // update illustration
    api.put(`/illustration/${illustration?.id}`, form)
      .then(data => {

        if (data.message != 'Updated successfully') {
          dispatch(setFlashMessage({ severity: 'danger', message: data.message }))
          return
        }
        dispatch(setFlashMessage({ severity: 'success', message: `Illustration "${illustration?.title}" was updated.` }))
        dispatch(setIllustrationEdit(false))
        dispatch(setUpdateUI(true))
        router.replace(`/illustration/${data.illustration.id}`)
    });
    };

  const handleNewSave = (event: FormEvent<HTMLFormElement>) => {
    let form = grabAndReturnObject(event.currentTarget)

      api.post(`/illustration`, form)
        .then(data => {

          if (data.message != 'Created successfully') {
            dispatch(setFlashMessage({ severity: 'danger', message: data.message }))
            return
          }
          dispatch(setFlashMessage({ severity: 'success', message: `Illustration "${form.title}" was created.` }))
          dispatch(setUpdateUI(true))
          router.replace(`/illustration/${data.id}`)
    });
    };

  const grabAndReturnObject = (form: EventTarget & HTMLFormElement) => {
    return {
      title: form.ititle.value.trim(),
      author: form.author.value.trim(),
      source: form.source.value.trim(),
      tags: formattedTags,
      content: form.content.value.trim(),
    }
    }

  return (
      <>
      <div className='mr-4 text-xl font-bold pb-4 text-sky-900'>{edit ? 'Edit' : 'New'} Illustration</div>

          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="mt-5 md:col-span-2 md:mt-0">
              <div className="overflow-hidden shadow sm:rounded-md">
                <div className="bg-white px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="ititle" className="block text-sm font-medium leading-6 text-gray-900">
                        Title
                      </label>
                      <input
                        type="text"
                        name="ititle"
                        id="ititle"
                        placeholder="Title"
                        defaultValue={edit && illustration ? illustration.title : ''}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="author" className="block text-sm font-medium leading-6 text-gray-900">
                        Author
                      </label>
                      <input
                        type="text"
                        name="author"
                        id="author"
                        placeholder="Author"
                        defaultValue={edit && illustration ? illustration.author : ''}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="source" className="block text-sm font-medium leading-6 text-gray-900">
                        Source
                      </label>
                      <input
                        type="text"
                        name="source"
                        id="source"
                        placeholder="Source"
                        defaultValue={edit && illustration ? illustration.source : ''}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="tags" className="block text-sm font-medium leading-6 text-gray-900">
                        Tags
                  </label>
                      <TagSelect defaultValue={edit && illustration ? illustration.tags : ''} />
                    </div>
                    <div className="col-span-6">
                      <label htmlFor="content" className="block text-sm font-medium leading-6 text-gray-900">
                        Content
                      </label>
                      <div className="mt-2">
                      <textarea
                        id="content"
                        name="content"
                        rows={16}
                        className="mt-1 block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:py-1.5 sm:text-sm sm:leading-6"
                        placeholder="Content"
                        defaultValue={edit && illustration ? illustration.content : ''}
                      />
                    </div>
                    </div>


                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                  <button
                className="px-4 py-2 mr-4 inline-flex justify-center rounded-md bg-cyan-300 font-semibold shadow-sm text-white text-sm bg-cyan-300 hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"

                    onClick={() => router.back()}>
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md bg-indigo-300 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    {edit ? 'Update' : 'Create'} Illustration
                  </button>
                </div>
              </div>
          </div>
         </form>
    </>
  )
}
