import Link from 'next/link'
import { connect } from 'react-redux'

const Page = ({ title, linkTo, tick }) => (
  <div>
    <h1>{title}</h1>
    <nav>
      <Link href={linkTo}>Navigate</Link>
    </nav>
  </div>
)

export default connect((state) => state)(Page)
