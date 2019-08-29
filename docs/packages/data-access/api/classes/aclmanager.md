---
title: Data Access: `ACLManager`
sidebar_label: ACLManager
---

# Class: ACLManager

ACL Manager for Data Access Roles, essentially a
high level abstraction of Spaces, Users, Roles, and Views

**`todo`** ensure client ids match when associating records

## Hierarchy

* **ACLManager**

## Index

### Constructors

* [constructor](aclmanager.md#constructor)

### Properties

* [logger](aclmanager.md#logger)

### Methods

* [authenticate](aclmanager.md#authenticate)
* [countDataTypes](aclmanager.md#countdatatypes)
* [countRoles](aclmanager.md#countroles)
* [countSpaces](aclmanager.md#countspaces)
* [countUsers](aclmanager.md#countusers)
* [countViews](aclmanager.md#countviews)
* [createDataType](aclmanager.md#createdatatype)
* [createRole](aclmanager.md#createrole)
* [createSpace](aclmanager.md#createspace)
* [createUser](aclmanager.md#createuser)
* [createView](aclmanager.md#createview)
* [findDataType](aclmanager.md#finddatatype)
* [findDataTypes](aclmanager.md#finddatatypes)
* [findRole](aclmanager.md#findrole)
* [findRoles](aclmanager.md#findroles)
* [findSpace](aclmanager.md#findspace)
* [findSpaces](aclmanager.md#findspaces)
* [findUser](aclmanager.md#finduser)
* [findUsers](aclmanager.md#findusers)
* [findView](aclmanager.md#findview)
* [findViews](aclmanager.md#findviews)
* [getViewForSpace](aclmanager.md#getviewforspace)
* [initialize](aclmanager.md#initialize)
* [migrateIndex](aclmanager.md#migrateindex)
* [removeDataType](aclmanager.md#removedatatype)
* [removeRole](aclmanager.md#removerole)
* [removeSpace](aclmanager.md#removespace)
* [removeUser](aclmanager.md#removeuser)
* [removeView](aclmanager.md#removeview)
* [resolveDataTypeConfig](aclmanager.md#resolvedatatypeconfig)
* [shutdown](aclmanager.md#shutdown)
* [simpleMigrate](aclmanager.md#simplemigrate)
* [updateDataType](aclmanager.md#updatedatatype)
* [updatePassword](aclmanager.md#updatepassword)
* [updateRole](aclmanager.md#updaterole)
* [updateSpace](aclmanager.md#updatespace)
* [updateToken](aclmanager.md#updatetoken)
* [updateUser](aclmanager.md#updateuser)
* [updateView](aclmanager.md#updateview)

## Constructors

###  constructor

\+ **new ACLManager**(`client`: Client, `config`: [ManagerConfig](../interfaces/managerconfig.md)): *[ACLManager](aclmanager.md)*

*Defined in [acl-manager.ts:23](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`config` | [ManagerConfig](../interfaces/managerconfig.md) |

**Returns:** *[ACLManager](aclmanager.md)*

## Properties

###  logger

• **logger**: *Logger*

*Defined in [acl-manager.ts:16](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L16)*

## Methods

###  authenticate

▸ **authenticate**(`args`: object): *Promise‹[User](../interfaces/user.md)›*

*Defined in [acl-manager.ts:77](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L77)*

Authenticate user with an api_token or username and password

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  countDataTypes

▸ **countDataTypes**(`args`: object, `authUser`: i.AuthUser): *Promise‹number›*

*Defined in [acl-manager.ts:303](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L303)*

Count data types by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹number›*

___

###  countRoles

▸ **countRoles**(`args`: object, `authUser`: i.AuthUser): *Promise‹number›*

*Defined in [acl-manager.ts:210](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L210)*

Count roles by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹number›*

___

###  countSpaces

▸ **countSpaces**(`args`: object, `authUser`: i.AuthUser): *Promise‹number›*

*Defined in [acl-manager.ts:399](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L399)*

Count spaces by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹number›*

___

###  countUsers

▸ **countUsers**(`args`: object, `authUser`: i.AuthUser): *Promise‹number›*

*Defined in [acl-manager.ts:117](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L117)*

Count users by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹number›*

___

###  countViews

▸ **countViews**(`args`: object, `authUser`: i.AuthUser): *Promise‹number›*

*Defined in [acl-manager.ts:471](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L471)*

Count views by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹number›*

___

###  createDataType

▸ **createDataType**(`args`: object, `authUser`: i.AuthUser): *Promise‹[DataType](../interfaces/datatype.md)›*

*Defined in [acl-manager.ts:310](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L310)*

Create a data type

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)›*

___

###  createRole

▸ **createRole**(`args`: object, `authUser`: i.AuthUser): *Promise‹[Role](../interfaces/role.md)›*

*Defined in [acl-manager.ts:217](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L217)*

Create a role

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[Role](../interfaces/role.md)›*

___

###  createSpace

▸ **createSpace**(`args`: object, `authUser`: i.AuthUser): *Promise‹[Space](../interfaces/space.md)›*

*Defined in [acl-manager.ts:409](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L409)*

Create space with optional views
If roles are specified on any of the views, it will try automatically
attached the space to those roles.

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[Space](../interfaces/space.md)›*

___

###  createUser

▸ **createUser**(`args`: object, `authUser`: i.AuthUser): *Promise‹[User](../interfaces/user.md)›*

*Defined in [acl-manager.ts:124](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L124)*

Create a user

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  createView

▸ **createView**(`args`: object, `authUser`: i.AuthUser): *Promise‹[View](../interfaces/view.md)›*

*Defined in [acl-manager.ts:478](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L478)*

Create a view, this will attach to the space and the role

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[View](../interfaces/view.md)›*

___

###  findDataType

▸ **findDataType**(`args`: i.FindOneArgs‹[DataType](../interfaces/datatype.md)›, `authUser`: i.AuthUser): *Promise‹[DataType](../interfaces/datatype.md)›*

*Defined in [acl-manager.ts:279](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L279)*

Find data type by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | i.FindOneArgs‹[DataType](../interfaces/datatype.md)› |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)›*

___

###  findDataTypes

▸ **findDataTypes**(`args`: i.FindArgs‹[DataType](../interfaces/datatype.md)›, `authUser`: i.AuthUser): *Promise‹[DataType](../interfaces/datatype.md)[]›*

*Defined in [acl-manager.ts:296](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L296)*

Find data types by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | i.FindArgs‹[DataType](../interfaces/datatype.md)› |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)[]›*

___

###  findRole

▸ **findRole**(`args`: i.FindOneArgs‹[Role](../interfaces/role.md)›, `authUser`: i.AuthUser): *Promise‹[Role](../interfaces/role.md)›*

*Defined in [acl-manager.ts:196](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L196)*

Find role by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | i.FindOneArgs‹[Role](../interfaces/role.md)› |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[Role](../interfaces/role.md)›*

___

###  findRoles

▸ **findRoles**(`args`: i.FindArgs‹[Role](../interfaces/role.md)›, `authUser`: i.AuthUser): *Promise‹[Role](../interfaces/role.md)[]›*

*Defined in [acl-manager.ts:203](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L203)*

Find roles by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | i.FindArgs‹[Role](../interfaces/role.md)› |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹[Role](../interfaces/role.md)[]›*

___

###  findSpace

▸ **findSpace**(`args`: i.FindOneArgs‹[Space](../interfaces/space.md)›, `authUser`: i.AuthUser): *Promise‹[Space](../interfaces/space.md)›*

*Defined in [acl-manager.ts:385](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L385)*

Find space by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | i.FindOneArgs‹[Space](../interfaces/space.md)› |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[Space](../interfaces/space.md)›*

___

###  findSpaces

▸ **findSpaces**(`args`: i.FindArgs‹[Space](../interfaces/space.md)›, `authUser`: i.AuthUser): *Promise‹[Space](../interfaces/space.md)[]›*

*Defined in [acl-manager.ts:392](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L392)*

Find spaces by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | i.FindArgs‹[Space](../interfaces/space.md)› |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹[Space](../interfaces/space.md)[]›*

___

###  findUser

▸ **findUser**(`args`: i.FindOneArgs‹[User](../interfaces/user.md)›, `authUser`: i.AuthUser): *Promise‹[User](../interfaces/user.md)›*

*Defined in [acl-manager.ts:98](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L98)*

Find user by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | i.FindOneArgs‹[User](../interfaces/user.md)› |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  findUsers

▸ **findUsers**(`args`: i.FindArgs‹[User](../interfaces/user.md)›, `authUser`: i.AuthUser): *Promise‹[User](../interfaces/user.md)[]›*

*Defined in [acl-manager.ts:110](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L110)*

Find all users by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | i.FindArgs‹[User](../interfaces/user.md)› |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹[User](../interfaces/user.md)[]›*

___

###  findView

▸ **findView**(`args`: i.FindOneArgs‹[View](../interfaces/view.md)›, `authUser`: i.AuthUser): *Promise‹[View](../interfaces/view.md)›*

*Defined in [acl-manager.ts:457](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L457)*

Find view by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | i.FindOneArgs‹[View](../interfaces/view.md)› |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[View](../interfaces/view.md)›*

___

###  findViews

▸ **findViews**(`args`: i.FindArgs‹[View](../interfaces/view.md)›, `authUser`: i.AuthUser): *Promise‹[View](../interfaces/view.md)[]›*

*Defined in [acl-manager.ts:464](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L464)*

Find views by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | i.FindArgs‹[View](../interfaces/view.md)› |  {} |
`authUser` | i.AuthUser | - |

**Returns:** *Promise‹[View](../interfaces/view.md)[]›*

___

###  getViewForSpace

▸ **getViewForSpace**(`args`: object, `authUser`: i.AuthUser): *Promise‹[DataAccessConfig](../interfaces/dataaccessconfig.md)›*

*Defined in [acl-manager.ts:541](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L541)*

Get the User's data access configuration for a "Space"

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[DataAccessConfig](../interfaces/dataaccessconfig.md)›*

___

###  initialize

▸ **initialize**(): *Promise‹void›*

*Defined in [acl-manager.ts:37](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L37)*

Initialize all index stores

**Returns:** *Promise‹void›*

___

###  migrateIndex

▸ **migrateIndex**(`model`: i.ModelName, `options`: MigrateIndexStoreOptions): *Promise‹any›*

*Defined in [acl-manager.ts:70](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`model` | i.ModelName |
`options` | MigrateIndexStoreOptions |

**Returns:** *Promise‹any›*

___

###  removeDataType

▸ **removeDataType**(`args`: object, `authUser`: i.AuthUser): *Promise‹boolean›*

*Defined in [acl-manager.ts:343](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L343)*

Remove a data type, this is really dangerous since there are views and spaces linked this

**`question`** should we remove the views and spaces associated with the data-type?

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹boolean›*

___

###  removeRole

▸ **removeRole**(`args`: object, `authUser`: i.AuthUser): *Promise‹boolean›*

*Defined in [acl-manager.ts:238](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L238)*

Remove role and remove from any associated views or users

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹boolean›*

___

###  removeSpace

▸ **removeSpace**(`args`: object, `authUser`: i.AuthUser): *Promise‹boolean›*

*Defined in [acl-manager.ts:444](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L444)*

Remove a space by id, this will clean up any associated views and roles

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹boolean›*

___

###  removeUser

▸ **removeUser**(`args`: object, `authUser`: i.AuthUser): *Promise‹boolean›*

*Defined in [acl-manager.ts:176](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L176)*

Remove user by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹boolean›*

___

###  removeView

▸ **removeView**(`args`: object, `authUser`: i.AuthUser): *Promise‹boolean›*

*Defined in [acl-manager.ts:516](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L516)*

Remove views and remove from any associated spaces

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹boolean›*

___

###  resolveDataTypeConfig

▸ **resolveDataTypeConfig**(`args`: i.ResolveDataTypeArgs, `authUser`: i.AuthUser): *Promise‹object›*

*Defined in [acl-manager.ts:286](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L286)*

Get the resolved type config for DataType

**Parameters:**

Name | Type |
------ | ------ |
`args` | i.ResolveDataTypeArgs |
`authUser` | i.AuthUser |

**Returns:** *Promise‹object›*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Defined in [acl-manager.ts:50](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L50)*

Shutdown all index stores

**Returns:** *Promise‹void›*

___

###  simpleMigrate

▸ **simpleMigrate**(): *Promise‹AnyObject›*

*Defined in [acl-manager.ts:60](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L60)*

**Returns:** *Promise‹AnyObject›*

___

###  updateDataType

▸ **updateDataType**(`args`: object, `authUser`: i.AuthUser): *Promise‹[DataType](../interfaces/datatype.md)›*

*Defined in [acl-manager.ts:323](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L323)*

Update a data type

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[DataType](../interfaces/datatype.md)›*

___

###  updatePassword

▸ **updatePassword**(`args`: object, `authUser`: i.AuthUser): *Promise‹boolean›*

*Defined in [acl-manager.ts:156](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L156)*

Update user's password

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹boolean›*

___

###  updateRole

▸ **updateRole**(`args`: object, `authUser`: i.AuthUser): *Promise‹[Role](../interfaces/role.md)›*

*Defined in [acl-manager.ts:227](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L227)*

Update a role

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[Role](../interfaces/role.md)›*

___

###  updateSpace

▸ **updateSpace**(`args`: object, `authUser`: i.AuthUser): *Promise‹[Space](../interfaces/space.md)›*

*Defined in [acl-manager.ts:426](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L426)*

Update a space

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[Space](../interfaces/space.md)›*

___

###  updateToken

▸ **updateToken**(`args`: object, `authUser`: i.AuthUser): *Promise‹string›*

*Defined in [acl-manager.ts:168](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L168)*

Generate a new API Token for a user

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹string›*

___

###  updateUser

▸ **updateUser**(`args`: object, `authUser`: i.AuthUser): *Promise‹[User](../interfaces/user.md)›*

*Defined in [acl-manager.ts:139](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L139)*

Update user without password

This cannot include private information

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[User](../interfaces/user.md)›*

___

###  updateView

▸ **updateView**(`args`: object, `authUser`: i.AuthUser): *Promise‹[View](../interfaces/view.md)›*

*Defined in [acl-manager.ts:489](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/acl-manager.ts#L489)*

Update a view, this will attach to the space and the role

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | i.AuthUser |

**Returns:** *Promise‹[View](../interfaces/view.md)›*
