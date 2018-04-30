'use strict';
const modulePath = ('../../lib/logger');
const sinon = require('sinon');
const expect = require('chai').expect;
const chalk = require('chalk');

const logger = require(modulePath);

describe('Unit:Logger', function () {
	let sandbox, stdout, stderr;

	beforeEach(function () {
		sandbox = sinon.createSandbox();
		stdout = sandbox.stub(process.stdout,'write');
		stderr = sandbox.stub(process.stderr,'write');
	});

	afterEach(function () {
		sandbox.restore();
		stdout = null;
		stderr = null;
	});

	it('[log] works normally', function () {
		const msg = 'success!';

		logger.log(msg, 'green', false);
		logger.log(msg, 'red', false);
		logger.log(msg, 'blue', false);

		sandbox.restore();
		expect(stdout.calledThrice).to.be.true;
		expect(stderr.called).to.be.false;
		expect(stdout.getCall(0).args[0]).to.equal(`${chalk.green(msg)}\n`);
		expect(stdout.getCall(1).args[0]).to.equal(`${chalk.red(msg)}\n`);
		expect(stdout.getCall(2).args[0]).to.equal(`${chalk.blue(msg)}\n`);
	});

	it('[log] doesn\'t require a color', function () {
		const msg = 'Normal text';

		logger.log(msg);

		sandbox.restore();
		expect(stdout.calledOnce).to.be.true;
		expect(stderr.called).to.be.false;
		expect(stdout.getCall(0).args[0]).to.equal(`${msg}\n`);
	});

	it('[log] will error if requested', function () {
		const msg = 'success!';

		logger.log(msg, 'green', true);
		logger.log(msg, 'blue', true);

		sandbox.restore();
		expect(stderr.calledTwice).to.be.true;
		expect(stdout.called).to.be.false;
		expect(stderr.getCall(0).args[0]).to.equal(`${chalk.green(msg)}\n`);
		expect(stderr.getCall(1).args[0]).to.equal(`${chalk.blue(msg)}\n`);
	});

	it('[warn] logs in yellow', function () {
		logger.warn('test');
		const reality = stdout.getCall(0).args[0]
		const expected = chalk.yellow('test') + '\n';

		sandbox.restore();
		expect(reality).to.be.ok;
		expect(expected).to.equal(reality);
	});

	it('[error] logs in red', function () {
		logger.error('test');
		const reality = stdout.getCall(0).args[0]
		const expected = chalk.red('test') + '\n';

		sandbox.restore();
		expect(reality).to.be.ok;
		expect(expected).to.equal(reality);
	});

	it('[success] logs in green', function () {
		logger.success('test');
		const reality = stdout.getCall(0).args[0]
		const expected = chalk.green('test') + '\n';

		sandbox.restore();
		expect(reality).to.be.ok;
		expect(expected).to.equal(reality);
	});

	it('[info] logs in cyan', function () {
		logger.info('test');
		const reality = stdout.getCall(0).args[0]
		const expected = chalk.cyan('test') + '\n';

		sandbox.restore();
		expect(reality).to.be.ok;
		expect(expected).to.equal(reality);
	});
});
