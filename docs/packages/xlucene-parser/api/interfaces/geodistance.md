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

*Defined in [packages/xlucene-parser/src/interfaces.ts:131](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L131)*

___

###  field

• **field**: *[Field](../overview.md#field)*

*Inherited from [TermLikeAST](termlikeast.md).[field](termlikeast.md#field)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:40](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L40)*

___

###  field_type

• **field_type**: *Geo*

*Defined in [packages/xlucene-parser/src/interfaces.ts:130](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L130)*

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

### `Optional` tokenizer

• **tokenizer**? : *undefined | false | true*

*Inherited from [TermLikeAST](termlikeast.md).[tokenizer](termlikeast.md#optional-tokenizer)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L41)*

___

###  type

• **type**: *[GeoDistance](../enums/asttype.md#geodistance)*

*Overrides [TermLikeAST](termlikeast.md).[type](termlikeast.md#type)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:129](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L129)*

___

###  unit

• **unit**: *t.GeoDistanceUnit*

*Defined in [packages/xlucene-parser/src/interfaces.ts:132](https://github.com/terascope/teraslice/blob/653cf7530/packages/xlucene-parser/src/interfaces.ts#L132)*
