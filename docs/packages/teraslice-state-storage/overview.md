---
title: Teraslice State Storage
sidebar_label: Overview
---

> State storage operation api for teraslice

Teraslice State Storage provides an LRU caching system, based on [mnemonist's](https://www.npmjs.com/package/mnemonist) LRU map, for teraslice processors. The in memory cache can be backed by a perminant storage system like Elasticsearch if a more robust cache is needed.


## Usage
`The state storoge api must be added to the job file to be accessible by a processor.`

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

`Add the state storage api to the processor with the createAPI function`

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
`"cache_size": NUMBER - maximum number of keys held in the cache before evicting unused keys`


## Cache Functions:

### set
`set(KEY, VALUE) - Sets a value for the given key in the cache. If the cache is already full, the least recently used key will be dropped from the cache and the evicted value will be logged by teraslice`

```javascript
stateStorage.set(1, { name: 'foo' });
stateStorage.set('abc123', { name: 'bar' });
```

### get
`get(KEY) - Retrieves the value associated to the given key in the cache or undefined if the key is not found.  If the key is found, the key is moved to the front of the underlying list to be the most recently used item.`

```javascript
stateStorage.get(1); // { name: 'foo' }
stateStorage.get('abc123'); // { name: 'bar' }
stateStorage.get('456def'); // undefined
```

### mset
`set([{ key: KEY1, data: VALUE1}, { key: KEY2, data: VALUE2 }, etc ...] - Sets multiple key, value pairs.  Requires an array of { key: key, data: value } objects`

```javascript
stateStorage.mset([{ key: 1, data: { name: 'foo' } }, { key: 'abc123', data: { name: 'bar' } }]);
```

### mget
`mget([KEY1, KEY2, KEY3, etc...]) - Returns an object of the found keys and values.  Required input is an array of keys`

```javascript
stateStorage.mget([1, 'abc123', '456def']); // { 1: { name: 'foo' }, 'abc123': { name: 'bar' } };
```

### values
`values(function) - Processes cache values based on passed function.`

```javascript
    const results = [];

   function processValues(data) {
       results.push(data);
   }

   stateStorage.values(processValues); // [ { name: 'foo' }, { name: 'bar' }];
```

### has
`has(KEY) - Returns true if key is in the cache otherwise returns false.`

```javascript
stateStorage.has(1); // true
stateStorage.has('345def'); // false
```

### clear
`clear() - Completely clears the cache.`

```javascript
stateStorage.clear();
```

## Using State Storage backed by Elasticsearch

The advantage of having the LRU cache backed by a perminant storage system like Elasticsearch is that if the key is not in the cache the processor will search an elasticsearch index for the key and if it is found will add it to the cache.  This works really well on data sets with a relatively low key count, but on data sets with a high key count making too many queres to Elasticsearch will slow down the process.

