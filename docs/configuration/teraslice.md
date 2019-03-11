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

|                      Field                      |                Type                |          Default           |                                                                 Description                                                                  |
| :---------------------------------------------: | :--------------------------------: | :------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------: |
|               **action_timeout**                |              `Number`              |          `300000`          |                  time in milliseconds for waiting for a action ( pause/stop job, etc) to complete before throwing an error                   |
|               **analytics_rate**                |              `Number`              |          `60000`           |                                           Rate in ms in which to push analytics to cluster master                                            |
|              **assets_directory**               |              `String`              |      `"$PWD/assets"`       |                                                         directory to look for assets                                                         |
|                **assets_volume**                |              `String`              |             -              |                                                      name of shared asset volume (k8s)                                                       |
|             **autoload_directory**              |              `String`              |     `"$PWD/autoload"`      |                                     directory to look for assets to auto deploy when teraslice boots up                                      |
|            **cluster_manager_type**             |     `"native"`, `"kubernetes"`     |         `"native"`         |                                                determines which cluster system should be used                                                |
|                     **cpu**                     |              `Number`              |             -              |                                         number of cpus to reserve per teraslice worker in kubernetes                                         |
|                  **hostname**                   |              `String`              |        `"$HOST_IP"`        |                                                          IP or hostname for server                                                           |
|     **index_rollover_frequency.analytics**      | `"daily"`, `"monthly"`, `"yearly"` |        `"monthly"`         |                                               How frequently the analytics indices are created                                               |
|       **index_rollover_frequency.state**        | `"daily"`, `"monthly"`, `"yearly"` |        `"monthly"`         |                                            How frequently the teraslice state indices are created                                            |
| **index_settings.analytics.number_of_replicas** |              `Number`              |            `1`             |                                                The number of replicas for the analytics index                                                |
|  **index_settings.analytics.number_of_shards**  |              `Number`              |            `5`             |                                                 The number of shards for the analytics index                                                 |
|  **index_settings.assets.number_of_replicas**   |              `Number`              |            `1`             |                                                 The number of replicas for the assets index                                                  |
|   **index_settings.assets.number_of_shards**    |              `Number`              |            `5`             |                                                  The number of shards for the assets index                                                   |
| **index_settings.execution.number_of_replicas** |              `Number`              |            `1`             |                                                The number of replicas for the execution index                                                |
|  **index_settings.execution.number_of_shards**  |              `Number`              |            `5`             |                                                 The number of shards for the execution index                                                 |
|   **index_settings.jobs.number_of_replicas**    |              `Number`              |            `1`             |                                                  The number of replicas for the jobs index                                                   |
|    **index_settings.jobs.number_of_shards**     |              `Number`              |            `5`             |                                                   The number of shards for the jobs index                                                    |
|   **index_settings.state.number_of_replicas**   |              `Number`              |            `1`             |                                                  The number of replicas for the state index                                                  |
|    **index_settings.state.number_of_shards**    |              `Number`              |            `5`             |                                                   The number of shards for the state index                                                   |
|         **kubernetes_config_map_name**          |              `String`              |    `"teraslice-worker"`    |                                  Specify the name of the Kubernetes ConfigMap used to configure worker pods                                  |
|              **kubernetes_image**               |              `String`              |  `"terascope/teraslice"`   |                             Specify a custom image name for kubernetes, this only applies to kubernetes systems                              |
|        **kubernetes_image_pull_secret**         |              `String`              |             -              |                                 Name of Kubernetes secret used to pull docker images from private repository                                 |
|            **kubernetes_namespace**             |              `String`              |        `"default"`         |                                Specify a custom kubernetes namespace, this only applies to kubernetes systems                                |
|                   **master**                    |             `Boolean`              |          `false`           |                                      boolean for determining if cluster_master should live on this node                                      |
|               **master_hostname**               |              `String`              |       `"localhost"`        |                         hostname where the cluster_master resides, used to notify all node_masters where to connect                          |
|                   **memory**                    |              `Number`              |             -              |                                       memory, in bytes, to reserve per teraslice worker in kubernetes                                        |
|                    **name**                     |        `elasticsearch_Name`        |      `"teracluster"`       |                                      Name for the cluster itself, its used for naming log files/indices                                      |
|           **network_latency_buffer**            |              `Number`              |          `15000`           | time in milliseconds buffer which is combined with action_timeout to determine how long the cluster master will wait till it throws an error |
|           **node_disconnect_timeout**           |              `Number`              |          `300000`          |       time in milliseconds that the cluster  will wait untill it drops that node from state and attempts to provision the lost workers       |
|             **node_state_interval**             |              `Number`              |           `5000`           |                         time in milliseconds that indicates when the cluster master will ping nodes for their state                          |
|                    **port**                     |               `port`               |           `5678`           |                                                   port for the cluster_master to listen on                                                   |
|                  **reporter**                   |              `String`              |             -              |                                                          not currently operational                                                           |
|              **shutdown_timeout**               |              `Number`              |          `60000`           |                   time in milliseconds, to allow workers and slicers to finish operations before forcefully shutting down                    |
|         **slicer_allocation_attempts**          |              `Number`              |            `3`             |                                     The number of times a slicer will try to be allocated before failing                                     |
|              **slicer_port_range**              |              `String`              |      `"45679:46678"`       |                                                range of ports that slicers will use per node                                                 |
|               **slicer_timeout**                |              `Number`              |          `180000`          |                       time in milliseconds that the slicer will wait for worker connection before terminating the job                        |
|                    **state**                    |              `Object`              | `{"connection":"default"}` |                                     Elasticsearch cluster where job state, analytics and logs are stored                                     |
|          **worker_disconnect_timeout**          |              `Number`              |          `300000`          |                time in milliseconds that the slicer will wait after all workers have disconnected before terminating the job                 |
|                   **workers**                   |              `Number`              |            `4`             |                                                         Number of workers per server                                                         |




### terafoundation

|              Field               |                Type                |     Default     |                                                              Description                                                              |
| :------------------------------: | :--------------------------------: | :-------------: | :-----------------------------------------------------------------------------------------------------------------------------------: |
|         **environment**          |              `String`              | `"development"` |                       If set to `production`, console logging will be disabled and logs will be sent to a file                        |
|     **log_buffer_interval**      |              `Number`              |     `60000`     |                                 How often the log buffer will flush the logs (number in milliseconds)                                 |
|       **log_buffer_limit**       |              `Number`              |      `30`       | Number of log lines to buffer before sending to elasticsearch, logging must have elasticsearch set as a value for this to take effect |
|        **log_connection**        |              `String`              |   `"default"`   |                                   logging connection endpoint if logging is saved to elasticsearch                                    |
| **log_index_rollover_frequency** | `"daily"`, `"monthly"`, `"yearly"` |   `"monthly"`   |                                              How frequently the log indices are created                                               |
|          **log_level**           |              `String`              |    `"info"`     |                                                        Default logging levels                                                         |
|           **log_path**           |              `String`              |    `"$PWD"`     |                                  Directory where the logs will be stored if logging is set to `file`                                  |
|           **logging**            |              `Array`               |   `"console"`   |                   Logging destinations. Expects an array of logging targets. options: console, file, elasticsearch                    |
|           **workers**            |              `Number`              |       `4`       |                                                     Number of workers per server                                                      |


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
