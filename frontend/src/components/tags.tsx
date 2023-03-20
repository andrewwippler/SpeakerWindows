// @ts-nocheck
import * as _ from "lodash"
import Link from 'next/link'
import api from '@/library/api'
import { useState, useEffect } from 'react'

import { useAppDispatch } from '@/hooks'

function Tags() {
  const dispatch = useAppDispatch()
  const [data, setData] = useState([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/tags', '').then(tags => {
      setData(tags);
      // dispatch(setTags(tags)) // do we need?
      setLoading(false)
    });
  },[])

  if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No Tags Found</p>

  let rows_per_column = Math.ceil(data.length / 3);
  let columnOneData = _.take(data, rows_per_column);
  let columnTwoData = _.takeRight(_.take(data, rows_per_column * 2), rows_per_column);
  let columnThreeData = _.takeRight(data, data.length-(rows_per_column*2));
  // console.log(rows_per_column, data, columnOneData, columnTwoData,columnThreeData)
    return (
    <>
        <div className="text-xl font-bold text-sky-900 pb-4">Tags</div>

        <div className="grid grid-cols-1 sm:grid-cols-3">
        <div>
          {
            columnOneData.map((tag, i) => (
                <Link key={`one-${i}`} className="block pb-2" href={`/tag/${tag.name}`}>{tag.name.replace(/-/g, " ")}</Link>
            ))
          }
        </div>
        <div>
                {
                  columnTwoData.map((tag, i) => (
                <Link key={`two-${i}`} className="block pb-2" href={`/tag/${tag.name}`}>{tag.name.replace(/-/g, " ")}</Link>
            ))
          }
          </div>
        <div>
                  {
                    columnThreeData.map((tag, i) => (
                <Link key={`three-${i}`} className="block pb-2" href={`/tag/${tag.name}`}>{tag.name.replace(/-/g, " ")}</Link>
            ))
          }
          </div>
          </div>
      </>
    );

}

export default Tags;
