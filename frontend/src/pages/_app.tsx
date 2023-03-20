import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SWRConfig } from 'swr'
import { Provider } from 'react-redux'
import fetchJson from '@/library/fetchJson'

import store from '../store'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (    <SWRConfig
    value={{
      fetcher: fetchJson,
      onError: (err) => {
        console.error(err)
      },
    }}
  >
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
    </SWRConfig>
  )
}
