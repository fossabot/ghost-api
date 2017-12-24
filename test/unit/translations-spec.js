'use strict';
const modulePath = ('../../lib/translations');
const expect = require('chai').expect;
const proxy = require('proxyquire').noCallThru();

const translations = {
	Translations: 'Are',
	PRETTY: 'Great',
	you: 'See!',
	is_real: 'Wow, {name} is real',
	NO_TRANSLATION: 'Great'
};
const translate = proxy(modulePath, {'./data/translations': translations});

describe('Unit:Translations', function () {
	it('handles unknown keys', function () {
		expect(translate('api')).to.equal('Great api');
	});

	it('general use cases work', function () {
		expect(translate('you')).to.equal('See!');
		expect(translate('Translations')).to.equal('Are');
		expect(translate('PRETTY')).to.equal('Great');
	});

	it('replaces variables', function () {
		expect(translate('is_real', {name: 'HexR'})).to.equal('Wow, HexR is real');
		expect(translate('is_real', {name: false})).to.equal('Wow, {name} is real');
	});
});
