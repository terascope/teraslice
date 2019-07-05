---
title: Data Types: `DataTypeManager`
sidebar_label: DataTypeManager
---

# Interface: DataTypeManager

## Hierarchy

* **DataTypeManager**

## Implemented by

* [DataType](../classes/datatype.md)

### Index

#### Methods

* [toESMapping](datatypemanager.md#toesmapping)
* [toGraphQL](datatypemanager.md#tographql)
* [toGraphQLTypes](datatypemanager.md#tographqltypes)
* [toXlucene](datatypemanager.md#toxlucene)

## Methods

###  toESMapping

▸ **toESMapping**(`args`: *[MappingConfiguration](mappingconfiguration.md)*): *any*

*Defined in [interfaces.ts:26](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`args` | [MappingConfiguration](mappingconfiguration.md) |

**Returns:** *any*

___

###  toGraphQL

▸ **toGraphQL**(`args?`: *[GraphQLArgs](graphqlargs.md)*): *string*

*Defined in [interfaces.ts:27](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`args?` | [GraphQLArgs](graphqlargs.md) |

**Returns:** *string*

___

###  toGraphQLTypes

▸ **toGraphQLTypes**(`args?`: *[GraphQLArgs](graphqlargs.md)*): *[GraphQlResults](graphqlresults.md)*

*Defined in [interfaces.ts:28](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`args?` | [GraphQLArgs](graphqlargs.md) |

**Returns:** *[GraphQlResults](graphqlresults.md)*

___

###  toXlucene

▸ **toXlucene**(): *`TypeConfig`*

*Defined in [interfaces.ts:29](https://github.com/terascope/teraslice/blob/d3a803c3/packages/data-types/src/interfaces.ts#L29)*

**Returns:** *`TypeConfig`*

