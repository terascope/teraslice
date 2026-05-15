---
title: Valkey
sidebar_label: Overview
---

The Valkey Connector facilitates a connection between a [terafoundation](https://terascope.github.io/teraslice/docs/packages/terafoundation/overview) based project and one or more [valkey](https://valkey.io) instances. It uses the [Valkey GLIDE](https://glide.valkeyio) client library.

## Installation

```bash
pnpm add @terascope/valkey
```

## Quick Reference

### Terafoundation Configuration

To make this connector available from a terafoundation based application, a connector must be added to the `terafoundation.yml` file:

```yaml
terafoundation:
    connectors:
        valkey:
            valkey-1:
                addresses:
                    - host: localhost
                      port: 6379
            valkey-2:
                addresses:
                    - host: 10.0.1.2
                      port: 6379
```

### Create a Valkey client using the terafoundation API

See the [terafoundation docs](../terafoundation/overview#api) for API details.

```typescript
const { client } = context.apis.foundation.createClient({
    type: 'valkey',
    endpoint: 'valkey-1',
    cached: true
});

await client.set('foo', 'bar');
console.log(await client.get('foo')) // bar

client.close();
```

### Configuration Parameters

| Parameter | Description | Type | Default |
| --------- | ----------- | ---- | ------- |
| `addresses` | DNS addresses and ports of known nodes. Required. In cluster mode the list can be partial; in standalone mode only provided addresses are used. | `Array<{host: string, port?: number}>` | `null` |
| `advancedConfiguration` | Advanced client configuration. Supports `connectionTimeout` (ms), `pubsubReconciliationIntervalMs`, `tcpNoDelay`, and `tlsAdvancedConfiguration` (`{insecure?, rootCertificates?}`). | Object | `undefined` |
| `clientAz` | Availability Zone of the client, used with `AZAffinity` and `AZAffinityReplicasAndPrimary` `readFrom` strategies. | String | `undefined` |
| `clientName` | Client name sent via `CLIENT SETNAME` during connection establishment. | String | `undefined` |
| `connectionBackoff` | Reconnection strategy on connection failure. Requires `numberOfRetries`, `factor`, and `exponentBase` (all non-negative integers); optional `jitterPercent`. | Object | `undefined` |
| `credentials` | Authentication credentials. Password auth: `{username?, password}`. IAM auth: `{username, iamConfig: {clusterName, service, region, refreshIntervalSeconds?}}`. `service` must be `"Elasticache"` or `"MemoryDB"`. | Object | `undefined` |
| `databaseId` | Index of the logical database to connect to. | Integer (≥ 0) | `undefined` (0) |
| `defaultDecoder` | Default response decoder when not set per command. One of: `"Bytes"`, `"String"`. | String | `undefined` (`"String"`) |
| `inflightRequestsLimit` | Maximum number of concurrent in-flight requests. | Integer (> 0) | `undefined` (1000) |
| `lazyConnect` | When `true`, defers physical connections until the first command is sent. | Boolean | `false` |
| `protocol` | Serialization protocol. One of: `"RESP2"`, `"RESP3"`. | String | `undefined` (`"RESP3"`) |
| `pubsubSubscriptions` | PubSub subscriptions applied on connection. `channelsAndPatterns` is keyed by mode (`0`=Exact, `1`=Pattern) with Sets of channel name strings. Optional `callback(msg, context)` and arbitrary `context`. | Object | `undefined` |
| `readFrom` | Read strategy. One of: `"primary"`, `"preferReplica"`, `"AZAffinity"`, `"AZAffinityReplicasAndPrimary"`. | String | `undefined` (`"primary"`) |
| `readOnly` | When `true`, enables read-only mode — write commands are blocked and all connected nodes are treated as valid read targets. | Boolean | `false` |
| `requestTimeout` | Duration in milliseconds the client waits for a request to complete. | Integer (> 0) | `undefined` (250) |
| `useTLS` | When `true`, communication with the server uses Transport Level Security. | Boolean | `false` |
