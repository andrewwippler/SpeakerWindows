import { useAppSelector, useAppDispatch } from '@/hooks'
import api from '@/library/api'
import { useState, useEffect, MouseEvent, ChangeEvent, useRef } from 'react'
import { tagType } from '@/library/tagtype';
import { getTags, setTags, addTag, removeTag } from '@/features/tags/reducer';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function TagSelect({ defaultValue }:{ defaultValue: tagType[] }) {


  const dispatch = useAppDispatch()

  const [tags, setLocalTags] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [showAutoComplete, show] = useState(false)
  const [filteredTags, setFilteredTags] = useState([]);
  const illustrationTags = useAppSelector(getTags);
  const inputRef = useRef(null);

  useEffect(() => {
    setLoading(true)
    api.get('/tags', '').then(tags => {
      setLocalTags(tags);
      dispatch(setTags(defaultValue))
      setLoading(false)
    });
  }, [])

  const search = (event: ChangeEvent<HTMLInputElement>) => {
    // Timeout to emulate a network connection

    let _filteredTags;
    show(true)
    // console.log(event.target.value)
        if (!event.target.value.trim().length) {
            _filteredTags = [...tags];
        }
        else {
            _filteredTags = tags.filter((tag) => {
                return tag.name.toLowerCase().startsWith(event.target.value.toLowerCase());
            });
          }
          setFilteredTags(_filteredTags);
  }

  const handleTagAutoCompleteClicked = (event: MouseEvent<HTMLDivElement, MouseEvent>) => {
    console.log("tag clicked", event.target.innerText)

    show(false)
    // @ts-ignore
    inputRef.current.value = ''
    dispatch(addTag({ name: event.target.innerText }))
  }

  const handleTagRemove = (name: string) => {
    dispatch(removeTag(name.trim()))
  }

  if (isLoading) return <p>Loading Tags...</p>

  return (
    <>
    <div className=' text-white content-center text-sm flex flex-wrap mt-2 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'>
      {illustrationTags && illustrationTags.map((tag, index) => {
        return <>
        <div
          key={index}
          className="inline-flex items-center px-2 py-1 ml-2 mb-2 text-sm font-medium text-sky-800 bg-sky-100 rounded dark:bg-sky-900 dark:text-sky-300"
          >
          {tag.name}
          <XMarkIcon onClick={e => handleTagRemove(tag.name)} className='ml-1 w-3.5 h-3.5 bg-sky-100' aria-hidden="true" />
          </div>
          </>
      })}
      <input
        name='tags'
        placeholder='Add New Tag...'
        className='clear-left ml-1 px-2 text-sky-900'
        autoComplete='off'
        onChange={e => search(e)}
        onBlur={() => show(false)}
        ref={inputRef}
      />

    </div>
      {showAutoComplete && filteredTags.map((tag: tagType) => {
        return <div className='bg-sky-300 p-2 m-1 text-white rounded-md z-10' onClick={e => handleTagAutoCompleteClicked(e)}>{tag.name}</div>
      })}
      </>
  )
}
