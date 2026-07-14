import { useState } from 'react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import HelpPanel from './HelpPanel'

export default function HelpIcon({ topic }: { topic: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sky-400 hover:text-sky-600 transition-colors"
        title={`Help: ${topic}`}
      >
        <QuestionMarkCircleIcon className="h-5 w-5" />
      </button>
      <HelpPanel topicId={topic} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
