import React, { FormEvent, useState } from 'react'
import Layout from '@/components/Layout'
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import router from 'next/router'
import api from '@/library/api'
import { useAppDispatch } from '@/hooks'
import { setFlashMessage } from '@/features/flash/reducer'
import Link from 'next/link'

export default function Register() {
const dispatch = useAppDispatch()

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  let form = grabAndReturnObject(event.currentTarget)

    if (form.password != form.password_confirmation) {
      dispatch(setFlashMessage({ severity: 'danger', message: "Passwords do not match" }))
      return
    }
    api.post(`/register`, form)
      .then(data => {
        if (data.message != 'Created successfully') {
          data.errors.map((e: any) => {
            dispatch(setFlashMessage({ severity: 'danger', message: e.message }))
          })
          return
        }
        dispatch(setFlashMessage({ severity: 'success', message: `Your account was sucessfully created.` }))
        router.replace(`/`)
  });
  };

const grabAndReturnObject = (form: EventTarget & HTMLFormElement) => {
  return {
    email: form.email.value.trim(),
    password: form.password.value.trim(),
    password_confirmation: form.password_confirm.value.trim(),
    tos: form.tos.value,
    thirteen: form.thirteen.value,
  }
}

  return (
    <Layout>
      <>
        <form onSubmit={(e) => {onSubmit(e)}}>
      <div className="border-b border-sky-900/10 pb-12">
          <h2 className="text-2xl font-semibold leading-7 text-sky-900">Register a New Account</h2>

          <div className="mt-10 grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-sky-900">
                Email address
              </label>
              <div className="mt-2">
                  <input
                  required
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-md border-0 py-1.5 text-sky-900 shadow-sm ring-1 ring-inset ring-sky-300 placeholder:text-sky-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-sky-900">
                Password
              </label>
              <div className="mt-2">
                  <input
                  required
                  type="password"
                  name="password"
                  id="password"
                  minLength={8}
                  pattern="^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*].+"
                  autoComplete="new-password"
                  className="block w-full rounded-md border-0 py-1.5 text-sky-900 shadow-sm ring-1 ring-inset ring-sky-300 placeholder:text-sky-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                   <p className="text-xs mt-1 ml-1 text-sky-500">Password must include a number AND special character: ! @ # $ % ^ & *</p>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="password_confirm" className="block text-sm font-medium leading-6 text-sky-900">
                Confirm Password
              </label>
              <div className="mt-2">
                  <input
                  required
                  type="password"
                  name="password_confirm"
                  id="password_confirm"
                  autoComplete="new-password"
                  minLength={8}
                  pattern="^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*].+."
                  className="block w-full rounded-md border-0 py-1.5 text-sky-900 shadow-sm ring-1 ring-inset ring-sky-300 placeholder:text-sky-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

          </div>
        </div>

        <div className="border-b border-sky-900/10 pb-12">


          <div className="mt-10 space-y-10">
            <fieldset>
              <div className="mt-6 space-y-6">
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="tos"
                      name="tos"
                        type="checkbox"
                        required
                      className="h-4 w-4 rounded border-sky-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="tos" className="font-medium text-sky-900">
                        I have read and agree to the <Link href="/privacy-policy" legacyBehavior passHref><a className='underline' target="_blank" rel="noopener noreferrer">Privacy Policy</a></Link> and <Link href="/tos" legacyBehavior passHref><a className='underline' target="_blank" rel="noopener noreferrer">Terms of Service</a></Link>.
                    </label>
                    <p className="text-sky-500">We promise not to sell your information.</p>
                  </div>
                </div>
                <div className="relative flex gap-x-3">
                  <div className="flex h-6 items-center">
                    <input
                      id="thirteen"
                      name="thirteen"
                      type="checkbox"
                      required
                      className="h-4 w-4 rounded border-sky-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="text-sm leading-6">
                    <label htmlFor="thirteen" className="font-medium text-sky-900">
                      I am at least 13 years of age.
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>

          </div>
        </div>


      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button type="button" className="inline-flex items-center text-sm font-semibold leading-6 text-sky-900" onClick={() => router.back()}>
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />Back
                  </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Register
        </button>
      </div>
    </form>
    </>
    </Layout>
  )
}
