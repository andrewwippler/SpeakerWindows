
function Illustration({ illustration }) {

  return (
    <div>
      {illustration.title ? illustration.title : 'Default Title'}
    </div>
  );

}

export default Illustration;
