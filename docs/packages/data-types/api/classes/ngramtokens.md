---
title: Data Types: `NgramTokens`
sidebar_label: NgramTokens
---

# Class: NgramTokens

## Hierarchy

* [BaseType](basetype.md)

  * **NgramTokens**

## Index

### Constructors

* [constructor](ngramtokens.md#constructor)

### Properties

* [config](ngramtokens.md#protected-config)
* [field](ngramtokens.md#protected-field)

### Methods

* [_formatGql](ngramtokens.md#protected-_formatgql)
* [toESMapping](ngramtokens.md#toesmapping)
* [toGraphQL](ngramtokens.md#tographql)
* [toXlucene](ngramtokens.md#toxlucene)

## Constructors

###  constructor

\+ **new NgramTokens**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[NgramTokens](ngramtokens.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[NgramTokens](ngramtokens.md)*

## Properties

### `Protected` config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: undefined | string): *object*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:21](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/base-type.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | undefined \| string |

**Returns:** *object*

___

###  toESMapping

▸ **toESMapping**(`_version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/ngram-tokens.ts:6](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/ngram-tokens.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`_version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/ngram-tokens.ts:36](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/ngram-tokens.ts#L36)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/ngram-tokens.ts:40](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-types/src/types/versions/v1/ngram-tokens.ts#L40)*

**Returns:** *object*
