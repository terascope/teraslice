---
title: Teraslice Configuration
sidebar_label: Overview
---

Teraslice configuration is provided via a YAML configuration file. This file will typically have 2 sections.

1. `terafoundation` - Configuration related to the terafoundation runtime. Most significantly this is where you configure your datasource connectors.
2. `teraslice` - Configuration for the Teraslice node. When deploying a `native` clustering Teraslice you'll have separate configurations for the master and worker nodes. Otherwise a single configuration is all that is required.

The configuration file is provided to the Teraslice process at startup using the `-c` command line option along with the path to the file

#### Example Config

```yaml
terafoundation:
    log_level: info
    connectors:
        elasticsearch-next:
            default:
                node:
                    - "http://localhost:9200"

teraslice:
    workers: 8
    master: true
    master_hostname: 127.0.0.1
    name: teraslice
    hostname: 127.0.0.1

```

## Terafoundation Configuration Reference
NOTE: All `asset_storage` related fields are deprecated. Please use the fields in the teraslice config instead. Also the `asset_storage` fields in the teraslice config will take precedence over the ones that are in terafoundation.

|      Field      |    Type    |     Default     |                                      Description                                      |
| :-------------: | :--------: | :-------------: | :-----------------------------------------------------------------------------------: |
| **connectors** |  `Object`  | none |       Required. An object whose keys are connection types and values are objects describing each connection of that type. See [Terafoundation Connectors](#terafoundation-connectors).        |
| **environment** |  `String`  | `"development"` |       If set to `development` console logging will automatically be turned on.        |
|  **log_level**  |  `String`  |    `"info"`     |                                Default logging levels                                 |
|  **log_path**   |  `String`  |    `"$PWD"`     |          Directory where the logs will be stored if logging is set to `file`          |
|   **logging**   | `String[]` |  `["console"]`  | Logging destinations. Expects an array of logging targets. options: `console`, `file` |
| **prom_metrics_enabled** | `Boolean` |  `false` | Create prometheus exporters. Kubernetes clustering only |
| **prom_metrics_port** | `Number` |  `3333` | Port of prometheus exporter server. Kubernetes clustering only. Metrics will be visible at `http://localhost:<PORT>/metrics` |
| **prom_metrics_add_default** | `Boolean` |  `true` | Display default node metrics in prom exporter. Kubernetes clustering only |
| **prom_metrics_display_url** | `String` |  `""` | Value to display as url label for prometheus metrics |
|   **workers**   |  `Number`  |       `4`       |                             Number of workers per server                              |

## Teraslice Configuration Reference

|                      Field                      |                Type                |          Default           |                                                                 Description                                                                 |
| :---------------------------------------------: | :--------------------------------: | :------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------: |
|               **action_timeout**                |             `duration`             |          `300000`          |              time in milliseconds for waiting for a network message (pause/stop job, etc) to complete before throwing an error              |
|               **analytics_rate**                |             `duration`             |          `60000`           |                                           Rate in ms in which to push analytics to cluster master                                           |
|            **api_response_timeout**             |             `duration`             |          `300000`          |    maximum time, in milliseconds, requests to the teraslice API will wait to complete a response without error (e.g. posting large assets)  |
|              **assets_directory**               |              `String`              |      `"$PWD/assets"`       |                                                        directory to look for assets                                                         |
| **asset_storage_bucket** |  `String` | `ts-assets-<teraslice.name>` |       Name of S3 bucket if using S3 external asset storage.        |
| **asset_storage_connection** |  `String`  | `"default"` |       Name of the connection of `asset_storage_connection_type` where asset bundles will be stored.        |
| **asset_storage_connection_type** |  `String`  | `"elasticsearch-next"` |       Name of the connection type that will store asset bundles. options: `elasticsearch-next`, `s3`.        |
|                **assets_volume**                |              `String`              |             -              |                                                      name of shared asset volume (k8s)                                                      |
|             **autoload_directory**              |              `String`              |     `"$PWD/autoload"`      |                                     directory to look for assets to auto deploy when teraslice boots up                                     |
|            **cluster_manager_type**             |     `"native"`, `"kubernetes", "kubernetesV2"`     |         `"native"`         |                                               determines which cluster system should be used                                                |
|                     **cpu**                     |              `Number`              |             -              |                                        number of cpus to reserve per teraslice worker in kubernetes                                         |
|                  **hostname**                   |              `String`              |        `"$HOST_IP"`        |                                                          IP or hostname for server                                                          |
|     **index_rollover_frequency.analytics**      | `"daily"`, `"monthly"`, `"yearly"` |        `"monthly"`         |                                              How frequently the analytics indices are created                                               |
|       **index_rollover_frequency.state**        | `"daily"`, `"monthly"`, `"yearly"` |        `"monthly"`         |                                           How frequently the teraslice state indices are created                                            |
| **index_settings.analytics.number_of_replicas** |              `Number`              |            `1`             |                                               The number of replicas for the analytics index                                                |
|  **index_settings.analytics.number_of_shards**  |              `Number`              |            `5`             |                                                The number of shards for the analytics index                                                 |
|  **index_settings.assets.number_of_replicas**   |              `Number`              |            `1`             |                                                 The number of replicas for the assets index                                                 |
|   **index_settings.assets.number_of_shards**    |              `Number`              |            `5`             |                                                  The number of shards for the assets index                                                  |
| **index_settings.execution.number_of_replicas** |              `Number`              |            `1`             |                                               The number of replicas for the execution index                                                |
|  **index_settings.execution.number_of_shards**  |              `Number`              |            `5`             |                                                The number of shards for the execution index                                                 |
|   **index_settings.jobs.number_of_replicas**    |              `Number`              |            `1`             |                                                  The number of replicas for the jobs index                                                  |
|    **index_settings.jobs.number_of_shards**     |              `Number`              |            `5`             |                                                   The number of shards for the jobs index                                                   |
|   **index_settings.state.number_of_replicas**   |              `Number`              |            `1`             |                                                 The number of replicas for the state index                                                  |
|    **index_settings.state.number_of_shards**    |              `Number`              |            `5`             |                                                  The number of shards for the state index                                                   |
|         **kubernetes_api_poll_delay**           |             `duration`             |          `1000`            |                                          Specify the delay between attempts to poll the kubernetes API                                      |
|         **kubernetes_config_map_name**          |              `String`              |    `"teraslice-worker"`    |                                 Specify the name of the Kubernetes ConfigMap used to configure worker pods                                  |
|              **kubernetes_image**               |              `String`              |  `"terascope/teraslice"`   |                             Specify a custom image name for kubernetes, this only applies to kubernetes systems                             |
|        **kubernetes_image_pull_secret**         |              `String`              |             -              |                                Name of Kubernetes secret used to pull docker images from private repository                                 |
|            **kubernetes_namespace**             |              `String`              |        `"default"`         |                               Specify a custom kubernetes namespace, this only applies to kubernetes systems                                |
|       **kubernetes_priority_class_name**        |              `String`              |        -                   |                               Priority class that the Teraslice master, execution controller, and stateful workers should run with systems                                |
|                   **master**                    |             `Boolean`              |          `false`           |                                     boolean for determining if cluster_master should live on this node                                      |
|               **master_hostname**               |              `String`              |       `"localhost"`        |                         hostname where the cluster_master resides, used to notify all node_masters where to connect                         |
|                   **memory**                    |              `Number`              |             -              |                                       memory, in bytes, to reserve per teraslice worker in kubernetes                                       |
|                    **name**                     |        `elasticsearch_Name`        |      `"teracluster"`       |                                     Name for the cluster itself, its used for naming log files/indices                                      |
|           **network_latency_buffer**            |             `duration`             |          `15000`           | time in milliseconds buffer which is combined with action_timeout to determine how long a network message will wait till it throws an error |
|           **node_disconnect_timeout**           |             `duration`             |          `300000`          |      time in milliseconds that the cluster  will wait untill it drops that node from state and attempts to provision the lost workers       |
|             **node_state_interval**             |             `duration`             |           `5000`           |                         time in milliseconds that indicates when the cluster master will ping nodes for their state                         |
|                    **port**                     |               `port`               |           `5678`           |                                                  port for the cluster_master to listen on                                                   |
|              **shutdown_timeout**               |             `duration`             |          `60000`           |                   time in milliseconds, to allow workers and slicers to finish operations before forcefully shutting down                   |
|         **slicer_allocation_attempts**          |              `Number`              |            `3`             |                                    The number of times a slicer will try to be allocated before failing                                     |
|              **slicer_port_range**              |              `String`              |      `"45679:46678"`       |                                                range of ports that slicers will use per node                                                |
|               **slicer_timeout**                |             `duration`             |          `180000`          |                       time in milliseconds that the slicer will wait for worker connection before terminating the job                       |
|                    **state**                    |              `Object`              | `{"connection":"default"}` |                                    Elasticsearch cluster where job state, analytics and logs are stored                                     |
|                  **env_vars**                   |              `Object`              |    `{"EXAMPLE":"test"}`    |                                      default environment variables to set on each the teraslice worker                                      |
|          **worker_disconnect_timeout**          |             `duration`             |          `300000`          |                time in milliseconds that the slicer will wait after all workers have disconnected before terminating the job                |
|                   **workers**                   |              `Number`              |            `4`             |                                                        Number of workers per server                                                         |


### Terafoundation Connectors

You use Terafoundation connectors to define how to access your various data sources. Connectors are grouped by type with each each key defining a separate connection name for that type of data source. This allows you to define many connections to different data sources so that you can route data between them. The connection name defined here can then be used in the `connection` attribute provided to processors in your jobs.

For Example

```yaml
# ...
terafoundation:
    # ...
    connectors:
        elasticsearch-next:
            default:
                node:
                    - "http://localhost:9200"
        kafka:
            default:
                brokers: "localhost:9092"
# ...
```

In this example we specify two different connector types: `elasticsearch-next` and `kafka`. Under each connector type you may then create custom endpoint configurations that will be validated against the defaults specified in node_modules/terafoundation/lib/connectors. Each endpoint has independent configuration options.

These different endpoints can be retrieved through terafoundations's connector API. As it's name implies, the `default` connector is what will be provided if a connection is requested without providing a specific name. In general we don't recommend doing that if you have multiple clusters, but it's convenient if you only have one.

The `elasticsearch-next` connector dynamically queries the cluster to verify the version and distribution and returns the appropriate client. It can work with versions 6, 7, 8 and with opensearch.

## Configuration Single Node / Native Clustering - Cluster Master

If you're running a single Teraslice node or using the simple native clustering you'll need a master node configuration.

The master node will still have workers available and this configuration is sufficient to do useful work if you don't yet have multiple nodes available. The workers will connect to the master on localhost and do work just as if they were in a real cluster. Then if you want to add workers you can use the worker configuration below as a starting point on adding more nodes.

```yaml
teraslice:
    workers: 8
    master: true
    master_hostname: "127.0.0.1"
    name: "teracluster"

terafoundation:
    log_path: '/path/to/logs'

    connectors:
        elasticsearch-next:
            default:
                node:
                    - YOUR_ELASTICSEARCH_IP:9200"
```

## Configuration Native Clustering - Worker Node

Configuration for a worker node is very similar. You just set `master` to false and provide the IP address where the master node can be located.

```yaml
teraslice:
    workers: 8
    master: false
    master_hostname: "YOUR_MASTER_IP"
    name: "teracluster"

terafoundation:
    log_path: '/path/to/logs'

    connectors:
        elasticsearch-next:
            default:
                node:
                    - YOUR_ELASTICSEARCH_IP:9200"
```

## Configuration Asset Storage

By default asset bundles are stored in Elasticsearch when uploaded. Defining the `asset_storage_connection_type` will allow Teraslice to store assets in an external storage medium. If using a connection besides `default`, specify it with the `asset_storage_connection` field.

Currently S3 is the only external asset storage type enabled. Use the `asset_storage_bucket` field to specify the S3 bucket where assets will be stored. Assets will be stored in S3 as `<AssetID>.zip` where AssetID is a hash of the zipped asset.

**Note**: All asset metadata will always be stored in Elasticsearch.


```yaml
terafoundation:
    asset_storage_connection_type: s3
    asset_storage_connection: minio1
    asset_storage_bucket: ts-assets
    log_level: info
    connectors:
        elasticsearch-next:
            default:
                node:
                    - "http://localhost:9200"
        s3:
            default:
                endpoint: "http://minio:9000"
                accessKeyId: "minioadmin"
                secretAccessKey: "minioadmin"
                forcePathStyle: true
                sslEnabled: false
                region: "us-east-1"
            minio1:
                endpoint: "http://minio:9000"
                accessKeyId: "minioadmin"
                secretAccessKey: "minioadmin"
                forcePathStyle: true
                sslEnabled: false
                region: "us-east-1"
teraslice:
    workers: 8
    master: true
    master_hostname: 127.0.0.1
    name: teraslice
    hostname: 127.0.0.1
