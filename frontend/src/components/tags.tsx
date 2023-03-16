import * as _ from "lodash";
import { useAppSelector, useAppDispatch } from '../hooks'
import Link from 'next/link'

function Tags() {

  const dispatch = useAppDispatch()
  // const tags = useAppSelector(selectTags)
  // const [incrementAmount, setIncrementAmount] = useState('2')

  function returnColumnHTML(data: any) {
    let value = '';
    _.each(data, function (object) {
      let name = object.name.replace(/ /g,"-");
        value += `<Link href='/tag/${name}'>${object.name}</Link>`
    })
    return value
  }
  // get tags data Api.get(/tags)
  // const tags = dispatch(getTags);
  let data = [{ id: 9, name: 'Adonis 101' },
  { id: 12, name: 'Adonis Is Cool' },
    { id: 11, name: 'Cooking' },
    { id: 13, name: 'Cookings' },
    { id: 10, name: 'Cool Is Andrew' }]

  let rows_per_column = Math.ceil(data.length / 3);
  let columnOneData = _.take(data, rows_per_column);
  let columnTwoData = _.takeRight(_.take(data, rows_per_column * 2), rows_per_column);
  let columnThreeData = _.takeRight(data, data.length-(rows_per_column*2));

  let columnOne = returnColumnHTML(columnOneData);
  let columnTwo = returnColumnHTML(columnTwoData);
  let columnThree = returnColumnHTML(columnThreeData);


  return (
  <div>
    <h1>Tags</h1>
    <div className="row">
        {
          columnOneData.map((tag) => (
            <div>
              <Link href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}</Link>
            </div>
          ))
        }
              {
          columnTwoData.map((tag) => (
            <div>
              <Link href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}</Link>
            </div>
          ))
        }
                {
          columnThreeData.map((tag) => (
            <div>
              <Link href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}</Link>
            </div>
          ))
        }
    </div>

    </div>
  );
}

export default Tags;
