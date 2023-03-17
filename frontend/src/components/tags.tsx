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
      console.log(tags);
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
    return (
    <div>
      <h1>Tags</h1>
      <div>
          {
            columnOneData.map((tag) => (
              <div key={ tag.id }>
                <Link href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}</Link>
              </div>
            ))
          }
                {
            columnTwoData.map((tag) => (
              <div key={ tag.id }>
                <Link href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}</Link>
              </div>
            ))
          }
                  {
            columnThreeData.map((tag) => (
              <div key={ tag.id }>
                <Link href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}</Link>
              </div>
            ))
          }
      </div>

      </div>
    );

}

export default Tags;
