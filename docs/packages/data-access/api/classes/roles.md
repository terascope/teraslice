---
title: Data Access: `Roles`
sidebar_label: Roles
---

# Class: Roles

Manager for Roles

## Hierarchy

* IndexModel‹[Role](../interfaces/role.md)›

  * **Roles**

## Index

### Constructors

* [constructor](roles.md#constructor)

### Properties

* [logger](roles.md#logger)
* [name](roles.md#name)
* [store](roles.md#store)
* [xluceneTypeConfig](roles.md#xlucenetypeconfig)
* [IndexModelConfig](roles.md#static-indexmodelconfig)

### Methods

* [_appendToArray](roles.md#protected-_appendtoarray)
* [_createJoinQuery](roles.md#protected-_createjoinquery)
* [_ensureUnique](roles.md#protected-_ensureunique)
* [_find](roles.md#protected-_find)
* [_postProcess](roles.md#protected-_postprocess)
* [_preProcess](roles.md#protected-_preprocess)
* [_removeFromArray](roles.md#protected-_removefromarray)
* [_sanitizeRecord](roles.md#protected-_sanitizerecord)
* [_updateWith](roles.md#protected-_updatewith)
* [count](roles.md#count)
* [countBy](roles.md#countby)
* [create](roles.md#create)
* [deleteAll](roles.md#deleteall)
* [deleteById](roles.md#deletebyid)
* [exists](roles.md#exists)
* [find](roles.md#find)
* [findAll](roles.md#findall)
* [findAndApply](roles.md#findandapply)
* [findBy](roles.md#findby)
* [findByAnyId](roles.md#findbyanyid)
* [findById](roles.md#findbyid)
* [initialize](roles.md#initialize)
* [shutdown](roles.md#shutdown)
* [update](roles.md#update)

## Constructors

###  constructor

\+ **new Roles**(`client`: Client, `config`: IndexModelOptions): *[Roles](roles.md)*

*Overrides void*

*Defined in [models/roles.ts:9](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/roles.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`config` | IndexModelOptions |

**Returns:** *[Roles](roles.md)*

## Properties

###  logger

• **logger**: *Logger*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:13

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:12

___

###  store

• **store**: *IndexStore‹[Role](../interfaces/role.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:11

___

###  xluceneTypeConfig

• **xluceneTypeConfig**: *TypeConfig | undefined*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:17

___

### `Static` IndexModelConfig

▪ **IndexModelConfig**: *IndexModelConfig‹[Role](../interfaces/role.md)›* =  rolesConfig

*Defined in [models/roles.ts:9](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/roles.ts#L9)*

## Methods

### `Protected` _appendToArray

▸ **_appendToArray**(`id`: string, `field`: keyof Role, `values`: string[] | string): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof Role |
`values` | string[] \| string |

**Returns:** *Promise‹void›*

___

### `Protected` _createJoinQuery

▸ **_createJoinQuery**(`fields`: AnyInput‹[Role](../interfaces/role.md)›, `joinBy?`: JoinBy, `arrayJoinBy?`: JoinBy): *string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:41

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[Role](../interfaces/role.md)› |
`joinBy?` | JoinBy |
`arrayJoinBy?` | JoinBy |

**Returns:** *string*

___

### `Protected` _ensureUnique

▸ **_ensureUnique**(`record`: [Role](../interfaces/role.md), `existing?`: [T]()): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:37

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Role](../interfaces/role.md) |
`existing?` | [T]() |

**Returns:** *Promise‹void›*

___

### `Protected` _find

▸ **_find**(`q?`: undefined | string, `options?`: i.FindOptions‹[Role](../interfaces/role.md)›, `queryAccess?`: QueryAccess‹[Role](../interfaces/role.md)›): *Promise‹[Role](../interfaces/role.md)[]›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:36

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | i.FindOptions‹[Role](../interfaces/role.md)› |
`queryAccess?` | QueryAccess‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹[Role](../interfaces/role.md)[]›*

___

### `Protected` _postProcess

▸ **_postProcess**(`record`: [Role](../interfaces/role.md)): *[Role](../interfaces/role.md)*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:39

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Role](../interfaces/role.md) |

**Returns:** *[Role](../interfaces/role.md)*

___

### `Protected` _preProcess

▸ **_preProcess**(`record`: [Role](../interfaces/role.md)): *[Role](../interfaces/role.md)*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:40

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Role](../interfaces/role.md) |

**Returns:** *[Role](../interfaces/role.md)*

___

### `Protected` _removeFromArray

▸ **_removeFromArray**(`id`: string, `field`: keyof Role, `values`: string[] | string): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:35

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof Role |
`values` | string[] \| string |

**Returns:** *Promise‹void›*

___

### `Protected` _sanitizeRecord

▸ **_sanitizeRecord**(`record`: [Role](../interfaces/role.md)): *[Role](../interfaces/role.md)*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:38

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Role](../interfaces/role.md) |

**Returns:** *[Role](../interfaces/role.md)*

___

### `Protected` _updateWith

▸ **_updateWith**(`id`: string, `body`: any): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:33

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`body` | any |

**Returns:** *Promise‹void›*

___

###  count

▸ **count**(`q?`: undefined | string, `queryAccess?`: QueryAccess‹[Role](../interfaces/role.md)›): *Promise‹number›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:20

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`queryAccess?` | QueryAccess‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹number›*

___

###  countBy

▸ **countBy**(`fields`: AnyInput‹[Role](../interfaces/role.md)›, `joinBy?`: JoinBy, `arrayJoinBy?`: JoinBy): *Promise‹number›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[Role](../interfaces/role.md)› |
`joinBy?` | JoinBy |
`arrayJoinBy?` | JoinBy |

**Returns:** *Promise‹number›*

___

###  create

▸ **create**(`record`: i.CreateRecordInput‹[Role](../interfaces/role.md)›): *Promise‹[Role](../interfaces/role.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`record` | i.CreateRecordInput‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹[Role](../interfaces/role.md)›*

___

###  deleteAll

▸ **deleteAll**(`ids`: string[]): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:24

**Parameters:**

Name | Type |
------ | ------ |
`ids` | string[] |

**Returns:** *Promise‹void›*

___

###  deleteById

▸ **deleteById**(`id`: string): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:23

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *Promise‹void›*

___

###  exists

▸ **exists**(`id`: string[] | string): *Promise‹boolean›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:25

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] \| string |

**Returns:** *Promise‹boolean›*

___

###  find

▸ **find**(`q?`: undefined | string, `options?`: i.FindOptions‹[Role](../interfaces/role.md)›, `queryAccess?`: QueryAccess‹[Role](../interfaces/role.md)›): *Promise‹[Role](../interfaces/role.md)[]›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:31

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | i.FindOptions‹[Role](../interfaces/role.md)› |
`queryAccess?` | QueryAccess‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹[Role](../interfaces/role.md)[]›*

___

###  findAll

▸ **findAll**(`input`: string[] | string | undefined, `options?`: i.FindOneOptions‹[Role](../interfaces/role.md)›, `queryAccess?`: QueryAccess‹[Role](../interfaces/role.md)›): *Promise‹[Role](../interfaces/role.md)[]›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:30

**Parameters:**

Name | Type |
------ | ------ |
`input` | string[] \| string \| undefined |
`options?` | i.FindOneOptions‹[Role](../interfaces/role.md)› |
`queryAccess?` | QueryAccess‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹[Role](../interfaces/role.md)[]›*

___

###  findAndApply

▸ **findAndApply**(`updates`: Partial‹[Role](../interfaces/role.md)› | undefined, `options?`: i.FindOneOptions‹[Role](../interfaces/role.md)›, `queryAccess?`: QueryAccess‹[Role](../interfaces/role.md)›): *Promise‹Partial‹[Role](../interfaces/role.md)››*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:29

**Parameters:**

Name | Type |
------ | ------ |
`updates` | Partial‹[Role](../interfaces/role.md)› \| undefined |
`options?` | i.FindOneOptions‹[Role](../interfaces/role.md)› |
`queryAccess?` | QueryAccess‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹Partial‹[Role](../interfaces/role.md)››*

___

###  findBy

▸ **findBy**(`fields`: AnyInput‹[Role](../interfaces/role.md)›, `joinBy?`: JoinBy, `options?`: i.FindOneOptions‹[Role](../interfaces/role.md)›, `queryAccess?`: QueryAccess‹[Role](../interfaces/role.md)›): *Promise‹[Role](../interfaces/role.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:26

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[Role](../interfaces/role.md)› |
`joinBy?` | JoinBy |
`options?` | i.FindOneOptions‹[Role](../interfaces/role.md)› |
`queryAccess?` | QueryAccess‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹[Role](../interfaces/role.md)›*

___

###  findByAnyId

▸ **findByAnyId**(`anyId`: any, `options?`: i.FindOneOptions‹[Role](../interfaces/role.md)›, `queryAccess?`: QueryAccess‹[Role](../interfaces/role.md)›): *Promise‹[Role](../interfaces/role.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`anyId` | any |
`options?` | i.FindOneOptions‹[Role](../interfaces/role.md)› |
`queryAccess?` | QueryAccess‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹[Role](../interfaces/role.md)›*

___

###  findById

▸ **findById**(`id`: string, `options?`: i.FindOneOptions‹[Role](../interfaces/role.md)›, `queryAccess?`: QueryAccess‹[Role](../interfaces/role.md)›): *Promise‹[Role](../interfaces/role.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | i.FindOneOptions‹[Role](../interfaces/role.md)› |
`queryAccess?` | QueryAccess‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹[Role](../interfaces/role.md)›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:18

**Returns:** *Promise‹void›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:19

**Returns:** *Promise‹void›*

___

###  update

▸ **update**(`record`: i.UpdateRecordInput‹[Role](../interfaces/role.md)›): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:32

**Parameters:**

Name | Type |
------ | ------ |
`record` | i.UpdateRecordInput‹[Role](../interfaces/role.md)› |

**Returns:** *Promise‹void›*
