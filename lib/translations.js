'use strict';

const blos = require('./data/translations');
module.exports = function translateError(error, data = {}) {
	error = error.split('{')[0];
	if (blos[error]) {
		let errorText = blos[error];
		for (const key in data) {
			if (data.hasOwnProperty(key) && data[key]) {
				const rx = new RegExp(`{${key}}`,'g');
				errorText = errorText.replace(rx, data[key]);
			}
		}
		return errorText;
	}
	return blos.NO_TRANSLATION + ' ' + error;
}
