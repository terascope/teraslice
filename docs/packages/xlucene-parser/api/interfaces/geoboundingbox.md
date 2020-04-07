---
title: xLucene Parser: `GeoBoundingBox`
sidebar_label: GeoBoundingBox
---

# Interface: GeoBoundingBox

## Hierarchy

* [TermLikeAST](termlikeast.md)

  ↳ **GeoBoundingBox**

## Index

### Properties

* [analyzed](geoboundingbox.md#optional-analyzed)
* [bottom_right](geoboundingbox.md#bottom_right)
* [field](geoboundingbox.md#field)
* [field_type](geoboundingbox.md#field_type)
* [top_left](geoboundingbox.md#top_left)
* [type](geoboundingbox.md#type)

## Properties

### `Optional` analyzed

• **analyzed**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[analyzed](termlikeast.md#optional-analyzed)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L41)*

___

###  bottom_right

• **bottom_right**: *GeoPoint*

*Defined in [packages/xlucene-parser/src/interfaces.ts:139](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L139)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:40](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L40)*

___

###  field_type

• **field_type**: *Geo*

*Defined in [packages/xlucene-parser/src/interfaces.ts:137](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L137)*

___

###  top_left

• **top_left**: *GeoPoint*

*Defined in [packages/xlucene-parser/src/interfaces.ts:138](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L138)*

___

###  type

• **type**: *[GeoBoundingBox](../enums/asttype.md#geoboundingbox)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:136](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L136)*
