# Teraslice

> Distributed computing platform for processing JSON data

Teraslice is an open source, distributed computing platform for processing JSON data. It works together with Elasticsearch and Kafka to enable highly scalable data processing pipelines.

It supports the creation of custom processor logic implemented in JavaScript and plugged into to the system to validate, transform and enrich data. Processing pipelines are scalable and easily distributable across many computers.

[![Build Status](https://travis-ci.org/terascope/teraslice.svg?branch=master)](https://travis-ci.org/terascope/teraslice)
[![codecov](https://codecov.io/gh/terascope/teraslice/branch/master/graph/badge.svg)](https://codecov.io/gh/terascope/teraslice)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)
[![Known Vulnerabilities](https://snyk.io/test/github/terascope/teraslice/badge.svg)](https://snyk.io/test/github/terascope/teraslice)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Getting Started

<!-- copied from Getting Started docs -->

Teraslice is written in Node.js and has been tested on Linux and Mac OS X.

### Dependencies ###
* Node.js 8 or above
* Yarn (development only)
* At least one Elasticsearch 5 or above cluster

### Installation ###

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

### Running ###

Create a configuration file called `config.yaml`:

```yaml
terafoundation:
    connectors:
        elasticsearch:
            default:
                host:
                    - localhost:9200

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

 * [Kafka](https://terascope.github.io/kafka-assets)
 * [Files](https://terascope.github.io/file-assets)
 * [HDFS](https://terascope.github.io/hdfs-assets)

If you want to get a simple cluster going use, the example docker-compose file:

```sh
docker-compose up --build
```

## Documentation

- [Getting Started](https://terascope.github.io/teraslice/docs/getting-started)
- [API](https://terascope.github.io/teraslice/docs/api)
- [Packages](https://terascope.github.io/teraslice/docs/packages)
- [Development](https://terascope.github.io/teraslice/docs/development/overview)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[Apache-2.0](./LICENSE).

Some packages in this repository are licensed under [MIT](https://opensource.org/licenses/MIT).
