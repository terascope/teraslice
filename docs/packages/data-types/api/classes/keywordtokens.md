---
title: Data Types: `KeywordTokens`
sidebar_label: KeywordTokens
---

# Class: KeywordTokens

## Hierarchy

* [BaseType](basetype.md)

  * **KeywordTokens**

## Index

### Constructors

* [constructor](keywordtokens.md#constructor)

### Properties

* [config](keywordtokens.md#protected-config)
* [field](keywordtokens.md#protected-field)

### Methods

* [_formatGql](keywordtokens.md#protected-_formatgql)
* [toESMapping](keywordtokens.md#toesmapping)
* [toGraphQL](keywordtokens.md#tographql)
* [toXlucene](keywordtokens.md#toxlucene)

## Constructors

###  constructor

\+ **new KeywordTokens**(`field`: string, `config`: [FieldTypeConfig](../overview.md#fieldtypeconfig)): *[KeywordTokens](keywordtokens.md)*

*Inherited from [BaseType](basetype.md).[constructor](basetype.md#constructor)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`config` | [FieldTypeConfig](../overview.md#fieldtypeconfig) |

**Returns:** *[KeywordTokens](keywordtokens.md)*

## Properties

### `Protected` config

• **config**: *[FieldTypeConfig](../overview.md#fieldtypeconfig)*

*Inherited from [BaseType](basetype.md).[config](basetype.md#protected-config)*

*Defined in [types/versions/base-type.ts:7](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L7)*

___

### `Protected` field

• **field**: *string*

*Inherited from [BaseType](basetype.md).[field](basetype.md#protected-field)*

*Defined in [types/versions/base-type.ts:6](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L6)*

## Methods

### `Protected` _formatGql

▸ **_formatGql**(`type`: string, `customType?`: undefined | string): *object*

*Inherited from [BaseType](basetype.md).[_formatGql](basetype.md#protected-_formatgql)*

*Defined in [types/versions/base-type.ts:19](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/base-type.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |
`customType?` | undefined \| string |

**Returns:** *object*

___

###  toESMapping

▸ **toESMapping**(`version?`: undefined | number): *object*

*Overrides [BaseType](basetype.md).[toESMapping](basetype.md#abstract-toesmapping)*

*Defined in [types/versions/v1/keyword-tokens.ts:5](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/v1/keyword-tokens.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`version?` | undefined \| number |

**Returns:** *object*

___

###  toGraphQL

▸ **toGraphQL**(): *object*

*Overrides [BaseType](basetype.md).[toGraphQL](basetype.md#abstract-tographql)*

*Defined in [types/versions/v1/keyword-tokens.ts:22](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/v1/keyword-tokens.ts#L22)*

**Returns:** *object*

___

###  toXlucene

▸ **toXlucene**(): *object*

*Overrides [BaseType](basetype.md).[toXlucene](basetype.md#abstract-toxlucene)*

*Defined in [types/versions/v1/keyword-tokens.ts:26](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-types/src/types/versions/v1/keyword-tokens.ts#L26)*

**Returns:** *object*
