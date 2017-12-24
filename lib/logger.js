'use strict';

const chalk = require('chalk');
/*
 * Logging library influenced by https://git.io/vbw22
*/

function log(message, color, stderr) {
	if (color) {
		message = chalk[color](message);
	}

	const stream = stderr ? 'stderr' : 'stdout';
	process[stream].write(`${message}\n`);
}

/*
 * Wrapper to log something in yellow
*/
function warn(message, stderr) {
	log(message, 'yellow', stderr);
}

/*
 * Wrapper to log something in red
*/
function error(message, stderr) {
	log(message, 'red', stderr);
}

/*
 * Wrapper to log something in green
*/
function success(message, stderr) {
	log(message, 'green', stderr);
}

/*
 * Wrapper to log something in cyan
*/
function info(message, stderr) {
	log(message, 'cyan', stderr);
}

module.exports = {
	log: log,
	warn: warn,
	info: info,
	error: error,
	success: success
};
