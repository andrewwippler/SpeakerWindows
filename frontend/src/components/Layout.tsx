import Head from 'next/head'
import Header from '@/components/Header'
import moment from 'moment'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>Speaker Windows</title>
      </Head>

      <Header />

      <main className="flex">
        <div className="p-4 w-screen">{children}</div>
      </main>
      <footer className="p-4 flex">
      <div className="text-sky-500">
          Speaker Windows &copy; Copyright 2017-{moment().year()} Andrew Wippler
      </div>
    </footer>
    </>
  )
}
