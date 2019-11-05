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
* [type](geodistance.md#type)
* [unit](geodistance.md#unit)

## Properties

###  distance

• **distance**: *number*

*Defined in [parser/interfaces.ts:136](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L136)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [parser/interfaces.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L46)*

___

###  field_type

• **field_type**: *[Geo](../enums/fieldtype.md#geo)*

*Defined in [parser/interfaces.ts:135](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L135)*

___

###  lat

• **lat**: *number*

*Inherited from [GeoPoint](geopoint.md).[lat](geopoint.md#lat)*

*Defined in [interfaces.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/interfaces.ts#L20)*

___

###  lon

• **lon**: *number*

*Inherited from [GeoPoint](geopoint.md).[lon](geopoint.md#lon)*

*Defined in [interfaces.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/interfaces.ts#L21)*

___

###  type

• **type**: *[GeoDistance](../enums/asttype.md#geodistance)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [parser/interfaces.ts:134](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L134)*

___

###  unit

• **unit**: *[GeoDistanceUnit](../overview.md#geodistanceunit)*

*Defined in [parser/interfaces.ts:137](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L137)*
