import { FormEvent } from 'react'
import { LockClosedIcon } from '@heroicons/react/20/solid'
import { AppProps } from 'next/app'
import api from '@/library/api'
import { useAppSelector, useAppDispatch } from '@/hooks'
import { selectModal, setModal } from '@/features/modal/reducer'
import { setFlashMessage } from '@/features/flash/reducer'
import useUser from '@/library/useUser';
import { useRouter } from 'next/router'

export default function IllustrationForm({ illustration }: {
  illustration?: AppProps<object>
  }) {
    const router = useRouter()
    const dispatch = useAppDispatch()
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
      handleEditSave(event)
    }
    handleNewSave(event)
  }

    const handleEditSave = (event: FormEvent<HTMLFormElement>) => {
      //todo: get all form objects and paste into object
      // maybe send it to re-usable function?
      const title = event.currentTarget.title.value.trim();

      // update illustration
      api.put(`/illustration/${illustration.id}`, {title})
        .then(data => {

          if (data.message != 'Updated successfully') {
            dispatch(setFlashMessage({ severity: 'danger', message: data.message }))
            return
          }
          dispatch(setFlashMessage({ severity: 'success', message: `Illustration "${illustration.title}" was updated.` }))

          router.replace(`/illustration/${data.id}`)
    });
    };

    const handleNewSave = (event: FormEvent<HTMLFormElement>) => {
      //todo: get all form objects and paste into object
      // maybe send it to re-usable function?
      const title = event.currentTarget.title.value.trim();

      api.post(`/illustration`, {title}) // check right URI?
        .then(data => {

          if (data.message != 'Updated successfully') {
            dispatch(setFlashMessage({ severity: 'danger', message: data.message }))
            return
          }
          dispatch(setFlashMessage({ severity: 'success', message: `Illustration "${illustration.title}" was updated.` }))

          router.replace(`/illustration/${data.id}`)
    });
    };

  return (
      <>

          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="-space-y-px rounded-md shadow-sm">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
                  placeholder="Email address"
                  defaultValue="test@test.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
                  placeholder="Password"
                  defaultValue="Test1234"
                />
              </div>
            </div>
        title
        author
        source
        Tags
        body
          </form>
    </>
  )
}
