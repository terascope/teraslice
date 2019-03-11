# terafoundation

<!-- THIS FILE IS AUTO-GENERATED, EDIT docs/packages/terafoundation/overview.md INSTEAD -->

**NOTE:** This a package within the [Teraslice](https://github.com/terascope/teraslice) monorepo, more documentation can be found [here](https://terascope.github.io/teraslice/docs/).

> Terafoundation

Node.js framework for building clustered servers

Here are a few tasks it can help you with:

  * Managing multiple database connections
  * Framework to create a number of general or special child workers
  * Schema validations for app configurations

### Basic Example

```js
//service.js
var worker = require('./worker');
var foundation = require('terafoundation')({
    name: 'testserver',
    worker: worker
});

//worker.js
module.exports = function(context)
var logger = context.logger
    var count = 0;
    while (true) {
        logger.info(count++)
    }
}
```



## terafoundation call time settings


| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
name | name of application| String | optional, defaults to terafoundation
ops_directory | 'path/to/directory', to look for more custom connectors. Usually this is where you place your custom code not part of core, unless you want to leave your code in place. | String | optional
descriptors | Object listing all the different modules that a child process could run, used when child process will have different behaviors | Object | optional, default to creation of children running the worker module passed in
cluster_name | name of application| String or Function | optional, defaults to terafoundation
script | javascript execution of code | Function | optional
config_schema | system schema for the top level service| Object or Function | optional
plugin_schema |system schema for plugins associated with the top level service |Object or Function | optional
schema_formats | If you have custom formats used for your schema validations you must pass them down | Array | optional, used to add any custom formats for convict validation library
start_workers | By default, the service will attempt to create as many child process as set in the config, if set to false then the top level application will be in charge of when a child process will be created | Boolean | optional, defaults to true
shutdownMessaging | If set to true then it provides a ipc shutdown message so all child process can hook into for custom shutdown. All child process will receive an ipc message of {message: 'shutdown'} | Boolean | optional, defaults to false which in turn cause the main process to call a kill signal "SIGINT"
emitter | you may pass down a node.js event emitter which will emit certain signals to listen on  | function | optional

### Complex example
```js
var foundation = require('terafoundation')({
    name: 'teraslice',
    shutdownMessaging: true,
    worker: worker,
    master: master,
    slicer: slicer,
    assets_loader: assets_loader,
    assets_service: assets_service,
    cluster_master: cluster_master,
    moderator: moderator,
    descriptors: {
        slicer: true,
        worker: true,
        cluster_master: true,
        moderator: true,
        assets_loader: true,
        assets_service: true
    },
    start_workers: false,
    config_schema: config_schema,
    schema_formats: schema_formats,
    ops_directory: ops_directory,
    cluster_name: cluster_name
  });
```
You may pass in multiple different type of child process that behave differently. To use them you must specify them on the descriptors. After this you may create them using `context.foundation.startWorkers` api to create that specific worker type. The descriptor is primarily needed for child worker restarts

#### Schemas
We use the [convict](https://github.com/mozilla/node-convict) library for configuration validations. Any top level program can pass down its schema as the config_schema parameter when instantiating terafoundation

You may reference system_schema at the root of terafoundation for references

#### Context
As noted in the basic example above, all child process will be called with a context which contains configurations and apis

The context is an object with the following keys:
 * `sysconfig` which contains all the fully validated configurations of your entire app
 * `cluster` which is the top level node cluster module used for all child processes
 * `name` which is the top level name of project
 * `cluster_name` which is name to distinguish the cluster
 * `logger` a base top level logger for any logging needs, we use [bunyan](https://github.com/trentm/node-bunyan)
 * `foundation` which contains the api to make a logger, create a database connection, or to make a worker

#### API
The api is located at `context.apis.foundation`:

 * `getConnection` which is used to get a database client.
```js
var client = context.apis.foundation.getConnection({
        type: 'elasticsearch',
        endpoint: default,
        cached: true
      }).client;
```
   In this example, `type` references which type of connector you are using. `Endpoint` references which of the endpoints you will use, and `cached` determines if the same client instance will be returned on subsequent calls.

* `makeLogger` which is used to create a logger

```js
var logger = context.apis.foundation.makeLogger({module: 'worker', slice: '7dj38d'});

```
The object attaches metadata to any of the logs done by the new child logger. This allows more visible logging per action taken or per module

* `startWorkers` which is used to create specific child workers

```js
context.apis.foundation.startWorkers(1, {
    assignment: 'assets_service',
    port: assets_port,
    node_id: context.sysconfig._nodeName
});
```
The first argument is the number of specific workers you are going to make. The second parameter is an object. The key `assignment` must match whats listed in the descriptors listed in the complex terafoundation example above. It allows the system to know what type of child process to create. All keys and values in the object will also by stored in the process environment `process.env` . This allows you to pass a port number, identifier or anything else that the process needs to know before hand to boot up

* `getSystemEvents` which returns the system wide event emitter

```js
var events = context.apis.foundation.getSystemEvents();

events.on('event', function() {
  // do something for this event.
});
```
This allows listening to and emitting events on the system events bus.


## terafoundation configuration

A configuration file may either be a YAML or JSON file. You can pass in the configuration file at run time:
 `node service.js -c config.yaml`
or by having the appropriate configuration file located at the root of your project

```js
/root-app
  /node-modules
    terafoundation
  service.js
  worker.js
  config.yaml
```
or by setting an environmental variable `TERAFOUNDATION_CONFIG` to the configuration file

### Example Config

```yaml
top_root_level_application:
  some: configuration
terafoundation:
  environment: development
  logging: elasticsearch
  log_path: "/some/path/to/logs"
  log_level:
  - console: info
  - elasticsearch: info
  connectors:
    elasticsearch:
      default:
        host:
        - 127.0.0.1:9200
        keepAlive: true
        maxRetries: 5
        maxSockets: 20
      endpoint2:
         host:
         - 127.0.0.1:9215
         keepAlive: true
         maxRetries: 5
         maxSockets: 20
    mongo:
      default:
        host: 127.0.0.1
        mock: false

```

#### Connectors
This is where client config used to set up database connections lives. It is an object with keys set to the different clients and must match the names of the clients listed in connectors/node-modules.

The values are once again objects with keys set to different endpoints within each client. For example in the config above, elasticsearch database has two endpoints listed. The first one is called default which listens to an elasticsearch database on port 9200, and by what its name implies is the endpoint that's used when making a client without specifying an endpoint. The other is endpoint2 which connects to an elasticsearch database on port 9215

Each endpoint will have its own configuration which will then be used by the actual client of the library

### terafoundation configuration settings

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
environment | Set for legacy purposes, if set to production, it will also write logs to file | String | optional, defaults to development
log_path | directory where the logs will be stored if logging is set to file | String | optional, defaults to root of project
logging | a list to where logs will be written to, settings available are ['console', 'file', 'elasticsearch'] | Array of Strings | optional, defaults to ['console']
log_level | this determines what level of logs are shown, options: trace, debug, info, warn , error, fatal | String or Array | optional, defaults to info, if a string is set then all log destinations in logging will use this, you may also customize log levels for each destination: [{console: 'debug'}, {file: 'warn}, {elasticsearch: 'info'}]
log_buffer_limit | the number of logs stored in the ringbuffer on the logger before sent, logging must have elasticsearch set as a value for this to take effect | Number | optional, defaults to 30
log_buffer_interval | interval (number in milliseconds) that the log buffer will send up its logs, this is used if logging is set to use elasticsearch | Number | optional, defaults to 60000 ms
log_connection | logging connection endpoint if logging is saved to elasticsearch, this is only in use if logs are being saved to a DB | String | optional, uses the 'default' endpoint of elasticsearch connectors
connectors | An object containing database client information for you service | Object | required

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[Apache-2.0](./LICENSE) licensed.
