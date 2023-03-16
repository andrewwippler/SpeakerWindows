import useSWR from 'swr'

import { useAppSelector, useAppDispatch } from '@/hooks'

import { getToken, selectToken } from '@/features/user/reducer';

const fetcher = (url: string, apioptions: {}) => fetch(url,apioptions).then(res => res.json())
const options = { errorRetryCount: 3 }


export function getIllustrations(tag: string) {

  const apiheaders = {
    headers: {
        'Authorization': 'Basic ' + useAppSelector(selectToken),
        'Content-Type': 'application/x-www-form-urlencoded'
    },
  }
  console.log(apiheaders,useAppSelector(selectToken))
  // const { data, error, isLoading } = useSWR([`${process.env.NEXT_PUBLIC_HOST_URL}/tags/${tag}`, apiheaders], ([url, apioptions]) => fetcher(url, apioptions), options)

  // return {
  //   illustrations: data,
  //   isLoading,
  //   isError: error,
  // }
  return {
    illustrations: [{ id: 9, name: 'Adonis 101' },
    { id: 12, name: 'Adonis Is Cool' },
      { id: 11, name: 'Cooking' },
      { id: 13, name: 'Cookings' },
      { id: 10, name: 'Cool Is Andrew' }], isLoading: true, isError: false
  }
}

