'use strict';
const modulePath = ('../../lib');
const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();

const GhostInstance = require(modulePath);
const TokenManager = require(`${modulePath}/token-manager`);

describe('Unit:GhostInstance', function () {
	it('empty constructor works', function () {
		const instance = new GhostInstance();
		expect(instance.token instanceof TokenManager).to.be.true;
	});

	it('normal constructor works', function () {
		const testInstance = new GhostInstance({
			url: 'https://test.instance',
			username: 'test',
			password: 'P@SSW0rd!',
			client: 'your-awesome-app',
			secret: 'randomletters'
		});


		expect(testInstance.url).to.equal('https://test.instance');
		expect(testInstance.user).to.equal('test');
		expect(testInstance.pass).to.equal('P@SSW0rd!');
		expect(testInstance.client).to.equal('your-awesome-app');
		expect(testInstance.secret).to.equal('randomletters');
		expect(testInstance.token instanceof TokenManager).to.be.true;
	});

	it('[construct] username and password fallback to short form', function () {
		const shortPass = new GhostInstance({
			username: 'test',
			pass: 'P@SSW0rd!'
		});

		const shortUser = new GhostInstance({
			user: 'testname',
			password: 'P@SSW0Rd!'
		});

		expect(shortPass.user).to.equal('test');
		expect(shortPass.pass).to.equal('P@SSW0rd!');
		expect(shortUser.user).to.equal('testname');
		expect(shortUser.pass).to.equal('P@SSW0Rd!');
	});

	it('[construct] warns when API is accessed over plaintext', function () {
		const warnStub = sinon.stub();
		const proxyOpts = {
			'./logger': {
				warn: warnStub
			},
			'./token-manager': class {}
		}
		const GhostInstance = proxyquire(modulePath, proxyOpts);
		const testInstance = new GhostInstance({url: 'http://test.instance'});

		expect(testInstance.url).to.equal('http://test.instance');
		expect(warnStub.calledOnce).to.be.true;
		expect(warnStub.getCall(0).args[0]).to.match(/http:\/\/test\.instance/);
	});

	it('[endpoint] supports nested values', function () {
		const instance = new GhostInstance();
		const expectedValue = '/ghost/api/v0.1/authentication/revoke';
		expect(instance.endpoint('token.destroy')).to.equal(expectedValue);
	});

	it('[endpoint] supports bad nested request', function () {
		const instance = new GhostInstance();
		expect(instance.endpoint('post')).to.deep.equal({});
	});

	it('[endpoint] can handle nonexistant calls', function () {
		const instance = new GhostInstance();
		const expectedValue = {};
		expect(instance.endpoint('invalid.api.endpoint')).to.deep.equal(expectedValue);
	});

	it('[urlFor] generates correct API url', function () {
		const instance = new GhostInstance({url: 'https://ghost.test'});
		const response = instance.urlFor('token.create');
		const url = 'https://ghost.test/ghost/api/v0.1/authentication/token';
		expect(response).to.equal(url);
	});

	it('[urlFor] handles complex keys', function () {
		const instance = new GhostInstance({url: 'https://ghost.test'});
		const response = instance.urlFor('post.delete');
		const url = 'https://ghost.test/ghost/api/v0.1/posts/{id}';
		expect(decodeURIComponent(response)).to.equal(url);
	});


	it('[getAuthHeader] returns proper header', function () {
		const instance = new GhostInstance({url: 'https://ghost.test'});
		const tokenStub = sinon.stub().resolves('rANdOmLEtTerS')
		instance.token.getToken = tokenStub;

		return instance.getAuthHeader().then((response) => {
			expect(tokenStub.calledOnce).to.be.true;
			expect(response).to.equal('Bearer rANdOmLEtTerS');
		});
	});

	it('[getToken] returns valid token', function () {
		class TokenManager {
			getToken() { return 'sUpeRseCuReToKeN';}
		}
		const proxyOpts = {'./token-manager': TokenManager};
		const GhostInstance = proxyquire(modulePath, proxyOpts);
		const instance = new GhostInstance({url: 'https://ghost.test'});

		expect(instance.getToken()).to.equal('sUpeRseCuReToKeN');
	});

	describe('[validate]', function () {
		it('correctly validates urls', function () {
			const instance = new GhostInstance();
			const cases = [
				['bad', 'INVALID_URL'],
				['http://', 'INVALID_URL'],
				['http://local', 'INVALID_USER'],
				['http://local.host', 'INVALID_USER']
			];

			cases.forEach((cse) => {
				instance.url = cse[0];
				const err = instance.validate();
				expect(err instanceof Error).to.be.true;
				expect(err.message).to.equal(cse[1]);
			});
		});

		it('correctly validates usernames (email)', function () {
			const instance = new GhostInstance();
			instance.url = 'https://ghost.local';
			const cases = [
				['bad', 'INVALID_USER'],
				['http://', 'INVALID_USER'],
				['http://local.host', 'INVALID_USER'],
				['user@', 'INVALID_USER'],
				['user@example', 'INVALID_USER'],
				['user@example.com', 'INVALID_PASS']
			];

			cases.forEach((cse) => {
				instance.user = cse[0];
				const err = instance.validate();
				expect(err instanceof Error).to.be.true;
				expect(err.message).to.equal(cse[1]);
			});
		});

		it('password, client and secret work', function () {
			const instance = new GhostInstance();
			instance.url = 'https://ghost.local';
			instance.user = 'user@example.com';
			const cases = [
				['pass', '', 'INVALID_PASS'],
				['pass', 'P@SSW0rd!', 'INVALID_CLIENT'],
				['client', '', 'INVALID_CLIENT'],
				['client', 'your-awesome-app', 'INVALID_SECRET'],
				['secret', '', 'INVALID_SECRET'],
				['secret', 'randomletters', 'INVALID_TOKEN', true]
			];

			cases.forEach((cse) => {
				instance[cse[0]] = cse[1];
				const err = instance.validate();
				expect(err instanceof Error).to.be[!cse[3]];
				expect(!cse[3] ? err.message : err).to.equal(cse[2]);
			});
		});

		it('checks token validity', function () {
			const validateStub = sinon.stub();
			class TokenManager {}
			TokenManager.prototype.validate = validateStub;

			const proxyOpts = {'./token-manager': TokenManager};
			const GhostInstance = proxyquire(modulePath, proxyOpts);
			const instance = new GhostInstance({
				url: 'https://test.instance',
				username: 'user@example.com',
				password: 'P@SSW0rd!',
				client: 'your-awesome-app',
				secret: 'randomletters'
			});

			const err = instance.validate();

			expect(err).to.not.be.ok;
			expect(validateStub.calledOnce).to.be.true;
		});
	});

	it('[destruct] destroys tokens', function () {
		const destructStub = sinon.stub();
		class TokenManager {}
		TokenManager.prototype.destruct = destructStub;

		const proxyOpts = {'./token-manager': TokenManager};
		const GhostInstance = proxyquire(modulePath, proxyOpts);
		const instance = new GhostInstance();

		instance.destruct();
		expect(destructStub.calledOnce).to.be.true;
	});
});
