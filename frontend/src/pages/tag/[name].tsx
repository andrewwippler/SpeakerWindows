import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useAppSelector, useAppDispatch } from '../../hooks'
import { useState, useEffect } from 'react'

export default function Tag() {
  const router = useRouter()
  const name = _.get(router.query, 'name', '')

  // console.log(router.query, name)
  const [data, setData] = useState([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/tag/${router.query.name}`, '')
      .then(data => {
      // console.log(data);
        // todo fix validation if state is not there
      setData(data);
      setLoading(false)
    });
  },[])

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      { data.map((d) => (
        <div key={d.id}>{d.title}</div>
      ))}
    </div>
  )
}
