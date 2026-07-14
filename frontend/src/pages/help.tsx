import Link from 'next/link'
import Layout from '@/components/Layout'
import { helpTopics } from '@/data/helpContent'
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/solid'
import Head from 'next/head'

const topicIcons: Record<string, any> = {
  search: MagnifyingGlassIcon,
  create: PlusIcon,
  import: ArrowUpTrayIcon,
}

export default function HelpIndex() {
  return (
    <Layout>
      <Head>
        <title>SW | Help</title>
      </Head>
      <div className="text-xl font-bold pb-6 text-sky-900 flex items-center">
        <QuestionMarkCircleIcon className="h-6 w-6 mr-2" />
        Help &amp; Documentation
      </div>
      <p className="text-gray-600 mb-8">
        Guides and reference documentation for using Speaker Windows.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {helpTopics.map((topic) => {
          const Icon = topicIcons[topic.id] || QuestionMarkCircleIcon
          return (
            <Link
              key={topic.id}
              href={`/help/${topic.id}`}
              className="block rounded-lg border border-gray-200 p-6 hover:border-sky-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-5 w-5 text-sky-600" />
                <h2 className="text-lg font-semibold text-sky-900">
                  {topic.title}
                </h2>
              </div>
              <span className="inline-block rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 mb-3">
                {topic.category}
              </span>
              <p className="text-sm text-gray-600">{topic.shortDescription}</p>
            </Link>
          )
        })}
      </div>
    </Layout>
  )
}
