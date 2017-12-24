'use strict';
const got = require('got');

function post(to, payload) {
	return got.post(to, {body: payload, form: true});
}

module.exports = {
	post: post
}
