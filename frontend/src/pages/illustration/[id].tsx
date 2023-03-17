import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect } from 'react'
import Illustration from '@/components/illustration';

export default function IllustrationWrapper() {
  const router = useRouter()

  // console.log(router.query, name)
  const [data, setData] = useState([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/illustration/${router.query.id}`, '')
      .then(data => {
      console.log(data);
        // todo fix validation if state is not there
      setData(data);
      setLoading(false)
    });
  },[])

  if (isLoading) return <div>Loading...</div>

  return (
    <Illustration illustration={data} />
  )
}
