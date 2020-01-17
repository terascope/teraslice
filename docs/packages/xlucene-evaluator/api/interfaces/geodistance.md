---
title: xLucene Evaluator: `GeoDistance`
sidebar_label: GeoDistance
---

# Interface: GeoDistance

## Hierarchy

* [GeoPoint](geopoint.md)

* [TermLikeAST](termlikeast.md)

  ↳ **GeoDistance**

## Index

### Properties

* [distance](geodistance.md#distance)
* [field](geodistance.md#field)
* [field_type](geodistance.md#field_type)
* [lat](geodistance.md#lat)
* [lon](geodistance.md#lon)
* [tokenizer](geodistance.md#optional-tokenizer)
* [type](geodistance.md#type)
* [unit](geodistance.md#unit)

## Properties

###  distance

• **distance**: *number*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:138](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L138)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:47](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L47)*

___

###  field_type

• **field_type**: *[Geo](../enums/fieldtype.md#geo)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:137](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L137)*

___

###  lat

• **lat**: *number*

*Inherited from [GeoPoint](geopoint.md).[lat](geopoint.md#lat)*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:21](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L21)*

___

###  lon

• **lon**: *number*

*Inherited from [GeoPoint](geopoint.md).[lon](geopoint.md#lon)*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L22)*

___

### `Optional` tokenizer

• **tokenizer**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[tokenizer](termlikeast.md#optional-tokenizer)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:48](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L48)*

___

###  type

• **type**: *[GeoDistance](../enums/asttype.md#geodistance)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:136](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L136)*

___

###  unit

• **unit**: *[GeoDistanceUnit](../overview.md#geodistanceunit)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:139](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L139)*
