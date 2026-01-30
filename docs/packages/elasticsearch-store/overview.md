---
title: Elasticsearch Store
sidebar_label: Overview
---

> An API for managing an elasticsearch index, with versioning and migration support.

## Installation

```bash
# Using yarn
yarn add elasticsearch-store
# Using npm
npm install --save elasticsearch-store
```

## Connectors

### Elasticsearch-next Connector

**Configuration:**

The Elasticsearch-next connector configuration, in your Teraslice configuration file, includes the following parameters:

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| node | A list of hosts to connect to. | String \| String[] | optional, defaults to `['http://127.0.0.1:9200']` |
| sniffOnStart | Sniff hosts on start up | Boolean | optional, defaults to `false` |
| caCertificate | A string containing a single or multiple ca certificates | String | optional, defaults to `undefined` |
| username | Username for authenticating with cluster | String | optional, required if authentication is enabled, defaults to `undefined` |
| password | Password for authenticating with cluster. | String | optional, required if used in conjunction with the username, defaults to `undefined` |
| ssl | Set the Node.js TLS(SSL) `ConnectionOptions` for clients using this connector. | Object | optional, defaults to `undefined` |
| sniffOnConnectionFault | Sniff hosts on connection failure | Boolean | optional, defaults to `false` |
| requestTimeout | Request timeout | duration | optional, defaults to `120000` |
| maxRetries | Maximum retries for a failed request | number | optional, defaults to `3` |
| suggestCompression | Adds `accept-encoding: \'gzip,deflate\'` header to every request. This enables HTTP compression for responses from the OpenSearch cluster to reduce network bandwidth usage. | Boolean | optional, defaults to `false` |
| pingTimeout | Max ping request timeout in milliseconds for each request. If undefined will use the client\'s default, usually `3000` | Number | optional, defaults to `undefined` |
| sniffInterval | Perform a sniff operation every n milliseconds. If undefined will use the client\'s default, usually `false` | Number \| false | optional, defaults to `undefined` |
| sniffEndpoint | Endpoint to ping during a sniff. If undefined will use the client\'s default, usually `_nodes/_all/http`. | String | optional, defaults to `undefined` |
| auth | Your authentication data. Does not support "ApiKey" or "Bearer" token authentication.' | `{ username: string, password: string }` | optional, defaults to `undefined` |

**Terafoundation Elasticsearch-next configuration example:**

```yaml
terafoundation:
    connectors:
        elasticsearch-next:
            default:
                node:
                    - "http://localhost:9200"

```

**Terafoundation Elasticsearch-next ssl configuration examples:**

```yaml
terafoundation:
    connectors:
        elasticsearch-next:
            default:
                node:
                    - "https://localhost:9200"
                username: admin
                password: mypassword
                caCertificate: |
                    -----BEGIN CERTIFICATE-----
                    MIICGTCCAZ+gAwIBAgIQCeCTZaz32ci5PhwLBCou8zAKBggqhkjOPQQDAzBOMQs
                    ...
                    DXZDjC5Ty3zfDBeWUA==
                    -----END CERTIFICATE-----

```

```yaml
terafoundation:
    connectors:
        elasticsearch-next:
            default:
                node:
                    - "https://localhost:9200"
                auth:
                    username: admin
                    password: mypassword
                ssl:
                    ca: |
                        -----BEGIN CERTIFICATE-----
                        MIICGTCCAZ+gAwIBAgIQCeCTZaz32ci5PhwLBCou8zAKBggqhkjOPQQDAzBOMQs
                        ...
                        DXZDjC5Ty3zfDBeWUA==
                        -----END CERTIFICATE-----

```