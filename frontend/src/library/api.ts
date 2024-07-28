import store from '@/store';

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const defaultMultiHeaders = {
  'Accept': 'application/json',
  // 'Content-Type': 'multipart/form-data', //https://stackoverflow.com/a/39281156
};

class Api {
  headers(token: string | undefined) {

    const realToken = token ? token : store.getState().user.apitoken

    return Object.assign({}, defaultHeaders,
      (
        {
          'Authorization': 'Bearer ' + realToken,
          'X-Authorization': 'Bearer ' + realToken,
        }
      ));

  }

  multiHeaders(token: string | undefined) {

    const realToken = token ? token : store.getState().user.apitoken

    return Object.assign({}, defaultMultiHeaders,
      (
        {
          'Authorization': 'Bearer ' + realToken,
          'X-Authorization': 'Bearer ' + realToken,
        }
      ));

  }

  get(route: string, params: any, token: string | undefined) {
    return this.xhr(route, params, 'GET', token);
  }

  patch(route: string, params: any, token: string | undefined) {
    return this.xhr(route, params, 'PATCH', token);
  }

  put(route: string, params: any, token: string | undefined) {
    return this.xhr(route, params, 'PUT', token);
  }

  post(route: string, params: any, token: string | undefined) {
    return this.xhr(route, params, 'POST', token);
  }

  delete(route: string, params: any, token: string | undefined) {
    return this.xhr(route, params, 'DELETE', token);
  }

  postMultipart(route: string, params: any, token: string | undefined) {
    return this.xhrMulti(route, params, token);
  }

  async xhrMulti(route: string, params: any, token: string | undefined) {
    let options = {
      method: 'POST',
      headers: this.multiHeaders(token)
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
    // console.log("api options.body", options.body)

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

  async xhr(route: string, params: any, verb: string, token: string | undefined) {
    let options = Object.assign({ method: verb });
    options.headers = this.headers(token);
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
      }).catch(error => {
        console.log("FETCH ERROR: ", error)
        return error
      });
  }

  getQuery(params: any) {
    return Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
  }

}

// @ts-ignore
export default Api = new Api();
