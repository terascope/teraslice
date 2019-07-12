---
title: Data Access: `DataAccessConfig`
sidebar_label: DataAccessConfig
---

# Interface: DataAccessConfig

The definition of an ACL for limiting access to data.

This will be passed in in to non-admin data-access tools,
like FilterAccess and SearchAccess

## Hierarchy

* **DataAccessConfig**

### Index

#### Properties

* [config](dataaccessconfig.md#optional-config)
* [data_type](dataaccessconfig.md#data_type)
* [role_id](dataaccessconfig.md#role_id)
* [space_endpoint](dataaccessconfig.md#optional-space_endpoint)
* [space_id](dataaccessconfig.md#space_id)
* [type](dataaccessconfig.md#type)
* [user_id](dataaccessconfig.md#user_id)
* [view](dataaccessconfig.md#view)

## Properties

### `Optional` config

• **config**? : *[SpaceSearchConfig](spacesearchconfig.md) | [SpaceStreamingConfig](spacestreamingconfig.md)*

*Defined in [interfaces.ts:91](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L91)*

The space's configuration

___

###  data_type

• **data_type**: *[DataType](datatype.md)*

*Defined in [interfaces.ts:96](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L96)*

The data type associated with the view

___

###  role_id

• **role_id**: *string*

*Defined in [interfaces.ts:71](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L71)*

The id of the Role used

___

### `Optional` space_endpoint

• **space_endpoint**? : *undefined | string*

*Defined in [interfaces.ts:86](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L86)*

The endpoint of the space

___

###  space_id

• **space_id**: *string*

*Defined in [interfaces.ts:76](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L76)*

The id of the space

___

###  type

• **type**: *`models.SpaceConfigType`*

*Defined in [interfaces.ts:81](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L81)*

The space configuration type

___

###  user_id

• **user_id**: *string*

*Defined in [interfaces.ts:66](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L66)*

The id of the user authenticated

___

###  view

• **view**: *[View](view.md)*

*Defined in [interfaces.ts:101](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/interfaces.ts#L101)*

The authenticated user's view of the space
