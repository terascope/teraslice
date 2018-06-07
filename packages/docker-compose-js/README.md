# docker-compose-js - Javascript API for docker-compose

This is a simple API wrapper for the docker-compose command line tool. Its primary purpose is to allow integration tests written in node.js to dynamically manipulate the docker-compose environment.

A larger example of the API used in this way is available in the [integration tests](https://github.com/terascope/teraslice-integration-tests) for the [Teraslice project](https://github.com/terascope/teraslice)

## Installation

```
npm install docker-compose-js
```

## Usage

The API largely just mirrors the regular docker-compose commands such as up(), down(), start(), stop() and so on. At the present time all commands except 'logs' and 'events' have been implemented.

The API is Promise based using the Bluebird promises library.

The examples below show the common patterns for calls. Since this is a wrapper around the standard docker-compose command details on each operation can be found [in the docker-compose documentation](https://docs.docker.com/compose/reference/).

Note: Each function takes an object for keyword parameters as the last argument.

```
var compose = require('docker-compose-js')('docker-compose.yaml');

compose.up()
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
        console.log(error);
    })
    .finally(function() {
        compose.down();
    })
```

Example of scaling a particular task

```
var compose = require('docker-compose-js')('docker-compose.yaml');

compose.up()
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
    .finally(function() {
        return compose.down();
    })
```
