# docker-compose-js - Javascript API for docker-compose

This is a simple API wrapper for the docker-compose command line tool. Its primary purpose is to allow integration tests written in node.js to dynamically manipulate the docker-compose environment.

The API largely just mirrors the regular docker-compose commands such as up(), down(), start(), stop() and so on.

The last parameter to each function is an object for any keyword options.


```
var compose = require('../index')('docker-compose.yaml');

compose.up()
    .then(function(result) {
        console.log(result)
        return compose.stop('test');
    })
    .then(function(result) {
        console.log(result);
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