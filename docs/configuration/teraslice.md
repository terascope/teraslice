---
title: Teraslice Configuration
sidebar_label: Teraslice
---

This entails information on how to set your configuration for teraslice itself. You may either set a config.json or config.yaml file at the root of teraslice or pass in the config file at startup time with the -c flag and the path to the file

Example Config

```json
{
  "teraslice": {
    "master": true,
    "network_timeout": 20000,
    "master_hostname": "SomeIP",
    "name": "teracluster",
    "assets_directory": "/Some/path/to/assets_ops",
    "workers": 8,
    "shutdown_timeout": 60000
  },
  "terafoundation": {
    "environment": "development",
    "logging": "elasticsearch",
    "log_path": "/some/path/to/logs",
    "log_level": [{console: "warn"},{elasticsearch: "info"}]
    "connectors": {
      "elasticsearch": {
        "default": {
          "host": [
            "127.0.0.1:9200"
          ],
          "keepAlive": true,
          "maxRetries": 5,
          "maxSockets": 20
        }
      },
      "mongo": {
        "default": {
          "host": "127.0.0.1",
          "mock": false
        }
      }
    }
  }
}

```

The configuration file essentially has two main fields, configuration for teraslice and for terafoundation which is a module that sits below it. terafoundation handles clustering/worker creation, general errors and database connection instantiation


## teraslice

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
assets_directory | 'path/to/directory', to look for more custom readers and processors. Usually this is where you place your custom code not part of core, unless you want to leave your code in place. | String | optional
action_timeout | time in milliseconds for waiting for a action ( pause/stop job, etc) to complete before throwing an error | Number | optional, defaults to 300000 ms
network_latency_buffer | time in milliseconds buffer which is combined with action_timeout to determine how long the cluster master will wait till it throws an error | Number | optional, defaults to 15000 ms
worker_disconnect_timeout | time in milliseconds that the slicer will wait after all workers have disconnected before terminating the job | Number | optional, defaults to 300000 ms or 5 minutes
node_disconnect_timeout | time in milliseconds that the cluster  will wait untill it drops that node from state and attempts to provision the lost workers | Number | optional, defaults to 300000 ms or 5 minutes
shutdown_timeout | time in milliseconds, to allow workers and slicers to finish operations before forcefully shutting down when a shutdown signal occurs| Number | optional, defaults to 60 seconds (60000 ms)
hostname | IP or hostname for server | String | required, this is used to identify your nodes
workers | This represents the maximum number of workers that is node is permitted to make, must be set to a number greater than zero. This is currently hard set, and to change this number it must require a reboot and configuration change | Number | optional, defaults to the amount of cpu cores your system is running on
master | determine if cluster_master should live on this node | Boolean| optional, defaults to false,
master_hostname | hostname where the cluster_master resides, used to notify all node_masters where to connect | String | required, defaults to 'localhost'
port | port for the cluster_master to listen on, this is the port that is exposed externally for the api | Number | optional, defaults to 5678
name | Name for the cluster itself, its used for naming log files/indices | String | defaults to 'teracluster',
state | Elasticsearch cluster where job state, analytics and logs are stored | Object | optional, defaults to {connection: 'default'},
slicer_port_range | range of ports that slicers will use per node | String | optional, defaults to range: '45678:46678'
slicer_allocation_attempts | The number of times a slicer will try to be allocated before failing | Number | optional, defaults to 3

### terafoundation

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
log_path | Path to where you would like to store logs pertaining to jobs as well as system logs | String | optional, defaults to the executing directory
environment | Set to either development or production, in development logs are sent to the console, while in production they are written to file located within the dir you specify at log_path| String | defaults to development
connectors | List of all databases used and connection configurations  | Object | required
logging | an array of options to specify which logging functionality to use, options: ['console', 'file', 'elasticsearch'], respectively sends logging to all those locations |  Array | optional, defaults to ['console'], if environment is set to production, it will ignore console and add file
log_level | what level of logs should be shown or saved. possible values: trace, debug, info, warn, error, fatal. if value is a string, all logging function will use that, if you specify an array then you make customize what level of logs go where. example of array => [{console: 'warn'}, {elasticsearch: 'info'}] | String or Array | optional, defaults to "info"
log_buffer_limit | the number of logs stored in the ringbuffer on the logger before sent, logging must have elasticsearch set as a value for this to take effect | Number | optional, defaults to  30
log_buffer_interval | interval (number in milliseconds) that the log buffer will send up its logs to elasticsearch if its enabled, used to prevent hanging logs of different services if they haven't hit the limit | Number | optional, default to 60000m which is one minute

##### connectors #####

The connectors is an object whose keys correspond to supported databases. Those keys should be set to an object which holds
endpoints, allowing you to specify multiple connections and connection configurations for each database.

For Example

```json
"connectors": {
      "elasticsearch": {
        "default": {
          "host": [
            "127.0.0.1:9200"
          ],
          "keepAlive": false,
          "maxRetries": 5,
          "maxSockets": 20
        },
        "secondary": {
          "host": [
             "someOtherIP:9200"
          ],
          "keepAlive": true,
          "maxRetries": 8,
          "maxSockets": 30
        }
      },
      "statsd": {
        "default": {
          "host": "127.0.0.1",
          "mock": false
        }
      },
      "mongodb": {
        "default": {
          "servers": "mongodb://localhost:27017/test"
        }
      },
      "redis": {
        "default": {
          "host": "127.0.0.1"
        }
      }
    }
```

In this example we specify four different connections: elasticsearch, statsd, mongod, and redis. We follow an idiom of naming the primary endpoint for each of them to be called `default`. Within each endpoint you may create custom configurations that will be validated against the defaults specified in node_modules/terafoundation/lib/connectors. As noted above, in elasticsearch there is the `default` endpoint and the `secondary` endpoint which connects to a different elasticsearch cluster each having different configurations. These different endpoints can be retrieved through terafoundations's api.

# Configuration Single Node / Cluster Master

Teraslice requires a configuration file in order to run. The configuration file defines your service connections and system level configurations.

This configuration example defines a single connection to Elasticsearch on localhost with 8 workers available to Teraslice.

The cluster configuration defines this node as a master node. The node will still have workers
available and this configuration is sufficient to do useful work if you don't have multiple
nodes available. The workers will connect to the master on localhost and do work just as if they were in a real cluster.


```yaml
teraslice:
    workers: 8
    master: true
    master_hostname: "127.0.0.1"
    name: "teracluster"

terafoundation:
    environment: 'development'
    log_path: '/path/to/logs'

    connectors:
        elasticsearch:
            default:
                host:
                    - "localhost:9200"
```

# Configuration Cluster Worker Node

Configuration for a worker node is very similar. You just set 'master' to false and provide the IP address where the master node can be located.

```yaml
teraslice:
    workers: 8
    master: false
    master_hostname: "YOUR_MASTER_IP"
    name: "teracluster"

terafoundation:
    environment: 'development'
    log_path: '/path/to/logs'

    connectors:
        elasticsearch:
            default:
                host:
                    - "YOUR_MASTER_IP":9200
```
