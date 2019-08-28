---
title: Data Access: `View`
sidebar_label: View
---

# Interface: View

The definition of a View model

## Hierarchy

* IndexModelRecord

  * **View**

## Index

### Properties

* [client_id](view.md#client_id)
* [constraint](view.md#optional-constraint)
* [created](view.md#created)
* [data_type](view.md#data_type)
* [description](view.md#optional-description)
* [excludes](view.md#optional-excludes)
* [id](view.md#id)
* [includes](view.md#optional-includes)
* [name](view.md#name)
* [prevent_prefix_wildcard](view.md#optional-prevent_prefix_wildcard)
* [roles](view.md#roles)
* [updated](view.md#updated)

## Properties

###  client_id

• **client_id**: *number*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:163

The mutli-tenant ID representing the client

___

### `Optional` constraint

• **constraint**? : *undefined | string*

*Defined in [models/config/views.ts:129](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/views.ts#L129)*

Constraint for queries and filtering

___

###  created

• **created**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:171

Creation date

___

###  data_type

• **data_type**: *string*

*Defined in [models/config/views.ts:109](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/views.ts#L109)*

The associated data type

___

### `Optional` description

• **description**? : *undefined | string*

*Defined in [models/config/views.ts:104](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/views.ts#L104)*

Description of the view usage

___

### `Optional` excludes

• **excludes**? : *string[]*

*Defined in [models/config/views.ts:119](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/views.ts#L119)*

Fields to exclude

___

###  id

• **id**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:159

A unique ID for the record - nanoid 12 digit

___

### `Optional` includes

• **includes**? : *string[]*

*Defined in [models/config/views.ts:124](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/views.ts#L124)*

Fields to include

___

###  name

• **name**: *string*

*Defined in [models/config/views.ts:99](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/views.ts#L99)*

Name of the view

___

### `Optional` prevent_prefix_wildcard

• **prevent_prefix_wildcard**? : *undefined | false | true*

*Defined in [models/config/views.ts:136](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/views.ts#L136)*

Restrict prefix wildcards in search values

**`example`** `foo:*bar`

___

###  roles

• **roles**: *string[]*

*Defined in [models/config/views.ts:114](https://github.com/terascope/teraslice/blob/d2d877b60/packages/data-access/src/models/config/views.ts#L114)*

A list of roles this view applys to

___

###  updated

• **updated**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:167

Updated date
