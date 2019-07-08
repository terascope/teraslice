---
title: Data Access: `Space`
sidebar_label: Space
---

# Interface: Space

The definition of a Space model

## Hierarchy

* `IndexModelRecord`

  * **Space**

### Index

#### Properties

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

*Defined in [models/config/spaces.ts:183](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-access/src/models/config/spaces.ts#L183)*

The mutli-tenant ID representing the client

___

### `Optional` config

• **config**? : *[SpaceSearchConfig](spacesearchconfig.md) | [SpaceStreamingConfig](spacestreamingconfig.md)*

*Defined in [models/config/spaces.ts:223](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-access/src/models/config/spaces.ts#L223)*

Configuration for the space

___

###  created

• **created**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:163

Creation date

___

###  data_type

• **data_type**: *string*

*Defined in [models/config/spaces.ts:208](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-access/src/models/config/spaces.ts#L208)*

The associated data type

___

### `Optional` description

• **description**? : *undefined | string*

*Defined in [models/config/spaces.ts:203](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-access/src/models/config/spaces.ts#L203)*

Description of the Role

___

### `Optional` endpoint

• **endpoint**? : *undefined | string*

*Defined in [models/config/spaces.ts:198](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-access/src/models/config/spaces.ts#L198)*

A URL friendly name for endpoint that is associated with the space, this must be unique

___

###  id

• **id**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:159

ID of the view - nanoid 12 digit

___

###  name

• **name**: *string*

*Defined in [models/config/spaces.ts:188](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-access/src/models/config/spaces.ts#L188)*

Name of the Space

___

###  roles

• **roles**: *string[]*

*Defined in [models/config/spaces.ts:218](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-access/src/models/config/spaces.ts#L218)*

A list of associated roles

___

###  type

• **type**: *[SpaceConfigType](../overview.md#spaceconfigtype)*

*Defined in [models/config/spaces.ts:193](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-access/src/models/config/spaces.ts#L193)*

The space configuration type

___

###  updated

• **updated**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:161

Updated date

___

###  views

• **views**: *string[]*

*Defined in [models/config/spaces.ts:213](https://github.com/terascope/teraslice/blob/a2250fb9/packages/data-access/src/models/config/spaces.ts#L213)*

A list of associated views
