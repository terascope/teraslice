---
title: Elasticsearch API
sidebar_label: Overview
---

> Elasticsearch client api used across multiple services, handles retries and exponential backoff

## Installation

```bash
# Using yarn
yarn add @terascope/elasticsearch-api
# Using npm
npm install --save @terascope/elasticsearch-api
```

## Usage

```js
const { Client } = require('elasticsearch');
const elasticsearchAPI = require('@terascope/elasticsearch-api');
const bunyan = require('bunyan');

const logger = bunyan.createLogger({ name: 'someName' });
const client = new Client({ host: ["127.0.0.1:9200"] });
const opConfig = { full_response: false };

const elasticsearch = elasticsearchAPI(client, logger, opConfig);

const query = elasticsearch.buildQuery(opConfig, msg);
const results = await elasticsearch.search(query);
console.log(results);
```

## Configuration

The `@terascope/elasticsearch-api` module must be passed in an opensearch client and a bunyan based logger. You may also optional pass in an object as the third argument.

| Configuration |                                      Description                                      |  Type   |                               Notes                               |
| :-----------: | :-----------------------------------------------------------------------------------: | :-----: | :---------------------------------------------------------------: |
| full_response | If using the search method, set this to true will return all metadata for the request | Boolean | optional, defaults to retuning data without its metadata attached |
|     index     |                     only used if you are using the version method                     | String  |  required if using the version method, if not then its optional   |

## API Methods

The majority of methods exhibit the same behavior of the native elasticsearch client

### get

It gets a single document

Query requires:

- id
- type
- index

```js
const query = {id: 'someID', type: 'someType', index: 'someIndex'};

elasticsearch.get(query)
   .then(function(results){
       console.log(results)
   })
```

### index

This will index a document to a given index

Query requires:

- index
- type
- body

```js
const query = {index: 'someIndex', type: 'someType', body: {actual: 'data'};

elasticsearch.index(query)
   .then(function(results){
       console.log(results)
   });
```

### indexWithId

This will index a document to a given index with a specific id

Query requires:

- index
- type
- id
- body

```js
const query = {
  index: 'someIndex',
  type: 'someType',
  id: 'someID',
  body: {actual: 'data'}
};

elasticsearch.indexWithId(query)
   .then(function(results){
       console.log(results)
   })
```

### create

Please reference index, they do the same except create will throw if doc already exists

### update

Update parts of a document, body is a partial document, which will be merged with the existing one

Query requires:

- index
- type
- id
- body

```js
const query = {
    index: 'someIndex',
    type: 'someType',
    id: 'someId',
    body: {
        doc: {
            partial: 'document'
        }
    }
};

elasticsearch.update(query)
   .then(function(results){
       console.log(results)
   })
```

### remove

Deletes a document for a given id

Query requires:

- index
- type
- id

```js
const query = {index: 'someIndex', type: 'someType', id: 'someId'};

elasticsearch.remove(query)
   .then(function(results){
       console.log(results)
   })
```

### search

Searches elasticsearch

Query requires:

- index (can be a single index or multiple)

optional:

- q  (lucene query)
- body (Elasticsearch’s Query DSL)

```js
const query = {index: 'someIndex', q: 'some:Data NOT other:Data'};
const query2 = {
   "index": "mapping_test",
   "size": 2000,
   "q": "bytes:>80000",
   "body": {
       "query": {
           "range": {
               "created": {
                   "gte": "2016-11-28T11:18:07.018-07:00",
                   "lt": "2016-11-28T11:18:07.031-07:00"
               }
           }
       }
   }
};

elasticsearch.search(query)
   .then(function(results){
       console.log(results)
   })
```

#### Note

- If the incoming query has size set to 0, then it will return the count of the given query
- If the passed in opConfig (third argument on instantiation of api) has set full_response to true, it will return docs with their associated metadata

### version

Verifies if a given index exists and logs what the max_result_window for said index

Query requires:

- index (requires passed in opConfig to have set an index key with the value set to a index)

```js
const opConfig = {index: 'someIndex'}
const elasticsearch = require('@terascope/elasticsearch-api')(client, logger, opConfig);

elasticsearch.version()
   .then(function(){
        // do stuff
   })
   .catch(function(err){
        //index does not exist or some other error
   })
```

### putTemplate

Adds a template

Query requires:

- template
- name

```js
const client = getClient(context, context.sysconfig.teraslice.state, 'elasticsearch');
const template = require('./backends/mappings/logs.json');
const name = 'logs_template';

elasticsearch.putTemplate(template, name)
```

