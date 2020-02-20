---
title: Data Types: `DataType`
sidebar_label: DataType
---

# Class: DataType

A DataType is used to define the structure of data with version support
and can be converted to the following formats:

- Elasticsearch Mappings
- GraphQL Schemas
- xLucene

## Hierarchy

* **DataType**

## Index

### Constructors

* [constructor](datatype.md#constructor)

### Properties

* [description](datatype.md#optional-description)
* [fields](datatype.md#fields)
* [groupedFields](datatype.md#groupedfields)
* [name](datatype.md#name)
* [version](datatype.md#version)

### Methods

* [toESMapping](datatype.md#toesmapping)
* [toGraphQL](datatype.md#tographql)
* [toGraphQLTypes](datatype.md#tographqltypes)
* [toXlucene](datatype.md#toxlucene)
* [mergeGraphQLDataTypes](datatype.md#static-mergegraphqldatatypes)

## Constructors

###  constructor

\+ **new DataType**(`config`: Partial‹i.DataTypeConfig›, `typeName?`: undefined | string, `description?`: undefined | string): *[DataType](datatype.md)*

*Defined in [data-types/src/data-type.ts:83](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | Partial‹i.DataTypeConfig› |
`typeName?` | undefined &#124; string |
`description?` | undefined &#124; string |

**Returns:** *[DataType](datatype.md)*

## Properties

### `Optional` description

• **description**? : *undefined | string*

*Defined in [data-types/src/data-type.ts:19](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L19)*

___

###  fields

• **fields**: *i.TypeConfigFields*

*Defined in [data-types/src/data-type.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L20)*

___

###  groupedFields

• **groupedFields**: *i.GroupedFields*

*Defined in [data-types/src/data-type.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L23)*

An object of base fields with their child fields

___

###  name

• **name**: *string*

*Defined in [data-types/src/data-type.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L18)*

___

###  version

• **version**: *i.AvailableVersion*

*Defined in [data-types/src/data-type.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L21)*

## Methods

###  toESMapping

▸ **toESMapping**(`__namedParameters`: object): *[ESMapping](../interfaces/esmapping.md)*

*Defined in [data-types/src/data-type.ts:104](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L104)*

Convert the DataType to an elasticsearch mapping.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`__namedParameters` | object |  {} |

**Returns:** *[ESMapping](../interfaces/esmapping.md)*

___

###  toGraphQL

▸ **toGraphQL**(`args?`: i.GraphQLOptions, `removeScalars`: boolean): *string*

*Defined in [data-types/src/data-type.ts:148](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L148)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args?` | i.GraphQLOptions | - |
`removeScalars` | boolean | false |

**Returns:** *string*

___

###  toGraphQLTypes

▸ **toGraphQLTypes**(`args`: i.GraphQLOptions): *i.GraphQLTypesResult*

*Defined in [data-types/src/data-type.ts:156](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L156)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | i.GraphQLOptions |  {} |

**Returns:** *i.GraphQLTypesResult*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Defined in [data-types/src/data-type.ts:230](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L230)*

**Returns:** *object*

___

### `Static` mergeGraphQLDataTypes

▸ **mergeGraphQLDataTypes**(`types`: [DataType](datatype.md)[], `options`: i.MergeGraphQLOptions): *string*

*Defined in [data-types/src/data-type.ts:28](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-types/src/data-type.ts#L28)*

Merge multiple data types into one GraphQL schema, useful for removing duplicates

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`types` | [DataType](datatype.md)[] | - |
`options` | i.MergeGraphQLOptions |  {} |

**Returns:** *string*
