---
title: Data Access: `Roles`
sidebar_label: Roles
---

# Class: Roles

Manager for Roles

## Hierarchy

* `IndexModel<Role>`

  * **Roles**

## Index

### Constructors

* [constructor](roles.md#constructor)

### Properties

* [logger](roles.md#logger)
* [name](roles.md#name)
* [store](roles.md#store)
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

\+ **new Roles**(`client`: `Client`, `config`: `IndexModelOptions`): *[Roles](roles.md)*

*Overrides void*

*Defined in [models/roles.ts:9](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-access/src/models/roles.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | `Client` |
`config` | `IndexModelOptions` |

**Returns:** *[Roles](roles.md)*

## Properties

###  logger

• **logger**: *`Logger`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:13

___

###  name

• **name**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:12

___

###  store

• **store**: *`IndexStore<Role>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:11

___

### `Static` IndexModelConfig

▪ **IndexModelConfig**: *`IndexModelConfig<Role>`* =  rolesConfig

*Defined in [models/roles.ts:9](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-access/src/models/roles.ts#L9)*

## Methods

### `Protected` _appendToArray

▸ **_appendToArray**(`id`: string, `field`: keyof Role, `values`: string[] | string): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:33

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof Role |
`values` | string[] \| string |

**Returns:** *`Promise<void>`*

___

### `Protected` _createJoinQuery

▸ **_createJoinQuery**(`fields`: `AnyInput<Role>`, `joinBy?`: `JoinBy`, `arrayJoinBy?`: `JoinBy`): *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:40

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<Role>` |
`joinBy?` | `JoinBy` |
`arrayJoinBy?` | `JoinBy` |

**Returns:** *string*

___

### `Protected` _ensureUnique

▸ **_ensureUnique**(`record`: [Role](../interfaces/role.md), `existing?`: [T]()): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:36

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Role](../interfaces/role.md) |
`existing?` | [T]() |

**Returns:** *`Promise<void>`*

___

### `Protected` _find

▸ **_find**(`q?`: undefined | string, `options?`: `i.FindOptions<Role>`, `queryAccess?`: `QueryAccess<Role>`): *`Promise<Role[]>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:35

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | `i.FindOptions<Role>` |
`queryAccess?` | `QueryAccess<Role>` |

**Returns:** *`Promise<Role[]>`*

___

### `Protected` _postProcess

▸ **_postProcess**(`record`: [Role](../interfaces/role.md)): *[Role](../interfaces/role.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:38

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Role](../interfaces/role.md) |

**Returns:** *[Role](../interfaces/role.md)*

___

### `Protected` _preProcess

▸ **_preProcess**(`record`: [Role](../interfaces/role.md)): *[Role](../interfaces/role.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:39

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Role](../interfaces/role.md) |

**Returns:** *[Role](../interfaces/role.md)*

___

### `Protected` _removeFromArray

▸ **_removeFromArray**(`id`: string, `field`: keyof Role, `values`: string[] | string): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof Role |
`values` | string[] \| string |

**Returns:** *`Promise<void>`*

___

### `Protected` _sanitizeRecord

▸ **_sanitizeRecord**(`record`: [Role](../interfaces/role.md)): *[Role](../interfaces/role.md)*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:37

**Parameters:**

Name | Type |
------ | ------ |
`record` | [Role](../interfaces/role.md) |

**Returns:** *[Role](../interfaces/role.md)*

___

### `Protected` _updateWith

▸ **_updateWith**(`id`: string, `body`: any): *`Promise<void>`*

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

▸ **count**(`q?`: undefined | string, `queryAccess?`: `QueryAccess<Role>`): *`Promise<number>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:19

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`queryAccess?` | `QueryAccess<Role>` |

**Returns:** *`Promise<number>`*

___

###  countBy

▸ **countBy**(`fields`: `AnyInput<Role>`, `joinBy?`: `JoinBy`, `arrayJoinBy?`: `JoinBy`): *`Promise<number>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:20

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<Role>` |
`joinBy?` | `JoinBy` |
`arrayJoinBy?` | `JoinBy` |

**Returns:** *`Promise<number>`*

___

###  create

▸ **create**(`record`: `i.CreateRecordInput<Role>`): *`Promise<Role>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`record` | `i.CreateRecordInput<Role>` |

**Returns:** *`Promise<Role>`*

___

###  deleteAll

▸ **deleteAll**(`ids`: string[]): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:23

**Parameters:**

Name | Type |
------ | ------ |
`ids` | string[] |

**Returns:** *`Promise<void>`*

___

###  deleteById

▸ **deleteById**(`id`: string): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *`Promise<void>`*

___

###  exists

▸ **exists**(`id`: string[] | string): *`Promise<boolean>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:24

**Parameters:**

Name | Type |
------ | ------ |
`id` | string[] \| string |

**Returns:** *`Promise<boolean>`*

___

###  find

▸ **find**(`q?`: undefined | string, `options?`: `i.FindOptions<Role>`, `queryAccess?`: `QueryAccess<Role>`): *`Promise<Role[]>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:30

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | `i.FindOptions<Role>` |
`queryAccess?` | `QueryAccess<Role>` |

**Returns:** *`Promise<Role[]>`*

___

###  findAll

▸ **findAll**(`input`: string[] | string | undefined, `options?`: `i.FindOneOptions<Role>`, `queryAccess?`: `QueryAccess<Role>`): *`Promise<Role[]>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:29

**Parameters:**

Name | Type |
------ | ------ |
`input` | string[] \| string \| undefined |
`options?` | `i.FindOneOptions<Role>` |
`queryAccess?` | `QueryAccess<Role>` |

**Returns:** *`Promise<Role[]>`*

___

###  findAndApply

▸ **findAndApply**(`updates`: `Partial<Role>` | undefined, `options?`: `i.FindOneOptions<Role>`, `queryAccess?`: `QueryAccess<Role>`): *`Promise<Partial<Role>>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`updates` | `Partial<Role>` \| undefined |
`options?` | `i.FindOneOptions<Role>` |
`queryAccess?` | `QueryAccess<Role>` |

**Returns:** *`Promise<Partial<Role>>`*

___

###  findBy

▸ **findBy**(`fields`: `AnyInput<Role>`, `joinBy?`: `JoinBy`, `options?`: `i.FindOneOptions<Role>`, `queryAccess?`: `QueryAccess<Role>`): *`Promise<Role>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:25

**Parameters:**

Name | Type |
------ | ------ |
`fields` | `AnyInput<Role>` |
`joinBy?` | `JoinBy` |
`options?` | `i.FindOneOptions<Role>` |
`queryAccess?` | `QueryAccess<Role>` |

**Returns:** *`Promise<Role>`*

___

###  findByAnyId

▸ **findByAnyId**(`anyId`: any, `options?`: `i.FindOneOptions<Role>`, `queryAccess?`: `QueryAccess<Role>`): *`Promise<Role>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`anyId` | any |
`options?` | `i.FindOneOptions<Role>` |
`queryAccess?` | `QueryAccess<Role>` |

**Returns:** *`Promise<Role>`*

___

###  findById

▸ **findById**(`id`: string, `options?`: `i.FindOneOptions<Role>`, `queryAccess?`: `QueryAccess<Role>`): *`Promise<Role>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:26

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | `i.FindOneOptions<Role>` |
`queryAccess?` | `QueryAccess<Role>` |

**Returns:** *`Promise<Role>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:17

**Returns:** *`Promise<void>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:18

**Returns:** *`Promise<void>`*

___

###  update

▸ **update**(`record`: `i.UpdateRecordInput<Role>`): *`Promise<void>`*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:31

**Parameters:**

Name | Type |
------ | ------ |
`record` | `i.UpdateRecordInput<Role>` |

**Returns:** *`Promise<void>`*
