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

* **IndexModel**

## Index

### Constructors

* [constructor](indexmodel.md#constructor)

### Properties

* [logger](indexmodel.md#logger)
* [name](indexmodel.md#name)
* [store](indexmodel.md#store)

### Methods

* [_appendToArray](indexmodel.md#protected-_appendtoarray)
* [_createJoinQuery](indexmodel.md#protected-_createjoinquery)
* [_ensureUnique](indexmodel.md#protected-_ensureunique)
* [_find](indexmodel.md#protected-_find)
* [_postProcess](indexmodel.md#protected-_postprocess)
* [_preProcess](indexmodel.md#protected-_preprocess)
* [_removeFromArray](indexmodel.md#protected-_removefromarray)
* [_sanitizeRecord](indexmodel.md#protected-_sanitizerecord)
* [_updateWith](indexmodel.md#protected-_updatewith)
* [count](indexmodel.md#count)
* [countBy](indexmodel.md#countby)
* [create](indexmodel.md#create)
* [deleteAll](indexmodel.md#deleteall)
* [deleteById](indexmodel.md#deletebyid)
* [exists](indexmodel.md#exists)
* [find](indexmodel.md#find)
* [findAll](indexmodel.md#findall)
* [findAndApply](indexmodel.md#findandapply)
* [findBy](indexmodel.md#findby)
* [findByAnyId](indexmodel.md#findbyanyid)
* [findById](indexmodel.md#findbyid)
* [initialize](indexmodel.md#initialize)
* [shutdown](indexmodel.md#shutdown)
* [update](indexmodel.md#update)

## Constructors

###  constructor

\+ **new IndexModel**(`client`: `Client`, `options`: [IndexModelOptions](../interfaces/indexmodeloptions.md), `modelConfig`: [IndexModelConfig](../interfaces/indexmodelconfig.md)‹*`T`*›): *[IndexModel](indexmodel.md)*

*Defined in [index-model.ts:18](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | `Client` |
`options` | [IndexModelOptions](../interfaces/indexmodeloptions.md) |
`modelConfig` | [IndexModelConfig](../interfaces/indexmodelconfig.md)‹*`T`*› |

**Returns:** *[IndexModel](indexmodel.md)*

## Properties

###  logger

• **logger**: *`Logger`*

*Defined in [index-model.ts:15](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L15)*

___

###  name

• **name**: *string*

*Defined in [index-model.ts:14](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L14)*

___

###  store

• **store**: *[IndexStore](indexstore.md)‹*`T`*›*

*Defined in [index-model.ts:13](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L13)*

## Methods

### `Protected` _appendToArray

▸ **_appendToArray**(`id`: string, `field`: keyof T, `values`: string[] | string): *`Promise<void>`*

*Defined in [index-model.ts:231](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L231)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof T |
`values` | string[] \| string |

**Returns:** *`Promise<void>`*

___

### `Protected` _createJoinQuery

▸ **_createJoinQuery**(`fields`: `AnyInput<T>`, `joinBy`: `JoinBy`, `arrayJoinBy`: `JoinBy`): *string*

*Defined in [index-model.ts:362](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L362)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`fields` | `AnyInput<T>` | - |
`joinBy` | `JoinBy` | "AND" |
`arrayJoinBy` | `JoinBy` | "OR" |

**Returns:** *string*

___

### `Protected` _ensureUnique

▸ **_ensureUnique**(`record`: `T`, `existing?`: [T]()): *`Promise<void>`*

*Defined in [index-model.ts:302](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L302)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | `T` |
`existing?` | [T]() |

**Returns:** *`Promise<void>`*

___

### `Protected` _find

▸ **_find**(`q`: string, `options`: `i.FindOptions<T>`, `queryAccess?`: `QueryAccess<T>`): *`Promise<T[]>`*

*Defined in [index-model.ts:281](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L281)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`q` | string | "" |
`options` | `i.FindOptions<T>` |  {} |
`queryAccess?` | `QueryAccess<T>` | - |

**Returns:** *`Promise<T[]>`*

___

### `Protected` _postProcess

▸ **_postProcess**(`record`: `T`): *`T`*

*Defined in [index-model.ts:354](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L354)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | `T` |

**Returns:** *`T`*

___

### `Protected` _preProcess

▸ **_preProcess**(`record`: `T`): *`T`*

*Defined in [index-model.ts:358](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L358)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | `T` |

**Returns:** *`T`*

___

### `Protected` _removeFromArray

▸ **_removeFromArray**(`id`: string, `field`: keyof T, `values`: string[] | string): *`Promise<void>`*

*Defined in [index-model.ts:252](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L252)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof T |
`values` | string[] \| string |

**Returns:** *`Promise<void>`*

___

### `Protected` _sanitizeRecord

▸ **_sanitizeRecord**(`record`: `T`): *`T`*

*Defined in [index-model.ts:330](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L330)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | `T` |

**Returns:** *`T`*

___

### `Protected` _updateWith

▸ **_updateWith**(`id`: string, `body`: any): *`Promise<void>`*

*Defined in [index-model.ts:227](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L227)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`body` | any |

**Returns:** *`Promise<void>`*

___

###  count

▸ **count**(`q`: string, `queryAccess?`: `QueryAccess<T>`): *`Promise<number>`*

*Defined in [index-model.ts:76](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L76)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`q` | string | "" |
`queryAccess?` | `QueryAccess<T>` | - |

**Returns:** *`Promise<number>`*

___

###  countBy

▸ **countBy**(`fields`: `AnyInput<T>`, `joinBy?`: `JoinBy`, `arrayJoinBy?`: `JoinBy`): *`Promise<number>`*

*Defined in [index-model.ts:81](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<T>` |
`joinBy?` | `JoinBy` |
`arrayJoinBy?` | `JoinBy` |

**Returns:** *`Promise<number>`*

___

###  create

▸ **create**(`record`: `i.CreateRecordInput<T>`): *`Promise<T>`*

*Defined in [index-model.ts:85](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | `i.CreateRecordInput<T>` |

**Returns:** *`Promise<T>`*

___

###  deleteAll

▸ **deleteAll**(`ids`: string[]): *`Promise<void>`*

*Defined in [index-model.ts:108](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`ids` | string[] |

**Returns:** *`Promise<void>`*

___

###  deleteById

▸ **deleteById**(`id`: string): *`Promise<void>`*

*Defined in [index-model.ts:104](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *`Promise<void>`*

___

###  exists

▸ **exists**(`id`: string[] | string): *`Promise<boolean>`*

*Defined in [index-model.ts:114](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] \| string |

**Returns:** *`Promise<boolean>`*

___

###  find

▸ **find**(`q`: string, `options`: `i.FindOptions<T>`, `queryAccess?`: `QueryAccess<T>`): *`Promise<T[]>`*

*Defined in [index-model.ts:203](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L203)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`q` | string | "" |
`options` | `i.FindOptions<T>` |  {} |
`queryAccess?` | `QueryAccess<T>` | - |

**Returns:** *`Promise<T[]>`*

___

###  findAll

▸ **findAll**(`input`: string[] | string | undefined, `options?`: `i.FindOneOptions<T>`, `queryAccess?`: `QueryAccess<T>`): *`Promise<T[]>`*

*Defined in [index-model.ts:176](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L176)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string[] \| string \| undefined |
`options?` | `i.FindOneOptions<T>` |
`queryAccess?` | `QueryAccess<T>` |

**Returns:** *`Promise<T[]>`*

___

###  findAndApply

▸ **findAndApply**(`updates`: `Partial<T>` | undefined, `options?`: `i.FindOneOptions<T>`, `queryAccess?`: `QueryAccess<T>`): *`Promise<Partial<T>>`*

*Defined in [index-model.ts:162](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L162)*

**Parameters:**

Name | Type |
------ | ------ |
`updates` | `Partial<T>` \| undefined |
`options?` | `i.FindOneOptions<T>` |
`queryAccess?` | `QueryAccess<T>` |

**Returns:** *`Promise<Partial<T>>`*

___

###  findBy

▸ **findBy**(`fields`: `AnyInput<T>`, `joinBy?`: `JoinBy`, `options?`: `i.FindOneOptions<T>`, `queryAccess?`: `QueryAccess<T>`): *`Promise<T>`*

*Defined in [index-model.ts:125](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L125)*

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<T>` |
`joinBy?` | `JoinBy` |
`options?` | `i.FindOneOptions<T>` |
`queryAccess?` | `QueryAccess<T>` |

**Returns:** *`Promise<T>`*

___

###  findByAnyId

▸ **findByAnyId**(`anyId`: any, `options?`: `i.FindOneOptions<T>`, `queryAccess?`: `QueryAccess<T>`): *`Promise<T>`*

*Defined in [index-model.ts:152](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`anyId` | any |
`options?` | `i.FindOneOptions<T>` |
`queryAccess?` | `QueryAccess<T>` |

**Returns:** *`Promise<T>`*

___

###  findById

▸ **findById**(`id`: string, `options?`: `i.FindOneOptions<T>`, `queryAccess?`: `QueryAccess<T>`): *`Promise<T>`*

*Defined in [index-model.ts:147](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L147)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | `i.FindOneOptions<T>` |
`queryAccess?` | `QueryAccess<T>` |

**Returns:** *`Promise<T>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Defined in [index-model.ts:68](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L68)*

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [index-model.ts:72](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L72)*

**Returns:** *`Promise<void>`*

___

###  update

▸ **update**(`record`: `i.UpdateRecordInput<T>`): *`Promise<void>`*

*Defined in [index-model.ts:207](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/elasticsearch-store/src/index-model.ts#L207)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | `i.UpdateRecordInput<T>` |

**Returns:** *`Promise<void>`*
