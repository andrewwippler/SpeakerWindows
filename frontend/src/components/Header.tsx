import Link from 'next/link'
import useUser from '@/library/useUser'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Image from 'next/image'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Dialog } from '@headlessui/react'
import fetchJson from '@/library/fetchJson'
import { PlusIcon } from '@heroicons/react/24/solid'

export default function Header() {
  const { user, mutateUser } = useUser()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return ( <div className="bg-white">
  <header className="inset-x-0 top-0 z-50">
    <nav className="bg-sky-300 flex items-center justify-between p-6 lg:px-8" aria-label="Global">
      <div className="flex lg:flex-1">
        <Link href="/" className="text-sky-100 italic -m-1.5 p-1.5">
          <span>Speaker Windows</span>
        </Link>
      </div>
        <div className="flex lg:hidden">
          <Link href="/new-illustration" className="mr-10 text-sm font-bold leading-6 text-sky-100 ">
          <span className="sr-only">Add New Illustration</span>
          <PlusIcon className='h-8 w-8'/>
          </Link>
        <button
          type="button"
          className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-sky-100"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open main menu</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
        <div className="hidden lg:flex lg:gap-x-12">
        {user?.isLoggedIn === true && (
        <>
          <Link href="/" className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900">
          Home
          </Link>
          <Link href="/new-illustration" className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900">
          New illustration
          </Link>
          <Link href="/search" className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900">
          Search
          </Link>
          <Link href="/authors" className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900">
          List Authors
          </Link>
        </>
        )}
      </div>
      <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {user?.isLoggedIn === false && (
            <div className='-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-7 text-sky-100 hover:bg-sky-900'>
              <Link href="/login" className="text-sm font-semibold leading-6 text-sky-100">
                Login <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          )}
          {user?.isLoggedIn === true && (
            <>
              <div className='-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-7 text-sky-100 hover:bg-sky-900'>
                <Link
                  href="/api/logout"
                  onClick={async (e) => {
                    e.preventDefault()
                    mutateUser(
                      await fetchJson('/api/logout', { method: 'POST' }),
                      false
                      )
                      router.push('/login')
                    }}
                >
                  Logout
                </Link>
              </div>
            </>
          )}
      </div>
    </nav>
    <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
      <div className="fixed inset-0 z-50" />
      <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sky-300 italic -m-1.5 p-1.5">
            <span>Speaker Windows</span>

          </Link>
          <button
            type="button"
            className="-m-2.5 rounded-md p-2.5 text-sky-300"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sr-only">Close menu</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-6 flow-root">
          <div className="-my-6 divide-y divide-gray-500/10">
            <div className="space-y-2 py-6">
                {user?.isLoggedIn === true && (
                  <>
                  <Link href="/" className="-mx-3 block rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900">Home</Link>
                  <Link href="/new-illustration" className="-mx-3 block rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900">New Illustration</Link>
                  <Link href="/search" className="-mx-3 block rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900">Search</Link>
                  <Link href="/authors" className="-mx-3 block rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900">List Authors</Link>
                  </>
                )}
                  </div>
            <div className="py-6">
            {user?.isLoggedIn === false && (
            <div className='-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900'>
              <Link href="/login" className="text-sm font-semibold leading-6 text-sky-300">
                Login
              </Link>
            </div>
          )}
          {user?.isLoggedIn === true && (
            <>
              <div className='-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900'>
                <Link
                  href="/api/logout"
                  onClick={async (e) => {
                    e.preventDefault()
                    mutateUser(
                      await fetchJson('/api/logout', { method: 'POST' }),
                      false
                      )
                      router.push('/login')
                    }}
                >
                  Logout
                </Link>
              </div>
            </>
          )}
            </div>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  </header>
</div>



  )
}
