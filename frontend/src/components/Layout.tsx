import Head from 'next/head'
import Header from '@/components/Header'
import Flash from './Flash'
import { format } from 'date-fns'
import Link from 'next/link'

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <>
      <Head>
        <title>Speaker Windows</title>
      </Head>

      <Header />
      <Flash />
      <main className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-screen-lg">{children}</div>
      </main>
      <footer className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-screen-lg text-sky-500">
          Speaker Windows &copy; Copyright 2017-{format(new Date(),'yyyy')} Andrew Wippler | <Link className='underline text-sky-300' href='/tos'>Terms of Service</Link> | <Link className='underline text-sky-300' href='/privacy-policy'>Privacy Policy</Link>
      </div>
    </footer>
    </>
  )
}
