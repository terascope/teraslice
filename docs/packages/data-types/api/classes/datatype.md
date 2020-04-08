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

*Defined in [data-type.ts:87](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L87)*

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

*Defined in [data-type.ts:23](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L23)*

___

###  fields

• **fields**: *i.TypeConfigFields*

*Defined in [data-type.ts:24](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L24)*

___

###  groupedFields

• **groupedFields**: *i.GroupedFields*

*Defined in [data-type.ts:27](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L27)*

An object of base fields with their child fields

___

###  name

• **name**: *string*

*Defined in [data-type.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L22)*

___

###  version

• **version**: *i.AvailableVersion*

*Defined in [data-type.ts:25](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L25)*

## Methods

###  toESMapping

▸ **toESMapping**(`__namedParameters`: object): *ESMapping*

*Defined in [data-type.ts:108](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L108)*

Convert the DataType to an elasticsearch mapping.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`__namedParameters` | object |  {} |

**Returns:** *ESMapping*

___

###  toGraphQL

▸ **toGraphQL**(`args?`: i.GraphQLOptions, `removeScalars`: boolean): *string*

*Defined in [data-type.ts:155](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L155)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args?` | i.GraphQLOptions | - |
`removeScalars` | boolean | false |

**Returns:** *string*

___

###  toGraphQLTypes

▸ **toGraphQLTypes**(`args`: i.GraphQLOptions): *i.GraphQLTypesResult*

*Defined in [data-type.ts:163](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L163)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | i.GraphQLOptions |  {} |

**Returns:** *i.GraphQLTypesResult*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Defined in [data-type.ts:237](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L237)*

**Returns:** *object*

___

### `Static` mergeGraphQLDataTypes

▸ **mergeGraphQLDataTypes**(`types`: [DataType](datatype.md)[], `options`: i.MergeGraphQLOptions): *string*

*Defined in [data-type.ts:32](https://github.com/terascope/teraslice/blob/b843209f9/packages/data-types/src/data-type.ts#L32)*

Merge multiple data types into one GraphQL schema, useful for removing duplicates

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`types` | [DataType](datatype.md)[] | - |
`options` | i.MergeGraphQLOptions |  {} |

**Returns:** *string*
