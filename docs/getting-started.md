# Installation

Teraslice is written in Node.js and has been tested on Linux and Mac OS X.

### Dependencies ###
* Node.js 8 or above
* At least one Elasticsearch 5 or above cluster. Elasticsearch 5.x recommended.

### Installing with npm ###

```
npm install terascope/teraslice
```

# Configuration Single Node / Cluster Master

Teraslice requires a configuration file in order to run. The configuration file defines your service connections and system level configurations.

This configuration example defines a single connection to Elasticsearch on localhost with 8 workers available to Teraslice. The *teraslice.ops_directory* setting tells Teraslice where it can find custom operation implementations.

The cluster configuration defines this node as a master node. The node will still have workers
available and this configuration is sufficient to do useful work if you don't have multiple
nodes available. The workers will connect to the master on localhost and do work just as if they were in a real cluster.


```
teraslice:
    ops_directory: '/path/to/ops/'
    workers: 8
    cluster:
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

```
teraslice:
    ops_directory: '/path/to/ops/'
    workers: 8
    cluster:
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

# Running

Once you have Teraslice installed you need a job specification and a configuration file to do something useful with it. See above for simple examples of each.

Starting the Teraslice service on the master node is simple. Just provide it a path to the configuration file.

```
node service.js -c master-config.yaml
```

Starting a worker on a remote node is basically the same.

```
node service.js -c worker-config.yaml
```
