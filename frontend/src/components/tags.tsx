import * as _ from "lodash"
import Link from 'next/link'
import api from '@/library/api'
import { useState, useEffect } from 'react'

function Tags() {

  const [data, setData] = useState([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/tags', '').then(tags => {
      setData(tags);
      setLoading(false)
    });
  },[])

  if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No profile data</p>

  let rows_per_column = Math.ceil(data.length / 3);
  let columnOneData = _.take(data, rows_per_column);
  let columnTwoData = _.takeRight(_.take(data, rows_per_column * 2), rows_per_column);
  let columnThreeData = _.takeRight(data, data.length-(rows_per_column*2));
  // console.log(rows_per_column, data, columnOneData, columnTwoData,columnThreeData)
    return (
    <>
        <div className="text-xl font-bold pb-4">Tags</div>

        <div className="grid grid-cols-1 sm:grid-cols-3">
        <div>
          {
            columnOneData.map((tag) => (
                <Link className="block pb-2" href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}</Link>
            ))
          }
        </div>
        <div>
                {
                  columnTwoData.map((tag) => (
                <Link className="block pb-2" href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}</Link>
            ))
          }
          </div>
        <div>
                  {
                    columnThreeData.map((tag) => (
                <Link className="block pb-2" href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}</Link>
            ))
          }
          </div>
          </div>
      </>
    );

}

export default Tags;
