import Head from 'next/head'
import Router from "next/router";
import moment from 'moment'
import { useAppSelector, useAppDispatch } from '../hooks'

import { loginAsync, selectLoginStatus } from '@/features/user/reducer';
import Tags from '@/components/tags';

export default function Home() {

  const loggedIn = useAppSelector(selectLoginStatus);
  const dispatch = useAppDispatch()

  return (
<>
      <Head>
        <title>Speaker Windows</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        {loggedIn == 'out' ?
          <button
            onClick={() => {
              dispatch(loginAsync({ email: 'test@test.com', password: 'Test1234' }));
            }}
          >You Need to Log In!</button>
          :
            <Tags />
        }
      </div>
      <footer className="footer">
      <div className="container">
          <span className="text-muted">&copy; Copyright 2017-{moment().year()} Andrew Wippler</span> {/* <% if user_signed_in? %> <%= link_to('Logout', destroy_user_session_path, method: :delete) %> */}
      </div>
    </footer>

    </>
  )
}
