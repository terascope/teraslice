---
title: xLucene Evaluator: `GeoBoundingBox`
sidebar_label: GeoBoundingBox
---

# Interface: GeoBoundingBox

## Hierarchy

* [TermLikeAST](termlikeast.md)

  ↳ **GeoBoundingBox**

## Index

### Properties

* [bottom_right](geoboundingbox.md#bottom_right)
* [field](geoboundingbox.md#field)
* [field_type](geoboundingbox.md#field_type)
* [tokenizer](geoboundingbox.md#optional-tokenizer)
* [top_left](geoboundingbox.md#top_left)
* [type](geoboundingbox.md#type)

## Properties

###  bottom_right

• **bottom_right**: *[GeoPoint](geopoint.md)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:146](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L146)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:47](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L47)*

___

###  field_type

• **field_type**: *[Geo](../enums/fieldtype.md#geo)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:144](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L144)*

___

### `Optional` tokenizer

• **tokenizer**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[tokenizer](termlikeast.md#optional-tokenizer)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:48](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L48)*

___

###  top_left

• **top_left**: *[GeoPoint](geopoint.md)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:145](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L145)*

___

###  type

• **type**: *[GeoBoundingBox](../enums/asttype.md#geoboundingbox)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:143](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L143)*
