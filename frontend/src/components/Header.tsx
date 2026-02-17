import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Image from "next/image";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Dialog } from "@headlessui/react";
import fetchJson from "@/library/fetchJson";
import { PlusIcon, TagIcon, BookOpenIcon, UserGroupIcon, CogIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import LoginBtn from "./LoginBtn";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white">
      <header className="inset-x-0 top-0 z-50">
        <nav
          className="bg-sky-300 flex items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <Link href="/" className="text-sky-100 italic -m-1.5 p-1.5">
              <span>Speaker Windows</span>
            </Link>
          </div>
          <div className="flex lg:hidden">
            <Link
              href="/new-illustration"
              className="mr-10 text-sm font-bold leading-6 text-sky-100 "
            >
              <span className="sr-only">Add New Illustration</span>
              <PlusIcon className="h-8 w-8" />
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
            {session && (
              <>
                <Link
                  href="/"
                  className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900 flex items-center"
                >
                  <TagIcon className="h-5 w-5 mr-1.5" />
                  Tags
                </Link>
                <Link
                  href="/new-illustration"
                  className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900 flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-1.5" />
                  New Illustration
                </Link>
                <Link
                  href="/articles"
                  className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900 flex items-center"
                >
                  <BookOpenIcon className="h-5 w-5 mr-1.5" />
                  Articles
                </Link>
                <Link
                  href="/authors"
                  className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900 flex items-center"
                >
                  <UserGroupIcon className="h-5 w-5 mr-1.5" />
                  Authors
                </Link>
                <Link
                  href="/settings"
                  className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900 flex items-center"
                >
                  <CogIcon className="h-5 w-5 mr-1.5" />
                  Settings
                </Link>
                <Link
                  href="/search"
                  className="text-sm font-semibold leading-6 text-sky-100 hover:text-sky-900 flex items-center"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-1.5" />
                  Search
                </Link>
              </>
            )}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <LoginBtn />
          </div>
        </nav>
        <Dialog
          as="div"
          className="lg:hidden"
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
        >
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
                  {session && (
                    <>
                      <Link
                        href="/"
                        className="-mx-3 flex items-center rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900"
                      >
                        <TagIcon className="h-5 w-5 mr-3" />
                        Tags
                      </Link>
                      <Link
                        href="/new-illustration"
                        className="-mx-3 flex items-center rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900"
                      >
                        <PlusIcon className="h-5 w-5 mr-3" />
                        New Illustration
                      </Link>
                      <Link
                        href="/articles"
                        className="-mx-3 flex items-center rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900"
                      >
                        <BookOpenIcon className="h-5 w-5 mr-3" />
                        Articles
                      </Link>
                      <Link
                        href="/authors"
                        className="-mx-3 flex items-center rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900"
                      >
                        <UserGroupIcon className="h-5 w-5 mr-3" />
                        Authors
                      </Link>
                      <Link
                        href="/settings"
                        className="-mx-3 flex items-center rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900"
                      >
                        <CogIcon className="h-5 w-5 mr-3" />
                        Settings
                      </Link>
                      <Link
                        href="/search"
                        className="-mx-3 flex items-center rounded-lg py-2 px-3 text-base font-semibold leading-7 text-sky-300 hover:bg-sky-900"
                      >
                        <MagnifyingGlassIcon className="h-5 w-5 mr-3" />
                        Search
                      </Link>
                    </>
                  )}
                </div>
                <div className="py-6">
                  <LoginBtn />

                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>
    </div>
  );
}
