'use strict'

const got = require('got');
const debug = require('debug')('ghost-api:post')

function makeRequest(to, body = {}, headers = {}) {
	if (JSON.stringify(body) === '{}') {
		return Promise.reject('NO_REQUEST_BODY');
	}
	return got.post(to, {
		body: body,
		form: true,
		headers: headers
	})
		.then(r => typeof r === 'object' ? r : JSON.parse(r))
		.then(r => Object.assign(r.body, {___ResponseObject: r}))
		.catch((error) => {
			if (!error) {
				return Promise.reject();
			}
			if (error.code === 'ECONNREFUSED') {
				return Promise.reject('SERVER_DED');
			}
			const code = error.statusCode;
			if (code >= 500 && code < 600) {
				return Promise.reject(`SERVER_ERR{${code}}`);
			}
			if (code >= 400 && code < 500) {
				return Promise.reject(`CLIENT_ERR{${code}}`);
			}

			debug('Caught Error');
			if (!code) {
				return Promise.reject(error);
			}
			return Promise.reject(`POST_ERR{${code}}`);
		});
}

module.exports = makeRequest;
