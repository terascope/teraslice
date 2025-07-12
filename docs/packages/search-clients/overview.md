---
title: Search Clients
sidebar_label: Overview
---

> A collection of Node.js clients including an http and Elasticsearch/Opensearch clients.

## Installation

```bash
# Using yarn
yarn add search-clients
# Using npm
npm install --save add search-clients
```

## Connectors

### Elasticsearch-next Connector

**Configuration:**

The Elasticsearch-next connector configuration, in your Teraslice configuration file, includes the following parameters:

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| node | A list of hosts to connect to. | String[] | optional, defaults to `['http://127.0.0.1:9200']` |
| sniffOnStart | Sniff hosts on start up | Boolean | optional, defaults to `false` |
| caCertificate | A string containing a single or multiple ca certificates | String | optional, defaults to `undefined` |
| username | Username for authenticating with cluster | String | optional, required if authentication is enabled, defaults to `undefined` |
| password | Password for authenticating with cluster. | String | optional, required if used in conjunction with the username, defaults to `undefined` |
| sniffOnConnectionFault | Sniff hosts on connection failure | Boolean | optional, defaults to `false` |
| requestTimeout | Request timeout | duration | optional, defaults to `120000` |
| maxRetries | Maximum retries for a failed request | number | optional, defaults to `3` |

**Terafoundation Elasticsearch-next configuration example:**

```yaml
terafoundation:
    connectors:
        elasticsearch-next:
            default:
                node:
                    - "http://localhost:9200"

```

**Terafoundation Elasticsearch-next ssl configuration example:**

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
