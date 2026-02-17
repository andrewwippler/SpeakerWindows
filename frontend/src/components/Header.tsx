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

function NavLink({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  const router = useRouter();
  const isActive = router.pathname === href || (href !== '/' && router.pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`text-sm font-semibold leading-6 flex items-center ${
        isActive ? 'text-sky-900' : 'text-sky-100 hover:text-sky-900'
      }`}
    >
      <Icon className="h-5 w-5 mr-1.5" />
      {children}
    </Link>
  );
}

function MobileNavLink({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  const router = useRouter();
  const isActive = router.pathname === href || (href !== '/' && router.pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`-mx-3 flex items-center rounded-lg py-2 px-3 text-base font-semibold leading-7 ${
        isActive ? 'bg-sky-900 text-white' : 'text-sky-300 hover:bg-sky-900'
      }`}
    >
      <Icon className="h-5 w-5 mr-3" />
      {children}
    </Link>
  );
}

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
                <NavLink href="/" icon={TagIcon}>Tags</NavLink>
                <NavLink href="/new-illustration" icon={PlusIcon}>New Illustration</NavLink>
                <NavLink href="/articles" icon={BookOpenIcon}>Articles</NavLink>
                <NavLink href="/authors" icon={UserGroupIcon}>Authors</NavLink>
                <NavLink href="/settings" icon={CogIcon}>Settings</NavLink>
                <NavLink href="/search" icon={MagnifyingGlassIcon}>Search</NavLink>
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
                      <MobileNavLink href="/" icon={TagIcon}>Tags</MobileNavLink>
                      <MobileNavLink href="/new-illustration" icon={PlusIcon}>New Illustration</MobileNavLink>
                      <MobileNavLink href="/articles" icon={BookOpenIcon}>Articles</MobileNavLink>
                      <MobileNavLink href="/authors" icon={UserGroupIcon}>Authors</MobileNavLink>
                      <MobileNavLink href="/settings" icon={CogIcon}>Settings</MobileNavLink>
                      <MobileNavLink href="/search" icon={MagnifyingGlassIcon}>Search</MobileNavLink>
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
