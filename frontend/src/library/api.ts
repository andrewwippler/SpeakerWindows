import store from '@/store';

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const defaultMultiHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
};

class Api {
  headers() {
    return Object.assign({}, defaultHeaders,
      (
        {
          'Authorization': 'Bearer ' + store.getState().user.apitoken,
          'X-Authorization': 'Bearer ' + store.getState().user.apitoken,
        }
      ));

  }

  multiHeaders() {
    return Object.assign({}, defaultMultiHeaders,
      (
        {
          'Authorization': 'Bearer ' + store.getState().user.apitoken,
          'X-Authorization': 'Bearer ' + store.getState().user.apitoken,
        }
      ));

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
      headers: this.multiHeaders()
    }

    // @ts-ignore
    options.body = new FormData();

    for (let key in params) {

      // for file uploads
      if (key === 'files') {
        // @ts-ignore
        params[key].forEach((file, i) => {
          // @ts-ignore
          options.body.append(`file[${i}]`, file);

        });
      } else {
        // @ts-ignore
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
    params = params ? params : {};

    let query, url;
    if (verb === 'GET') {
      query = this.getQuery(params);
      (!query) ? url = `${process.env.NEXT_PUBLIC_HOST_URL}${route}` : url = `${process.env.NEXT_PUBLIC_HOST_URL}${route}?${query}`;
    } else {
      options.body = JSON.stringify(params);
      // console.log("options body", options)
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

}

// @ts-ignore
export default new Api();
