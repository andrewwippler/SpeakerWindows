import Head from 'next/head'
import Router from "next/router";
import moment from 'moment'
import { useState, useEffect } from 'react';

export default function Home() {
  const [apitoken,loggedOut] = useState();
  const loggedIn = () => { return false; };

  useEffect(() => {
    if (apitoken && !loggedOut) {
      Router.replace("/tags");
    }
  }, [apitoken, loggedOut]);

  return (
<>
      <Head>
        <title>Speaker Windows</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>

        <button
          onClick={() => {
            login();
            mutate(); // after logging in, we revalidate the SWR
          }}
        >You Need to Log In!</button>
      </div>
      <footer className="footer">
      <div className="container">
          <span className="text-muted">&copy; Copyright 2017-{moment().year()} Andrew Wippler</span> {/* <% if user_signed_in? %> <%= link_to('Logout', destroy_user_session_path, method: :delete) %> */}
      </div>
    </footer>

    </>
  )
}
