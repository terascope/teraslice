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
# npm install --global terafoundation_kafka_connector
```

### Running ###

Once you have Teraslice installed you need a job specification and a configuration file to do something useful with it. See above for simple examples of each.

Starting the Teraslice service on the master node is simple. Just provide it a path to the configuration file.

```sh
teraslice -c master-config.yaml
```

Starting a worker on a remote node is basically the same.

```sh
teraslice -c worker-config.yaml
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
