---
title: Data Access: `Users`
sidebar_label: Users
---

# Class: Users

Manager for Users

## Hierarchy

* IndexModel‹[User](../interfaces/user.md)›

  * **Users**

## Index

### Constructors

* [constructor](users.md#constructor)

### Properties

* [logger](users.md#logger)
* [name](users.md#name)
* [store](users.md#store)
* [xluceneTypeConfig](users.md#xlucenetypeconfig)
* [IndexModelConfig](users.md#static-indexmodelconfig)
* [PrivateFields](users.md#static-privatefields)

### Methods

* [_appendToArray](users.md#protected-_appendtoarray)
* [_createJoinQuery](users.md#protected-_createjoinquery)
* [_ensureUnique](users.md#protected-_ensureunique)
* [_find](users.md#protected-_find)
* [_postProcess](users.md#protected-_postprocess)
* [_preProcess](users.md#protected-_preprocess)
* [_removeFromArray](users.md#protected-_removefromarray)
* [_sanitizeRecord](users.md#protected-_sanitizerecord)
* [_updateWith](users.md#protected-_updatewith)
* [authenticate](users.md#authenticate)
* [authenticateWithToken](users.md#authenticatewithtoken)
* [count](users.md#count)
* [countBy](users.md#countby)
* [create](users.md#create)
* [createWithPassword](users.md#createwithpassword)
* [deleteAll](users.md#deleteall)
* [deleteById](users.md#deletebyid)
* [exists](users.md#exists)
* [find](users.md#find)
* [findAll](users.md#findall)
* [findAndApply](users.md#findandapply)
* [findBy](users.md#findby)
* [findByAnyId](users.md#findbyanyid)
* [findById](users.md#findbyid)
* [initialize](users.md#initialize)
* [isPrivateUser](users.md#isprivateuser)
* [removeRoleFromUsers](users.md#removerolefromusers)
* [shutdown](users.md#shutdown)
* [update](users.md#update)
* [updatePassword](users.md#updatepassword)
* [updateToken](users.md#updatetoken)

## Constructors

###  constructor

\+ **new Users**(`client`: Client, `options`: IndexModelOptions): *[Users](users.md)*

*Overrides void*

*Defined in [models/users.ts:14](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`options` | IndexModelOptions |

**Returns:** *[Users](users.md)*

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

• **store**: *IndexStore‹[User](../interfaces/user.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:11

___

###  xluceneTypeConfig

• **xluceneTypeConfig**: *TypeConfig | undefined*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:17

___

### `Static` IndexModelConfig

▪ **IndexModelConfig**: *IndexModelConfig‹[User](../interfaces/user.md)›* =  usersConfig

*Defined in [models/users.ts:14](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L14)*

___

### `Static` PrivateFields

▪ **PrivateFields**: *string[]* =  ['api_token', 'salt', 'hash']

*Defined in [models/users.ts:13](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L13)*

## Methods

### `Protected` _appendToArray

▸ **_appendToArray**(`id`: string, `field`: keyof User, `values`: string[] | string): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof User |
`values` | string[] \| string |

**Returns:** *Promise‹void›*

___

### `Protected` _createJoinQuery

▸ **_createJoinQuery**(`fields`: AnyInput‹[User](../interfaces/user.md)›, `joinBy?`: JoinBy, `arrayJoinBy?`: JoinBy): *string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:41

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[User](../interfaces/user.md)› |
`joinBy?` | JoinBy |
`arrayJoinBy?` | JoinBy |

**Returns:** *string*

___

### `Protected` _ensureUnique

▸ **_ensureUnique**(`record`: [User](../interfaces/user.md), `existing?`: [T]()): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:37

**Parameters:**

Name | Type |
------ | ------ |
`record` | [User](../interfaces/user.md) |
`existing?` | [T]() |

**Returns:** *Promise‹void›*

___

### `Protected` _find

▸ **_find**(`q?`: undefined | string, `options?`: i.FindOptions‹[User](../interfaces/user.md)›, `queryAccess?`: QueryAccess‹[User](../interfaces/user.md)›): *Promise‹[User](../interfaces/user.md)[]›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:36

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | i.FindOptions‹[User](../interfaces/user.md)› |
`queryAccess?` | QueryAccess‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹[User](../interfaces/user.md)[]›*

___

### `Protected` _postProcess

▸ **_postProcess**(`record`: [User](../interfaces/user.md)): *[User](../interfaces/user.md)*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:39

**Parameters:**

Name | Type |
------ | ------ |
`record` | [User](../interfaces/user.md) |

**Returns:** *[User](../interfaces/user.md)*

___

### `Protected` _preProcess

▸ **_preProcess**(`record`: [User](../interfaces/user.md)): *[User](../interfaces/user.md)*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:40

**Parameters:**

Name | Type |
------ | ------ |
`record` | [User](../interfaces/user.md) |

**Returns:** *[User](../interfaces/user.md)*

___

### `Protected` _removeFromArray

▸ **_removeFromArray**(`id`: string, `field`: keyof User, `values`: string[] | string): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:35

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`field` | keyof User |
`values` | string[] \| string |

**Returns:** *Promise‹void›*

___

### `Protected` _sanitizeRecord

▸ **_sanitizeRecord**(`record`: [User](../interfaces/user.md)): *[User](../interfaces/user.md)*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:38

**Parameters:**

Name | Type |
------ | ------ |
`record` | [User](../interfaces/user.md) |

**Returns:** *[User](../interfaces/user.md)*

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

###  authenticate

▸ **authenticate**(`username`: string, `password`: string): *Promise‹[User](../interfaces/user.md)›*

*Defined in [models/users.ts:51](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L51)*

Authenticate the user

**Parameters:**

Name | Type |
------ | ------ |
`username` | string |
`password` | string |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  authenticateWithToken

▸ **authenticateWithToken**(`apiToken?`: undefined | string): *Promise‹[User](../interfaces/user.md)›*

*Defined in [models/users.ts:95](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L95)*

Authenticate user by api token, returns private fields

**Parameters:**

Name | Type |
------ | ------ |
`apiToken?` | undefined \| string |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  count

▸ **count**(`q?`: undefined | string, `queryAccess?`: QueryAccess‹[User](../interfaces/user.md)›): *Promise‹number›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:20

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`queryAccess?` | QueryAccess‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹number›*

___

###  countBy

▸ **countBy**(`fields`: AnyInput‹[User](../interfaces/user.md)›, `joinBy?`: JoinBy, `arrayJoinBy?`: JoinBy): *Promise‹number›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:21

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[User](../interfaces/user.md)› |
`joinBy?` | JoinBy |
`arrayJoinBy?` | JoinBy |

**Returns:** *Promise‹number›*

___

###  create

▸ **create**(`record`: i.CreateRecordInput‹[User](../interfaces/user.md)›): *Promise‹[User](../interfaces/user.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:22

**Parameters:**

Name | Type |
------ | ------ |
`record` | i.CreateRecordInput‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  createWithPassword

▸ **createWithPassword**(`record`: [CreateUserInput](../overview.md#createuserinput), `password`: string): *Promise‹[User](../interfaces/user.md)›*

*Defined in [models/users.ts:23](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L23)*

Create user with password, returns private fields

**Parameters:**

Name | Type |
------ | ------ |
`record` | [CreateUserInput](../overview.md#createuserinput) |
`password` | string |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

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

▸ **find**(`q?`: undefined | string, `options?`: i.FindOptions‹[User](../interfaces/user.md)›, `queryAccess?`: QueryAccess‹[User](../interfaces/user.md)›): *Promise‹[User](../interfaces/user.md)[]›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:31

**Parameters:**

Name | Type |
------ | ------ |
`q?` | undefined \| string |
`options?` | i.FindOptions‹[User](../interfaces/user.md)› |
`queryAccess?` | QueryAccess‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹[User](../interfaces/user.md)[]›*

___

###  findAll

▸ **findAll**(`input`: string[] | string | undefined, `options?`: i.FindOneOptions‹[User](../interfaces/user.md)›, `queryAccess?`: QueryAccess‹[User](../interfaces/user.md)›): *Promise‹[User](../interfaces/user.md)[]›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:30

**Parameters:**

Name | Type |
------ | ------ |
`input` | string[] \| string \| undefined |
`options?` | i.FindOneOptions‹[User](../interfaces/user.md)› |
`queryAccess?` | QueryAccess‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹[User](../interfaces/user.md)[]›*

___

###  findAndApply

▸ **findAndApply**(`updates`: Partial‹[User](../interfaces/user.md)› | undefined, `options?`: i.FindOneOptions‹[User](../interfaces/user.md)›, `queryAccess?`: QueryAccess‹[User](../interfaces/user.md)›): *Promise‹Partial‹[User](../interfaces/user.md)››*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:29

**Parameters:**

Name | Type |
------ | ------ |
`updates` | Partial‹[User](../interfaces/user.md)› \| undefined |
`options?` | i.FindOneOptions‹[User](../interfaces/user.md)› |
`queryAccess?` | QueryAccess‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹Partial‹[User](../interfaces/user.md)››*

___

###  findBy

▸ **findBy**(`fields`: AnyInput‹[User](../interfaces/user.md)›, `joinBy?`: JoinBy, `options?`: i.FindOneOptions‹[User](../interfaces/user.md)›, `queryAccess?`: QueryAccess‹[User](../interfaces/user.md)›): *Promise‹[User](../interfaces/user.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:26

**Parameters:**

Name | Type |
------ | ------ |
`fields` | AnyInput‹[User](../interfaces/user.md)› |
`joinBy?` | JoinBy |
`options?` | i.FindOneOptions‹[User](../interfaces/user.md)› |
`queryAccess?` | QueryAccess‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  findByAnyId

▸ **findByAnyId**(`anyId`: any, `options?`: i.FindOneOptions‹[User](../interfaces/user.md)›, `queryAccess?`: QueryAccess‹[User](../interfaces/user.md)›): *Promise‹[User](../interfaces/user.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`anyId` | any |
`options?` | i.FindOneOptions‹[User](../interfaces/user.md)› |
`queryAccess?` | QueryAccess‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  findById

▸ **findById**(`id`: string, `options?`: i.FindOneOptions‹[User](../interfaces/user.md)›, `queryAccess?`: QueryAccess‹[User](../interfaces/user.md)›): *Promise‹[User](../interfaces/user.md)›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`options?` | i.FindOneOptions‹[User](../interfaces/user.md)› |
`queryAccess?` | QueryAccess‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:18

**Returns:** *Promise‹void›*

___

###  isPrivateUser

▸ **isPrivateUser**(`user`: Partial‹[User](../interfaces/user.md)›): *boolean*

*Defined in [models/users.ts:121](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`user` | Partial‹[User](../interfaces/user.md)› |

**Returns:** *boolean*

___

###  removeRoleFromUsers

▸ **removeRoleFromUsers**(`roleId`: string): *Promise‹void›*

*Defined in [models/users.ts:128](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L128)*

**Parameters:**

Name | Type |
------ | ------ |
`roleId` | string |

**Returns:** *Promise‹void›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:19

**Returns:** *Promise‹void›*

___

###  update

▸ **update**(`record`: i.UpdateRecordInput‹[User](../interfaces/user.md)›): *Promise‹void›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/index-model.d.ts:32

**Parameters:**

Name | Type |
------ | ------ |
`record` | i.UpdateRecordInput‹[User](../interfaces/user.md)› |

**Returns:** *Promise‹void›*

___

###  updatePassword

▸ **updatePassword**(`id`: string, `password`: string): *Promise‹void›*

*Defined in [models/users.ts:36](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`password` | string |

**Returns:** *Promise‹void›*

___

###  updateToken

▸ **updateToken**(`id`: string): *Promise‹string›*

*Defined in [models/users.ts:80](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/users.ts#L80)*

Update the API Token for a user

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *Promise‹string›*
