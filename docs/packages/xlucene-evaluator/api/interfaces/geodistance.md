---
title: Xlucene Evaluator: `GeoDistance`
sidebar_label: GeoDistance
---

# Interface: GeoDistance

## Hierarchy

* [GeoPoint](geopoint.md)

* [TermLikeAST](termlikeast.md)

  * **GeoDistance**

## Index

### Properties

* [distance](geodistance.md#distance)
* [field](geodistance.md#field)
* [field_type](geodistance.md#field_type)
* [lat](geodistance.md#lat)
* [lon](geodistance.md#lon)
* [type](geodistance.md#type)
* [unit](geodistance.md#unit)

## Properties

###  distance

• **distance**: *number*

*Defined in [parser/interfaces.ts:141](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L141)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [parser/interfaces.ts:54](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L54)*

___

###  field_type

• **field_type**: *[Geo](../enums/fieldtype.md#geo)*

*Defined in [parser/interfaces.ts:140](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L140)*

___

###  lat

• **lat**: *number*

*Inherited from [GeoPoint](geopoint.md).[lat](geopoint.md#lat)*

*Defined in [parser/interfaces.ts:146](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L146)*

___

###  lon

• **lon**: *number*

*Inherited from [GeoPoint](geopoint.md).[lon](geopoint.md#lon)*

*Defined in [parser/interfaces.ts:147](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L147)*

___

###  type

• **type**: *[GeoDistance](../enums/asttype.md#geodistance)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [parser/interfaces.ts:139](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L139)*

___

###  unit

• **unit**: *[GeoDistanceUnit](../overview.md#geodistanceunit)*

*Defined in [parser/interfaces.ts:142](https://github.com/terascope/teraslice/blob/0ae31df4/packages/xlucene-evaluator/src/parser/interfaces.ts#L142)*
