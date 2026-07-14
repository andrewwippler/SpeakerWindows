import Layout from '@/components/Layout'
import { getHelpTopic } from '@/data/helpContent'
import { renderMarkdown } from '@/library/renderMarkdown'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function HelpImportPage() {
  const topic = getHelpTopic('import')
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  if (!session?.accessToken || !topic) return null

  return (
    <Layout>
      <Head>
        <title>SW | {topic.title}</title>
      </Head>
      <div className="mb-4">
        <span className="inline-block rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
          {topic.category}
        </span>
      </div>
      <div className="prose prose-sm max-w-none text-gray-700">
        {renderMarkdown(topic.fullContent)}
      </div>
    </Layout>
  )
}
