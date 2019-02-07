---
title: Getting Started
---

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
# npm install --global terascope/terafoundation_kafka_connector
```

# Running

Once you have Teraslice installed you need a job specification and a configuration file to do something useful with it. See above for simple examples of each.

Starting the Teraslice service on the master node is simple. Just provide it a path to the configuration file.

```sh
teraslice -c master-config.yaml
```

Starting a worker on a remote node is basically the same.

```sh
teraslice -c worker-config.yaml
```
