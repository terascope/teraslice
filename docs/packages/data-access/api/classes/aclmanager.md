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

### Index

#### Constructors

* [constructor](aclmanager.md#constructor)

#### Properties

* [logger](aclmanager.md#logger)

#### Methods

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
* [removeDataType](aclmanager.md#removedatatype)
* [removeRole](aclmanager.md#removerole)
* [removeSpace](aclmanager.md#removespace)
* [removeUser](aclmanager.md#removeuser)
* [removeView](aclmanager.md#removeview)
* [resolveDataTypeConfig](aclmanager.md#resolvedatatypeconfig)
* [shutdown](aclmanager.md#shutdown)
* [updateDataType](aclmanager.md#updatedatatype)
* [updatePassword](aclmanager.md#updatepassword)
* [updateRole](aclmanager.md#updaterole)
* [updateSpace](aclmanager.md#updatespace)
* [updateToken](aclmanager.md#updatetoken)
* [updateUser](aclmanager.md#updateuser)
* [updateView](aclmanager.md#updateview)

## Constructors

###  constructor

\+ **new ACLManager**(`client`: *`Client`*, `config`: *[ManagerConfig](../interfaces/managerconfig.md)*): *[ACLManager](aclmanager.md)*

*Defined in [acl-manager.ts:23](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | `Client` |
`config` | [ManagerConfig](../interfaces/managerconfig.md) |

**Returns:** *[ACLManager](aclmanager.md)*

## Properties

###  logger

• **logger**: *`Logger`*

*Defined in [acl-manager.ts:16](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L16)*

## Methods

###  authenticate

▸ **authenticate**(`args`: *object*): *`Promise<User>`*

*Defined in [acl-manager.ts:63](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L63)*

Authenticate user with an api_token or username and password

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |

**Returns:** *`Promise<User>`*

___

###  countDataTypes

▸ **countDataTypes**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<number>`*

*Defined in [acl-manager.ts:260](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L260)*

Count data types by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<number>`*

___

###  countRoles

▸ **countRoles**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<number>`*

*Defined in [acl-manager.ts:181](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L181)*

Count roles by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<number>`*

___

###  countSpaces

▸ **countSpaces**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<number>`*

*Defined in [acl-manager.ts:334](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L334)*

Count spaces by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<number>`*

___

###  countUsers

▸ **countUsers**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<number>`*

*Defined in [acl-manager.ts:97](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L97)*

Count users by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<number>`*

___

###  countViews

▸ **countViews**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<number>`*

*Defined in [acl-manager.ts:406](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L406)*

Count views by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | object |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<number>`*

___

###  createDataType

▸ **createDataType**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<DataType>`*

*Defined in [acl-manager.ts:267](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L267)*

Create a data type

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<DataType>`*

___

###  createRole

▸ **createRole**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<Role>`*

*Defined in [acl-manager.ts:188](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L188)*

Create a role

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<Role>`*

___

###  createSpace

▸ **createSpace**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<Space>`*

*Defined in [acl-manager.ts:344](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L344)*

Create space with optional views
If roles are specified on any of the views, it will try automatically
attached the space to those roles.

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<Space>`*

___

###  createUser

▸ **createUser**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<User>`*

*Defined in [acl-manager.ts:104](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L104)*

Create a user

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<User>`*

___

###  createView

▸ **createView**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<View>`*

*Defined in [acl-manager.ts:413](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L413)*

Create a view, this will attach to the space and the role

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<View>`*

___

###  findDataType

▸ **findDataType**(`args`: *`i.FindOneArgs<DataType>`*, `authUser`: *`i.AuthUser`*): *`Promise<DataType>`*

*Defined in [acl-manager.ts:239](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L239)*

Find data type by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | `i.FindOneArgs<DataType>` |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<DataType>`*

___

###  findDataTypes

▸ **findDataTypes**(`args`: *`i.FindArgs<DataType>`*, `authUser`: *`i.AuthUser`*): *`Promise<DataType[]>`*

*Defined in [acl-manager.ts:253](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L253)*

Find data types by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | `i.FindArgs<DataType>` |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<DataType[]>`*

___

###  findRole

▸ **findRole**(`args`: *`i.FindOneArgs<Role>`*, `authUser`: *`i.AuthUser`*): *`Promise<Role>`*

*Defined in [acl-manager.ts:167](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L167)*

Find role by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | `i.FindOneArgs<Role>` |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<Role>`*

___

###  findRoles

▸ **findRoles**(`args`: *`i.FindArgs<Role>`*, `authUser`: *`i.AuthUser`*): *`Promise<Role[]>`*

*Defined in [acl-manager.ts:174](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L174)*

Find roles by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | `i.FindArgs<Role>` |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<Role[]>`*

___

###  findSpace

▸ **findSpace**(`args`: *`i.FindOneArgs<Space>`*, `authUser`: *`i.AuthUser`*): *`Promise<Space>`*

*Defined in [acl-manager.ts:320](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L320)*

Find space by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | `i.FindOneArgs<Space>` |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<Space>`*

___

###  findSpaces

▸ **findSpaces**(`args`: *`i.FindArgs<Space>`*, `authUser`: *`i.AuthUser`*): *`Promise<Space[]>`*

*Defined in [acl-manager.ts:327](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L327)*

Find spaces by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | `i.FindArgs<Space>` |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<Space[]>`*

___

###  findUser

▸ **findUser**(`args`: *`i.FindOneArgs<User>`*, `authUser`: *`i.AuthUser`*): *`Promise<User>`*

*Defined in [acl-manager.ts:82](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L82)*

Find user by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | `i.FindOneArgs<User>` |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<User>`*

___

###  findUsers

▸ **findUsers**(`args`: *`i.FindArgs<User>`*, `authUser`: *`i.AuthUser`*): *`Promise<User[]>`*

*Defined in [acl-manager.ts:90](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L90)*

Find all users by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | `i.FindArgs<User>` |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<User[]>`*

___

###  findView

▸ **findView**(`args`: *`i.FindOneArgs<View>`*, `authUser`: *`i.AuthUser`*): *`Promise<View>`*

*Defined in [acl-manager.ts:392](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L392)*

Find view by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | `i.FindOneArgs<View>` |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<View>`*

___

###  findViews

▸ **findViews**(`args`: *`i.FindArgs<View>`*, `authUser`: *`i.AuthUser`*): *`Promise<View[]>`*

*Defined in [acl-manager.ts:399](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L399)*

Find views by a given query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | `i.FindArgs<View>` |  {} |
`authUser` | `i.AuthUser` | - |

**Returns:** *`Promise<View[]>`*

___

###  getViewForSpace

▸ **getViewForSpace**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<DataAccessConfig>`*

*Defined in [acl-manager.ts:476](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L476)*

Get the User's data access configuration for a "Space"

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<DataAccessConfig>`*

___

###  initialize

▸ **initialize**(): *`Promise<void>`*

*Defined in [acl-manager.ts:37](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L37)*

Initialize all index stores

**Returns:** *`Promise<void>`*

___

###  removeDataType

▸ **removeDataType**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<boolean>`*

*Defined in [acl-manager.ts:290](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L290)*

Remove a data type, this is really dangerous since there are views and spaces linked this

**`question`** should we remove the views and spaces associated with the data-type?

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<boolean>`*

___

###  removeRole

▸ **removeRole**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<boolean>`*

*Defined in [acl-manager.ts:209](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L209)*

Remove role and remove from any associated views or users

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<boolean>`*

___

###  removeSpace

▸ **removeSpace**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<boolean>`*

*Defined in [acl-manager.ts:379](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L379)*

Remove a space by id, this will clean up any associated views and roles

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<boolean>`*

___

###  removeUser

▸ **removeUser**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<boolean>`*

*Defined in [acl-manager.ts:147](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L147)*

Remove user by id

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<boolean>`*

___

###  removeView

▸ **removeView**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<boolean>`*

*Defined in [acl-manager.ts:451](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L451)*

Remove views and remove from any associated spaces

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<boolean>`*

___

###  resolveDataTypeConfig

▸ **resolveDataTypeConfig**(`args`: *`i.ResolveDataTypeArgs`*, `authUser`: *`i.AuthUser`*): *`Promise<object>`*

*Defined in [acl-manager.ts:246](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L246)*

Get the resolved type config for DataType

**Parameters:**

Name | Type |
------ | ------ |
`args` | `i.ResolveDataTypeArgs` |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<object>`*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Defined in [acl-manager.ts:50](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L50)*

Shutdown all index stores

**Returns:** *`Promise<void>`*

___

###  updateDataType

▸ **updateDataType**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<DataType>`*

*Defined in [acl-manager.ts:277](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L277)*

Update a data type

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<DataType>`*

___

###  updatePassword

▸ **updatePassword**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<boolean>`*

*Defined in [acl-manager.ts:130](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L130)*

Update user's password

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<boolean>`*

___

###  updateRole

▸ **updateRole**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<Role>`*

*Defined in [acl-manager.ts:198](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L198)*

Update a role

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<Role>`*

___

###  updateSpace

▸ **updateSpace**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<Space>`*

*Defined in [acl-manager.ts:361](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L361)*

Update a space

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<Space>`*

___

###  updateToken

▸ **updateToken**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<string>`*

*Defined in [acl-manager.ts:139](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L139)*

Generate a new API Token for a user

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<string>`*

___

###  updateUser

▸ **updateUser**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<User>`*

*Defined in [acl-manager.ts:116](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L116)*

Update user without password

This cannot include private information

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<User>`*

___

###  updateView

▸ **updateView**(`args`: *object*, `authUser`: *`i.AuthUser`*): *`Promise<View>`*

*Defined in [acl-manager.ts:424](https://github.com/terascope/teraslice/blob/9dc0f8b8/packages/data-access/src/acl-manager.ts#L424)*

Update a view, this will attach to the space and the role

**Parameters:**

Name | Type |
------ | ------ |
`args` | object |
`authUser` | `i.AuthUser` |

**Returns:** *`Promise<View>`*

