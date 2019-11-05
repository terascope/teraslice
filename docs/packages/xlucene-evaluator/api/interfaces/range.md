---
title: xLucene Evaluator: `Range`
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
* [type](range.md#type)

## Properties

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [parser/interfaces.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L46)*

___

###  field_type

• **field_type**: *[FieldType](../enums/fieldtype.md)*

*Defined in [parser/interfaces.ts:124](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L124)*

___

###  left

• **left**: *[RangeNode](rangenode.md)*

*Defined in [parser/interfaces.ts:125](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L125)*

___

### `Optional` right

• **right**? : *[RangeNode](rangenode.md)*

*Defined in [parser/interfaces.ts:126](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L126)*

___

###  type

• **type**: *[Range](../enums/asttype.md#range)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [parser/interfaces.ts:123](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L123)*
