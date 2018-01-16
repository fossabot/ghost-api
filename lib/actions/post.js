'use strict';

function create(postObject) {
	return this.makeRequest('post.create', postObject);
}

function update(postObject) {
	return this.makeRequest('post.update', postObject);
}

function del(postObject) {
	return this.makeRequest('post.delete', postObject);
}

module.exports = {
	create: create,
	update: update,
	delete: del
};
