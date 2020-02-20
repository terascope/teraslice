---
title: xLucene Parser: `Range`
sidebar_label: Range
---

# Interface: Range

## Hierarchy

* [TermLikeAST](termlikeast.md)

  ↳ **Range**

## Index

### Properties

* [field](range.md#field)
* [field_type](range.md#field_type)
* [left](range.md#left)
* [right](range.md#optional-right)
* [tokenizer](range.md#optional-tokenizer)
* [type](range.md#type)

## Properties

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:40](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L40)*

___

###  field_type

• **field_type**: *XluceneFieldType*

*Defined in [packages/xlucene-parser/src/interfaces.ts:119](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L119)*

___

###  left

• **left**: *[RangeNode](rangenode.md)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:120](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L120)*

___

### `Optional` right

• **right**? : *[RangeNode](rangenode.md)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:121](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L121)*

___

### `Optional` tokenizer

• **tokenizer**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[tokenizer](termlikeast.md#optional-tokenizer)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L41)*

___

###  type

• **type**: *[Range](../enums/asttype.md#range)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:118](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L118)*
