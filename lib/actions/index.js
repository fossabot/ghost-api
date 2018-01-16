'use strict';

const Promise = require('bluebird');
const got = require('got');
const ver = require('../../package').version;

function makeRequest(key, payload = {}) {
	function addAuthHeaders(options, privateAuth) {
		if (!privateAuth) {
			options.body.client_id = this.id;
			options.body.client_secret = this.secret;
			return Promise.resolve(options);
		} else {
			return this.getAuthHeader()
				.then((header) => {
					options.headers.authorization = header;
					return options;
				});
		}
	}

	const options = {
		json: true,
		form: true,
		headers: {
			'user-agent': `ghost-api/${ver} https://github.com/hexrweb/ghost-api`
		}
	};
	const endpoint = this.endpoint(key);

	if (!endpoint.path) {
		return Promise.reject('INVALID_KEY');
	}

	endpoint.path = this.urlFor(key);
	let promise;

	(endpoint.replace || []).forEach((variable) => {
		if (payload[variable]) {
			// The url has already been resolved -> {} are encoded
			const regex = new RegExp(`%7B${variable}%7D`,'gi');
			console.log(regex);
			endpoint.path = endpoint.path.replace(regex, payload[variable]);
			delete payload[variable];
		} else {
			promise = Promise.reject(`MISSING_ENDPOINT_VARIABLE{${variable}}`);
		}
	});

	if (promise) {
		return promise;
	}

	options.method = endpoint.method;
	// @todo: add validations to payload
	options.body = payload;

	return addAuthHeaders.call(this, options, endpoint.private)
		.then(() => Promise.resolve(got(endpoint.path, options)));
}

module.exports = {
	makeRequest: makeRequest,
	post: require('./post')
};
