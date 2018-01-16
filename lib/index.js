'use strict';
// const debug = require('debug')('ghost-api:ghost-instance');
const url = require('url');
const logger = require('./logger');
const translate = require('./translations');
const actions = require('./actions');

class GhostInstance {
	constructor(options = {}) {
		// TokenManager and GhostInstance have somewhat of a circular dependency.
		// TokenManager needs to generate GhostInstance specific API urls, so it
		// requires an instantiated GhostInstance, and GhostInstance needs to use
		// TokenManager to maintain usable tokens. If we were to require this
		// library at the beginning, GhostInstance wouldn't be fully exported,
		// making the usage-check of TokenManager's constructor not be feasible.
		// Therefore, TokenManager is required here, when GhostInstance is cached.
		const TokenManager = require('./token-manager');
		this.url = options.url;
		this.user = options.user || options.username;
		this.pass = options.pass || options.password;
		this.client = options.client;
		this.secret = options.secret;
		this.token = new TokenManager(this);

		if (this.url && url.parse(this.url).protocol === 'http:') {
			logger.warn(translate('SUGGEST_SSL', {url: this.url}));
		}
	}

	// Retrieve URL path for API endpoints
	endpoint(e) {
		let value = GhostInstance.endpoints;
		const paths = e.split('.');
		paths.forEach((path) => {
			value = value[path] || {};
		});

		if (typeof value === 'object') {
			if (value.path) {
				value = Object.assign({}, value);
			} else {
				value = {};
			}
		}

		return value;
	}

	// Generate full url to perform an API action
	urlFor(action) {
		const endpoint = this.endpoint(action);

		if (endpoint.path) {
			return url.resolve(this.url, endpoint.path);
		}

		return url.resolve(this.url, endpoint.toString());
	}

	// Retrieve valid auth header
	getAuthHeader() {
		return this.token.getToken().then((token) => `Bearer ${token}`);
	}

	// Retrieve API token from ghost instance
	getToken() { return this.token.getToken(); }

	// Check data and make sure it's usable
	validate() {
		// Validate blog url
		const parts = url.parse(this.url);
		if (!(parts.protocol && parts.host)) {
			return new Error('INVALID_URL');
		}

		// Validate email (super basic, dependency free)
		if (this.user === undefined ||
			this.user === '' ||
			this.user.indexOf('@') <= 0 ||
			this.user.indexOf('.') <= 0) {
			return new Error('INVALID_USER');
		}

		// Validate data that should exist
		const tests = ['pass', 'client', 'secret'];
		let err = false

		tests.forEach((test) => {
			if (this[test] === undefined || this[test] === '') {
				err = err || new Error(`INVALID_${test.toUpperCase()}`);
			}
		});

		// Validate token. Handled by class
		return err || this.token.validate();
	}

	destruct() { return this.token.destruct(); }
}

GhostInstance.prototype.makeRequest = actions.makeRequest;
GhostInstance.prototype.post = actions.post;

const endpointPrefix = '/ghost/api/v0.1';
// @todo: add all the endpoints!
GhostInstance.endpoints = {
	token: {
		create: endpointPrefix + '/authentication/token',
		destroy: endpointPrefix + '/authentication/revoke'
	},
	post: {
		browse: {
			private: false,
			path: endpointPrefix + '/posts',
			method: 'get'
		},
		create: {
			private: true,
			path: endpointPrefix + '/posts',
			method: 'post'
		},
		readId: {
			private: false,
			path: endpointPrefix + '/posts/{id}',
			mathod: 'get',
			replace: ['id']
		},
		update: {
			private: true,
			path: endpointPrefix + '/posts/{id}',
			method: 'put',
			replace: ['id']
		},
		delete: {
			private: true,
			path: endpointPrefix + '/posts/{id}',
			method: 'delete',
			replace: ['id']
		},
		readSlug: {
			private: false,
			path: endpointPrefix + '/posts/slug/{slug}',
			mathod: 'get',
			replace: ['slug']
		}
	}
};

module.exports = GhostInstance;
