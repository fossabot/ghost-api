'use strict'

const got = require('got');
const Promise = require('bluebird');

function between(value, lower, upper) {
	return !isNaN(value) &&
		value >= lower &&
		value <= upper;
}

const errors = {
	http: [{
		name: 'SERVER_ERR{{statusCode}}',
		trueIf: (err) => between(err.statusCode, 500, 599),
		replace: ['statusCode']
	}, {
		name: 'CLIENT_ERR{{statusCode}}',
		trueIf: (err) => between(err.statusCode, 400, 499),
		replace: ['statusCode']
	}]
};

function makeRequest(to, body = {}, headers = {}) {
	if (JSON.stringify(body) === '{}') {
		return Promise.reject('NO_REQUEST_BODY');
	}
	return Promise.resolve(got.post(to, {
		body: body,
		form: true,
		json: true,
		headers: headers
	}))
		.then(r => Object.assign(r.body, {___ResponseObject: r}))
		.catch({name: 'HTTPError'}, error => {
			let retVal = false;
			errors.http.forEach((tester) => {
				if (!retVal && tester.trueIf(error)) {
					retVal = tester.name;

					tester.replace.forEach((key) => {
						const toReplace = new RegExp(`{${key}}`,'g');
						retVal = retVal.replace(toReplace, error[key]);
					});
				}
			});

			if (!retVal) {
				retVal = `POST_ERR{${error.statusCode}}`
			}

			return Promise.reject(retVal);
		})
		.catch({name: 'RequestError'}, error =>
			Promise.reject(error.code === 'ECONNREFUSED' ? 'SERVER_DED' : error));
}

module.exports = makeRequest;
