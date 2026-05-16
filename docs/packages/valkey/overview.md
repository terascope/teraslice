---
title: Valkey
sidebar_label: Overview
---

The Valkey Connector facilitates a connection between a [terafoundation](https://terascope.github.io/teraslice/docs/packages/terafoundation/overview) based project and one or more [valkey](https://valkey.io) instances. It uses the [Valkey GLIDE](https://glide.valkeyio) client library.

## Installation

```bash
pnpm add @terascope/valkey
```

## Terafoundation Configuration

To make this connector available from a terafoundation based application, a connector named `valkey` must be added to the `terafoundation.yml` file. Within the valkey connector multiple endpoints can be named and configured. Only the `addresses` field is required, but all configuration fields specified in the Valkey GLIDE client are acceptable.

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


## Configuration Parameters

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

## Create a Valkey client using the terafoundation API

See the [terafoundation docs](../terafoundation/overview.md#api) for API details.

```typescript
const { client } = context.apis.foundation.createClient({
    type: 'valkey',
    endpoint: 'valkey-1',
    cached: true
});
```

## Commands

A full list of commands can be found in the [client](https://glide.valkey.io/languages/nodejs/api/) and [server](https://valkey.io/commands) docs.

### Get / Set a Key

```typescript
await client.set('key1', 'hello');
console.log(await client.get('key1')) // "hello"

await client.mset({ 'key1': 'goodbye', 'key2': 'Bob' });
console.log(await client.mget(['key1', 'key2'])); // [ 'goodbye', 'Bob' ]
```

### Increment / Decrement

```typescript
await client.set('counter', '10');
console.log(await client.incr('counter')); // 11
console.log(await client.get('counter')); // "11"
console.log(await client.decr('counter')); // 10
console.log(await client.get('counter')); // "10"
```

### Geo Functions

#### Add Geo Points to a Key

`client.geoadd(key, membersToGeospatialData, options?)` adds geospatial members to a key.

| Parameter | Description |
| --------- | ----------- |
| `key` | The key to store the geospatial data in. |
| `membersToGeospatialData` | A `Map` of member name strings to `{ longitude, latitude }` objects. |
| `options.updateMode` | Controls which members are updated. `OnlyIfExists` updates only existing members; `OnlyIfDoesNotExist` adds only new members. Omit to update all. |
| `options.changed` | When `true`, returns the count of members whose position was changed rather than the count of newly added members. |

```typescript
await client.geoadd(
    'Sicily',
    new Map([
        ['Palermo', { longitude: 13.361389, latitude: 38.115556 }],
        ['Catania', { longitude: 15.087269, latitude: 37.502669 }]
    ])
);
```

#### Get positions (lon/lat) of Geo Points

`client.geopos(key, members)` returns the longitude/latitude of one or more members stored in a key.

| Parameter | Description |
| --------- | ----------- |
| `key` | The key holding the geospatial data. |
| `members` | An array of member name strings to look up. |

```typescript
console.log(await client.geopos('Sicily', ['Palermo', 'Catania']));
/**
 * [
 *   [ 13.361389338970184, 38.1155563954963 ],
 *   [ 15.087267458438873, 37.50266842333162 ]
 * ]
*/
```

#### Get distance between two points

`client.geodist(key, member1, member2, options?)` returns the distance between two members stored in a key.

| Parameter | Description |
| --------- | ----------- |
| `key` | The key holding the geospatial data. |
| `member1` | Name of the first member. |
| `member2` | Name of the second member. |
| `options.unit` | Unit for the returned distance. A `GeoUnit` enum value: `METERS`, `KILOMETERS`, `MILES`, or `FEET`. Defaults to `METERS`. |

```typescript
console.log(await client.geodist(
    'Sicily',
    'Palermo',
    'Catania',
    { unit: GeoUnit.KILOMETERS }
)) // 166.2742
```

#### Geo Search

`client.geosearch(key, searchFrom, searchBy, options?)` searches for members within a key by shape and origin. For [polygon](#bypolygon-query) searches, use `client.customCommand` with the raw `GEOSEARCH` command.

| Parameter | Description |
| --------- | ----------- |
| `key` | The key holding the geospatial data. |
| `searchFrom` | Origin of the search. Use `{ position: { longitude, latitude } }` for a coordinate origin (`FROMLONLAT`) or `{ member: string }` for a stored member origin (`FROMMEMBER`). |
| `searchBy` | Shape of the search area. Use `{ radius, unit }` for a circle (`BYRADIUS`) or `{ width, height, unit }` for a bounding box (`BYBOX`). `unit` is a `GeoUnit` enum value: `METERS`, `KILOMETERS`, `MILES`, or `FEET`. |
| `options.sortOrder` | Order results by distance: `SortOrder.ASC` (nearest first) or `SortOrder.DESC` (farthest first). |
| `options.count` | Limit the number of results returned. |
| `options.withDist` | When `true`, include the distance from the origin in each result. |
| `options.withCoord` | When `true`, include the longitude/latitude of each result. |
| `options.withHash` | When `true`, include the raw geohash integer for each result. |

##### `BYRADIUS` query with `FROMLONLAT` origin

```typescript
console.dir(await client.geosearch(
    'Sicily',
    { position: { longitude: 13.36, latitude: 38.1 } }, // Search from Coordinate Origin
    { radius: 300, unit: GeoUnit.KILOMETERS }, // GeoCircleShape
    {
        sortOrder: SortOrder.ASC,
        withDist: true,
        withCoord: true,
    }
), { depth: null }); 
/**
 * [
 *   [ 'Palermo', [ 1.7345, [ 13.361389338970184, 38.1155563954963 ] ] ],
 *   [ 'Catania', [ 165.6989, [ 15.087267458438873, 37.50266842333162 ] ] ]
 * ]
*/
```

##### `BYBOX` query with `FROMMEMBER` origin

```typescript
console.dir(await client.geosearch(
    'Sicily',
    { member: 'Palermo' }, // Search from Member Origin
    { width: 500, height: 500, unit: GeoUnit.KILOMETERS }, // GeoBoxShape
    {
        sortOrder: SortOrder.DESC,
        withDist: true,
        count: 3
    }
), { depth: null });
/**
 * [
 *   [ 'Catania', [ 166.2742 ] ],
 *   [ 'Palermo', [ 0 ] ]
 * ]
 */ 
```

##### `BYPOLYGON` query

`BYPOLYGON` is not yet supported by the GLIDE client's typed API and must be issued via `client.customCommand`. The command arguments are positional:

| Argument | Description |
| -------- | ----------- |
| `"GEOSEARCH"` | The command name. |
| `key` | The key holding the geospatial data. |
| `"BYPOLYGON"` | Selects polygon search mode. |
| `numVertices` | Number of polygon vertices as a string (e.g. `coords.length.toString()`). |
| `lon1, lat1, ...` | Flattened lon/lat string pairs for each vertex. The closing vertex (repeating the first) is optional. |
| `"WITHCOORD"` | _(optional)_ Include the longitude/latitude of each result. |
| `"WITHHASH"` | _(optional)_ Include the raw geohash integer for each result. |
| `"COUNT"`, `n` | _(optional)_ Limit results to `n` members. Pass as two separate string arguments. |
| `"ASC"` / `"DESC"` | _(optional)_ Sort results by distance ascending or descending. |

The `GlideJson` class requires the [Valkey JSON](https://github.com/valkey-io/valkey-json) server module.

```typescript
// Store a GeoJSON polygon
await GlideJson.set(client, "searchArea", "$", JSON.stringify({
    type: "Polygon",
    coordinates: [[
        ['13', '36'],
        ['14', '36'],
        ['14', '39'],
        ['13', '39'],
        ['13', '36']  // closing coordinates optional
    ]]
}));

const searchAreaStr = await GlideJson.get(client, 'searchArea');
if (searchAreaStr) {
    const coords: [string, string][] = JSON
        .parse(searchAreaStr as string)
        .coordinates[0];

    // We flatten all coordinates into a single array so we can use
    // the spread operator to insert each as an argument within `customCommand`
    const polygonArgs = coords.flatMap(([lon, lat]) => [lon, lat]);
    // ['13', '36', '14', '36', '14', '39', '13', '39', '13', '36']

    console.dir(await client.customCommand([
        "GEOSEARCH",
        'Sicily',
        "BYPOLYGON",
        coords.length.toString(),
        ...polygonArgs,
        "WITHCOORD"
    ]), { depth: null });
    /**
     * [[ 'Palermo', [ [ 13.361389338970184, 38.1155563954963 ] ] ]]
     */
}
```

If the [Valkey JSON](https://github.com/valkey-io/valkey-json) server module is not present on you server you can save the polygon as raw JSON. This has the disadvantage of not allowing you to query/update individual fields without deserializing the whole document.

```typescript
// Store a polygon as a plain string (no JSON module required)
await client.set('searchAreaPlain', JSON.stringify([
    ['13', '36'],
    ['14', '36'],
    ['14', '39'],
    ['13', '39'],
    ['13', '36'],
]));

const searchAreaPlainStr = await client.get('searchAreaPlain');
if (searchAreaPlainStr) {
    const coords: [string, string][] = JSON.parse(searchAreaPlainStr as string);
    const polygonArgs = coords.flatMap(([lon, lat]) => [lon, lat]);

    console.dir(await client.customCommand([
        "GEOSEARCH",
        'Sicily',
        "BYPOLYGON",
        coords.length.toString(),
        ...polygonArgs,
        "WITHCOORD"
    ]), { depth: null });
    /**
     * [[ 'Palermo', [ [ 13.361389338970184, 38.1155563954963 ] ] ]]
     */
}
```

### Delete and close client

```typescript
await client.del(['key1', 'key2', 'counter', 'Sicily', 'searchAreaPlain', 'searchArea'])
client.close();
```
