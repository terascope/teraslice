---
title: Elasticsearch Store: `IndexModel`
sidebar_label: IndexModel
---

# Class: IndexModel <**T**>

An high-level, opionionated, abstract class
for an elasticsearch DataType, with a CRUD-like interface

## Type parameters

▪ **T**: *[IndexModelRecord](../interfaces/indexmodelrecord.md)*

## Hierarchy

* [IndexStore](indexstore.md)‹T›

  ↳ **IndexModel**

## Index

### Constructors

* [constructor](indexmodel.md#constructor)

### Properties

* [_defaultQueryAccess](indexmodel.md#protected-_defaultqueryaccess)
* [client](indexmodel.md#client)
* [config](indexmodel.md#config)
* [indexQuery](indexmodel.md#indexquery)
* [logger](indexmodel.md#logger)
* [manager](indexmodel.md#manager)
* [name](indexmodel.md#name)
* [readHooks](indexmodel.md#readhooks)
* [refreshByDefault](indexmodel.md#refreshbydefault)
* [writeHooks](indexmodel.md#writehooks)
* [xluceneTypeConfig](indexmodel.md#xlucenetypeconfig)

### Methods

* [_ensureUnique](indexmodel.md#protected-_ensureunique)
* [_sanitizeRecord](indexmodel.md#protected-_sanitizerecord)
* [_toRecord](indexmodel.md#protected-_torecord)
* [_toRecords](indexmodel.md#protected-_torecords)
* [appendToArray](indexmodel.md#appendtoarray)
* [bulk](indexmodel.md#bulk)
* [count](indexmodel.md#count)
* [countBy](indexmodel.md#countby)
* [countRecords](indexmodel.md#countrecords)
* [countRequest](indexmodel.md#countrequest)
* [create](indexmodel.md#create)
* [createById](indexmodel.md#createbyid)
* [createJoinQuery](indexmodel.md#createjoinquery)
* [createRecord](indexmodel.md#createrecord)
* [deleteById](indexmodel.md#deletebyid)
* [deleteRecord](indexmodel.md#deleterecord)
* [exists](indexmodel.md#exists)
* [fetchRecord](indexmodel.md#fetchrecord)
* [findAll](indexmodel.md#findall)
* [findAllBy](indexmodel.md#findallby)
* [findAndApply](indexmodel.md#findandapply)
* [findBy](indexmodel.md#findby)
* [findById](indexmodel.md#findbyid)
* [flush](indexmodel.md#flush)
* [get](indexmodel.md#get)
* [getDefaultParams](indexmodel.md#getdefaultparams)
* [index](indexmodel.md#index)
* [indexById](indexmodel.md#indexbyid)
* [initialize](indexmodel.md#initialize)
* [mget](indexmodel.md#mget)
* [migrateIndex](indexmodel.md#migrateindex)
* [recordExists](indexmodel.md#recordexists)
* [refresh](indexmodel.md#refresh)
* [removeFromArray](indexmodel.md#removefromarray)
* [search](indexmodel.md#search)
* [searchRequest](indexmodel.md#searchrequest)
* [shutdown](indexmodel.md#shutdown)
* [update](indexmodel.md#update)
* [updatePartial](indexmodel.md#updatepartial)
* [updateRecord](indexmodel.md#updaterecord)

## Constructors

###  constructor

\+ **new IndexModel**(`client`: Client, `options`: [IndexModelOptions](../interfaces/indexmodeloptions.md), `modelConfig`: [IndexModelConfig](../interfaces/indexmodelconfig.md)‹T›): *[IndexModel](indexmodel.md)*

*Overrides [IndexStore](indexstore.md).[constructor](indexstore.md#constructor)*

*Defined in [index-model.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`options` | [IndexModelOptions](../interfaces/indexmodeloptions.md) |
`modelConfig` | [IndexModelConfig](../interfaces/indexmodelconfig.md)‹T› |

**Returns:** *[IndexModel](indexmodel.md)*

## Properties

### `Protected` _defaultQueryAccess

• **_defaultQueryAccess**: *QueryAccess‹T› | undefined*

*Inherited from [IndexStore](indexstore.md).[_defaultQueryAccess](indexstore.md#protected-_defaultqueryaccess)*

*Defined in [index-store.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L20)*

___

###  client

• **client**: *Client*

*Inherited from [IndexStore](indexstore.md).[client](indexstore.md#client)*

*Defined in [index-store.ts:14](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L14)*

___

###  config

• **config**: *[IndexConfig](../interfaces/indexconfig.md)*

*Inherited from [IndexStore](indexstore.md).[config](indexstore.md#config)*

*Defined in [index-store.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L15)*

___

###  indexQuery

• **indexQuery**: *string*

*Inherited from [IndexStore](indexstore.md).[indexQuery](indexstore.md#indexquery)*

*Defined in [index-store.ts:16](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L16)*

___

###  logger

• **logger**: *Logger*

*Defined in [index-model.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L15)*

___

###  manager

• **manager**: *[IndexManager](indexmanager.md)*

*Inherited from [IndexStore](indexstore.md).[manager](indexstore.md#manager)*

*Defined in [index-store.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L17)*

___

###  name

• **name**: *string*

*Overrides [IndexStore](indexstore.md).[name](indexstore.md#name)*

*Defined in [index-model.ts:14](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L14)*

___

###  readHooks

• **readHooks**: *Set‹function›* =  new Set<ReadHook<T>>()

*Inherited from [IndexStore](indexstore.md).[readHooks](indexstore.md#readhooks)*

*Defined in [index-store.ts:24](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L24)*

___

###  refreshByDefault

• **refreshByDefault**: *boolean* = true

*Inherited from [IndexStore](indexstore.md).[refreshByDefault](indexstore.md#refreshbydefault)*

*Defined in [index-store.ts:19](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L19)*

___

###  writeHooks

• **writeHooks**: *Set‹function›* =  new Set<WriteHook<T>>()

*Inherited from [IndexStore](indexstore.md).[writeHooks](indexstore.md#writehooks)*

*Defined in [index-store.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L23)*

___

###  xluceneTypeConfig

• **xluceneTypeConfig**: *XluceneTypeConfig*

*Inherited from [IndexStore](indexstore.md).[xluceneTypeConfig](indexstore.md#xlucenetypeconfig)*

*Defined in [index-store.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L21)*

## Methods

### `Protected` _ensureUnique

▸ **_ensureUnique**(`record`: T, `existing?`: T): *Promise‹void›*

*Defined in [index-model.ts:191](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L191)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | T |
`existing?` | T |

**Returns:** *Promise‹void›*

___

### `Protected` _sanitizeRecord

▸ **_sanitizeRecord**(`record`: T): *T*

*Defined in [index-model.ts:167](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L167)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | T |

**Returns:** *T*

___

### `Protected` _toRecord

▸ **_toRecord**(`result`: RecordResponse‹T›, `critical`: boolean): *T*

*Inherited from [IndexStore](indexstore.md).[_toRecord](indexstore.md#protected-_torecord)*

*Defined in [index-store.ts:688](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L688)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`result` | RecordResponse‹T› | - |
`critical` | boolean | true |

**Returns:** *T*

___

### `Protected` _toRecords

▸ **_toRecords**(`results`: RecordResponse‹T›[], `critical`: boolean): *T[]*

*Inherited from [IndexStore](indexstore.md).[_toRecords](indexstore.md#protected-_torecords)*

*Defined in [index-store.ts:698](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L698)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`results` | RecordResponse‹T›[] | - |
`critical` | boolean | false |

**Returns:** *T[]*

___

###  appendToArray

▸ **appendToArray**(`id`: string, `field`: keyof T, `values`: string[] | string): *Promise‹void›*

*Inherited from [IndexStore](indexstore.md).[appendToArray](indexstore.md#appendtoarray)*

*Defined in [index-store.ts:608](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L608)*

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

*Inherited from [IndexStore](indexstore.md).[bulk](indexstore.md#bulk)*

*Defined in [index-store.ts:88](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L88)*

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

*Inherited from [IndexStore](indexstore.md).[bulk](indexstore.md#bulk)*

*Defined in [index-store.ts:89](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`action` | "index" &#124; "create" |
`doc?` | Partial‹T› |
`id?` | undefined &#124; string |

**Returns:** *Promise‹void›*

▸ **bulk**(`action`: "update", `doc?`: Partial‹T›, `id?`: undefined | string): *Promise‹void›*

*Inherited from [IndexStore](indexstore.md).[bulk](indexstore.md#bulk)*

*Defined in [index-store.ts:90](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L90)*

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

*Inherited from [IndexStore](indexstore.md).[count](indexstore.md#count)*

*Defined in [index-store.ts:131](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L131)*

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

*Inherited from [IndexStore](indexstore.md).[countBy](indexstore.md#countby)*

*Defined in [index-store.ts:372](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L372)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | [AnyInput](../overview.md#anyinput)‹T› |
`joinBy?` | [JoinBy](../overview.md#joinby) |
`options?` | RestrictOptions |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹number›*

___

###  countRecords

▸ **countRecords**(`fields`: [AnyInput](../overview.md#anyinput)‹T›, `clientId?`: undefined | number, `joinBy?`: [JoinBy](../overview.md#joinby), `options?`: RestrictOptions, `queryAccess?`: QueryAccess‹T›): *Promise‹number›*

*Defined in [index-model.ts:140](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L140)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | [AnyInput](../overview.md#anyinput)‹T› |
`clientId?` | undefined &#124; number |
`joinBy?` | [JoinBy](../overview.md#joinby) |
`options?` | RestrictOptions |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹number›*

___

###  countRequest

▸ **countRequest**(`params`: CountParams): *Promise‹number›*

*Inherited from [IndexStore](indexstore.md).[countRequest](indexstore.md#countrequest)*

*Defined in [index-store.ts:141](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L141)*

Count records by a given Elasticsearch Query DSL

**Parameters:**

Name | Type |
------ | ------ |
`params` | CountParams |

**Returns:** *Promise‹number›*

___

###  create

▸ **create**(`doc`: Partial‹T›, `params?`: PartialParam‹CreateDocumentParams, "body"›): *Promise‹T›*

*Inherited from [IndexStore](indexstore.md).[create](indexstore.md#create)*

*Defined in [index-store.ts:163](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L163)*

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

*Inherited from [IndexStore](indexstore.md).[createById](indexstore.md#createbyid)*

*Defined in [index-store.ts:153](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L153)*

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

▸ **createJoinQuery**(`fields`: [AnyInput](../overview.md#anyinput)‹T›, `joinBy`: [JoinBy](../overview.md#joinby), `variables`: object): *XluceneQueryResult*

*Inherited from [IndexStore](indexstore.md).[createJoinQuery](indexstore.md#createjoinquery)*

*Defined in [index-store.ts:593](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L593)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`fields` | [AnyInput](../overview.md#anyinput)‹T› | - |
`joinBy` | [JoinBy](../overview.md#joinby) | "AND" |
`variables` | object |  {} |

**Returns:** *XluceneQueryResult*

___

###  createRecord

▸ **createRecord**(`record`: i.CreateRecordInput‹T›): *Promise‹T›*

*Defined in [index-model.ts:89](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | i.CreateRecordInput‹T› |

**Returns:** *Promise‹T›*

___

###  deleteById

▸ **deleteById**(`id`: string, `params?`: PartialParam‹DeleteDocumentParams›): *Promise‹void›*

*Inherited from [IndexStore](indexstore.md).[deleteById](indexstore.md#deletebyid)*

*Defined in [index-store.ts:277](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L277)*

Deletes a document for a given id

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`params?` | PartialParam‹DeleteDocumentParams› |

**Returns:** *Promise‹void›*

___

###  deleteRecord

▸ **deleteRecord**(`id`: string, `clientId?`: undefined | number): *Promise‹boolean›*

*Defined in [index-model.ts:125](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L125)*

Soft deletes a record by ID

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`clientId?` | undefined &#124; number |

**Returns:** *Promise‹boolean›*

___

###  exists

▸ **exists**(`id`: string[] | string, `options?`: RestrictOptions, `queryAccess?`: QueryAccess‹T›): *Promise‹boolean›*

*Inherited from [IndexStore](indexstore.md).[exists](indexstore.md#exists)*

*Defined in [index-store.ts:382](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L382)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] &#124; string |
`options?` | RestrictOptions |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹boolean›*

___

###  fetchRecord

▸ **fetchRecord**(`anyId`: string, `options?`: i.FindOneOptions‹T›, `queryAccess?`: QueryAccess‹T›): *Promise‹T›*

*Defined in [index-model.ts:74](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L74)*

Fetch a record by any unique ID

**Parameters:**

Name | Type |
------ | ------ |
`anyId` | string |
`options?` | i.FindOneOptions‹T› |
`queryAccess?` | QueryAccess‹T› |

**Returns:** *Promise‹T›*

___

###  findAll

▸ **findAll**(`ids`: string[] | string | undefined, `options?`: i.FindOneOptions‹T›, `queryAccess?`: QueryAccess‹T›): *Promise‹T[]›*

*Inherited from [IndexStore](indexstore.md).[findAll](indexstore.md#findall)*

*Defined in [index-store.ts:476](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L476)*

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

*Inherited from [IndexStore](indexstore.md).[findAllBy](indexstore.md#findallby)*

*Defined in [index-store.ts:430](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L430)*

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

*Inherited from [IndexStore](indexstore.md).[findAndApply](indexstore.md#findandapply)*

*Defined in [index-store.ts:458](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L458)*

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

*Inherited from [IndexStore](indexstore.md).[findBy](indexstore.md#findby)*

*Defined in [index-store.ts:397](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L397)*

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

*Inherited from [IndexStore](indexstore.md).[findById](indexstore.md#findbyid)*

*Defined in [index-store.ts:446](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L446)*

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

*Inherited from [IndexStore](indexstore.md).[flush](indexstore.md#flush)*

*Defined in [index-store.ts:176](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L176)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`flushAll` | boolean | false |

**Returns:** *Promise‹void›*

___

###  get

▸ **get**(`id`: string, `params?`: PartialParam‹GetParams›): *Promise‹T›*

*Inherited from [IndexStore](indexstore.md).[get](indexstore.md#get)*

*Defined in [index-store.ts:193](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L193)*

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

*Inherited from [IndexStore](indexstore.md).[getDefaultParams](indexstore.md#getdefaultparams)*

*Defined in [index-store.ts:362](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L362)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *any*

___

###  index

▸ **index**(`doc`: T | Partial‹T›, `params?`: PartialParam‹IndexDocumentParams‹T›, "body"›): *Promise‹T›*

*Inherited from [IndexStore](indexstore.md).[index](indexstore.md#index)*

*Defined in [index-store.ts:222](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L222)*

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

*Inherited from [IndexStore](indexstore.md).[indexById](indexstore.md#indexbyid)*

*Defined in [index-store.ts:238](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L238)*

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

*Inherited from [IndexStore](indexstore.md).[initialize](indexstore.md#initialize)*

*Defined in [index-store.ts:207](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L207)*

Connect and validate the index configuration.

**Returns:** *Promise‹void›*

___

###  mget

▸ **mget**(`body`: any, `params?`: PartialParam‹MGetParams›): *Promise‹T[]›*

*Inherited from [IndexStore](indexstore.md).[mget](indexstore.md#mget)*

*Defined in [index-store.ts:244](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L244)*

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

*Inherited from [IndexStore](indexstore.md).[migrateIndex](indexstore.md#migrateindex)*

*Defined in [index-store.ts:256](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L256)*

**`see`** IndexManager#migrateIndex

**Parameters:**

Name | Type |
------ | ------ |
`options` | i.MigrateIndexStoreOptions |

**Returns:** *Promise‹any›*

___

###  recordExists

▸ **recordExists**(`id`: string[] | string, `clientId?`: undefined | number): *Promise‹boolean›*

*Defined in [index-model.ts:156](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L156)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] &#124; string |
`clientId?` | undefined &#124; number |

**Returns:** *Promise‹boolean›*

___

###  refresh

▸ **refresh**(`params?`: PartialParam‹IndicesRefreshParams›): *Promise‹void›*

*Inherited from [IndexStore](indexstore.md).[refresh](indexstore.md#refresh)*

*Defined in [index-store.ts:263](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L263)*

Refreshes the current index

**Parameters:**

Name | Type |
------ | ------ |
`params?` | PartialParam‹IndicesRefreshParams› |

**Returns:** *Promise‹void›*

___

###  removeFromArray

▸ **removeFromArray**(`id`: string, `field`: keyof T, `values`: string[] | string): *Promise‹void›*

*Inherited from [IndexStore](indexstore.md).[removeFromArray](indexstore.md#removefromarray)*

*Defined in [index-store.ts:638](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L638)*

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

*Inherited from [IndexStore](indexstore.md).[search](indexstore.md#search)*

*Defined in [index-store.ts:512](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L512)*

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

*Inherited from [IndexStore](indexstore.md).[searchRequest](indexstore.md#searchrequest)*

*Defined in [index-store.ts:546](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L546)*

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

*Inherited from [IndexStore](indexstore.md).[shutdown](indexstore.md#shutdown)*

*Defined in [index-store.ts:295](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L295)*

Shutdown, flush any pending requests and cleanup

**Returns:** *Promise‹void›*

___

###  update

▸ **update**(`id`: string, `body`: [UpdateBody](../overview.md#updatebody)‹T›, `params?`: PartialParam‹UpdateDocumentParams, "body" | "id"›): *Promise‹void›*

*Inherited from [IndexStore](indexstore.md).[update](indexstore.md#update)*

*Defined in [index-store.ts:308](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L308)*

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

*Inherited from [IndexStore](indexstore.md).[updatePartial](indexstore.md#updatepartial)*

*Defined in [index-store.ts:330](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L330)*

Safely apply updates to a document by applying the latest changes

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`id` | string | - |
`applyChanges` | ApplyPartialUpdates‹T› | - |
`retriesOnConlfict` | number | 3 |

**Returns:** *Promise‹T›*

___

###  updateRecord

▸ **updateRecord**(`id`: string, `record`: i.UpdateRecordInput‹T›): *Promise‹T›*

*Defined in [index-model.ts:106](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-model.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`record` | i.UpdateRecordInput‹T› |

**Returns:** *Promise‹T›*
