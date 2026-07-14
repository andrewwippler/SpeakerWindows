import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { renderMarkdown } from '@/library/renderMarkdown'
import { getHelpTopic } from '@/data/helpContent'
import Link from 'next/link'

export default function HelpPanel({
  topicId,
  open,
  onClose,
}: {
  topicId: string
  open: boolean
  onClose: () => void
}) {
  const topic = getHelpTopic(topicId)
  if (!topic) return null

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="bg-sky-50 px-4 py-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <QuestionMarkCircleIcon className="h-6 w-6 text-sky-600" />
                          <Dialog.Title className="text-lg font-semibold text-sky-900">
                            {topic.title}
                          </Dialog.Title>
                        </div>
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={onClose}
                        >
                          <span className="sr-only">Close</span>
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="mt-1 flex gap-2">
                        <span className="inline-block rounded-full bg-sky-200 px-2 py-0.5 text-xs font-medium text-sky-800">
                          {topic.category}
                        </span>
                      </div>
                    </div>

                    <div className="relative flex-1 px-4 py-5 sm:px-6">
                      <div className="prose prose-sm max-w-none text-gray-700">
                        {renderMarkdown(topic.panelContent)}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                      <Link
                        href={`/help/${topic.id}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-500"
                      >
                        Read full article
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
