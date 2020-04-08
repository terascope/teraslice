---
title: Elasticsearch Store: `IndexStore`
sidebar_label: IndexStore
---

# Class: IndexStore <**T**>

A single index elasticearch-store with some specific requirements around
the index name, and record data

## Type parameters

▪ **T**: *Record‹string, any›*

## Hierarchy

* **IndexStore**

  ↳ [IndexModel](indexmodel.md)

## Index

### Constructors

* [constructor](indexstore.md#constructor)

### Properties

* [_defaultQueryAccess](indexstore.md#protected-_defaultqueryaccess)
* [client](indexstore.md#client)
* [config](indexstore.md#config)
* [esVersion](indexstore.md#esversion)
* [indexQuery](indexstore.md#indexquery)
* [manager](indexstore.md#manager)
* [name](indexstore.md#name)
* [readHooks](indexstore.md#readhooks)
* [refreshByDefault](indexstore.md#refreshbydefault)
* [writeHooks](indexstore.md#writehooks)
* [xLuceneTypeConfig](indexstore.md#xlucenetypeconfig)

### Methods

* [_toRecord](indexstore.md#protected-_torecord)
* [_toRecords](indexstore.md#protected-_torecords)
* [appendToArray](indexstore.md#appendtoarray)
* [bulk](indexstore.md#bulk)
* [count](indexstore.md#count)
* [countBy](indexstore.md#countby)
* [countRequest](indexstore.md#countrequest)
* [create](indexstore.md#create)
* [createById](indexstore.md#createbyid)
* [createJoinQuery](indexstore.md#createjoinquery)
* [deleteById](indexstore.md#deletebyid)
* [exists](indexstore.md#exists)
* [findAll](indexstore.md#findall)
* [findAllBy](indexstore.md#findallby)
* [findAndApply](indexstore.md#findandapply)
* [findBy](indexstore.md#findby)
* [findById](indexstore.md#findbyid)
* [flush](indexstore.md#flush)
* [get](indexstore.md#get)
* [getDefaultParams](indexstore.md#getdefaultparams)
* [index](indexstore.md#index)
* [indexById](indexstore.md#indexbyid)
* [initialize](indexstore.md#initialize)
* [mget](indexstore.md#mget)
* [migrateIndex](indexstore.md#migrateindex)
* [refresh](indexstore.md#refresh)
* [removeFromArray](indexstore.md#removefromarray)
* [search](indexstore.md#search)
* [searchRequest](indexstore.md#searchrequest)
* [shutdown](indexstore.md#shutdown)
* [update](indexstore.md#update)
* [updatePartial](indexstore.md#updatepartial)

## Constructors

###  constructor

\+ **new IndexStore**(`client`: Client, `config`: [IndexConfig](../interfaces/indexconfig.md)‹T›): *[IndexStore](indexstore.md)*

*Defined in [index-store.ts:35](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`config` | [IndexConfig](../interfaces/indexconfig.md)‹T› |

**Returns:** *[IndexStore](indexstore.md)*

## Properties

### `Protected` _defaultQueryAccess

• **_defaultQueryAccess**: *QueryAccess‹T› | undefined*

*Defined in [index-store.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L22)*

___

###  client

• **client**: *Client*

*Defined in [index-store.ts:15](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L15)*

___

###  config

• **config**: *[IndexConfig](../interfaces/indexconfig.md)*

*Defined in [index-store.ts:16](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L16)*

___

###  esVersion

• **esVersion**: *number*

*Defined in [index-store.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L21)*

___

###  indexQuery

• **indexQuery**: *string*

*Defined in [index-store.ts:17](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L17)*

___

###  manager

• **manager**: *[IndexManager](indexmanager.md)*

*Defined in [index-store.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L18)*

___

###  name

• **name**: *string*

*Defined in [index-store.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L19)*

___

###  readHooks

• **readHooks**: *Set‹function›* =  new Set<ReadHook<T>>()

*Defined in [index-store.ts:26](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L26)*

___

###  refreshByDefault

• **refreshByDefault**: *boolean* = true

*Defined in [index-store.ts:20](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L20)*

___

###  writeHooks

• **writeHooks**: *Set‹function›* =  new Set<WriteHook<T>>()

*Defined in [index-store.ts:25](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L25)*

___

###  xLuceneTypeConfig

• **xLuceneTypeConfig**: *xLuceneTypeConfig*

*Defined in [index-store.ts:23](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L23)*

## Methods

### `Protected` _toRecord

▸ **_toRecord**(`result`: RecordResponse‹T›, `critical`: boolean): *T*

*Defined in [index-store.ts:701](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L701)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`result` | RecordResponse‹T› | - |
`critical` | boolean | true |

**Returns:** *T*

___

### `Protected` _toRecords

▸ **_toRecords**(`results`: RecordResponse‹T›[], `critical`: boolean): *T[]*

*Defined in [index-store.ts:711](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L711)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`results` | RecordResponse‹T›[] | - |
`critical` | boolean | false |

**Returns:** *T[]*

___

###  appendToArray

▸ **appendToArray**(`id`: string, `field`: keyof T, `values`: string[] | string): *Promise‹void›*

*Defined in [index-store.ts:621](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L621)*

Append values from an array on a record.
Use with caution, this may not work in all cases.

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof T |
`values` | string[] &#124; string |

**Returns:** *Promise‹void›*

___

###  bulk

▸ **bulk**(`action`: "delete", `id?`: undefined | string): *Promise‹void›*

*Defined in [index-store.ts:91](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L91)*

Safely add a create, index, or update requests to the bulk queue

This method will batch messages using the configured
bulk max size and wait configuration.

**`todo`** we need to add concurrency support for sending multiple bulk requests in flight

**Parameters:**

Name | Type |
------ | ------ |
`action` | "delete" |
`id?` | undefined &#124; string |

**Returns:** *Promise‹void›*

▸ **bulk**(`action`: "index" | "create", `doc?`: Partial‹T›, `id?`: undefined | string): *Promise‹void›*

*Defined in [index-store.ts:92](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`action` | "index" &#124; "create" |
`doc?` | Partial‹T› |
`id?` | undefined &#124; string |

**Returns:** *Promise‹void›*

▸ **bulk**(`action`: "update", `doc?`: Partial‹T›, `id?`: undefined | string): *Promise‹void›*

*Defined in [index-store.ts:93](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L93)*

**Parameters:**

Name | Type |
------ | ------ |
`action` | "update" |
`doc?` | Partial‹T› |
`id?` | undefined &#124; string |

**Returns:** *Promise‹void›*

___

###  count

▸ **count**(`query`: string, `options?`: RestrictOptions, `queryAccess?`: QueryAccess‹T›): *Promise‹number›*

*Defined in [index-store.ts:136](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L136)*

Count records by a given Lucene Query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query` | string | "" |
`options?` | RestrictOptions | - |
`queryAccess?` | QueryAccess‹T› | - |

**Returns:** *Promise‹number›*

___

###  countBy

▸ **countBy**(`fields`: [AnyInput](../overview.md#anyinput)‹T›, `joinBy?`: [JoinBy](../overview.md#joinby), `options?`: RestrictOptions, `queryAccess?`: QueryAccess‹T›): *Promise‹number›*

*Defined in [index-store.ts:378](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L378)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | [AnyInput](../overview.md#anyinput)‹T› |
`joinBy?` | [JoinBy](../overview.md#joinby) |
`options?` | RestrictOptions |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹number›*

___

###  countRequest

▸ **countRequest**(`params`: CountParams): *Promise‹number›*

*Defined in [index-store.ts:146](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L146)*

Count records by a given Elasticsearch Query DSL

**Parameters:**

Name | Type |
------ | ------ |
`params` | CountParams |

**Returns:** *Promise‹number›*

___

###  create

▸ **create**(`doc`: Partial‹T›, `params?`: PartialParam‹CreateDocumentParams, "body"›): *Promise‹T›*

*Defined in [index-store.ts:168](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L168)*

Create a document but will throw if doc already exists

**Parameters:**

Name | Type |
------ | ------ |
`doc` | Partial‹T› |
`params?` | PartialParam‹CreateDocumentParams, "body"› |

**Returns:** *Promise‹T›*

the created record

___

###  createById

▸ **createById**(`id`: string, `doc`: Partial‹T›, `params?`: PartialParam‹CreateDocumentParams, "id" | "body"›): *Promise‹T›*

*Defined in [index-store.ts:158](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L158)*

Create a document with an id

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`doc` | Partial‹T› |
`params?` | PartialParam‹CreateDocumentParams, "id" &#124; "body"› |

**Returns:** *Promise‹T›*

the created record

___

###  createJoinQuery

▸ **createJoinQuery**(`fields`: [AnyInput](../overview.md#anyinput)‹T›, `joinBy`: [JoinBy](../overview.md#joinby), `variables`: object): *xLuceneQueryResult*

*Defined in [index-store.ts:606](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L606)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`fields` | [AnyInput](../overview.md#anyinput)‹T› | - |
`joinBy` | [JoinBy](../overview.md#joinby) | "AND" |
`variables` | object |  {} |

**Returns:** *xLuceneQueryResult*

___

###  deleteById

▸ **deleteById**(`id`: string, `params?`: PartialParam‹DeleteDocumentParams›): *Promise‹void›*

*Defined in [index-store.ts:282](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L282)*

Deletes a document for a given id

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`params?` | PartialParam‹DeleteDocumentParams› |

**Returns:** *Promise‹void›*

___

###  exists

▸ **exists**(`id`: string[] | string, `options?`: RestrictOptions, `queryAccess?`: QueryAccess‹T›): *Promise‹boolean›*

*Defined in [index-store.ts:388](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L388)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] &#124; string |
`options?` | RestrictOptions |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹boolean›*

___

###  findAll

▸ **findAll**(`ids`: string[] | string | undefined, `options?`: i.FindOneOptions‹T›, `queryAccess?`: QueryAccess‹T›): *Promise‹T[]›*

*Defined in [index-store.ts:484](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L484)*

**Parameters:**

Name | Type |
------ | ------ |
`ids` | string[] &#124; string &#124; undefined |
`options?` | i.FindOneOptions‹T› |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹T[]›*

___

###  findAllBy

▸ **findAllBy**(`fields`: [AnyInput](../overview.md#anyinput)‹T›, `joinBy?`: [JoinBy](../overview.md#joinby), `options?`: i.FindOptions‹T›, `queryAccess?`: QueryAccess‹T›): *Promise‹T[]›*

*Defined in [index-store.ts:436](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L436)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | [AnyInput](../overview.md#anyinput)‹T› |
`joinBy?` | [JoinBy](../overview.md#joinby) |
`options?` | i.FindOptions‹T› |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹T[]›*

___

###  findAndApply

▸ **findAndApply**(`updates`: Partial‹T› | undefined, `options?`: i.FindOneOptions‹T›, `queryAccess?`: QueryAccess‹T›): *Promise‹Partial‹T››*

*Defined in [index-store.ts:466](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L466)*

**Parameters:**

Name | Type |
------ | ------ |
`updates` | Partial‹T› &#124; undefined |
`options?` | i.FindOneOptions‹T› |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹Partial‹T››*

___

###  findBy

▸ **findBy**(`fields`: [AnyInput](../overview.md#anyinput)‹T›, `joinBy?`: [JoinBy](../overview.md#joinby), `options?`: i.FindOneOptions‹T›, `queryAccess?`: QueryAccess‹T›): *Promise‹T›*

*Defined in [index-store.ts:403](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L403)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | [AnyInput](../overview.md#anyinput)‹T› |
`joinBy?` | [JoinBy](../overview.md#joinby) |
`options?` | i.FindOneOptions‹T› |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹T›*

___

###  findById

▸ **findById**(`id`: string, `options?`: i.FindOneOptions‹T›, `queryAccess?`: QueryAccess‹T›): *Promise‹T›*

*Defined in [index-store.ts:454](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L454)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | i.FindOneOptions‹T› |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹T›*

___

###  flush

▸ **flush**(`flushAll`: boolean): *Promise‹void›*

*Defined in [index-store.ts:181](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L181)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`flushAll` | boolean | false |

**Returns:** *Promise‹void›*

___

###  get

▸ **get**(`id`: string, `params?`: PartialParam‹GetParams›): *Promise‹T›*

*Defined in [index-store.ts:198](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L198)*

Get a single document

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`params?` | PartialParam‹GetParams› |

**Returns:** *Promise‹T›*

___

###  getDefaultParams

▸ **getDefaultParams**(...`params`: any[]): *any*

*Defined in [index-store.ts:366](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L366)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *any*

___

###  index

▸ **index**(`doc`: T | Partial‹T›, `params?`: PartialParam‹IndexDocumentParams‹T›, "body"›): *Promise‹T›*

*Defined in [index-store.ts:227](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L227)*

Index a document

**Parameters:**

Name | Type |
------ | ------ |
`doc` | T &#124; Partial‹T› |
`params?` | PartialParam‹IndexDocumentParams‹T›, "body"› |

**Returns:** *Promise‹T›*

___

###  indexById

▸ **indexById**(`id`: string, `doc`: T | Partial‹T›, `params?`: PartialParam‹IndexDocumentParams‹T›, "index" | "type" | "id"›): *Promise‹T›*

*Defined in [index-store.ts:243](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L243)*

A convenience method for indexing a document with an ID

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`doc` | T &#124; Partial‹T› |
`params?` | PartialParam‹IndexDocumentParams‹T›, "index" &#124; "type" &#124; "id"› |

**Returns:** *Promise‹T›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Defined in [index-store.ts:212](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L212)*

Connect and validate the index configuration.

**Returns:** *Promise‹void›*

___

###  mget

▸ **mget**(`body`: any, `params?`: PartialParam‹MGetParams›): *Promise‹T[]›*

*Defined in [index-store.ts:249](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L249)*

Get multiple documents at the same time

**Parameters:**

Name | Type |
------ | ------ |
`body` | any |
`params?` | PartialParam‹MGetParams› |

**Returns:** *Promise‹T[]›*

___

###  migrateIndex

▸ **migrateIndex**(`options`: i.MigrateIndexStoreOptions): *Promise‹any›*

*Defined in [index-store.ts:261](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L261)*

**`see`** IndexManager#migrateIndex

**Parameters:**

Name | Type |
------ | ------ |
`options` | i.MigrateIndexStoreOptions |

**Returns:** *Promise‹any›*

___

###  refresh

▸ **refresh**(`params?`: PartialParam‹IndicesRefreshParams›): *Promise‹void›*

*Defined in [index-store.ts:268](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L268)*

Refreshes the current index

**Parameters:**

Name | Type |
------ | ------ |
`params?` | PartialParam‹IndicesRefreshParams› |

**Returns:** *Promise‹void›*

___

###  removeFromArray

▸ **removeFromArray**(`id`: string, `field`: keyof T, `values`: string[] | string): *Promise‹void›*

*Defined in [index-store.ts:651](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L651)*

Remove values from an array on a record.
Use with caution, this may not work in all cases.

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof T |
`values` | string[] &#124; string |

**Returns:** *Promise‹void›*

___

###  search

▸ **search**(`q`: string, `options`: i.FindOptions‹T›, `queryAccess?`: QueryAccess‹T›, `critical?`: undefined | false | true): *Promise‹i.SearchResult‹T››*

*Defined in [index-store.ts:520](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L520)*

Search with a given Lucene Query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`q` | string | "" |
`options` | i.FindOptions‹T› |  {} |
`queryAccess?` | QueryAccess‹T› | - |
`critical?` | undefined &#124; false &#124; true | - |

**Returns:** *Promise‹i.SearchResult‹T››*

___

###  searchRequest

▸ **searchRequest**(`params`: PartialParam‹SearchParams‹T››, `critical?`: undefined | false | true): *Promise‹i.SearchResult‹T››*

*Defined in [index-store.ts:554](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L554)*

Search using the underyling Elasticsearch Query DSL

**Parameters:**

Name | Type |
------ | ------ |
`params` | PartialParam‹SearchParams‹T›› |
`critical?` | undefined &#124; false &#124; true |

**Returns:** *Promise‹i.SearchResult‹T››*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Defined in [index-store.ts:300](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L300)*

Shutdown, flush any pending requests and cleanup

**Returns:** *Promise‹void›*

___

###  update

▸ **update**(`id`: string, `body`: [UpdateBody](../overview.md#updatebody)‹T›, `params?`: PartialParam‹UpdateDocumentParams, "body" | "id"›): *Promise‹void›*

*Defined in [index-store.ts:313](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L313)*

Update a document with a given id

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`body` | [UpdateBody](../overview.md#updatebody)‹T› |
`params?` | PartialParam‹UpdateDocumentParams, "body" &#124; "id"› |

**Returns:** *Promise‹void›*

___

###  updatePartial

▸ **updatePartial**(`id`: string, `applyChanges`: ApplyPartialUpdates‹T›, `retriesOnConlfict`: number): *Promise‹T›*

*Defined in [index-store.ts:335](https://github.com/terascope/teraslice/blob/b843209f9/packages/elasticsearch-store/src/index-store.ts#L335)*

Safely apply updates to a document by applying the latest changes

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`id` | string | - |
`applyChanges` | ApplyPartialUpdates‹T› | - |
`retriesOnConlfict` | number | 3 |

**Returns:** *Promise‹T›*
