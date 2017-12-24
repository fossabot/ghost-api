'use strict';
const modulePath = ('../../lib/token-manager');
const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();

const TokenManager = require(modulePath);
const GhostInstance = require('../../lib');

const instance = new GhostInstance({
	url: 'https://ghost.local',
	user: 'you@example.com',
	pass: 'P@SSW0rd!',
	client: 'your-awesome-app',
	secret: 'randomletters'
});


function generatePostProxy(resolves = true) {
	const postStub = sinon.stub()[resolves ? 'resolves' : 'rejects']();
	const proxyOpts = {'./post': postStub};
	const TokenManager = proxyquire(modulePath, proxyOpts);
	return {
		tm: new TokenManager(instance),
		stub: postStub
	};
}

describe('Unit:GhostInstance', function () {
	it('requires a ghost instance to construct', function () {
		try {
			/* eslint-disable no-unused-vars */
			const tm = new TokenManager();
			/* eslint-enable no-unused-vars */
		} catch (error) {
			expect(error).to.be.ok;
			expect(error.message).to.equal('BAD_GHOST_INSTANCE');
		}
	});

	it('can construct', function () {
		const tm = new TokenManager(instance);
		expect(tm.instance instanceof GhostInstance).to.be.true;
		expect(Date.now() > tm.expires).to.be.true;
	});

	it('[initialize] sets state and logs in', function () {
		const login = sinon.stub();
		const tm = new TokenManager(instance);
		tm.login = login;

		expect(tm.initialized).to.not.be.ok;

		tm.initialize();

		expect(tm.initialized).to.be.true;
		expect(login.calledOnce).to.be.true;
	});

	it('[login] logs in and updates tokens', function () {
		const proxiedPost = generatePostProxy();
		const tm = proxiedPost.tm;
		const postStub = proxiedPost.stub;
		const updateStub = sinon.stub().resolves();

		tm.updateTokens = updateStub;

		return tm.login().then(() => {
			expect(postStub.calledOnce).to.be.true;
			const accessRequest = postStub.getCall(0).args[1];
			expect(accessRequest).to.be.ok;
			expect(accessRequest.grant_type).to.equal('password');
			expect(accessRequest.username).to.equal(instance.user);
			expect(accessRequest.password).to.equal(instance.pass);
			expect(accessRequest.client_id).to.equal(instance.client);
			expect(accessRequest.client_secret).to.equal(instance.secret);
			expect(updateStub.calledOnce).to.be.true;
		});
	});

	describe('[refresh]', function () {
		it('initializes if not already done', function () {
			const initializeStub = sinon.stub();
			const tm = new TokenManager(instance);
			tm.initialize = initializeStub;

			tm.refresh();

			expect(initializeStub.calledOnce).to.be.true;
		});

		it('doesn\'t fetch a new token when it has a good one', function () {
			const tokenStub = sinon.stub().returns(true);
			const tm = new TokenManager(instance);
			tm.initialized = true;
			tm.accessToken = 'sUpeRseCuReToKeN';
			tm.tokenIsValid = tokenStub;

			return tm.refresh().then((token) => {
				expect(tokenStub.calledOnce).to.be.true;
				expect(token).to.be.ok;
				expect(token).to.equal('sUpeRseCuReToKeN');
			});
		});

		it('destroys bad tokens and gets new ones when needed', function () {
			const proxiedPost = generatePostProxy();
			const tm = proxiedPost.tm;
			const postStub = proxiedPost.stub;
			const destroyStub = sinon.stub().resolves();
			const updateStub = sinon.stub().resolves();

			tm.initialized = true;
			tm.tokenIsValid = () => false;

			tm.destroyAccessToken = destroyStub;
			tm.refresh_token = 'longerLasting';
			tm.updateTokens = updateStub;

			return tm.refresh().then(() => {
				expect(destroyStub.calledOnce).to.be.true;
				expect(postStub.calledOnce).to.be.true;
				const accessRequest = postStub.getCall(0).args[1];
				expect(accessRequest).to.be.ok;
				expect(accessRequest.grant_type).to.equal('refresh_token');
				expect(accessRequest.refresh_token).to.equal('longerLasting');
				expect(updateStub.calledOnce).to.be.true;
			});
		});
	});

	it('[updateTokens] updates access and response tokens', function () {
		const tm = new TokenManager(instance);
		const ctx = {};
		const res = {
			access_token: 'access_granted',
			refresh_token: 'please_sir_can_I_have_some_more',
			// This isn't random, it's supposed to negate the 1 second delay
			expires_in: 1
		};

		return tm.updateTokens.call(ctx, res).then((res) => {
			expect(res).to.be.ok;
			expect(res).to.equal('access_granted');
			expect(ctx.accessToken).to.equal(res);
			expect(ctx.refreshToken).to.equal('please_sir_can_I_have_some_more');
			expect(ctx.expires <= Date.now()).to.be.true;
		});
	});

	it('[getToken] refreshes and returns access token', function () {
		const tm = new TokenManager(instance);
		tm.accessToken = 'access_granted';
		tm.refresh = sinon.stub().resolves();

		return tm.getToken().then((token) => {
			expect(tm.refresh.calledOnce).to.be.true;
			expect(token).to.equal('access_granted');
		});
	});

	describe('[destroySingleToken]', function () {
		let proxiedPost, tm, postStub;

		beforeEach(function () {
			proxiedPost = generatePostProxy();
			tm = proxiedPost.tm;
			postStub = proxiedPost.stub;
		});

		it('Returns when invalid token is sent', function () {
			return tm.destroySingleToken(null, 'access_granted').then(() => {
				expect(postStub.calledOnce).to.be.false;
			});
		});

		it('Returns when invalid access token is sent', function () {
			return tm.destroySingleToken('a_token', null).then(() => {
				expect(postStub.calledOnce).to.be.false;
			});
		});

		it('Sends the request when everything is proper', function () {
			return tm.destroySingleToken('a_token', 'access_granted').then(() => {
				expect(postStub.calledOnce).to.be.true;
				const request = postStub.getCall(0).args;
				expect(request[0]).to.be.ok;
				expect(request[1]).to.be.ok;
				expect(request[1].token).to.be.ok;
				expect(request[2]).to.be.ok;
				expect(request[2].authorization).to.be.ok;
				expect(request[1].token).to.equal('a_token');
				expect(request[2].authorization).to.equal('Bearer access_granted');
			});
		});
	});

	describe('[destruct]', function () {
		let tm, stubs;

		beforeEach(function () {
			stubs = {destroy: sinon.stub().resolves()};
			tm = new TokenManager(instance)
			tm.accessToken = 'access_granted';
			tm.refreshToken = 'longerLasting';
			tm.destroySingleToken = stubs.destroy;
		});

		it('deletes refresh token', function () {
			return tm.destruct().then(() => {
				expect(stubs.destroy.calledTwice).to.be.true;
				const firstCall = stubs.destroy.getCall(0).args[0];
				const secondCall = stubs.destroy.getCall(1).args[0];
				expect(firstCall).to.equal('longerLasting');
				expect(secondCall).to.equal('access_granted');
			});
		});

		it('attempts to get an access token if needed', function () {
			const ctx = {
				destroySingleToken: stubs.destroy,
				accessToken: null,
				unsetAccess: sinon.stub(),
				refreshToken: 'longerLasting'
			};
			stubs.login = sinon.stub().callsFake(() => {
				ctx.refreshToken = 'nowLongerLasting';
				return Promise.resolve('new_access');
			});
			ctx.login = stubs.login;

			return tm.destruct.call(ctx).then(() => {
				expect(stubs.destroy.calledThrice).to.be.true;
				expect(stubs.login.calledOnce).to.be.true;
				const expected = [
					['longerLasting', 'new_access'],
					['nowLongerLasting', 'new_access'],
					['new_access', 'new_access']
				];
				expected.forEach((expected, index) => {
					expect(stubs.destroy.getCall(index).args).to.deep.equal(expected);
				});
			});
		});

		it('handles server errors', function () {
			const destroyStub = sinon.stub().rejects('SERVER_ERR');
			const unsetStub = sinon.stub();
			tm.destroySingleToken = destroyStub;
			tm.unsetAccess = unsetStub;

			return tm.destruct().then(() => {
				expect(destroyStub.calledTwice).to.be.true;
				expect(unsetStub.calledOnce).to.be.true;
			});
		});

		it('passes unknown errors through', function () {
			const destroyStub = sinon.stub().rejects('too_fast');
			const unsetStub = sinon.stub();
			const ctx = {
				destroySingleToken: destroyStub,
				unsetAccess: unsetStub,
				accessToken: 'access_granted'
			};

			return tm.destruct.call(ctx).then(() => {
				expect(false, 'Promise should have rejected').to.be.true;
			}).catch((done) => {
				expect(done).to.equal('too_fast');
				expect(destroyStub.calledOnce).to.be.true;
				expect(unsetStub.calledOnce).to.be.false;
			});
		});
	});

	it('[unsetAccess] deletes access token', function () {
		const tm = new TokenManager(instance);
		const ctx = {accessToken: 'access_granted'};
		tm.unsetAccess.call(ctx);
		expect(ctx.accessToken).to.not.be.ok;
	});

	describe('[destroyAccessToken]', function () {
		let tm;

		beforeEach(function () {
			tm = new TokenManager(instance);
		});

		it('resets when accesToken doesn\'t exist', function () {
			const ctx = {expires: 1000};
			return tm.destroyAccessToken.call(ctx).then(() => {
				expect(ctx.expires).to.equal(0);
			});
		});

		it('calls destroySingleToken', function () {
			const destroyStub = sinon.stub().resolves();
			const ctx = {
				accessToken: 'access_granted',
				destroySingleToken: destroyStub
			};

			return tm.destroyAccessToken.call(ctx).then(() => {
				expect(destroyStub.calledOnce).to.be.true;
				const args = destroyStub.getCall(0).args;
				expect(args[0]).to.equal('access_granted');
				expect(args[1]).to.equal('access_granted');
			});
		});

		it('handles server errors', function () {
			const destroyStub = sinon.stub().rejects('SERVER_ERR');
			const unsetStub = sinon.stub();
			const ctx = {
				destroySingleToken: destroyStub,
				unsetAccess: unsetStub,
				accessToken: 'access_granted'
			};

			return tm.destroyAccessToken.call(ctx).then(() => {
				expect(destroyStub.calledOnce).to.be.true;
				expect(unsetStub.calledOnce).to.be.true;
			});
		});

		it('passes unknown errors through', function () {
			const destroyStub = sinon.stub().rejects('too_fast');
			const unsetStub = sinon.stub();
			const ctx = {
				destroySingleToken: destroyStub,
				unsetAccess: unsetStub,
				accessToken: 'access_granted'
			};

			return tm.destroyAccessToken.call(ctx).then(() => {
				expect(false, 'Promise should have rejected').to.be.true;
			}).catch((done) => {
				expect(done).to.equal('too_fast');
				expect(destroyStub.calledOnce).to.be.true;
				expect(unsetStub.calledOnce).to.be.false;
			});
		});
	});

	describe('[tokenIsValid]', function () {
		let tm, clock;

		beforeEach(function () {
			tm = new TokenManager(instance);
			clock = sinon.useFakeTimers();
			tm.expires = Date.now() + 2000;
		});

		afterEach(function () {
			clock.restore();
		});

		it('Works under normal conditions', function () {
			let isValid = tm.tokenIsValid(1000);
			expect(isValid).to.be.true;
			isValid = tm.tokenIsValid(2000);
			expect(isValid).to.be.true;
			isValid = tm.tokenIsValid(2001);
			expect(isValid).to.be.false;
		});

		it('Handles negative offsets', function () {
			let isValid = tm.tokenIsValid(-1000);
			expect(isValid).to.be.true;
			isValid = tm.tokenIsValid(-2000);
			expect(isValid).to.be.true;
			isValid = tm.tokenIsValid(-2001);
			expect(isValid).to.be.false;
		});
	});

	it('[urlFor] defaults to instance', function () {
		const initialFunct = instance.urlFor;
		const stub = sinon.stub();
		instance.urlFor = stub;

		const tm = new TokenManager(instance);

		tm.urlFor('test');

		instance.urlFor = initialFunct;
		expect(stub.calledOnce).to.be.true;
	});

	it('[validate] checks token validity', function () {
		const tm = new TokenManager(instance);
		const stub = sinon.stub().returns(false);
		tm.tokenIsValid = stub;

		const state = tm.validate();
		expect(stub.calledOnce).to.be.true;
		expect(state).to.equal('INVALID_TOKEN');

		tm.tokenIsValid = () => true;
		expect(tm.validate()).to.be.true;
	});
});
