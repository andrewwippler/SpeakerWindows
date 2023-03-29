import React, { FormEvent, Fragment, useState } from 'react'
import Layout from '@/components/Layout'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { setFlashMessage } from '@/features/flash/reducer'
import { useAppDispatch } from '@/hooks'
import api from '@/library/api'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import router from 'next/router'

const reasons = [
  { type: 'General' },
  { type: 'DMCA Notice' },
  { type: 'Privacy Violation' },
  { type: 'TOS Violation' },
  { type: 'Unsubscribe' },
]
export default function ContactForm() {

  const [selected, setSelected] = useState(reasons[0])
  const dispatch = useAppDispatch()

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let form = grabAndReturnObject(event.currentTarget)

    api.post(`/contact`, form)
      .then(data => {
        if (data.message != 'Created successfully') {
          data.errors.map((e: any) => {
            dispatch(setFlashMessage({ severity: 'danger', message: e.message }))
          })
          return
        }
        dispatch(setFlashMessage({ severity: 'success', message: `Your message was sucessfully sent.` }))
        router.replace(`/`)
  });
  };

const grabAndReturnObject = (form: EventTarget & HTMLFormElement) => {
  return {
    reason: selected.type,
    email: form.email.value.trim(),
    message: form.message.value.trim(),

  }
}
  return (
    <Layout>
      <form onSubmit={(e) => {onSubmit(e)}}>

      <div className="border-b border-sky-900/10 pb-12">
          <h2 className="text-2xl font-semibold leading-7 text-sky-900">Contact Us</h2>
        <div className="mt-10 grid grid-cols-1 gap-y-8 gap-x-6:grid-cols-6 text-sm">
          <div className="sm:col-span-6">
              <label htmlFor="email" className="block font-medium leading-6 text-sky-900">
                Email address
              </label>
              <div className="mt-2">
                  <input
                  required
                  id="email"
                  name="email"
                  type="email"
                  placeholder='Email'
                  autoComplete="email"
                  className="border-0 relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300"
                />
              </div>
          </div>
          <div className="sm:col-span-6">
          <label htmlFor="reason" className="block font-medium leading-6 text-sky-900">
                Contact Reason
              </label>
          <Listbox value={selected} onChange={setSelected}>
            <div id='reason' className="relative mt-1">
              <Listbox.Button className="w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 ">
                <span className="block truncate">{selected.type}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                    />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                >
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg focus:outline-none">
                  {reasons.map((item, itemIdx) => (
                    <Listbox.Option
                    key={itemIdx}
                    className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                    }`
                  }
                  value={item}
                  >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? 'font-medium' : 'font-normal'
                            }`}
                            >
                            {item.type}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
          </div>
          <div className="sm:col-span-6">
              <label htmlFor="message" className="block font-medium leading-6 text-sky-900">
                Message
              </label>
              <div className="mt-2">
                <textarea
                  required
                  minLength={40}
                  rows={12}
                  id="message"
                  name="message"
                  placeholder='Your message goes here...'
                  className="border-0 w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-lg focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300"
                  />
              </div>
          </div>
        </div>
      </div>

        <div className="mt-6 flex items-center justify-end gap-x-6">
        <button type="button" className="inline-flex items-center font-semibold leading-6 text-sky-900" onClick={() => router.back()}>
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />Back
                  </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 py-2 px-3 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Send Message
        </button>
      </div>
              </form>
    </Layout>
  )
}
