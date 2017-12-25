'use strict'

const got = require('got');

function between(value, lower, upper) {
	return !isNaN(value) &&
		value >= lower &&
		value <= upper;
}

const errors = [{
	name: 'SERVER_DED',
	trueIf: (err) => err.code === 'ECONNREFUSED'
}, {
	name: 'SERVER_ERR{{statusCode}}',
	trueIf: (err) => between(err.statusCode, 500, 599),
	replace: ['statusCode']
}, {
	name: 'CLIENT_ERR{{statusCode}}',
	trueIf: (err) => between(err.statusCode, 400, 499),
	replace: ['statusCode']
}];

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
		.catch((error = '') => {
			let retVal = false;
			errors.forEach((tester) => {
				if (!retVal && tester.trueIf(error)) {
					retVal = tester.name;
					(tester.replace || []).forEach((key) => {
						const toReplace = new RegExp(`{${key}}`,'g');
						retVal = retVal.replace(toReplace, error[key]);
					});
				}
			});
			retVal = retVal ||
				(error.statusCode ?
					`POST_ERR{${error.statusCode}}` :
					error)
			return Promise.reject(retVal);
		});
}

module.exports = makeRequest;
