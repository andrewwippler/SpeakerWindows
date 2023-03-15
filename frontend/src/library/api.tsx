import useSWR from 'swr'
import { useState } from 'react';
const fetcher = (url,apioptions) => fetch(url,apioptions).then(res => res.json())
const options = { errorRetryCount: 3 }

export function getIllustrations(tag) {
  const apitoken = useState();
  const apioptions = {
    headers: new Headers({
        'Authorization': 'Basic ' + apitoken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }),
}
  const { data, mutate, error, isLoading } = useSWR([`${process.env.NEXT_PUBLIC_HOST_URL}/tags/${tag}`, apioptions], ([url, apioptions]) => fetcher(url, apioptions), options)

  return {
    illustrations: data,
    isLoading,
    isError: error,
    mutate
  }
}

export function getUser(username, password) {

}
