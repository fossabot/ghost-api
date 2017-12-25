# Ghost-API

[![Build Status](https://travis-ci.org/HexRweb/ghost-api.svg?branch=master)](https://travis-ci.org/HexRweb/ghost-api)
[![Coverage Status](https://coveralls.io/repos/github/HexRweb/ghost-api/badge.svg?branch=master)](https://coveralls.io/github/HexRweb/ghost-api?branch=master)
[![dependencies Status](https://david-dm.org/HexRweb/ghost-api/status.svg)](https://david-dm.org/HexRweb/ghost-api)
[![Maintainability](https://api.codeclimate.com/v1/badges/22530b1725bc84995ec4/maintainability)](https://codeclimate.com/github/HexRweb/ghost-api/maintainability)
[![Code Climate Test Coverage](https://api.codeclimate.com/v1/badges/22530b1725bc84995ec4/test_coverage)](https://codeclimate.com/github/HexRweb/ghost-api/test_coverage)

## Introduction

Ghost-API is a server-side wrapper for the v0.1 API of the popular blogging platform [Ghost](https://github.com/TryGhost/ghost).

## Table 'O Contents

 - [Installation](#installation)
 - [Usage](#usage)
 - [Instance API](#instance-api)
 - [TokenManager API](#tokenmanager-api)
 - [Issues](#issues)
 - [Contributing](#contributing)
 - [Thanks](#thanks)
 - [License](#license)

## Installation

Ghost-API is *not* available on NPM because 1) we want to adhere to [Ghost Trademark Policy](https://ghost.org/trademark) and 2) this package is not complete. That being said, it is still possible to install ghost-api as a dependency

```bash
npm install https://github.com/HexRdesign/ghost-api.git --save
```

## Usage

As of now, Ghost-API is only capable of token-related tasks. More functionality will be added in the future, on an as-needed basis. Ghost-API will follow Ghost node version guidelines starting in April. There is currently support for Node v6 & v8

Requiring the Ghost-API will expose a GhostInstance class. This gives you the ability to easily keep track of multiple Ghost instances that are using the API. To create a GhostInstance,

```javascript
const GhostInstance = require('ghost-api');
const options = {};
const instance = new GhostInstance(options)
```


## Instance API

### `constructor`

The GhostInstance constructor takes an optional object paramater. This parameter should provide 5 key details:

**url** - The HTTP URL of the Ghost Instance

**username** = **user** (user takes precedence) - The email address of the account to login to {url}

**password** = **pass** (pass takes precedence) - The password of the account to login to {url}

**client** - Client ID used to access the API. Found in the `clients` table of a working Ghost instance

**secret** - Client Secret used to access the API. Found in the `clients` table of a working Ghost instance and corresponds to Client ID

<br />

Without these 5 keys, any instance is functionally useless. You can modify any of these values via object assignment (`instance[key] = 'new_value'`).

### `endpoint(e)`

Retrieve an API endpoint. Supports basic object traversal via dot notation (i.e. `token.destroy` will equate to `paths['token']['destroy']`)

Returns a relative URL for existing paths, or an object containing all related paths for non-existent paths

### `urlFor(action)`

Generates an absolute URL for endpoint `action`

### `getToken`

Retrieves a valid oAuth access token for the instance

### `validate`

Verifies the validity of the instance. You should run this before performing any actions to make sure the instance is usable, including the token.

### `destruct`

Destroys the instance. This revokes all known tokens as a courtesy to the Ghost instance.

### `(static) endpoints`

A list of all known and functional endpoints. `GhostInstance.prototype.endpoint` uses this list.

## TokenManager API

TokenManager is responsible for maintaining access and refresh tokens. It has a circular dependency with GhostInstance. While you shouldn't directly access these methods, they are documented for future improvement and feedback. TokenManager, like GhostInstance is a class.

### `constructor`

Takes a required `instance` parameter. Instance _must_ be an instantiated Instance class

### `initialize`

Initializes the TokenManager instance by logging in to the paired instance. Returns a valid access token.

### `refresh`

Refreshes tokens if necessary. Returns a valid access token.

### `updateTokens(response)`

Takes a parameter (`response`) which is a parsed JSON object of the the response body of a POST request to get a token

Updates access and refresh tokens locally, and access token expiry. Returns a valid access token

### `getToken`

Returns a valid access token

### `destroySingleToken(token, auth)`

Attempts to delete `token` from the paired instance. Uses the `auth` token for authentication

### `destruct`

Attempts to destroy all tokens from the paired related that were created by the TokenManager instance

### `unsetAccess`

Overrides the accessToken. This usually occurs when there was an attempt to destroy a token that failed

### `tokenIsValid(offset)`

Takes an optional offset (defaults to 1000) and determines if the access token will be valid within said offset

### `urlFor(e)`

Alias of `this.instance.urlFor(e)`

### `validate`

Ensures the access token is still valid

## Issues

Got an issue? Question? Comment? Concern? Feel free to [create an issue](https://github.com/HexRweb/ghost-api/issues). We'll try and help you out

## Contributing

Want to make Ghost-API better? Great! You're appreciated :smile: Feel free to create a <abbr title='Pull Request'>PR</abbr> with your changes. Please make sure all tests pass (`npm test`), coverage stays high (we'd prefer 100% but it's understandable if that's not possible) and documentation stays useful and relevant.

## Thanks

This project wouldn't have been possible without the existence of the [Ghost Foundation](https://ghost.org) and all of the contributors who make it successful. A lot of the boilerplate code (i.e. package file, tests) was created with influence from the [Ghost CLI](https://github.com/TryGhost/ghost-cli)

## License

This project, just like Ghost, is licensed under the [MIT License](https://github.com/HexRweb/LICENSE)
