import React from 'react';
import App from 'next/app';

import { reduxWrapper } from '../redux/store';
import '../styles/app.scss'

class CustomApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <Component {...pageProps} />
    );
  }
}

export default reduxWrapper.withRedux(CustomApp);
