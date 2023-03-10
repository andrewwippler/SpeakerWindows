import React, { Component } from 'react';

import { connect } from 'react-redux';
import { withRouter } from 'next/router';

import { getIllustrations } from '../../redux/tag/actions'

class TagPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      illustrations: null
    }
  }

  render() {
    return (
      <div>
        {this.props.illustrations}
      </div>
    )
  }
}

// used to fetch initial props on build
TagPage.getStaticProps = async ({ store, query }) => {
  // Call an external API endpoint to get posts.

  const promises = [

    store.dispatch(getIllustrations()),
  ]

  await Promise.all(promises);

  return {};
};


const mapStateToProps = state => ({
 illustrations: state.illustrations
});

const mapDispatchToProps = dispatch => ({
  getIllustrations: (data) => dispatch(getIllustrations(data)),
});


export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TagPage));
