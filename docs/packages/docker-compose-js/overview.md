---
title: Docker Compose JS
sidebar_label: docker-compose-js
---

> Node.js driver for controlling docker-compose testing environments.

This is a simple API wrapper for the docker-compose command line tool. Its primary purpose is to allow integration tests written in node.js to dynamically manipulate the docker-compose environment.

A larger example of the API used in this way is available in the [integration tests](https://github.com/terascope/teraslice-integration-tests) for the [Teraslice project](https://github.com/terascope/teraslice)

## Installation

```bash
# Using pnpm
pnpm add @terascope/docker-compose-js
# Using npm
npm install --save  @terascope/docker-compose-js
```

## Usage

The API largely just mirrors the regular docker-compose commands such as up(), down(), start(), stop() and so on. At the present time all commands except 'logs' and 'events' have been implemented.

The examples below show the common patterns for calls. Since this is a wrapper around the standard docker-compose command details on each operation can be found [in the docker-compose documentation](https://docs.docker.com/compose/reference/).

Note: Each function takes an object for keyword parameters as the last argument.

```js
const { Compose } = require('@terascope/docker-compose-js');

new Compose('docker-compose.yaml').up()
    .then(function() {
        return compose.stop('test');
    })
    .then(function() {
        return compose.kill('test', { s: 'SIGINT' });
    })
    .then(function() {
        return compose.ps();
    })
    .then(console.log)
    .catch(function(error) {
        console.error(error);
    })
    .then(function() {
        return compose.down();
    });
```

Example of scaling a particular task

```js
const { Compose } = require('@terascope/docker-compose-js');

new Compose('docker-compose.yaml').up()
    .then(function(result) {
        return compose.scale('test=2');
    })
    .then(function() {
        return compose.ps();
    })
    .then(console.log)
    .catch(function(error) {
        console.log(error);
    })
    .then(function() {
        return compose.down();
    })
```
