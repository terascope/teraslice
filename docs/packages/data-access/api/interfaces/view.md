---
title: Data Access: `View`
sidebar_label: View
---

# Interface: View

The definition of a View model

## Hierarchy

* `IndexModelRecord`

  * **View**

### Index

#### Properties

* [client_id](view.md#optional-client_id)
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

### `Optional` client_id

• **client_id**? : *undefined | number*

*Defined in [models/config/views.ts:107](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/views.ts#L107)*

The mutli-tenant ID representing the client

___

### `Optional` constraint

• **constraint**? : *undefined | string*

*Defined in [models/config/views.ts:142](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/views.ts#L142)*

Constraint for queries and filtering

___

###  created

• **created**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:163

Creation date

___

###  data_type

• **data_type**: *string*

*Defined in [models/config/views.ts:122](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/views.ts#L122)*

The associated data type

___

### `Optional` description

• **description**? : *undefined | string*

*Defined in [models/config/views.ts:117](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/views.ts#L117)*

Description of the view usage

___

### `Optional` excludes

• **excludes**? : *string[]*

*Defined in [models/config/views.ts:132](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/views.ts#L132)*

Fields to exclude

___

###  id

• **id**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:159

ID of the view - nanoid 12 digit

___

### `Optional` includes

• **includes**? : *string[]*

*Defined in [models/config/views.ts:137](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/views.ts#L137)*

Fields to include

___

###  name

• **name**: *string*

*Defined in [models/config/views.ts:112](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/views.ts#L112)*

Name of the view

___

### `Optional` prevent_prefix_wildcard

• **prevent_prefix_wildcard**? : *undefined | false | true*

*Defined in [models/config/views.ts:149](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/views.ts#L149)*

Restrict prefix wildcards in search values

**`example`** `foo:*bar`

___

###  roles

• **roles**: *string[]*

*Defined in [models/config/views.ts:127](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/data-access/src/models/config/views.ts#L127)*

A list of roles this view applys to

___

###  updated

• **updated**: *string*

*Inherited from void*

Defined in /Users/peter/Projects/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:161

Updated date
