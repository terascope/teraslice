---
title: Getting Started
---

<!-- copied from Getting Started docs -->

Teraslice is written in Node.js and has been tested on Linux and Mac OS X.

### Dependencies

- Node.js (10.16 or above)
- Yarn (1.16 or abose)
- At least one elasticsearch 5.x, 6.x, or 7.x

### Installation

```sh
# Install teraslice globally
npm install --global teraslice
# Or with yarn, yarn global add teraslice

# A teraslice CLI client
npm install --global teraslice-cli
# Or with yarn, yarn global add teraslice-cli

# To add additional connectors, use
# npm install terafoundation_kafka_connector
```

### Running

Create a configuration file called `config.yaml`:

```yaml
terafoundation:
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

Starting a single-node teraslice instance:

NOTE: Elasticsearch must be running first.

```sh
teraslice -c config.yaml
```

Deploy needed assets:

For many use cases elasticsearch is a good start.

```sh
teraslice-cli assets deploy localhost terascope/elasticsearch-assets
```

There are also asset bundles available for:

- [Kafka](https://github.com/terascope/kafka-assets)
- [Files](https://github.com/terascope/file-assets) - NFS, Gluster, Amazon S3
- [HDFS](https://github.com/terascope/hdfs-assets)

If you want to get a simple cluster going use, the example docker-compose file:

```sh
docker-compose up --build
```
