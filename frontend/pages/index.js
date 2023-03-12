import Head from 'next/head'
// import { Form, Button } from 'react-bootstrap'
import { isLoggedIn } from '../library/helpers/isLoggedIn.js'
// import Login from '../components/Login'
// import TagList from '../components/TagList'
import moment from 'moment'
import Link from 'next/link'


export default function Home() {

  const loggedIn = isLoggedIn();

  return (
    <div>
      <Head>
        <title>Speaker Windows</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <nav className="navbar navbar-expand-md navbar-dark masthead fixed-top">
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">

        {!loggedIn
          ?
            <>
              <ul className="navbar-nav mr-auto">
            <li>
              <Link href="/" className="nav-link">All Tags</Link>
            </li>
            <li>
            <Link href="/" className="nav-link">New Illustration</Link>
            </li>
              </ul>
{/*
             <Form className="form-inline my-2 my-lg-0" action="/illustrations/search" method="GET">
        <Form.Control name="q" className="form-control mr-sm-2" type="text" placeholder="Search" aria-label="Search" />
        <Button className="btn btn-light my-2 my-sm-0" type="submit">Search</Button>
              </Form> */}
          </>

          :
          <>
            <ul className="navbar-nav mr-auto">
            <li>
              <Link href="/" className="nav-link">Speaker Windows</Link>
            </li>
            </ul>
          </>
            }
        </div>
      </nav>

      <div role="main" className="container">
        <div className="starter-template">
          {/* <%= flash_messages %> */}

          {/* {!loggedIn
            ? <Login />
            : <TagList />
          } */}
        </div>
      </div>
<footer className="footer">
      <div className="container">
          <span className="text-muted">&copy; Copyright 2017-{moment().year()} Andrew Wippler</span> {/* <% if user_signed_in? %> <%= link_to('Logout', destroy_user_session_path, method: :delete) %> */}
      </div>
</footer>

    </div>
  );
}
