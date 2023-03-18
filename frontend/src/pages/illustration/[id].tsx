import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect } from 'react'
import Link from 'next/link';
// import Illustration from '@/components/illustration';
import Layout from '@/components/Layout';
import useUser from '@/library/useUser';
import { ClipboardDocumentListIcon, ArrowLeftIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAppSelector, useAppDispatch } from '@/hooks'
import { selectModal, setModal } from '@/features/modal/reducer'
import { setFlashMessage } from '@/features/flash/reducer'

export default function IllustrationWrapper() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useUser({
    redirectTo: '/login',
  })

  // console.log(router.query, name)
  const [illustration, setData] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (!router.query.id) {
      return
    }
    api.get(`/illustration/${router.query.id}`, '')
      .then(data => {
        // todo fix validation if state is not there
      setData(data);
      setLoading(false)
    });
  },[router.query.id])

  if (isLoading) return <Layout>Loading...</Layout>

// https://stackoverflow.com/a/43467144
  function isValidHttpUrl(string: string) {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

  const handleDelete = () => {
    console.log('handle delete')
    // delete illustration
    api.delete(`/illustration/${illustration.id}`, '')
    .then(data => {
      dispatch(setModal(false))
      // dispatch(setFlash({message: 'something', type: 'good, bad, etc'}))
      dispatch(setFlashMessage({severity: 'danger', message: `Illustration: "${illustration.title}" was deleted.`}))
      router.back()
      // setData(data);

  });
  };

  return (
  <Layout>
      <div className="p-4 bg-gray-50 columns-1 md:columns-2">
        <div>
          <span className="font-bold pr-2">Title:</span>
          {illustration.title ? illustration.title : 'Default Title'}
        </div>
        <div>
          <span className="font-bold pr-2">Author:</span>
          {illustration.author ? illustration.author : 'Default Title'}
        </div>
        <div>
          <span className="font-bold pr-2">Source:</span>
          {illustration.source ?
            isValidHttpUrl(illustration.source) ? <Link href={illustration.source}>{illustration.source}</Link> : illustration.source
           : 'Default Title'}
        </div>
        <div>
          <span className="font-bold pr-2">Tags:</span>
          {illustration.tags ? illustration.tags.map((tag, index, arr) => (
            <Link key={index} className="inline-block mr-2 text-sky-500" href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}{index != (arr.length-1) ? ', ' : ''}</Link>
          ))
          : 'no tags'}
    </div>
      </div>
      <div className="columns-1">
    {illustration.content && <button type="button" data-toggle="tooltip" data-placement="bottom" title="Copy to clipboard"
      className="group relative flex w-full justify-center px-4 py-2 my-2 font-semibold text-sm bg-gray-300 hover:bg-gray-500 text-white rounded-md shadow-sm"
      onClick={() => { navigator.clipboard.writeText(illustration.content) }}><ClipboardDocumentListIcon className="h-4 w-4 mr-2" /> <span>Copy</span></button>}
    <div className="columns-1">
    {illustration.content ? illustration.content : 'Default Title'}
    </div>

        <div className="columns-1 pt-2">
        <button
        className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-cyan-300 hover:bg-cyan-500 text-white rounded-full inline-flex items-center shadow-sm"
        onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />Back
      </button>
          <button onClick={() => router.back()} className='px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-300 hover:bg-green-500 text-white rounded-full shadow-sm inline-flex items-center' >
            <PencilSquareIcon className="h-4 w-4 mr-2" />Edit Illustration</button>
          <ConfirmDialog handleAgree={handleDelete} title={illustration.title} deleteName="Illustration" />
          <button onClick={() => dispatch(setModal(true))} className='px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-red-300 hover:bg-red-500 text-white rounded-full shadow-sm inline-flex items-center'>
            <TrashIcon className="h-4 w-4 mr-2" />Delete Illustration</button>
        </div>
    </div>
 {/*
    <div className="row">
      <div className="col-sm-12" id="illustrationPlaces">
        <h3>Illustration Usage:</h3>
        {/* <% unless @places.empty? %>
          <% @places.each do |p| %>
            <% unless p.place.blank? %><%= p.place %>, <% end %><% unless p.location.blank? %><%= p.location %> - <% end %><% unless p.used.blank? %><%= p.used.strftime("%m/%d/%Y") %><% end %>
          <% end %>
        <% end %> */}
       {/* </div>

          <div className="col-sm-4">
          {/* <%= form_with(model: Place, id: :places_form) do |form| %> */}
         {/*     <input type="hidden" value="<%= @illustration.id %>" name="place[illustration_id]">
            <div className="form-group">
              {/* <%= form.text_field :place, id: :place_place, class: "form-control", placeholder: "Place" %> */}
          {/*    </div>
          </div>
          <div className="col-sm-4">
            <div className="form-group">
              {/* <%= form.text_field :location, id: :place_location, class: "form-control", placeholder: "Location" %> */}
       {/*       </div>
          </div>
          <div className="col-sm-4">
            <div className="form-group">
              {/* <%= form.text_field :used, id: :place_used, class: "form-control", value: Time.now.strftime("%m/%d/%Y")  %> */}
       {/*       </div>
          </div>
          <div className="col-sm-12">
            <div className="form-group">
              <button id="add_place" className="btn btn-success"><i className="fa fa-plus"></i> Add Place</button>
            </div>
          </div>
          {/* <% end %>

    </div>*/}
  </Layout>
  )
}
