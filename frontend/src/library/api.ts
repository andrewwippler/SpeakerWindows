import { selectToken } from '@/features/user/reducer';
import { useAppSelector, useAppDispatch } from '@/hooks'
import store from '@/store';

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
};



class Api {
  headers() {
    return Object.assign({}, defaultHeaders,
        ({'Authorization': 'Bearer ' + store.getState().user.apitoken}));
  }

  get(route: string, params: any) {
    return this.xhr(route, params, 'GET');
  }

  patch(route: string, params: any) {
    return this.xhr(route, params, 'PATCH');
  }

  put(route: string, params: any) {
    return this.xhr(route, params, 'PUT');
  }

  post(route: string, params: any) {
    return this.xhr(route, params, 'POST');
  }

  delete(route: string, params: any) {
    return this.xhr(route, params, 'DELETE');
  }

  postMultipart(route: string, params: any) {
    return this.xhrMulti(route, params);
  }

  async xhrMulti(route: string, params: any) {
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

  async xhr(route: string, params: any, verb: string) {
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

  getQuery(params: any) {
    return Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
  }

  async getAuthorizationHeader() {
    return `Bearer ${store.getState().user.apitoken}`;
  }
}

export default new Api();
