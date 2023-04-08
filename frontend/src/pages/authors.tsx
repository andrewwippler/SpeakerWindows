import Author from '@/components/AuthorIndex';
import Layout from '@/components/Layout'
import useUser from '@/library/useUser';

export default function Home() {
  const { user } = useUser({
    redirectTo: '/login',
  })

  return (
    <Layout>
      { user?.isLoggedIn && (<Author token={user?.token} />) }
    </Layout>
  )
}
