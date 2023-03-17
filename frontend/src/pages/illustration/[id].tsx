import { useRouter } from 'next/router'
import * as _ from "lodash";
import api from '@/library/api';
import { useState, useEffect } from 'react'
import Link from 'next/link';
// import Illustration from '@/components/illustration';
import Layout from '@/components/Layout';
import useUser from '@/library/useUser';

export default function IllustrationWrapper() {
  const router = useRouter()
  const { user } = useUser({
    redirectTo: '/login',
  })

  // console.log(router.query, name)
  const [illustration, setData] = useState([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (!router.query.id) {
      return
    }
    api.get(`/illustration/${router.query.id}`, '')
      .then(data => {
      console.log(data);
        // todo fix validation if state is not there
      setData(data);
      setLoading(false)
    });
  },[router.query.id])

  if (isLoading) return <div>Loading...</div>

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
          {illustration.source ? illustration.source : 'Default Title'}
        </div>
        <div>
          <span className="font-bold pr-2">Tags:</span>
          {illustration.tags ? illustration.tags.map((tag) => (
                <Link className="inline-block pr-2" href={`/tag/${tag.name.replace(/ /g, "-")}`}>{tag.name}, </Link>
          ))
          : 'no tags'}
    </div>
      </div>
      <div className="row">
    <div className="columns-1">
    {/* <button type="button" data-toggle="tooltip" data-placement="bottom" title="Copy to clipboard"
      className="btn btn-lg btn-secondary btn-block js-copy"><i className="fa fa-copy"></i> Copy</button> */}
    </div>
    <div className="columns-1" id="illustrationContent">
    {illustration.content ? illustration.content : 'Default Title'}
    </div>

        <div className="columns-1 pt-2">
        <button
        className="px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm"
        onClick={() => router.back()}>
          Back
      </button>
        <Link className='px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-green-500 text-white rounded-full shadow-sm' href={`/illustration/${illustration.id}/edit`}>Edit Illustration</Link>
        <Link className='px-4 py-2 mr-4 mt-2 font-semibold text-sm bg-red-500 text-white rounded-full shadow-sm' href={`/illustration/${illustration.id}/delete`}>Delete Illustration</Link>
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
