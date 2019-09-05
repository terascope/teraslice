---
title: Data Access API Overview
sidebar_label: API
---

## Index

### Classes

* [ACLManager](classes/aclmanager.md)
* [DataTypes](classes/datatypes.md)
* [Roles](classes/roles.md)
* [SearchAccess](classes/searchaccess.md)
* [Spaces](classes/spaces.md)
* [StreamAccess](classes/streamaccess.md)
* [Users](classes/users.md)
* [Views](classes/views.md)

### Interfaces

* [DataAccessConfig](interfaces/dataaccessconfig.md)
* [DataType](interfaces/datatype.md)
* [FinalResponse](interfaces/finalresponse.md)
* [InputQuery](interfaces/inputquery.md)
* [ManagerConfig](interfaces/managerconfig.md)
* [Role](interfaces/role.md)
* [Space](interfaces/space.md)
* [SpaceSearchConfig](interfaces/spacesearchconfig.md)
* [SpaceStreamingConfig](interfaces/spacestreamingconfig.md)
* [User](interfaces/user.md)
* [View](interfaces/view.md)

### Type aliases

* [AnyModel](overview.md#anymodel)
* [AuthUser](overview.md#authuser)
* [CreateUserInput](overview.md#createuserinput)
* [FindArgs](overview.md#findargs)
* [FindOneArgs](overview.md#findoneargs)
* [ModelName](overview.md#modelname)
* [ResolveDataTypeArgs](overview.md#resolvedatatypeargs)
* [ResolveDataTypeOptions](overview.md#resolvedatatypeoptions)
* [SpaceConfigType](overview.md#spaceconfigtype)
* [UpdateUserInput](overview.md#updateuserinput)
* [UserType](overview.md#usertype)

### Variables

* [ModelNames](overview.md#const-modelnames)
* [SpaceConfigTypes](overview.md#const-spaceconfigtypes)
* [UserTypes](overview.md#const-usertypes)

### Functions

* [generateAPIToken](overview.md#generateapitoken)
* [generatePasswordHash](overview.md#generatepasswordhash)
* [generateSalt](overview.md#generatesalt)

## Type aliases

###  AnyModel

Ƭ **AnyModel**: *[User](interfaces/user.md) | [Role](interfaces/role.md) | [DataType](interfaces/datatype.md) | [Space](interfaces/space.md) | [View](interfaces/view.md)*

*Defined in [interfaces.ts:10](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/interfaces.ts#L10)*

___

###  AuthUser

Ƭ **AuthUser**: *[User](interfaces/user.md) | false*

*Defined in [interfaces.ts:9](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/interfaces.ts#L9)*

___

###  CreateUserInput

Ƭ **CreateUserInput**: *Omit‹CreateRecordInput‹[User](interfaces/user.md)›, "api_token" | "hash" | "salt"›*

*Defined in [models/config/users.ts:187](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L187)*

___

###  FindArgs

Ƭ **FindArgs**: *object & FindOptions‹T›*

*Defined in [interfaces.ts:12](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/interfaces.ts#L12)*

___

###  FindOneArgs

Ƭ **FindOneArgs**: *object & FindOneOptions‹T›*

*Defined in [interfaces.ts:13](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/interfaces.ts#L13)*

___

###  ModelName

Ƭ **ModelName**: *"User" | "Role" | "DataType" | "Space" | "View"*

*Defined in [interfaces.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/interfaces.ts#L6)*

___

###  ResolveDataTypeArgs

Ƭ **ResolveDataTypeArgs**: *models.ResolveDataTypeOptions & object*

*Defined in [interfaces.ts:88](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/interfaces.ts#L88)*

___

###  ResolveDataTypeOptions

Ƭ **ResolveDataTypeOptions**: *FindOneOptions‹[DataType](interfaces/datatype.md)› & object*

*Defined in [models/data-types.ts:186](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/data-types.ts#L186)*

___

###  SpaceConfigType

Ƭ **SpaceConfigType**: *"SEARCH" | "STREAMING"*

*Defined in [models/config/spaces.ts:3](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/spaces.ts#L3)*

___

###  UpdateUserInput

Ƭ **UpdateUserInput**: *Omit‹UpdateRecordInput‹[User](interfaces/user.md)›, "api_token" | "hash" | "salt"›*

*Defined in [models/config/users.ts:188](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L188)*

___

###  UserType

Ƭ **UserType**: *"SUPERADMIN" | "ADMIN" | "DATAADMIN" | "USER"*

*Defined in [models/config/users.ts:14](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L14)*

A fixed permission level type system, used for primarly metadata management.

Available Types:
- `SUPERADMIN`: This type is multi-tenate and read/write everything.
- `ADMIN`: This type is single-tenate and can read/write most things.
- `DATAADMIN`: This type is single-tenate and read/write Spaces and DataTypes.
- `USER`: This type is single-tenate and can only read/write things it has direct permission to.

## Variables

### `Const` ModelNames

• **ModelNames**: *keyof ModelName[]* =  ['User', 'Role', 'DataType', 'Space', 'View']

*Defined in [interfaces.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/interfaces.ts#L7)*

___

### `Const` SpaceConfigTypes

• **SpaceConfigTypes**: *keyof SpaceConfigType[]* =  ['SEARCH', 'STREAMING']

*Defined in [models/config/spaces.ts:4](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/spaces.ts#L4)*

___

### `Const` UserTypes

• **UserTypes**: *keyof UserType[]* =  ['SUPERADMIN', 'ADMIN', 'DATAADMIN', 'USER']

*Defined in [models/config/users.ts:15](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L15)*

## Functions

###  generateAPIToken

▸ **generateAPIToken**(`hash`: string, `username`: string): *Promise‹string›*

*Defined in [utils/crypto.ts:10](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/utils/crypto.ts#L10)*

Generate a API Token

**Parameters:**

Name | Type |
------ | ------ |
`hash` | string |
`username` | string |

**Returns:** *Promise‹string›*

___

###  generatePasswordHash

▸ **generatePasswordHash**(`password`: string, `salt`: string): *Promise‹string›*

*Defined in [utils/crypto.ts:30](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/utils/crypto.ts#L30)*

Generate a secure password hash

**Parameters:**

Name | Type |
------ | ------ |
`password` | string |
`salt` | string |

**Returns:** *Promise‹string›*

___

###  generateSalt

▸ **generateSalt**(): *Promise‹string›*

*Defined in [utils/crypto.ts:22](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/utils/crypto.ts#L22)*

Generate a random salt

**Returns:** *Promise‹string›*
