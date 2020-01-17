---
title: Elasticsearch Store: `IndexStore`
sidebar_label: IndexStore
---

# Class: IndexStore <**T**>

**`todo`** add the ability to enable/disable refresh by default

## Type parameters

▪ **T**: *Record‹string, any›*

## Hierarchy

* **IndexStore**

  ↳ [IndexModel](indexmodel.md)

## Index

### Constructors

* [constructor](indexstore.md#constructor)

### Properties

* [client](indexstore.md#client)
* [config](indexstore.md#config)
* [indexQuery](indexstore.md#indexquery)
* [manager](indexstore.md#manager)
* [name](indexstore.md#name)
* [readHooks](indexstore.md#readhooks)
* [refreshByDefault](indexstore.md#refreshbydefault)
* [writeHooks](indexstore.md#writehooks)
* [xluceneTypeConfig](indexstore.md#xlucenetypeconfig)

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

*Defined in [index-store.ts:37](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`config` | [IndexConfig](../interfaces/indexconfig.md)‹T› |

**Returns:** *[IndexStore](indexstore.md)*

## Properties

###  client

• **client**: *Client*

*Defined in [index-store.ts:19](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L19)*

___

###  config

• **config**: *[IndexConfig](../interfaces/indexconfig.md)*

*Defined in [index-store.ts:20](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L20)*

___

###  indexQuery

• **indexQuery**: *string*

*Defined in [index-store.ts:21](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L21)*

___

###  manager

• **manager**: *[IndexManager](indexmanager.md)*

*Defined in [index-store.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L22)*

___

###  name

• **name**: *string*

*Defined in [index-store.ts:23](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L23)*

___

###  readHooks

• **readHooks**: *Set‹function›* =  new Set<ReadHook<T>>()

*Defined in [index-store.ts:28](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L28)*

___

###  refreshByDefault

• **refreshByDefault**: *boolean* = true

*Defined in [index-store.ts:24](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L24)*

___

###  writeHooks

• **writeHooks**: *Set‹function›* =  new Set<WriteHook<T>>()

*Defined in [index-store.ts:27](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L27)*

___

###  xluceneTypeConfig

• **xluceneTypeConfig**: *TypeConfig | undefined*

*Defined in [index-store.ts:25](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L25)*

## Methods

### `Protected` _toRecord

▸ **_toRecord**(`result`: RecordResponse‹T›, `critical`: boolean): *T*

*Defined in [index-store.ts:685](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L685)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`result` | RecordResponse‹T› | - |
`critical` | boolean | true |

**Returns:** *T*

___

### `Protected` _toRecords

▸ **_toRecords**(`results`: RecordResponse‹T›[], `critical`: boolean): *T[]*

*Defined in [index-store.ts:695](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L695)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`results` | RecordResponse‹T›[] | - |
`critical` | boolean | false |

**Returns:** *T[]*

___

###  appendToArray

▸ **appendToArray**(`id`: string, `field`: keyof T, `values`: string[] | string): *Promise‹void›*

*Defined in [index-store.ts:605](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L605)*

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

*Defined in [index-store.ts:91](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L91)*

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

*Defined in [index-store.ts:92](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`action` | "index" &#124; "create" |
`doc?` | Partial‹T› |
`id?` | undefined &#124; string |

**Returns:** *Promise‹void›*

▸ **bulk**(`action`: "update", `doc?`: Partial‹T›, `id?`: undefined | string): *Promise‹void›*

*Defined in [index-store.ts:93](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L93)*

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

*Defined in [index-store.ts:134](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L134)*

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

▸ **countBy**(`fields`: [AnyInput](../overview.md#anyinput)‹T›, `joinBy?`: [JoinBy](../overview.md#joinby), `options?`: RestrictOptions): *Promise‹number›*

*Defined in [index-store.ts:375](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L375)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | [AnyInput](../overview.md#anyinput)‹T› |
`joinBy?` | [JoinBy](../overview.md#joinby) |
`options?` | RestrictOptions |

**Returns:** *Promise‹number›*

___

###  countRequest

▸ **countRequest**(`params`: CountParams): *Promise‹number›*

*Defined in [index-store.ts:144](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L144)*

Count records by a given Elasticsearch Query DSL

**Parameters:**

Name | Type |
------ | ------ |
`params` | CountParams |

**Returns:** *Promise‹number›*

___

###  create

▸ **create**(`doc`: Partial‹T›, `params?`: PartialParam‹CreateDocumentParams, "body"›): *Promise‹T›*

*Defined in [index-store.ts:166](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L166)*

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

*Defined in [index-store.ts:156](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L156)*

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

▸ **createJoinQuery**(`fields`: [AnyInput](../overview.md#anyinput)‹T›, `joinBy`: [JoinBy](../overview.md#joinby), `variables`: object): *JoinQueryResult*

*Defined in [index-store.ts:590](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L590)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`fields` | [AnyInput](../overview.md#anyinput)‹T› | - |
`joinBy` | [JoinBy](../overview.md#joinby) | "AND" |
`variables` | object |  {} |

**Returns:** *JoinQueryResult*

___

###  deleteById

▸ **deleteById**(`id`: string, `params?`: PartialParam‹DeleteDocumentParams›): *Promise‹void›*

*Defined in [index-store.ts:280](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L280)*

Deletes a document for a given id

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`params?` | PartialParam‹DeleteDocumentParams› |

**Returns:** *Promise‹void›*

___

###  exists

▸ **exists**(`id`: string[] | string): *Promise‹boolean›*

*Defined in [index-store.ts:384](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L384)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] &#124; string |

**Returns:** *Promise‹boolean›*

___

###  findAll

▸ **findAll**(`ids`: string[] | string | undefined, `options?`: i.FindOneOptions‹T›, `queryAccess?`: QueryAccess‹T›): *Promise‹T[]›*

*Defined in [index-store.ts:474](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L474)*

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

*Defined in [index-store.ts:428](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L428)*

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

*Defined in [index-store.ts:456](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L456)*

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

*Defined in [index-store.ts:395](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L395)*

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

*Defined in [index-store.ts:444](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L444)*

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

*Defined in [index-store.ts:179](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L179)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`flushAll` | boolean | false |

**Returns:** *Promise‹void›*

___

###  get

▸ **get**(`id`: string, `params?`: PartialParam‹GetParams›): *Promise‹T›*

*Defined in [index-store.ts:196](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L196)*

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

*Defined in [index-store.ts:365](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L365)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *any*

___

###  index

▸ **index**(`doc`: T | Partial‹T›, `params?`: PartialParam‹IndexDocumentParams‹T›, "body"›): *Promise‹T›*

*Defined in [index-store.ts:225](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L225)*

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

*Defined in [index-store.ts:241](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L241)*

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

*Defined in [index-store.ts:210](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L210)*

Connect and validate the index configuration.

**Returns:** *Promise‹void›*

___

###  mget

▸ **mget**(`body`: any, `params?`: PartialParam‹MGetParams›): *Promise‹T[]›*

*Defined in [index-store.ts:247](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L247)*

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

*Defined in [index-store.ts:259](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L259)*

**`see`** IndexManager#migrateIndex

**Parameters:**

Name | Type |
------ | ------ |
`options` | i.MigrateIndexStoreOptions |

**Returns:** *Promise‹any›*

___

###  refresh

▸ **refresh**(`params?`: PartialParam‹IndicesRefreshParams›): *Promise‹void›*

*Defined in [index-store.ts:266](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L266)*

Refreshes the current index

**Parameters:**

Name | Type |
------ | ------ |
`params?` | PartialParam‹IndicesRefreshParams› |

**Returns:** *Promise‹void›*

___

###  removeFromArray

▸ **removeFromArray**(`id`: string, `field`: keyof T, `values`: string[] | string): *Promise‹void›*

*Defined in [index-store.ts:635](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L635)*

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

▸ **search**(`q`: string, `options`: i.FindOptions‹T›, `queryAccess?`: QueryAccess‹T›, `critical?`: undefined | false | true): *Promise‹T[]›*

*Defined in [index-store.ts:510](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L510)*

Search with a given Lucene Query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`q` | string | "" |
`options` | i.FindOptions‹T› |  {} |
`queryAccess?` | QueryAccess‹T› | - |
`critical?` | undefined &#124; false &#124; true | - |

**Returns:** *Promise‹T[]›*

___

###  searchRequest

▸ **searchRequest**(`params`: PartialParam‹SearchParams‹T››, `critical?`: undefined | false | true): *Promise‹T[]›*

*Defined in [index-store.ts:543](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L543)*

Search using the underyling Elasticsearch Query DSL

**Parameters:**

Name | Type |
------ | ------ |
`params` | PartialParam‹SearchParams‹T›› |
`critical?` | undefined &#124; false &#124; true |

**Returns:** *Promise‹T[]›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Defined in [index-store.ts:298](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L298)*

Shutdown, flush any pending requests and cleanup

**Returns:** *Promise‹void›*

___

###  update

▸ **update**(`id`: string, `body`: [UpdateBody](../overview.md#updatebody)‹T›, `params?`: PartialParam‹UpdateDocumentParams, "body" | "id"›): *Promise‹void›*

*Defined in [index-store.ts:311](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L311)*

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

*Defined in [index-store.ts:333](https://github.com/terascope/teraslice/blob/78714a985/packages/elasticsearch-store/src/index-store.ts#L333)*

Safely apply updates to a document by applying the latest changes

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`id` | string | - |
`applyChanges` | ApplyPartialUpdates‹T› | - |
`retriesOnConlfict` | number | 3 |

**Returns:** *Promise‹T›*
