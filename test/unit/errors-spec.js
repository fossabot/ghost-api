'use strict';
const modulePath = ('../../lib/errors');
const expect = require('chai').expect;

const errors = require(modulePath);

describe('Unit:Errors', function () {
	describe('[handleServerError]', function () {
		it('resolves by default', function () {
			return errors.handleServerError()('SERVER_ERR')
				.then((err) => {
					expect(err).to.not.exist;
				});
		});

		it('calls provided callback by default', function (cb) {
			function done(err) {
				expect(err).to.not.exist;
				cb();
			}
			return errors.handleServerError(done)('SERVER_ERR');
		});

		it('looks at core message', function () {
			return errors.handleServerError()('SERVER_ERR{500}')
				.then((err) => {
					expect(err).to.not.exist;
				});
		});
	});
});
