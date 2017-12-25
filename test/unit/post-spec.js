'use strict';
const modulePath = ('../../lib/post');
const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();

const post = require(modulePath);

function makeProxy(opts) {
	return proxyquire(modulePath, opts);
}

describe('Unit:Post', function () {
	it('requires a form body', function () {
		return post('google').then(() => {
			expect(false, 'Promise should have rejected').to.be.true;
		}).catch((err) => {
			expect(err).to.exist;
			expect(err).to.equal('NO_REQUEST_BODY');
		});
	});

	it('sends the big three options', function () {
		const gotStub = sinon.stub().callsFake((url, opt) => {
			try {
				expect(url).to.equal('google');
				expect(opt.body).to.exist;
				expect(opt.body.test).to.equal('yes');
				expect(opt.form).to.be.true;
				expect(opt.headers).to.deep.equal({});
				return Promise.resolve({body: {}});
			} catch (err) {
				return Promise.reject(err);
			}
		});
		const post = makeProxy({got: {post: gotStub}});
		return post('google', {test: 'yes'});
	});

	it('passes original response object', function () {
		const gotStub = sinon.stub().resolves({body: {value: 'test'}, real: 'yes'});
		const post = makeProxy({got: {post: gotStub}});
		return post('google', {test: 'yes'}).then((res) => {
			expect(res).to.be.ok;
			expect(res.value).to.equal('test');
			expect(res.___ResponseObject).to.exist;
			expect(res.___ResponseObject.real).to.equal('yes');
			expect(res.___ResponseObject.body.value).to.equal(res.value);
		});
	});

	it('passes bad errors through', function () {
		const gotStub = sinon.stub().returns(Promise.reject());
		const post = makeProxy({got: {post: gotStub}});
		return post('google', {test: 'yes'}).then(() => {
			expect(false, 'Promise should have rejected').to.be.true;
		}).catch((err) => {
			expect(err).to.not.be.ok;
		});
	});

	it('unable to connect error works', function () {
		const err = new Error('0 means off');
		err.code = 'ECONNREFUSED';
		const gotStub = sinon.stub().rejects(err);
		const post = makeProxy({got: {post: gotStub}});
		return post('google', {test: 'yes'}).then(() => {
			expect(false, 'Promise should have rejected').to.be.true;
		}).catch((err) => {
			expect(err).to.be.ok;
			expect(err).to.equal('SERVER_DED');
		});
	});

	it('server errors work', function () {
		const err = new Error('This is why you CI');
		err.statusCode = 505;
		const gotStub = sinon.stub().rejects(err);
		const post = makeProxy({got: {post: gotStub}});
		return post('google', {test: 'yes'}).then(() => {
			expect(false, 'Promise should have rejected').to.be.true;
		}).catch((err) => {
			expect(err).to.be.ok;
			expect(err).to.equal('SERVER_ERR{505}');
		});
	});

	it('server errors work', function () {
		const err = new Error('Gaah typo!');
		err.statusCode = 404;
		const gotStub = sinon.stub().rejects(err);
		const post = makeProxy({got: {post: gotStub}});
		return post('google', {test: 'yes'}).then(() => {
			expect(false, 'Promise should have rejected').to.be.true;
		}).catch((err) => {
			expect(err).to.be.ok;
			expect(err).to.equal('CLIENT_ERR{404}');
		});
	});

	it('knows a POST error when it sees one', function () {
		const err = new Error('Glitch in the matrix');
		err.statusCode = 600;
		const gotStub = sinon.stub().rejects(err);
		const post = makeProxy({got: {post: gotStub}});
		return post('google', {test: 'yes'}).then(() => {
			expect(false, 'Promise should have rejected').to.be.true;
		}).catch((err) => {
			expect(err).to.be.ok;
			expect(err).to.equal('POST_ERR{600}');
		});
	});

	it('passes unknown errors through', function () {
		const err = new Error('Server too hot');
		const gotStub = sinon.stub().rejects(err);
		const post = makeProxy({got: {post: gotStub}});
		return post('google', {test: 'yes'}).then(() => {
			expect(false, 'Promise should have rejected').to.be.true;
		}).catch((err) => {
			expect(err).to.be.ok;
			expect(err.message).to.equal('Server too hot');
		});
	});
});