### bulkSend

Uses the client bulk functionality with exponential back-off retries

Query requires:

- data  (formatted to work with opensearch bulk queries)

```js
const elasticsearch = require('@terascope/elasticsearch-api')(client, logger, opConfig);
elasticsearch.bulkSend([
     {
        action: {
            index: { _index: 'some_index', _id: 1 }
        },
        data: { title: 'foo' }
    },
    {
        action: {
            delete: { _index: 'some_index', _id: 5 }
        }
    }
])
  .then(() => {
      //all done sending data
   });
```

### nodeInfo

directly calls opensearch client.nodes.info()

### nodeStats

directly calls opensearch `client.nodes.stats()`

### index_exists

calls `client.indices.exists()` with and retries if queue is overloaded

Query requires:

- index

```js
const existQuery = {index: index_name};
elasticsearch.index_exists(existQuery)
```

### index_create

calls `client.indices.create()` with and retries if queue is overloaded

Query requires:

- index
- body (mapping for index)

```js
const createQuery = {index: index_name, body: mapping};
elasticsearch.index_create(createQuery)
```

### index_refresh

calls client.indices.refreash() with and retries if queue is overloaded

Query requires:

- index

```js
const query = {index: index_name};
elasticsearch.index_refresh(query)
```

### index_recovery

calls `client.indices.recovery()` with and retries if queue is overloaded

Query requires:

- index

```js
const existQuery = {index: index_name};
elasticsearch.index_recovery(existQuery)
```

### buildQuery

basic elasticsearch dsl query builder

Query requires:

- opConfig (object)
- msg  (object)

Basic usage

```js
const elasticsearch = require('@terascope/elasticsearch-api')(client, logger, opConfig);
const query = elasticsearch.buildQuery(opConfig, msg);
elasticsearch.search(query)
```

#### Configuration for opConfig

|  Configuration  |                                                                                                                                         Description                                                                                                                                         |               Type                |                           Notes                           |
| :-------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------: | :-------------------------------------------------------: |
|      index      |                                                                                                                              Index in which you will read from                                                                                                                              |              String               |                         required                          |
|     fields      | Determines what fields are sent back in the returning query. Setting it to true or false will determine if the _source field should be returned. Setting it to a list of fields will return results only of those fields and if set to a single string will only return that specific field | String, Array of Strings, Boolean |                         optional                          |
| date_field_name |                                                                                                        the field name of the document on which you will be performing a range query                                                                                                         |              String               | required only if msg parameter has a start and end value, |
|      query      |                                                                                                  Must be lucene query syntax. If set then this will add a lucene query to the final query                                                                                                   |              String               |                         optional                          |

#### Configuration for msg

| Configuration |                                           Description                                            |     Type      |                      Notes                       |
| :-----------: | :----------------------------------------------------------------------------------------------: | :-----------: | :----------------------------------------------: |
|     count     |                            determines the size parameter of the query                            |    Number     |                     required                     |
|     start     |             used for a range query, searches for greater than or equal to this value             | String (date) |  optional, must be used in conjunction with end  |
|      end      |             used for a range query, searches for less than this value, non-inclusive             | String (date) | optional, must be used in conjunction with start |
|      key      | if set then this will perform a wildcard query using this value against all document's _id value |    String     |                     optional                     |

Example of query generated:

```txt
In the following example, this will create a query searching the index: someIndex with a _id that matches a76f*, with bytes greater than 80000 and in-between two dates
```

```js
const opConfig = {
   date_field_name: 'created',
   index: 'someIndex',
   query: 'bytes:>80000'
};

const msg = {
   count: 2000,
   start: "2016-11-28T11:18:07.018-07:00",
   end: "2016-11-28T11:18:07.031-07:00",
   key: "a76f*"
};

const query = elasticsearch.buildQuery(opConfig, msg);
console.log(query);

const obj = {
  "index": "someIndex",
  "size": 2000,
  "body": {
    "query": {
      bool: {
        must: [
          {
            "range": {
              "created": {
                "gte": "2016-11-28T11:18:07.018-07:00",
                "lt": "2016-11-28T11:18:07.031-07:00"
              }
            }
          },
          {
            query_string: {
              query: "bytes:>80000"
            }
          },
          {
            wildcard: {
              _uid: "a76f*"
            }
          }

        ]
      }
    }
  }
};
```
