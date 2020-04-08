---
title: xLucene Parser: `GeoDistance`
sidebar_label: GeoDistance
---

# Interface: GeoDistance

## Hierarchy

* GeoPoint

* [TermLikeAST](termlikeast.md)

  ↳ **GeoDistance**

## Index

### Properties

* [analyzed](geodistance.md#optional-analyzed)
* [distance](geodistance.md#distance)
* [field](geodistance.md#field)
* [field_type](geodistance.md#field_type)
* [lat](geodistance.md#lat)
* [lon](geodistance.md#lon)
* [type](geodistance.md#type)
* [unit](geodistance.md#unit)

## Properties

### `Optional` analyzed

• **analyzed**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[analyzed](termlikeast.md#optional-analyzed)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L41)*

___

###  distance

• **distance**: *number*

*Defined in [packages/xlucene-parser/src/interfaces.ts:131](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L131)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:40](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L40)*

___

###  field_type

• **field_type**: *Geo*

*Defined in [packages/xlucene-parser/src/interfaces.ts:130](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L130)*

___

###  lat

• **lat**: *number*

*Inherited from void*

Defined in packages/types/dist/src/geo-interfaces.d.ts:51

___

###  lon

• **lon**: *number*

*Inherited from void*

Defined in packages/types/dist/src/geo-interfaces.d.ts:52

___

###  type

• **type**: *[GeoDistance](../enums/asttype.md#geodistance)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:129](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L129)*

___

###  unit

• **unit**: *t.GeoDistanceUnit*

*Defined in [packages/xlucene-parser/src/interfaces.ts:132](https://github.com/terascope/teraslice/blob/b843209f9/packages/xlucene-parser/src/interfaces.ts#L132)*
