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

See 

|      Field      |    [Type](#configuration-formats)    |     Default     |                                      Description                                      |
| :-------------: | :--------: | :-------------: | :-----------------------------------------------------------------------------------: |
| **connectors** |  `Object`  | none |       Required. An object whose keys are connection types and values are objects describing each connection of that type. See [Terafoundation Connectors](#terafoundation-connectors).        |
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
|                    **name**                     |        `elasticsearch_name`        |      `"teracluster"`       |                                     Name for the cluster itself, its used for naming log files/indices                                      |
|           **network_latency_buffer**            |             `duration`             |          `15000`           | time in milliseconds buffer which is combined with action_timeout to determine how long a network message will wait till it throws an error |
|           **node_disconnect_timeout**           |             `duration`             |          `300000`          |      time in milliseconds that the cluster  will wait until it drops that node from state and attempts to provision the lost workers       |
|             **node_state_interval**             |             `duration`             |           `5000`           |                         time in milliseconds that indicates when the cluster master will ping nodes for their state                         |
|                    **port**                     |               `port`               |           `5678`           |                                                  port for the cluster_master to listen on                                                   |
|              **shutdown_timeout**               |             `duration`             |          `60000`           |                   time in milliseconds, to allow workers and slicers to finish operations before forcefully shutting down                   |
|         **slicer_allocation_attempts**          |              `Number`              |            `3`             |                                    The number of times a slicer will try to be allocated before failing                                     |
|              **slicer_port_range**              |              `String`              |      `"45679:46678"`       |                                                range of ports that slicers will use per node                                                |
|               **slicer_timeout**                |             `duration`             |          `180000`          |                       time in milliseconds that the slicer will wait for worker connection before terminating the job                       |
|                    **state**                    |              `Object`              | `{"connection":"default"}` |                                    Opensearch cluster where job state, analytics and logs are stored                                     |
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

These different endpoints can be retrieved through terafoundation's connector API. As it's name implies, the `default` connector is what will be provided if a connection is requested without providing a specific name. In general we don't recommend doing that if you have multiple clusters, but it's convenient if you only have one.

The `elasticsearch-next` connector dynamically queries the cluster to verify the version and distribution and returns the appropriate client. It can work with versions 6, 7, 8 and with opensearch.

View all available configuration settings for `elasticsearch-next` [here](../packages/elasticsearch-store/overview.md#connectors)

Provided here is a list of connectors Terascope actively maintains with references on how to configure them:

- [S3 Connector:](https://github.com/terascope/file-assets/blob/master/README.md#connectors) Supports connecting to various S3 Object stores like AWS and Minio
- [Kafka Connector:](https://github.com/terascope/kafka-assets/blob/master/README.md#connectors) Supports connecting to Kafka

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
                    - YOUR_OPENSEARCH_IP:9200"
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
                    - YOUR_OPENSEARCH_IP:9200"
```

## Configuration Asset Storage

By default asset bundles are stored in opensearch when uploaded. Defining the `asset_storage_connection_type` will allow Teraslice to store assets in an external storage medium. If using a connection besides `default`, specify it with the `asset_storage_connection` field.

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
```

## Configuration Formats

Each configuration property is assigned a format within its schema. Valid formats include:

- javascript types - values will be evaluated against the type's javascript constructor
    - `Boolean`
    - `String`
    - `Number`
    - `Array`
    - `Object`
    - `RegExp`
- `'int'` - an integer
- `'port'` - a number, or string that can be coerced to a number, from 1 to 65535
- `'nat'` - a natural number (integer >= 0)
- `'url'` - a Zod url() compliant string
- `'email'` - a Zod email() compliant string
- `'ipaddress'` - a Zod ipv4() or ipv6() compliant string
- `'*'` - any or no value
- enums - an array of valid values, i.e, ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
- inline format functions - validation functions written in javascript defined directly within a schema. The function should either return void or throw an error if validation fails. Coercing values is not supported.
- predefined formats - these formats can contain both coerce and validate functions. If a coerce function is defined it will run first and validation will run on the coerced value to see that it meets the format requirements:
    - `'required_string'` - must be a string
    - `'optional_string'` - must be a string, null, or undefined
    - `'optional_date'` - value will be coerced to an ISO8601 date if possible. Valid formats include:
        - Year - 'YYYY'
        - Year - 'YYYY[T]'
        - Year_month - 'YYYYMM'
        - basic_date - 'YYYYMMDD'
        - basic_date_time - 'YYYYMMDD[T]HHmmss.SSSZ'
        - basic_date_time_no_millis - 'YYYYMMDD[T]HHmmssZ'
        - basic_time - 'HHmmss.SSSZ'
        - basic_time_no_millis - 'HHmmssZ'
        - basic_t_time - '[T]HHmmss.SSSZ'
        - basic_t_time_no_millis - '[T]HHmmssZ'
        - date - 'YYYY-MM'
        - date - 'YYYY-MM-DD'
        - date_hour - 'YYYY-MM-DD[T]HH'
        - date_hour_minute - 'YYYY-MM-DD[T]HH:mm'
        - date_hour_minute_second - 'YYYY-MM-DD[T]HH:mm:ss'
        - date_hour_minute_second_fraction - 'YYYY-MM-DD[T]HH:mm:ss.SSS'
        - date_time - 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ'
        - date_time_no_millis - 'YYYY-MM-DD[T]HH:mm:ssZZ'
        - date_time_no_second - 'YYYY-MM-DD[T]HH:mmZZ'
        - hour - 'HH'
        - hour_minute - 'HH:mm'
        - hour_minute_second - 'HH:mm:ss'
        - hour_minute_second_fraction - 'HH:mm:ss.SSS'
        - time - 'HH:mm:ss.SSSZZ'
        - time_no_millis - 'HH:mm:ssZZ'
        - t_time - '[T]HH:mm:ss.SSSZZ'
        - t_time_no_millis - '[T]HH:mm:ssZZ'
        - timestamp strings between 5 and 13 character (inclusive)
        - timestamp integers of any length
        - any valid [datemath-parser](https://github.com/randing89/datemath-parser) value
    - `'elasticsearch_name'` - value must be a string of 255 characters or less, contain only lowercase letters (no uppercase A-Z), does not start with underscore, hyphen, or plus signs, does not equal "." or "..", and does not contain any of these invalid characters: #, *, ?, ", `<`, `>`, |, /, or \\.
    - `'positive_int'` - must be valid integer greater than zero
    - `'optional_bool'` - must be either true, false, 'true', 'false', 1, 0, '1', '0', null, or undefined
    - `'optional_int'` - must be an integer, null, or undefined
    - `'duration'` - must be a positive integer or human readable string containing a number and valid unit (e.g. 3000, "5 days")
    - `'optional_duration'` - must be null, undefined, a positive integer or human readable string containing a number and valid unit (e.g. 3000, "5 days")
    - `'timestamp'` - must be a string or number that can be coerced to a valid unix timestamp
