---
title: Data Access API Overview
sidebar_label: API
---

#### Classes

* [ACLManager](classes/aclmanager.md)
* [DataTypes](classes/datatypes.md)
* [Roles](classes/roles.md)
* [SearchAccess](classes/searchaccess.md)
* [Spaces](classes/spaces.md)
* [StreamAccess](classes/streamaccess.md)
* [Users](classes/users.md)
* [Views](classes/views.md)

#### Interfaces

* [DataAccessConfig](interfaces/dataaccessconfig.md)
* [DataType](interfaces/datatype.md)
* [FinalResponse](interfaces/finalresponse.md)
* [GeoSortQuery](interfaces/geosortquery.md)
* [InputQuery](interfaces/inputquery.md)
* [ManagerConfig](interfaces/managerconfig.md)
* [Role](interfaces/role.md)
* [Space](interfaces/space.md)
* [SpaceSearchConfig](interfaces/spacesearchconfig.md)
* [SpaceStreamingConfig](interfaces/spacestreamingconfig.md)
* [User](interfaces/user.md)
* [View](interfaces/view.md)

#### Type aliases

* [AnyModel](overview.md#anymodel)
* [AuthUser](overview.md#authuser)
* [CreateUserInput](overview.md#createuserinput)
* [FindArgs](overview.md#findargs)
* [FindOneArgs](overview.md#findoneargs)
* [ModelName](overview.md#modelname)
* [ResolveDataTypeArgs](overview.md#resolvedatatypeargs)
* [SortOrder](overview.md#sortorder)
* [SpaceConfigType](overview.md#spaceconfigtype)
* [UpdateUserInput](overview.md#updateuserinput)
* [UserType](overview.md#usertype)

#### Variables

* [ModelNames](overview.md#const-modelnames)
* [SpaceConfigTypes](overview.md#const-spaceconfigtypes)
* [UserTypes](overview.md#const-usertypes)

#### Functions

* [generateAPIToken](overview.md#generateapitoken)
* [generatePasswordHash](overview.md#generatepasswordhash)
* [generateSalt](overview.md#generatesalt)

## Type aliases

###  AnyModel

Ƭ **AnyModel**: *[User](interfaces/user.md) | [Role](interfaces/role.md) | [DataType](interfaces/datatype.md) | [Space](interfaces/space.md) | [View](interfaces/view.md)*

*Defined in [interfaces.ts:9](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L9)*

___

###  AuthUser

Ƭ **AuthUser**: *[User](interfaces/user.md) | false*

*Defined in [interfaces.ts:8](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L8)*

___

###  CreateUserInput

Ƭ **CreateUserInput**: *`Omit<CreateRecordInput<User>, "api_token" | "hash" | "salt">`*

*Defined in [models/config/users.ts:195](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/users.ts#L195)*

___

###  FindArgs

Ƭ **FindArgs**: *object & `FindOptions<T>`*

*Defined in [interfaces.ts:11](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L11)*

___

###  FindOneArgs

Ƭ **FindOneArgs**: *object & `FindOneOptions<T>`*

*Defined in [interfaces.ts:12](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L12)*

___

###  ModelName

Ƭ **ModelName**: *"User" | "Role" | "DataType" | "Space" | "View"*

*Defined in [interfaces.ts:5](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L5)*

___

###  ResolveDataTypeArgs

Ƭ **ResolveDataTypeArgs**: *`models.ResolveDataTypeOptions` & object*

*Defined in [interfaces.ts:104](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L104)*

___

###  SortOrder

Ƭ **SortOrder**: *"asc" | "desc"*

*Defined in [interfaces.ts:20](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L20)*

___

###  SpaceConfigType

Ƭ **SpaceConfigType**: *"SEARCH" | "STREAMING"*

*Defined in [models/config/spaces.ts:3](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/spaces.ts#L3)*

___

###  UpdateUserInput

Ƭ **UpdateUserInput**: *`Omit<UpdateRecordInput<User>, "api_token" | "hash" | "salt">`*

*Defined in [models/config/users.ts:196](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/users.ts#L196)*

___

###  UserType

Ƭ **UserType**: *"SUPERADMIN" | "ADMIN" | "DATAADMIN" | "USER"*

*Defined in [models/config/users.ts:12](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/users.ts#L12)*

A fixed permission level type system, used for primarly metadata management.

Available Types:
- `SUPERADMIN`: This type is multi-tenate and read/write everything.
- `ADMIN`: This type is single-tenate and can read/write most things.
- `DATAADMIN`: This type is single-tenate and read/write Spaces and DataTypes.
- `USER`: This type is single-tenate and can only read/write things it has direct permission to.

## Variables

### `Const` ModelNames

• **ModelNames**: *`ReadonlyArray<ModelName>`* =  ['User', 'Role', 'DataType', 'Space', 'View']

*Defined in [interfaces.ts:6](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L6)*

___

### `Const` SpaceConfigTypes

• **SpaceConfigTypes**: *`ReadonlyArray<SpaceConfigType>`* =  ['SEARCH', 'STREAMING']

*Defined in [models/config/spaces.ts:4](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/spaces.ts#L4)*

___

### `Const` UserTypes

• **UserTypes**: *`ReadonlyArray<UserType>`* =  ['SUPERADMIN', 'ADMIN', 'DATAADMIN', 'USER']

*Defined in [models/config/users.ts:13](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/users.ts#L13)*

## Functions

###  generateAPIToken

▸ **generateAPIToken**(`hash`: string, `username`: string): *`Promise<string>`*

*Defined in [utils/crypto.ts:10](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/utils/crypto.ts#L10)*

Generate a API Token

**Parameters:**

Name | Type |
------ | ------ |
`hash` | string |
`username` | string |

**Returns:** *`Promise<string>`*

___

###  generatePasswordHash

▸ **generatePasswordHash**(`password`: string, `salt`: string): *`Promise<string>`*

*Defined in [utils/crypto.ts:30](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/utils/crypto.ts#L30)*

Generate a secure password hash

**Parameters:**

Name | Type |
------ | ------ |
`password` | string |
`salt` | string |

**Returns:** *`Promise<string>`*

___

###  generateSalt

▸ **generateSalt**(): *`Promise<string>`*

*Defined in [utils/crypto.ts:22](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/utils/crypto.ts#L22)*

Generate a random salt

**Returns:** *`Promise<string>`*
