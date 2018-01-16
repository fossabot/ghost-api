'use strict';
const modulePath = ('../../../lib/actions');
const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();

const action = require(modulePath);
const GI = require('../../../lib');

function stubGot(stub) {
	return proxyquire(modulePath, {got: stub});
}

describe('Unit:Action', function () {
	it('exports the proper methods', function () {
		expect(action).to.be.ok;
		expect(Object.keys(action).length).to.equal(2);
		expect(action.makeRequest).to.be.a('function');
		expect(action.post).to.be.an('object');
		expect(action.post.create).to.be.a('function');
		expect(action.post.update).to.be.a('function');
		expect(action.post.delete).to.be.a('function');
	});

	describe('makeRequest', function () {
		let context, stubs, makeRequest;

		beforeEach(function () {
			stubs = {
				url: sinon.stub(),
				got: sinon.stub().resolves(),
				auth: sinon.stub().callsFake(() => Promise.resolve('_token_'))
			};
			makeRequest = stubGot(stubs.got).makeRequest;
			context = {
				url: 'https://ghost.blog',
				endpoint: GI.prototype.endpoint,
				urlFor: GI.prototype.urlFor,
				getAuthHeader: stubs.auth
			};
		});

		it('Fails with unknown endpoints', function () {
			return makeRequest.call(context, 'post').then(() => {
				expect(false, 'Promise should have rejected').to.be.true;
			}).catch((error) => {
				expect(error).to.equal('INVALID_KEY');
			});
		});

		it('Fails with missing variables', function () {
			return makeRequest.call(context, 'post.update').then(() => {
				expect(false, 'Promise should have rejected').to.be.true;
			}).catch((error) => {
				expect(error).to.equal('MISSING_ENDPOINT_VARIABLE{id}');
			});
		});

		it('Replaces variables properly', function () {
			return makeRequest.call(context, 'post.delete', {
				id: 'delete-me',
				data: 'yes',
				test: 'yes',
				leave: 'no'
			}).then(() => {
				const reqURL = 'https://ghost.blog/ghost/api/v0.1/' +
					'posts/delete-me';
				const expectedBody = {
					data: 'yes',
					test: 'yes',
					leave: 'no'
				}
				expect(stubs.got.calledOnce).to.be.true;
				expect(stubs.got.getCall(0).args[0]).to.equal(reqURL);
				const gotOpts = stubs.got.getCall(0).args[1];
				expect(gotOpts).to.be.ok;
				expect(gotOpts.method).to.equal('delete');
				expect(gotOpts.body).to.exist;
				expect(gotOpts.body).to.deep.equal(expectedBody);
			});
		});

		it('Adds authorization header for private endpoints', function () {
			return makeRequest.call(context, 'post.create').then(() => {
				expect(stubs.auth.calledOnce).to.be.true;
				expect(stubs.got.calledOnce).to.be.true;
				const gotOpts = stubs.got.getCall(0).args[1];
				expect(gotOpts).to.be.ok;
				expect(gotOpts.headers).to.exist;
				expect(gotOpts.headers.authorization).to.equal('_token_');
			});
		});

		it('Adds authorization for public endpoints', function () {
			context.id = 'CLIENT_SECRET';
			context.secret = 'CLIENT_ID';
			return makeRequest.call(context, 'post.browse').then(() => {
				expect(stubs.auth.called).to.be.false;
				expect(stubs.got.calledOnce).to.be.true;
				const gotOpts = stubs.got.getCall(0).args[1];
				expect(gotOpts).to.be.ok;
				expect(gotOpts.body).to.exist;
				expect(gotOpts.body.client_id).to.equal('CLIENT_SECRET');
				expect(gotOpts.body.client_secret).to.equal('CLIENT_ID');
			});
		});
	});
});
