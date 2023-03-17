import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect } from 'react'

// Note: Function to redirect old URLs to the new format.
export default function LegacyIllustration() {
  const router = useRouter()

  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/illustrations/${router.query.id}`, '')
      .then(data => {
        setLoading(false)
        router.replace(`/illustration/${data.id}`)
    });
  },[])

  if (isLoading) return <div>Redirecting...</div>

}
