
import type { AppProps } from 'next/app'

export default function Illustration({ illustration }: AppProps) {

  console.log(illustration);
  return
    <>
    <div className="flex bg-gray-50">
    <div className="col-xs-12 col-sm-6">
      <strong>Title:</strong><br />
      {illustration.title ? illustration.title : 'Default Title'}
    </div>

    {/* <% unless @illustration.author.empty? %> */}
    <div className="col-xs-12 col-sm-6">
      <strong>Author:</strong><br />
      {illustration.author ? illustration.author : 'Default Title'}
    </div>
    {/* <% end %> */}

    {/* <% unless @illustration.source.empty? %> */}
    <div className="col-xs-12 col-sm-6">
      <strong>Source:</strong><br />
      {/* <%= @illustration.source %> */}
    </div>
    {/* <% end %> */}

    <div className="col-xs-12 col-sm-6">
      <strong>Tags:</strong><br />
      {/* <% for index in (@tag_links.count).downto(1) %>
          <%= link_to @tag_links[index-1].name, @tag_links[index-1] %><% unless index == 1 %>, <% end %>
      <% end %> */}
    </div>
    </div>

    <div className="row">
    <div className="col-sm-12">
    <button type="button" data-toggle="tooltip" data-placement="bottom" title="Copy to clipboard"
      className="btn btn-lg btn-secondary btn-block js-copy"><i className="fa fa-copy"></i> Copy</button>
    </div>
    <div className="col-sm-12" id="illustrationContent">
    {/* <%= simple_format @illustration.content %> */}
    </div>

    <div className="col-sm-12">
    {/* <%= link_to 'Back', :back, class: 'btn btn-link' %>
    <%= link_to content_tag(:i, ' Edit Illustration', :class => "fa fa-pencil"), edit_illustration_path(@illustration), class: 'btn btn-success' %>
    <%= link_to content_tag(:i, ' Delete Illustration', :class => "fa fa-trash-o"), illustration_path(@illustration), class: 'btn btn-danger', :method => :delete,  data: {:confirm => 'Delete this illustration?'} %> */}
    </div>
    </div>

    <div className="row">
      <div className="col-sm-12" id="illustrationPlaces">
        <h3>Illustration Usage:</h3>
        {/* <% unless @places.empty? %>
          <% @places.each do |p| %>
            <% unless p.place.blank? %><%= p.place %>, <% end %><% unless p.location.blank? %><%= p.location %> - <% end %><% unless p.used.blank? %><%= p.used.strftime("%m/%d/%Y") %><% end %><br />
          <% end %>
        <% end %> */}
      </div>

          <div className="col-sm-4">
          {/* <%= form_with(model: Place, id: :places_form) do |form| %> */}
            <input type="hidden" value="<%= @illustration.id %>" name="place[illustration_id]">
            <div className="form-group">
              {/* <%= form.text_field :place, id: :place_place, class: "form-control", placeholder: "Place" %> */}
            </div>
          </div>
          <div className="col-sm-4">
            <div className="form-group">
              {/* <%= form.text_field :location, id: :place_location, class: "form-control", placeholder: "Location" %> */}
            </div>
          </div>
          <div className="col-sm-4">
            <div className="form-group">
              {/* <%= form.text_field :used, id: :place_used, class: "form-control", value: Time.now.strftime("%m/%d/%Y")  %> */}
            </div>
          </div>
          <div className="col-sm-12">
            <div className="form-group">
              <button id="add_place" className="btn btn-success"><i className="fa fa-plus"></i> Add Place</button>
            </div>
          </div>
          {/* <% end %> */}

    </div>
  </>


}

