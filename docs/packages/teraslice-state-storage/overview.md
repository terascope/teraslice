---
title: Teraslice State Storage
sidebar_label: Overview
---

> State storage operation api for teraslice

Teraslice State Storage provides an LRU caching system, based on [mnemonist's](https://www.npmjs.com/package/mnemonist) LRU map, for teraslice processors. The in memory cache can be backed by a persistant storage system like Elasticsearch if a more robust cache is needed.

The advantage of having the LRU cache backed by a persistant storage system like Elasticsearch is that if the key is not in the cache the processor will search an elasticsearch index for the key and if it is found will add it to the cache.  This essentially expands the cache to the size of the underlying elasticsearch index without requiring the same memory resources in Teraslice.  The potential drawback is that on data sets with a large key set the processor will be continously seaching elasticsearch for each key which would render the caching mechanism pointless.

## Usage
Add the state storoge api must be added to the job file under the 'apis' property to be accessible by a processor.

### Job Setup
```json
 {
    "name": "state-storage-job",
    "lifecycle": "persistent",
    "workers": 20,
    "assets": [
        "asset1:0.1.0"
    ],
    "apis": [
        {
            "_name": "cached_state_storage",
            "cache_size": 10000
        }
    ],
    "operations": [
        {
            "_op": "reader"
        },
        {
            "_op": "state_storage_processor",
            "state_storage": "cached_state_storage"
        },
        {
            "_op": "sender"
        }
    ]
}
```

Add the state storage api to the processor with the createAPI function

### Processor Example
```javascript
const { BatchProcessor } = require('@terascope/job-components');

class StateStorageProcessor extends BatchProcessor {
    async initialize() {
        this.state = await this.createAPI(this.opConfig.state_storage);
    }

     async onBatch(dataArray) {
         for (const doc of dataArray) {
            const key = doc.getMetadata('_key');

            // use set to save a record to the cache
            this.state.set(key, doc);

            // use get to retrieve a record
            const record = this.state.get(key);
         }

     }
}

module.exports = StateStorageProcessor;
```

## State Storage Job Settings

### cache_size
"cache_size": NUMBER - maximum number of keys held in the cache before evicting unused keys.

## Cache Functions:

### set
set(KEY, VALUE) - Sets a value for the given key in the cache. If the cache is already full, the least recently used key will be dropped from the cache and the evicted value will be logged by teraslice

```javascript
this.state.set(1, { name: 'foo' });
this.state.set('abc123', { name: 'bar' });
```

### get
get(KEY) - Retrieves the value associated to the given key in the cache or undefined if the key is not found.  If the key is found, the key is moved to the front of the underlying list to be the most recently used item.

```javascript
this.state.get(1); // { name: 'foo' }
this.state.get('abc123'); // { name: 'bar' }
this.state.get('456def'); // undefined
```

### mset
mset([\{ key: KEY1, data: VALUE1\}, \{ key: KEY2, data: VALUE2 \}, etc ...]) - Sets multiple key, value pairs.  Requires an array of \{ key: key, data: value \} objects

```javascript
this.state.mset([{ key: 1, data: { name: 'foo' } }, { key: 'abc123', data: { name: 'bar' } }]);
```

### mget
mget([KEY1, KEY2, KEY3, etc...]) - Returns an object of the found keys and values.  Required input is an array of keys

```javascript
this.state.mget([1, 'abc123', '456def']); // { 1: { name: 'foo' }, 'abc123': { name: 'bar' } };
```

### values
values(function) - Processes cache values based on passed function.

```javascript
    const results = [];

   function processValues(data) {
       results.push(data);
   }

   this.state.values(processValues); // [ { name: 'foo' }, { name: 'bar' }];
```

### has
has(KEY) - Returns true if key is in the cache otherwise returns false.

```javascript
this.state.has(1); // true
this.state.has('345def'); // false
```

### clear
`clear() - Completely clears the cache.`

```javascript
this.state.clear();
```

## State Storage backed by Elasticsearch

## Usage
Add the state storage api to the job with the elasticsearch settings

### Job Setup
```json
 {
    "name": "es-state-storage-job",
    "lifecycle": "persistent",
    "workers": 20,
    "assets": [
        "asset1:0.1.0"
    ],
     "apis": [
        {
            "_name": "elasticsearch_state_storage",
            "connection": "OPENSEARCH_CLUSTER_URL",
            "index": "INDEX_NAME",
            "cache_size": 1000000
        }
    ],
    "operations": [
        {
            "_op": "reader"
        },
        {
            "_op": "state_storage_processor",
            "state_storage": "elasticsearch_state_storage"
        },
        {
            "_op": "sender"
        }
    ]
}
```

Add the elasticsearch state storage api to the processor with the createAPI function

### Processor Example
```javascript
const { BatchProcessor } = require('@terascope/job-components');

class StateStorageProcessor extends BatchProcessor {
    async initialize() {
        this.state = await this.createAPI(this.opConfig.state_storage);
    }

     async onBatch(dataArray) {
         const cachedDocs = this.state.mget(dataArray);

         // process docs
     }
}

module.exports = StateStorageProcessor;
```

## Elasticsearch State Storage Job Settings

### cache_size
"cache_size": NUMBER - Maximum number of keys held in the cache before evicting unused keys, defaults to 2,147,483,647

### index
"index": "STRING" - Name of elasticsearch index

### type
"type":"STRING" - Elasticsearch type, defaults to _doc

### concurrency
"concurrency": NUMBER - Number of concurrent elasticsearch mget requests, defaults to 10

### chunk_size
"chunk_size": NUMBER - Number of documents in each elasticsearch mget request, defaults to 2,500

### persist
"persist": BOOLEAN - Saves the record to elasticsearch upon caching the document, defaults to false

### meta_key_field
"metaKey": "STRING" - Field in the metadata to use as the key for cacheing and searching in elasticsearch

### connection
"connection": "STRING" - Terafoundation connection name for elasticsearch cluster


## Elasticsearch State Storage API for processing data:
Elasticsearch State Storage operates under the assumption that all records being processed are data entities

```javascript
const foo = DataEntity.make({ name: 'foo'}, { _key: 1 });
const bar = DataEntity.make({ name: 'bar'}, { _key: 2 });
```

### set
set(DATAENTITY) - Adds the records to the cache. If the cache is already full, the least recently used key will be dropped from the cache and the evicted value will be logged by teraslice

```javascript
this.state.set(foo);
this.state.set(bar);
```

### get
get(DATAENTITY) - Asynchronous function that returns the cached state of the input.  If the record is not cached then it will search the elasticsearch index for the reocrd.  If the record is found, the key is moved to the front of the underlying list to be the most recently used item.

```javascript
this.state.get(foo); // { name: 'foo' }
```

### mset
mset([DATAENTITY1, DATAENTITY2, etc...]) - Asynchronous function that addes records to the cache. If persist is true it will also save the records in the elasticsearch index.  Input is a data entity array.

```javascript
this.state.mset([foo, bar]);
```

### mget
mget([DATAENTITY1, DATAENTITY2, etc...]) - Asynchronous function that returns an object of the cached keys and values.  For records not in the cache it will search elasticsearch and add found records to the cache.  Input is data entity array

```javascript
this.state.mget([foo, bar]); // { 1: { name: 'foo' }, 2: { name: 'bar' } };
```

### isCached
isCached(DATA_ENTITY) - Return true if the records key is in the cache otherwise returns false
```javascript
this.state.isCached(foo); // true
this.state.isCached(other); // false
```

### isKeyCached
isKeyCached(KEY) - Returns true if key is in the cache otherwise returns false.

```javascript
this.state.isKeyCached(1); // true
this.state.isKeyCached('other'); // false
```

### count
count - Returns the number of records in the cache
```javascript
this.state.count(); // 2
```
