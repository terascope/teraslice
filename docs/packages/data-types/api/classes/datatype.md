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

* [name](datatype.md#name)

### Methods

* [toESMapping](datatype.md#toesmapping)
* [toGraphQL](datatype.md#tographql)
* [toGraphQLTypes](datatype.md#tographqltypes)
* [toXlucene](datatype.md#toxlucene)
* [mergeGraphQLDataTypes](datatype.md#static-mergegraphqldatatypes)

## Constructors

###  constructor

\+ **new DataType**(`config`: i.DataTypeConfig, `typeName?`: undefined | string): *[DataType](datatype.md)*

*Defined in [data-type.ts:45](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/data-type.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | i.DataTypeConfig |
`typeName?` | undefined &#124; string |

**Returns:** *[DataType](datatype.md)*

## Properties

###  name

• **name**: *string*

*Defined in [data-type.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/data-type.ts#L18)*

## Methods

###  toESMapping

▸ **toESMapping**(`__namedParameters`: object): *[ESMapping](../interfaces/esmapping.md)*

*Defined in [data-type.ts:58](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/data-type.ts#L58)*

Convert the DataType to an elasticsearch mapping.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`__namedParameters` | object |  {} |

**Returns:** *[ESMapping](../interfaces/esmapping.md)*

___

###  toGraphQL

▸ **toGraphQL**(`args?`: i.GraphQLOptions): *string*

*Defined in [data-type.ts:102](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/data-type.ts#L102)*

**Parameters:**

Name | Type |
------ | ------ |
`args?` | i.GraphQLOptions |

**Returns:** *string*

___

###  toGraphQLTypes

▸ **toGraphQLTypes**(`args`: i.GraphQLOptions): *i.GraphQLTypesResult*

*Defined in [data-type.ts:108](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/data-type.ts#L108)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | i.GraphQLOptions |  {} |

**Returns:** *i.GraphQLTypesResult*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Defined in [data-type.ts:150](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/data-type.ts#L150)*

**Returns:** *object*

___

### `Static` mergeGraphQLDataTypes

▸ **mergeGraphQLDataTypes**(`types`: [DataType](datatype.md)[], `typeReferences`: i.GraphQLTypeReferences): *string*

*Defined in [data-type.ts:22](https://github.com/terascope/teraslice/blob/d8feecc03/packages/data-types/src/data-type.ts#L22)*

Merge multiple data types into one GraphQL schema, useful for removing duplicates

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`types` | [DataType](datatype.md)[] | - |
`typeReferences` | i.GraphQLTypeReferences |  {} |

**Returns:** *string*
