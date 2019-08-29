---
title: Data Access: `Space`
sidebar_label: Space
---

# Interface: Space

The definition of a Space model

## Hierarchy

* IndexModelRecord

  * **Space**

## Index

### Properties

* [client_id](space.md#client_id)
* [config](space.md#optional-config)
* [created](space.md#created)
* [data_type](space.md#data_type)
* [description](space.md#optional-description)
* [endpoint](space.md#optional-endpoint)
* [id](space.md#id)
* [name](space.md#name)
* [roles](space.md#roles)
* [type](space.md#type)
* [updated](space.md#updated)
* [views](space.md#views)

## Properties

###  client_id

• **client_id**: *number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:163

The mutli-tenant ID representing the client

___

### `Optional` config

• **config**? : *[SpaceSearchConfig](spacesearchconfig.md) | [SpaceStreamingConfig](spacestreamingconfig.md)*

*Defined in [models/config/spaces.ts:211](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/spaces.ts#L211)*

Configuration for the space

___

###  created

• **created**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:171

Creation date

___

###  data_type

• **data_type**: *string*

*Defined in [models/config/spaces.ts:196](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/spaces.ts#L196)*

The associated data type

___

### `Optional` description

• **description**? : *undefined | string*

*Defined in [models/config/spaces.ts:191](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/spaces.ts#L191)*

Description of the Role

___

### `Optional` endpoint

• **endpoint**? : *undefined | string*

*Defined in [models/config/spaces.ts:186](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/spaces.ts#L186)*

A URL friendly name for endpoint that is associated with the space, this must be unique

___

###  id

• **id**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:159

A unique ID for the record - nanoid 12 digit

___

###  name

• **name**: *string*

*Defined in [models/config/spaces.ts:176](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/spaces.ts#L176)*

Name of the Space

___

###  roles

• **roles**: *string[]*

*Defined in [models/config/spaces.ts:206](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/spaces.ts#L206)*

A list of associated roles

___

###  type

• **type**: *[SpaceConfigType](../overview.md#spaceconfigtype)*

*Defined in [models/config/spaces.ts:181](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/spaces.ts#L181)*

The space configuration type

___

###  updated

• **updated**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:167

Updated date

___

###  views

• **views**: *string[]*

*Defined in [models/config/spaces.ts:201](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/spaces.ts#L201)*

A list of associated views
