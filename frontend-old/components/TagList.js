const _ = require('lodash')

function returnColumnHTML(data) {
  let value = '';
  _.each(data, function (object) {
    let name = object.name.replace(/ /g,"-");
      value += `<div class='col p-2'><a href='/tag/${name}'>${object.name}</a></div>`
  })
  return value
}

const Login = (props) => {

  // get tags data Api.get(/tags)
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
  <>
    <h1>Tags</h1>
    <div className="row">
      <div className="col-sm" dangerouslySetInnerHTML={{ __html: columnOne }}></div>
      <div className="col-sm" dangerouslySetInnerHTML={{ __html: columnTwo }}></div>
      <div className="col-sm" dangerouslySetInnerHTML={{ __html: columnThree }}></div>
    </div>

    </>
  );
}

export default Login;
