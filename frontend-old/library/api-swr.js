import useSWR from 'swr'
const fetcher = (...args) => fetch(...args).then(res => res.json())

export function getIllustrations(tag) {
  const { data, error, isLoading } = useSWR(`${process.env.NEXT_PUBLIC_HOST_URL}/tags/${tag}`, fetcher)

  return {
    illustrations: data,
    isLoading,
    isError: error
  }
}
