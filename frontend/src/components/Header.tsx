import Link from 'next/link'
import useUser from '@/library/useUser'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Image from 'next/image'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Dialog } from '@headlessui/react'
import fetchJson from '@/library/fetchJson'

const navigation = [
  { name: 'Home', href: '#' },
  { name: 'g', href: '#' },
  { name: 'Marketplace', href: '#' },
  { name: 'Company', href: '#' },
]

export default function Header() {
  const { user, mutateUser } = useUser()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return ( <div className="bg-white">
  <header className="inset-x-0 top-0 z-50">
    <nav className="bg-sky-300 flex items-center justify-between p-6 lg:px-8" aria-label="Global">
      <div className="flex lg:flex-1">
        <a href="#" className="-m-1.5 p-1.5">
          <span className="sr-only">Speaker Windows</span>
          {/* <img
            className="h-8 w-auto"
            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
            alt=""
          /> */}
        </a>
      </div>
      <div className="flex lg:hidden">
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
          <Link href="/" className="text-sm font-semibold leading-6 text-sky-100">
          Home
          </Link>

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
                <a
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
                </a>
              </div>
            </>
          )}
      </div>
    </nav>
    <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
      <div className="fixed inset-0 z-50" />
      <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
        <div className="flex items-center justify-between">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Speaker Windows</span>
            {/* <img
              className="h-8 w-auto"
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
              alt=""
            /> */}
          </a>
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

            <Link href="/" className="-mx-3 block rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900">Home</Link>
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
                <a
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
                </a>
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
