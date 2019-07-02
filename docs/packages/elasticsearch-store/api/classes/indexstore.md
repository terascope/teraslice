---
title: Elasticsearch Store :: IndexStore
sidebar_label: IndexStore
---

# Class: IndexStore <**T, I**>

**`todo`** add the ability to enable/disable refresh by default

## Type parameters

▪ **T**: *`Object`*

▪ **I**: *`Partial<T>`*

## Hierarchy

* **IndexStore**

### Index

#### Constructors

* [constructor](indexstore.md#constructor)

#### Properties

* [client](indexstore.md#client)
* [config](indexstore.md#config)
* [indexQuery](indexstore.md#indexquery)
* [manager](indexstore.md#manager)
* [refreshByDefault](indexstore.md#refreshbydefault)
* [validateRecord](indexstore.md#validaterecord)

#### Methods

* [_count](indexstore.md#_count)
* [_search](indexstore.md#_search)
* [bulk](indexstore.md#bulk)
* [count](indexstore.md#count)
* [create](indexstore.md#create)
* [createWithId](indexstore.md#createwithid)
* [flush](indexstore.md#flush)
* [get](indexstore.md#get)
* [getDefaultParams](indexstore.md#getdefaultparams)
* [index](indexstore.md#index)
* [indexWithId](indexstore.md#indexwithid)
* [initialize](indexstore.md#initialize)
* [mget](indexstore.md#mget)
* [refresh](indexstore.md#refresh)
* [remove](indexstore.md#remove)
* [search](indexstore.md#search)
* [shutdown](indexstore.md#shutdown)
* [update](indexstore.md#update)
* [updatePartial](indexstore.md#updatepartial)

## Constructors

###  constructor

\+ **new IndexStore**(`client`: *`Client`*, `config`: *[IndexConfig](../interfaces/indexconfig.md)‹*`T`*›*): *[IndexStore](indexstore.md)*

*Defined in [index-store.ts:29](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | `Client` |
`config` | [IndexConfig](../interfaces/indexconfig.md)‹*`T`*› |

**Returns:** *[IndexStore](indexstore.md)*

## Properties

###  client

• **client**: *`Client`*

*Defined in [index-store.ts:13](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L13)*

___

###  config

• **config**: *[IndexConfig](../interfaces/indexconfig.md)*

*Defined in [index-store.ts:14](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L14)*

___

###  indexQuery

• **indexQuery**: *string*

*Defined in [index-store.ts:15](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L15)*

___

###  manager

• **manager**: *[IndexManager](indexmanager.md)*

*Defined in [index-store.ts:16](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L16)*

___

###  refreshByDefault

• **refreshByDefault**: *boolean* = true

*Defined in [index-store.ts:17](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L17)*

___

###  validateRecord

• **validateRecord**: *`ValidateFn<I | T>`*

*Defined in [index-store.ts:19](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L19)*

## Methods

###  _count

▸ **_count**(`params`: *`CountParams`*): *`Promise<number>`*

*Defined in [index-store.ts:158](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L158)*

Count records by a given Elasticsearch Query DSL

**Parameters:**

Name | Type |
------ | ------ |
`params` | `CountParams` |

**Returns:** *`Promise<number>`*

___

###  _search

▸ **_search**(`params`: *`PartialParam<SearchParams<T>>`*): *`Promise<T[]>`*

*Defined in [index-store.ts:334](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L334)*

Search an Elasticsearch Query DSL

**Parameters:**

Name | Type |
------ | ------ |
`params` | `PartialParam<SearchParams<T>>` |

**Returns:** *`Promise<T[]>`*

___

###  bulk

▸ **bulk**(`action`: *"delete"*, `id?`: *undefined | string*): *`Promise<void>`*

*Defined in [index-store.ts:110](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L110)*

Safely add a create, index, or update requests to the bulk queue

This method will batch messages using the configured
bulk max size and wait configuration.

**`todo`** we need to add concurrency support for sending multiple bulk requests in flight

**Parameters:**

Name | Type |
------ | ------ |
`action` | "delete" |
`id?` | undefined \| string |

**Returns:** *`Promise<void>`*

▸ **bulk**(`action`: *"index" | "create"*, `doc?`: *[I]()*, `id?`: *undefined | string*): *`Promise<void>`*

*Defined in [index-store.ts:111](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L111)*

**Parameters:**

Name | Type |
------ | ------ |
`action` | "index" \| "create" |
`doc?` | [I]() |
`id?` | undefined \| string |

**Returns:** *`Promise<void>`*

▸ **bulk**(`action`: *"update"*, `doc?`: *`Partial<T>`*, `id?`: *undefined | string*): *`Promise<void>`*

*Defined in [index-store.ts:112](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`action` | "update" |
`doc?` | `Partial<T>` |
`id?` | undefined \| string |

**Returns:** *`Promise<void>`*

___

###  count

▸ **count**(`query`: *string*, `params?`: *`PartialParam<CountParams, "q" | "body">`*): *`Promise<number>`*

*Defined in [index-store.ts:150](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L150)*

Count records by a given Lucene Query

**Parameters:**

Name | Type |
------ | ------ |
`query` | string |
`params?` | `PartialParam<CountParams, "q" \| "body">` |

**Returns:** *`Promise<number>`*

___

###  create

▸ **create**(`doc`: *`T` | `I`*, `params?`: *`PartialParam<CreateDocumentParams, "body">`*): *`Promise<T>`*

*Defined in [index-store.ts:179](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L179)*

Create a document but will throw if doc already exists

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `T` \| `I` |
`params?` | `PartialParam<CreateDocumentParams, "body">` |

**Returns:** *`Promise<T>`*

a boolean to indicate whether the document was created

___

###  createWithId

▸ **createWithId**(`doc`: *`T` | `I`*, `id`: *string*, `params?`: *`PartialParam<CreateDocumentParams, "id" | "body">`*): *`Promise<T>`*

*Defined in [index-store.ts:170](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L170)*

Create a document with an id

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `T` \| `I` |
`id` | string |
`params?` | `PartialParam<CreateDocumentParams, "id" \| "body">` |

**Returns:** *`Promise<T>`*

a boolean to indicate whether the document was created

___

###  flush

▸ **flush**(`flushAll`: *boolean*): *`Promise<void>`*

*Defined in [index-store.ts:194](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L194)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`flushAll` | boolean | false |

**Returns:** *`Promise<void>`*

___

###  get

▸ **get**(`id`: *string*, `params?`: *`PartialParam<GetParams>`*): *`Promise<T>`*

*Defined in [index-store.ts:213](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L213)*

Get a single document

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`params?` | `PartialParam<GetParams>` |

**Returns:** *`Promise<T>`*

___

###  getDefaultParams

▸ **getDefaultParams**(...`params`: *any[]*): *any*

*Defined in [index-store.ts:405](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L405)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | any[] |

**Returns:** *any*

___

###  index

▸ **index**(`doc`: *`T` | `I`*, `params?`: *`PartialParam<IndexDocumentParams<T>, "body">`*): *`Promise<T>`*

*Defined in [index-store.ts:240](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L240)*

Index a document

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `T` \| `I` |
`params?` | `PartialParam<IndexDocumentParams<T>, "body">` |

**Returns:** *`Promise<T>`*

___

###  indexWithId

▸ **indexWithId**(`doc`: *`T` | `I`*, `id`: *string*, `params?`: *`PartialParam<IndexDocumentParams<T>, "index" | "type" | "id">`*): *`Promise<T>`*

*Defined in [index-store.ts:258](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L258)*

A convenience method for indexing a document with an ID

**Parameters:**

Name | Type |
------ | ------ |
`doc` | `T` \| `I` |
`id` | string |
`params?` | `PartialParam<IndexDocumentParams<T>, "index" \| "type" \| "id">` |

**Returns:** *`Promise<T>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Defined in [index-store.ts:225](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L225)*

Connect and validate the index configuration.

**Returns:** *`Promise<void>`*

___

###  mget

▸ **mget**(`body`: *any*, `params?`: *`PartialParam<MGetParams>`*): *`Promise<T[]>`*

*Defined in [index-store.ts:263](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L263)*

Get multiple documents at the same time

**Parameters:**

Name | Type |
------ | ------ |
`body` | any |
`params?` | `PartialParam<MGetParams>` |

**Returns:** *`Promise<T[]>`*

___

###  refresh

▸ **refresh**(`params?`: *`PartialParam<IndicesRefreshParams>`*): *`Promise<void>`*

*Defined in [index-store.ts:276](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L276)*

Refreshes the current index

**Parameters:**

Name | Type |
------ | ------ |
`params?` | `PartialParam<IndicesRefreshParams>` |

**Returns:** *`Promise<void>`*

___

###  remove

▸ **remove**(`id`: *string*, `params?`: *`PartialParam<DeleteDocumentParams>`*): *`Promise<void>`*

*Defined in [index-store.ts:292](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L292)*

Deletes a document for a given id

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`params?` | `PartialParam<DeleteDocumentParams>` |

**Returns:** *`Promise<void>`*

___

###  search

▸ **search**(`query`: *string*, `params?`: *`PartialParam<SearchParams<T>>`*): *`Promise<T[]>`*

*Defined in [index-store.ts:326](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L326)*

Search with a given Lucene Query

**Parameters:**

Name | Type |
------ | ------ |
`query` | string |
`params?` | `PartialParam<SearchParams<T>>` |

**Returns:** *`Promise<T[]>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [index-store.ts:311](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L311)*

Shutdown, flush any pending requests and cleanup

**Returns:** *`Promise<void>`*

___

###  update

▸ **update**(`body`: *object*, `id`: *string*, `params?`: *`PartialParam<UpdateDocumentParams, "body" | "id">`*): *`Promise<void>`*

*Defined in [index-store.ts:369](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L369)*

Update a document with a given id

**Parameters:**

Name | Type |
------ | ------ |
`body` | object |
`id` | string |
`params?` | `PartialParam<UpdateDocumentParams, "body" \| "id">` |

**Returns:** *`Promise<void>`*

▸ **update**(`body`: *object*, `id`: *string*, `params?`: *`PartialParam<UpdateDocumentParams, "body" | "id">`*): *`Promise<void>`*

*Defined in [index-store.ts:370](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L370)*

**Parameters:**

Name | Type |
------ | ------ |
`body` | object |
`id` | string |
`params?` | `PartialParam<UpdateDocumentParams, "body" \| "id">` |

**Returns:** *`Promise<void>`*

___

###  updatePartial

▸ **updatePartial**(`id`: *string*, `applyChanges`: *`ApplyPartialUpdates<T>`*, `retriesOnConlfict`: *number*): *`Promise<void>`*

*Defined in [index-store.ts:388](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/elasticsearch-store/src/index-store.ts#L388)*

Safely apply updates to a document by applying the latest changes

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`id` | string | - |
`applyChanges` | `ApplyPartialUpdates<T>` | - |
`retriesOnConlfict` | number | 3 |

**Returns:** *`Promise<void>`*
