---
title: Data Access: `DataTypes`
sidebar_label: DataTypes
---

# Class: DataTypes

Manager for DataTypes

## Hierarchy

* IndexModel‹[DataType](../interfaces/datatype.md)›

  * **DataTypes**

## Index

### Constructors

* [constructor](datatypes.md#constructor)

### Properties

* [logger](datatypes.md#logger)
* [name](datatypes.md#name)
* [store](datatypes.md#store)
* [xluceneTypeConfig](datatypes.md#xlucenetypeconfig)
* [IndexModelConfig](datatypes.md#static-indexmodelconfig)

### Methods

* [_appendToArray](datatypes.md#protected-_appendtoarray)
* [_createJoinQuery](datatypes.md#protected-_createjoinquery)
* [_ensureUnique](datatypes.md#protected-_ensureunique)
* [_find](datatypes.md#protected-_find)
* [_postProcess](datatypes.md#protected-_postprocess)
* [_preProcess](datatypes.md#protected-_preprocess)
* [_removeFromArray](datatypes.md#protected-_removefromarray)
* [_sanitizeRecord](datatypes.md#protected-_sanitizerecord)
* [_updateWith](datatypes.md#protected-_updatewith)
* [count](datatypes.md#count)
* [countBy](datatypes.md#countby)
* [create](datatypes.md#create)
* [deleteAll](datatypes.md#deleteall)
* [deleteById](datatypes.md#deletebyid)
* [exists](datatypes.md#exists)
* [find](datatypes.md#find)
* [findAll](datatypes.md#findall)
* [findAndApply](datatypes.md#findandapply)
* [findBy](datatypes.md#findby)
* [findByAnyId](datatypes.md#findbyanyid)
* [findById](datatypes.md#findbyid)
* [initialize](datatypes.md#initialize)
* [resolveDataType](datatypes.md#resolvedatatype)
* [resolveTypeConfig](datatypes.md#resolvetypeconfig)
* [shutdown](datatypes.md#shutdown)
* [update](datatypes.md#update)

## Constructors

###  constructor

\+ **new DataTypes**(`client`: Client, `options`: IndexModelOptions): *[DataTypes](datatypes.md)*

*Overrides void*

*Defined in [models/data-types.ts:17](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/data-types.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`options` | IndexModelOptions |

**Returns:** *[DataTypes](datatypes.md)*

## Properties

###  logger

• **logger**: *Logger*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:13

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:12

___

###  store

• **store**: *IndexStore‹[DataType](../interfaces/datatype.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:11

___

###  xluceneTypeConfig

• **xluceneTypeConfig**: *TypeConfig | undefined*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:17

___

### `Static` IndexModelConfig

▪ **IndexModelConfig**: *IndexModelConfig‹[DataType](../interfaces/datatype.md)›* =  dataTypesConfig

*Defined in [models/data-types.ts:17](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/data-types.ts#L17)*

## Methods

### `Protected` _appendToArray

▸ **_appendToArray**(`id`: string, `field`: keyof DataType, `values`: string[] | string): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof DataType |
`values` | string[] \| string |

**Returns:** *Promise‹void›*

___

### `Protected` _createJoinQuery

▸ **_createJoinQuery**(`fields`: AnyInput‹[DataType](../interfaces/datatype.md)›, `joinBy?`: JoinBy, `arrayJoinBy?`: JoinBy): *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:41

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[DataType](../interfaces/datatype.md)› |
`joinBy?` | JoinBy |
`arrayJoinBy?` | JoinBy |

**Returns:** *string*

___

### `Protected` _ensureUnique

▸ **_ensureUnique**(`record`: [DataType](../interfaces/datatype.md), `existing?`: [T]()): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:37

**Parameters:**

Name | Type |
------ | ------ |
`record` | [DataType](../interfaces/datatype.md) |
`existing?` | [T]() |

**Returns:** *Promise‹void›*

___

### `Protected` _find

▸ **_find**(`q?`: undefined | string, `options?`: i.FindOptions‹[DataType](../interfaces/datatype.md)›, `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹[DataType](../interfaces/datatype.md)[]›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:36

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | i.FindOptions‹[DataType](../interfaces/datatype.md)› |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)[]›*

___

### `Protected` _postProcess

▸ **_postProcess**(`record`: [DataType](../interfaces/datatype.md)): *[DataType](../interfaces/datatype.md)*

*Overrides void*

*Defined in [models/data-types.ts:180](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/data-types.ts#L180)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | [DataType](../interfaces/datatype.md) |

**Returns:** *[DataType](../interfaces/datatype.md)*

___

### `Protected` _preProcess

▸ **_preProcess**(`record`: [DataType](../interfaces/datatype.md)): *[DataType](../interfaces/datatype.md)*

*Overrides void*

*Defined in [models/data-types.ts:175](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/data-types.ts#L175)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | [DataType](../interfaces/datatype.md) |

**Returns:** *[DataType](../interfaces/datatype.md)*

___

### `Protected` _removeFromArray

▸ **_removeFromArray**(`id`: string, `field`: keyof DataType, `values`: string[] | string): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:35

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof DataType |
`values` | string[] \| string |

**Returns:** *Promise‹void›*

___

### `Protected` _sanitizeRecord

▸ **_sanitizeRecord**(`record`: [DataType](../interfaces/datatype.md)): *[DataType](../interfaces/datatype.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:38

**Parameters:**

Name | Type |
------ | ------ |
`record` | [DataType](../interfaces/datatype.md) |

**Returns:** *[DataType](../interfaces/datatype.md)*

___

### `Protected` _updateWith

▸ **_updateWith**(`id`: string, `body`: any): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:33

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`body` | any |

**Returns:** *Promise‹void›*

___

###  count

▸ **count**(`q?`: undefined | string, `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹number›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:20

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹number›*

___

###  countBy

▸ **countBy**(`fields`: AnyInput‹[DataType](../interfaces/datatype.md)›, `joinBy?`: JoinBy, `arrayJoinBy?`: JoinBy): *Promise‹number›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[DataType](../interfaces/datatype.md)› |
`joinBy?` | JoinBy |
`arrayJoinBy?` | JoinBy |

**Returns:** *Promise‹number›*

___

###  create

▸ **create**(`record`: i.CreateRecordInput‹[DataType](../interfaces/datatype.md)›): *Promise‹[DataType](../interfaces/datatype.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`record` | i.CreateRecordInput‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)›*

___

###  deleteAll

▸ **deleteAll**(`ids`: string[]): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:24

**Parameters:**

Name | Type |
------ | ------ |
`ids` | string[] |

**Returns:** *Promise‹void›*

___

###  deleteById

▸ **deleteById**(`id`: string): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:23

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *Promise‹void›*

___

###  exists

▸ **exists**(`id`: string[] | string): *Promise‹boolean›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:25

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] \| string |

**Returns:** *Promise‹boolean›*

___

###  find

▸ **find**(`q?`: undefined | string, `options?`: i.FindOptions‹[DataType](../interfaces/datatype.md)›, `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹[DataType](../interfaces/datatype.md)[]›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:31

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | i.FindOptions‹[DataType](../interfaces/datatype.md)› |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)[]›*

___

###  findAll

▸ **findAll**(`input`: string[] | string | undefined, `options?`: i.FindOneOptions‹[DataType](../interfaces/datatype.md)›, `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹[DataType](../interfaces/datatype.md)[]›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:30

**Parameters:**

Name | Type |
------ | ------ |
`input` | string[] \| string \| undefined |
`options?` | i.FindOneOptions‹[DataType](../interfaces/datatype.md)› |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)[]›*

___

###  findAndApply

▸ **findAndApply**(`updates`: Partial‹[DataType](../interfaces/datatype.md)› | undefined, `options?`: i.FindOneOptions‹[DataType](../interfaces/datatype.md)›, `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹Partial‹[DataType](../interfaces/datatype.md)››*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:29

**Parameters:**

Name | Type |
------ | ------ |
`updates` | Partial‹[DataType](../interfaces/datatype.md)› \| undefined |
`options?` | i.FindOneOptions‹[DataType](../interfaces/datatype.md)› |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹Partial‹[DataType](../interfaces/datatype.md)››*

___

###  findBy

▸ **findBy**(`fields`: AnyInput‹[DataType](../interfaces/datatype.md)›, `joinBy?`: JoinBy, `options?`: i.FindOneOptions‹[DataType](../interfaces/datatype.md)›, `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹[DataType](../interfaces/datatype.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:26

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[DataType](../interfaces/datatype.md)› |
`joinBy?` | JoinBy |
`options?` | i.FindOneOptions‹[DataType](../interfaces/datatype.md)› |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)›*

___

###  findByAnyId

▸ **findByAnyId**(`anyId`: any, `options?`: i.FindOneOptions‹[DataType](../interfaces/datatype.md)›, `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹[DataType](../interfaces/datatype.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`anyId` | any |
`options?` | i.FindOneOptions‹[DataType](../interfaces/datatype.md)› |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)›*

___

###  findById

▸ **findById**(`id`: string, `options?`: i.FindOneOptions‹[DataType](../interfaces/datatype.md)›, `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹[DataType](../interfaces/datatype.md)›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | i.FindOneOptions‹[DataType](../interfaces/datatype.md)› |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:18

**Returns:** *Promise‹void›*

___

###  resolveDataType

▸ **resolveDataType**(`id`: string, `options?`: [ResolveDataTypeOptions](../overview.md#resolvedatatypeoptions), `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹[DataType](../interfaces/datatype.md)›*

*Defined in [models/data-types.ts:27](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/data-types.ts#L27)*

Get the type configuration for a data type
including any merged fields

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | [ResolveDataTypeOptions](../overview.md#resolvedatatypeoptions) |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)›*

___

###  resolveTypeConfig

▸ **resolveTypeConfig**(`dataType`: [DataType](../interfaces/datatype.md), `options?`: [ResolveDataTypeOptions](../overview.md#resolvedatatypeoptions), `queryAccess?`: QueryAccess‹[DataType](../interfaces/datatype.md)›): *Promise‹DataTypeConfig›*

*Defined in [models/data-types.ts:39](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/data-types.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`dataType` | [DataType](../interfaces/datatype.md) |
`options?` | [ResolveDataTypeOptions](../overview.md#resolvedatatypeoptions) |
`queryAccess?` | QueryAccess‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹DataTypeConfig›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:19

**Returns:** *Promise‹void›*

___

###  update

▸ **update**(`record`: i.UpdateRecordInput‹[DataType](../interfaces/datatype.md)›): *Promise‹void›*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:32

**Parameters:**

Name | Type |
------ | ------ |
`record` | i.UpdateRecordInput‹[DataType](../interfaces/datatype.md)› |

**Returns:** *Promise‹void›*
