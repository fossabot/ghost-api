'use strict';
const debug = require('debug')('ghost-api:token-manager');
// This is specifically for token actions; hopefully this will be
// used in the future to test multiple states and make sure tokens
// are properly destroyed. It stands for ghost-api:token-state,
// but since tokens are so long, it's been shortened to g-a:t-s
const logTokenState = require('debug')('g-a:t-s');
const errors = require('./errors');
const post = require('./post');
const GhostInstance = require('.');
const Promise = require('bluebird');

function handleLeakyToken(err) {
	return errors.handleServerError((err) => {
		this.unsetAccess();
		logTokenState('Token Leak Occurred');
		return Promise.resolve(err);
	})(err);
}

class TokenManager {
	constructor(instance) {
		debug('Initializing TokenManager');
		if (!(instance instanceof GhostInstance)) {
			throw new Error('BAD_GHOST_INSTANCE');
		}
		this.instance = instance;
		this.expires = Date.now() - 1000;
	}

	initialize() {
		debug('Initializing TM');
		this.initialized = true;
		return this.login();
	}

	login() {
		debug('Logging in');
		const opts = {
			grant_type: 'password',
			username: this.instance.user,
			password: this.instance.pass,
			client_id: this.instance.client,
			client_secret: this.instance.secret
		};
		return post(this.urlFor('token.create'), opts)
			.then((res) => this.updateTokens(res));
	}

	refresh() {
		debug('Refreshing tokens');
		if (!this.initialized) {
			return this.initialize();
		}
		if (this.tokenIsValid(5000)) {
			return Promise.resolve(this.accessToken);
		}
		return this.destroyAccessToken()
			.then(() => {
				const opts = {
					grant_type: 'refresh_token',
					refresh_token: this.refresh_token
				};
				return post(this.urlFor('token.create'), opts)
			})
			.then(res => this.updateTokens(res));
	}

	updateTokens(response) {
		this.accessToken = response.access_token;
		this.refreshToken = response.refresh_token;
		logTokenState('Created Token', this.accessToken);
		logTokenState('Created Token', this.refreshToken);
		// We don't know when the server responded. We're giving a 1-second
		// buffer for the time in transit + the processing time over here.
		// 1 second should be plenty, since token validity is checked before
		// performing an action with another buffer

		// Access tokens expire based on this value - refresh tokens expire
		// every 6 months
		this.expires = Date.now() + (response.expires_in * 1000) - 1000;
		return Promise.resolve(this.accessToken);
	}

	getToken() { return this.refresh().then(() => this.accessToken); }

	destroySingleToken(token, authToken) {
		if (!token || !authToken) {
			if (token) {
				logTokenState('Failed Destroying Token', token);
			}
			return Promise.resolve();
		}

		logTokenState('Destroyed Token', token);
		const headers = {authorization: `Bearer ${authToken}`}
		return post(this.urlFor('token.destroy'), {token: token}, headers);
	}

	destruct() {
		debug('Destructing instance');
		let state = Promise.resolve();
		let at = this.accessToken
		const dst = this.destroySingleToken;
		const tokensToDelete = [];
		if (this.refreshToken) {
			tokensToDelete.push(this.refreshToken);
		}
		if (!at) {
			state = this.login().then((accessToken) => {
				tokensToDelete.push(this.refreshToken);
				at = accessToken;
			});
		}

		return state.then(() => {
			const chain = Promise.resolve();

			tokensToDelete.forEach((token) => {
				chain.then(() => dst(token, at))
					// These tokens aren't access tokens so
					// there's no housekeeping chores to do
					// - all we know is the token probably
					// wasn't destroyed.
					// @todo @future - possibly try harder
					// to delete bad tokens like this???
					.catch(() => Promise.resolve());
			});

			// This needs to be done last
			return chain.then(() => dst(at, at));
		}).catch((e) => handleLeakyToken.call(this, e));
	}

	// Destroying access tokens is attempted stewardship. We
	// will make an attempt, but if it doesn't succeed we
	// won't try again.
	unsetAccess() { this.accessToken = null; }

	destroyAccessToken() {
		debug('Destroying Access Token');
		if (!this.accessToken) {
			this.expires = 0;
			return Promise.resolve();
		}

		return this.destroySingleToken(this.accessToken, this.accessToken)
			.catch((e) => handleLeakyToken.call(this, e));
	}

	tokenIsValid(offset = 1000) {
		if (offset < 0) {
			offset *= -1;
		}
		const relativeTime = Date.now() + offset;
		return this.expires >= relativeTime;
	}

	urlFor(e) { return this.instance.urlFor(e); }

	validate() {
		debug('Self-Validating')
		return this.tokenIsValid() ? true : 'INVALID_TOKEN';
	}
}

module.exports = TokenManager;
