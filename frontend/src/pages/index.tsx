import Layout from '@/components/Layout'
import Image from 'next/image'


import Tags from '@/components/tags';
import useUser from '@/library/useUser';

export default function Home() {
  const { user } = useUser({
    redirectTo: '/login',
  })

  return (
    <Layout>
      { user?.isLoggedIn && (<Tags />) }
    </Layout>
  )
}
