'use strict';

const Promise = require('bluebird');

// This is a really hacky fix to deal with
// catch predicates in bluebird causing tests
// fail. @todo: refactor as catch predicate and
// make it work with tests
function handleServerError(callbackIfServerError) {
	callbackIfServerError = callbackIfServerError || (() => Promise.resolve());
	return (error) => {
		error = error.toString();
		if (error.split('{')[0] === 'SERVER_ERR') {
			return callbackIfServerError();
		}
		return Promise.reject(error);
	}
}

module.exports = {
	handleServerError: handleServerError
}
