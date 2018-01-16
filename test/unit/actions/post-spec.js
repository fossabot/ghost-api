'use strict';
const modulePath = ('../../../lib/actions/post');
const sinon = require('sinon');
const expect = require('chai').expect;

const post = require(modulePath);

describe('Unit:Action > Post', function () {
	it('exports the proper methods', function () {
		expect(post).to.be.an('object');
		expect(post.create).to.be.a('function');
		expect(post.update).to.be.a('function');
		expect(post.delete).to.be.a('function');
	});

	it('[create] calls makeRequest', function () {
		const context = {makeRequest: sinon.stub()};
		const postObj = {
			testing: true,
			data: 'yes'
		}
		post.create.call(context, postObj);
		expect(context.makeRequest.calledOnce).to.be.true;
		expect(context.makeRequest.getCall(0).args[0]).to.equal('post.create');
		expect(context.makeRequest.getCall(0).args[1]).to.deep.equal(postObj);
	});
	it('[delete] calls makeRequest', function () {
		const context = {makeRequest: sinon.stub()};
		const postObj = {
			testing: true,
			data: 'yes'
		}
		post.delete.call(context, postObj);
		expect(context.makeRequest.calledOnce).to.be.true;
		expect(context.makeRequest.getCall(0).args[0]).to.equal('post.delete');
		expect(context.makeRequest.getCall(0).args[1]).to.deep.equal(postObj);
	});
	it('[update] calls makeRequest', function () {
		const context = {makeRequest: sinon.stub()};
		const postObj = {
			testing: true,
			data: 'yes'
		}
		post.update.call(context, postObj);
		expect(context.makeRequest.calledOnce).to.be.true;
		expect(context.makeRequest.getCall(0).args[0]).to.equal('post.update');
		expect(context.makeRequest.getCall(0).args[1]).to.deep.equal(postObj);
	});
});
