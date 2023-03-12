import fetch from 'node-fetch';
import { getCookie } from './helpers/session';

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

class Api {
  headers() {
    return Object.assign({}, defaultHeaders,
        ({'Authorization': process.env.NEXT_PUBLIC_AUTHORIZATION}));
  }

  get(route, params) {
    return this.xhr(route, params, 'GET');
  }

  patch(route, params) {
    return this.xhr(route, params, 'PATCH');
  }

  put(route, params) {
    return this.xhr(route, params, 'PUT');
  }

  post(route, params) {
    return this.xhr(route, params, 'POST');
  }

  delete(route, params) {
    return this.xhr(route, params, 'DELETE');
  }

  postMultipart(route, params) {
    return this.xhrMulti(route, params);
  }

  async xhrMulti(route, params) {
    let options = {
      method: 'POST',
      headers: {
        'X-Authorization': await this.getAuthorizationHeader()
      }
    }

    options.body = new FormData();

    for (let key in params) {

      // for file uploads
      if (key === 'files') {
        params[key].forEach((file, i) => {
          options.body.append(`file[${i}]`, file);

        });
      } else {
        options.body.append(key, params[key]);
      }
    }
    const url = `${process.env.NEXT_PUBLIC_HOST_URL}${route}`;

    return fetch(url, options)
      .then(resp => {
        let json = resp.json();
        if (resp.ok) {
          return json;
        }
        return json.then(err => {
          throw err;
        });
      })
      .then(json => {
        return json;
      });
  }

  async xhr(route, params, verb) {
    let options = Object.assign({ method: verb });
    options.headers = this.headers();
    options.headers['X-Authorization'] = await this.getAuthorizationHeader();
    params = params ? params : {};

    let query, url;
    if (verb === 'GET') {
      query = this.getQuery(params);
      (!query) ? url = `${process.env.NEXT_PUBLIC_HOST_URL}${route}` : url = `${process.env.NEXT_PUBLIC_HOST_URL}${route}?${query}`;
    } else {
      options.body = JSON.stringify(params);
      url = `${process.env.NEXT_PUBLIC_HOST_URL}${route}`;
    }
    return fetch(url, options)
      .then(resp => {
        let json = resp.json();
        if (resp.ok) {
          return json;
        }
        return json.then(err => {
          return err;
        });
      })
      .then(json => {
        return json;
      });
  }

  getQuery(params) {
    return Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
  }

  async getAuthorizationHeader() {
    return `Bearer ${getCookie('token')}`;
  }
}

export default new Api();
