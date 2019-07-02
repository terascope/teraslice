---
title: Data Types :: DataType
sidebar_label: DataType
---

# Class: DataType

## Hierarchy

* **DataType**

## Implements

* [DataTypeManager](../interfaces/datatypemanager.md)

### Index

#### Constructors

* [constructor](datatype.md#constructor)

#### Methods

* [toESMapping](datatype.md#toesmapping)
* [toGraphQL](datatype.md#tographql)
* [toGraphQLTypes](datatype.md#tographqltypes)
* [toXlucene](datatype.md#toxlucene)
* [mergeGraphQLDataTypes](datatype.md#static-mergegraphqldatatypes)

## Constructors

###  constructor

\+ **new DataType**(`__namedParameters`: *object*, `typeName?`: *undefined | string*): *[DataType](datatype.md)*

*Defined in [datatype.ts:28](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/datatype.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`__namedParameters` | object |
`typeName?` | undefined \| string |

**Returns:** *[DataType](datatype.md)*

## Methods

###  toESMapping

▸ **toESMapping**(`__namedParameters`: *object*): *object*

*Defined in [datatype.ts:44](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/datatype.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`__namedParameters` | object |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(`args?`: *[GraphQLArgs](../interfaces/graphqlargs.md)*): *string*

*Implementation of [DataTypeManager](../interfaces/datatypemanager.md)*

*Defined in [datatype.ts:103](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/datatype.ts#L103)*

**Parameters:**

Name | Type |
------ | ------ |
`args?` | [GraphQLArgs](../interfaces/graphqlargs.md) |

**Returns:** *string*

___

###  toGraphQLTypes

▸ **toGraphQLTypes**(`args`: *[GraphQLArgs](../interfaces/graphqlargs.md)*): *object*

*Defined in [datatype.ts:112](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/datatype.ts#L112)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`args` | [GraphQLArgs](../interfaces/graphqlargs.md) |  {} as GraphQLArgs |

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Implementation of [DataTypeManager](../interfaces/datatypemanager.md)*

*Defined in [datatype.ts:144](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/datatype.ts#L144)*

**Returns:** *object*

___

### `Static` mergeGraphQLDataTypes

▸ **mergeGraphQLDataTypes**(`types`: *[DataType](datatype.md)[]*, `typeInjection?`: *undefined | string*): *string*

*Defined in [datatype.ts:12](https://github.com/terascope/teraslice/blob/6e018493/packages/data-types/src/datatype.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`types` | [DataType](datatype.md)[] |
`typeInjection?` | undefined \| string |

**Returns:** *string*
