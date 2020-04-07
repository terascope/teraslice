---
title: xLucene Parser: `Wildcard`
sidebar_label: Wildcard
---

# Interface: Wildcard

## Hierarchy

* [StringDataType](stringdatatype.md)

* [TermLikeAST](termlikeast.md)

  ↳ **Wildcard**

## Index

### Properties

* [analyzed](wildcard.md#optional-analyzed)
* [field](wildcard.md#field)
* [field_type](wildcard.md#field_type)
* [quoted](wildcard.md#quoted)
* [restricted](wildcard.md#optional-restricted)
* [type](wildcard.md#type)
* [value](wildcard.md#value)

## Properties

### `Optional` analyzed

• **analyzed**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[analyzed](termlikeast.md#optional-analyzed)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L41)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:40](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L40)*

___

###  field_type

• **field_type**: *String*

*Inherited from [StringDataType](stringdatatype.md).[field_type](stringdatatype.md#field_type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:81](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L81)*

___

###  quoted

• **quoted**: *boolean*

*Inherited from [StringDataType](stringdatatype.md).[quoted](stringdatatype.md#quoted)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:83](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L83)*

___

### `Optional` restricted

• **restricted**? : *undefined | false | true*

*Inherited from [StringDataType](stringdatatype.md).[restricted](stringdatatype.md#optional-restricted)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:84](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L84)*

___

###  type

• **type**: *[Wildcard](../enums/asttype.md#wildcard)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:154](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L154)*

___

###  value

• **value**: *string*

*Inherited from [StringDataType](stringdatatype.md).[value](stringdatatype.md#value)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:82](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L82)*
