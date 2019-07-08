---
title: Data Access: `DataTypes`
sidebar_label: DataTypes
---

# Class: DataTypes

Manager for DataTypes

## Hierarchy

* `IndexModel<DataType>`

  * **DataTypes**

### Index

#### Constructors

* [constructor](datatypes.md#constructor)

#### Properties

* [logger](datatypes.md#logger)
* [name](datatypes.md#name)
* [store](datatypes.md#store)
* [IndexModelConfig](datatypes.md#static-indexmodelconfig)

#### Methods

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

\+ **new DataTypes**(`client`: *`Client`*, `options`: *`IndexModelOptions`*): *[DataTypes](datatypes.md)*

*Overrides void*

*Defined in [models/data-types.ts:12](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/data-types.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | `Client` |
`options` | `IndexModelOptions` |

**Returns:** *[DataTypes](datatypes.md)*

## Properties

###  logger

• **logger**: *`Logger`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:12

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:11

___

###  store

• **store**: *`IndexStore<DataType>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:10

___

### `Static` IndexModelConfig

▪ **IndexModelConfig**: *`IndexModelConfig<DataType>`* =  dataTypesConfig

*Defined in [models/data-types.ts:12](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/data-types.ts#L12)*

## Methods

### `Protected` _appendToArray

▸ **_appendToArray**(`id`: *string*, `field`: *keyof DataType*, `values`: *string[] | string*): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:33

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof DataType |
`values` | string[] \| string |

**Returns:** *`Promise<void>`*

___

### `Protected` _createJoinQuery

▸ **_createJoinQuery**(`fields`: *`AnyInput<DataType>`*, `joinBy?`: *`JoinBy`*, `arrayJoinBy?`: *`JoinBy`*): *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:40

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<DataType>` |
`joinBy?` | `JoinBy` |
`arrayJoinBy?` | `JoinBy` |

**Returns:** *string*

___

### `Protected` _ensureUnique

▸ **_ensureUnique**(`record`: *`AnyInput<DataType>`*): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:36

**Parameters:**

Name | Type |
------ | ------ |
`record` | `AnyInput<DataType>` |

**Returns:** *`Promise<void>`*

___

### `Protected` _find

▸ **_find**(`q?`: *undefined | string*, `options?`: *`i.FindOptions<DataType>`*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<DataType[]>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:35

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | `i.FindOptions<DataType>` |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<DataType[]>`*

___

### `Protected` _postProcess

▸ **_postProcess**(`record`: *[DataType](../interfaces/datatype.md)*): *[DataType](../interfaces/datatype.md)*

*Overrides void*

*Defined in [models/data-types.ts:164](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/data-types.ts#L164)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | [DataType](../interfaces/datatype.md) |

**Returns:** *[DataType](../interfaces/datatype.md)*

___

### `Protected` _preProcess

▸ **_preProcess**(`record`: *[DataType](../interfaces/datatype.md)*): *[DataType](../interfaces/datatype.md)*

*Overrides void*

*Defined in [models/data-types.ts:159](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/data-types.ts#L159)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | [DataType](../interfaces/datatype.md) |

**Returns:** *[DataType](../interfaces/datatype.md)*

___

### `Protected` _removeFromArray

▸ **_removeFromArray**(`id`: *string*, `field`: *keyof DataType*, `values`: *string[] | string*): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof DataType |
`values` | string[] \| string |

**Returns:** *`Promise<void>`*

___

### `Protected` _sanitizeRecord

▸ **_sanitizeRecord**(`record`: *[DataType](../interfaces/datatype.md)*): *[DataType](../interfaces/datatype.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:37

**Parameters:**

Name | Type |
------ | ------ |
`record` | [DataType](../interfaces/datatype.md) |

**Returns:** *[DataType](../interfaces/datatype.md)*

___

### `Protected` _updateWith

▸ **_updateWith**(`id`: *string*, `body`: *any*): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:32

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`body` | any |

**Returns:** *`Promise<void>`*

___

###  count

▸ **count**(`q?`: *undefined | string*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<number>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:19

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<number>`*

___

###  countBy

▸ **countBy**(`fields`: *`AnyInput<DataType>`*, `joinBy?`: *`JoinBy`*, `arrayJoinBy?`: *`JoinBy`*): *`Promise<number>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:20

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<DataType>` |
`joinBy?` | `JoinBy` |
`arrayJoinBy?` | `JoinBy` |

**Returns:** *`Promise<number>`*

___

###  create

▸ **create**(`record`: *`i.CreateRecordInput<DataType>`*): *`Promise<DataType>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`record` | `i.CreateRecordInput<DataType>` |

**Returns:** *`Promise<DataType>`*

___

###  deleteAll

▸ **deleteAll**(`ids`: *string[]*): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:23

**Parameters:**

Name | Type |
------ | ------ |
`ids` | string[] |

**Returns:** *`Promise<void>`*

___

###  deleteById

▸ **deleteById**(`id`: *string*): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *`Promise<void>`*

___

###  exists

▸ **exists**(`id`: *string[] | string*): *`Promise<boolean>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:24

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] \| string |

**Returns:** *`Promise<boolean>`*

___

###  find

▸ **find**(`q?`: *undefined | string*, `options?`: *`i.FindOptions<DataType>`*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<DataType[]>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:30

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | `i.FindOptions<DataType>` |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<DataType[]>`*

___

###  findAll

▸ **findAll**(`input`: *string[] | string | undefined*, `options?`: *`i.FindOneOptions<DataType>`*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<DataType[]>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:29

**Parameters:**

Name | Type |
------ | ------ |
`input` | string[] \| string \| undefined |
`options?` | `i.FindOneOptions<DataType>` |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<DataType[]>`*

___

###  findAndApply

▸ **findAndApply**(`updates`: *`Partial<DataType>` | undefined*, `options?`: *`i.FindOneOptions<DataType>`*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<Partial<DataType>>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`updates` | `Partial<DataType>` \| undefined |
`options?` | `i.FindOneOptions<DataType>` |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<Partial<DataType>>`*

___

###  findBy

▸ **findBy**(`fields`: *`AnyInput<DataType>`*, `joinBy?`: *`JoinBy`*, `options?`: *`i.FindOneOptions<DataType>`*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<DataType>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:25

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<DataType>` |
`joinBy?` | `JoinBy` |
`options?` | `i.FindOneOptions<DataType>` |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<DataType>`*

___

###  findByAnyId

▸ **findByAnyId**(`anyId`: *any*, `options?`: *`i.FindOneOptions<DataType>`*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<DataType>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`anyId` | any |
`options?` | `i.FindOneOptions<DataType>` |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<DataType>`*

___

###  findById

▸ **findById**(`id`: *string*, `options?`: *`i.FindOneOptions<DataType>`*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<DataType>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:26

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | `i.FindOneOptions<DataType>` |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<DataType>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:17

**Returns:** *`Promise<void>`*

___

###  resolveDataType

▸ **resolveDataType**(`id`: *string*, `options?`: *`ResolveDataTypeOptions`*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<DataType>`*

*Defined in [models/data-types.ts:22](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/data-types.ts#L22)*

Get the type configuration for a data type
including any merged fields

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | `ResolveDataTypeOptions` |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<DataType>`*

___

###  resolveTypeConfig

▸ **resolveTypeConfig**(`dataType`: *[DataType](../interfaces/datatype.md)*, `options?`: *`ResolveDataTypeOptions`*, `queryAccess?`: *`QueryAccess<DataType>`*): *`Promise<DataTypeConfig>`*

*Defined in [models/data-types.ts:30](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/models/data-types.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`dataType` | [DataType](../interfaces/datatype.md) |
`options?` | `ResolveDataTypeOptions` |
`queryAccess?` | `QueryAccess<DataType>` |

**Returns:** *`Promise<DataTypeConfig>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:18

**Returns:** *`Promise<void>`*

___

###  update

▸ **update**(`record`: *`i.UpdateRecordInput<DataType>`*): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:31

**Parameters:**

Name | Type |
------ | ------ |
`record` | `i.UpdateRecordInput<DataType>` |

**Returns:** *`Promise<void>`*

