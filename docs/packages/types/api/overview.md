---
title: Types API Overview
sidebar_label: API
---

## Index

### Enumerations

* [ESGeoShapeType](enums/esgeoshapetype.md)
* [GeoShapeRelation](enums/geoshaperelation.md)
* [GeoShapeType](enums/geoshapetype.md)
* [xLuceneFieldType](enums/xlucenefieldtype.md)

### Interfaces

* [ESIndexSettings](interfaces/esindexsettings.md)
* [ESMapping](interfaces/esmapping.md)
* [ESTypeMappings](interfaces/estypemappings.md)
* [ExistsQuery](interfaces/existsquery.md)
* [GeoDistanceObj](interfaces/geodistanceobj.md)
* [GeoPoint](interfaces/geopoint.md)
* [GeoQuery](interfaces/geoquery.md)
* [MACAddress](interfaces/macaddress.md)
* [MatchPhraseQuery](interfaces/matchphrasequery.md)
* [MatchQuery](interfaces/matchquery.md)
* [MultiMatchQuery](interfaces/multimatchquery.md)
* [QueryStringQuery](interfaces/querystringquery.md)
* [RangeExpression](interfaces/rangeexpression.md)
* [RangeQuery](interfaces/rangequery.md)
* [RegExprQuery](interfaces/regexprquery.md)
* [TermQuery](interfaces/termquery.md)
* [WildcardQuery](interfaces/wildcardquery.md)
* [xLuceneTypeConfig](interfaces/xlucenetypeconfig.md)
* [xLuceneVariables](interfaces/xlucenevariables.md)

### Type aliases

* [AnyQuery](overview.md#anyquery)
* [AnyQuerySort](overview.md#anyquerysort)
* [BoolQuery](overview.md#boolquery)
* [BoolQueryTypes](overview.md#boolquerytypes)
* [ConstantScoreQuery](overview.md#constantscorequery)
* [CoordinateTuple](overview.md#coordinatetuple)
* [ESFieldType](overview.md#esfieldtype)
* [ESGeoShape](overview.md#esgeoshape)
* [ESGeoShapeMultiPolygon](overview.md#esgeoshapemultipolygon)
* [ESGeoShapePoint](overview.md#esgeoshapepoint)
* [ESGeoShapePolygon](overview.md#esgeoshapepolygon)
* [ESTypeMapping](overview.md#estypemapping)
* [ElasticsearchDSLOptions](overview.md#elasticsearchdsloptions)
* [ElasticsearchDSLResult](overview.md#elasticsearchdslresult)
* [GeoDistanceSort](overview.md#geodistancesort)
* [GeoDistanceUnit](overview.md#geodistanceunit)
* [GeoPointInput](overview.md#geopointinput)
* [GeoShape](overview.md#geoshape)
* [GeoShapeMultiPolygon](overview.md#geoshapemultipolygon)
* [GeoShapePoint](overview.md#geoshapepoint)
* [GeoShapePolygon](overview.md#geoshapepolygon)
* [GeoSortQuery](overview.md#geosortquery)
* [JoinGeoShape](overview.md#joingeoshape)
* [MACDelimiter](overview.md#macdelimiter)
* [MatchAllQuery](overview.md#matchallquery)
* [PropertyESTypeMapping](overview.md#propertyestypemapping)
* [PropertyESTypes](overview.md#propertyestypes)
* [SortOrder](overview.md#sortorder)

### Object literals

* [GEO_DISTANCE_UNITS](overview.md#const-geo_distance_units)

## Type aliases

###  AnyQuery

Ƭ **AnyQuery**: *[BoolQuery](overview.md#boolquery) | [GeoQuery](interfaces/geoquery.md) | [TermQuery](interfaces/termquery.md) | [MatchQuery](interfaces/matchquery.md) | [MatchPhraseQuery](interfaces/matchphrasequery.md) | [WildcardQuery](interfaces/wildcardquery.md) | [ExistsQuery](interfaces/existsquery.md) | [RegExprQuery](interfaces/regexprquery.md) | [QueryStringQuery](interfaces/querystringquery.md) | [RangeQuery](interfaces/rangequery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

*Defined in [elasticsearch-interfaces.ts:24](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L24)*

___

###  AnyQuerySort

Ƭ **AnyQuerySort**: *[GeoSortQuery](overview.md#geosortquery)*

*Defined in [elasticsearch-interfaces.ts:154](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L154)*

___

###  BoolQuery

Ƭ **BoolQuery**: *object*

*Defined in [elasticsearch-interfaces.ts:14](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L14)*

#### Type declaration:

___

###  BoolQueryTypes

Ƭ **BoolQueryTypes**: *"filter" | "should" | "must_not"*

*Defined in [elasticsearch-interfaces.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L22)*

___

###  ConstantScoreQuery

Ƭ **ConstantScoreQuery**: *object*

*Defined in [elasticsearch-interfaces.ts:133](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L133)*

#### Type declaration:

___

###  CoordinateTuple

Ƭ **CoordinateTuple**: *[number, number]*

*Defined in [geo-interfaces.ts:49](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L49)*

___

###  ESFieldType

Ƭ **ESFieldType**: *"long" | "integer" | "short" | "byte" | "double" | "float" | "keyword" | "text" | "boolean" | "ip" | "ip_range" | "date" | "geo_point" | "geo_shape" | "object" | "nested"*

*Defined in [elasticsearch-interfaces.ts:161](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L161)*

___

###  ESGeoShape

Ƭ **ESGeoShape**: *[ESGeoShapePoint](overview.md#esgeoshapepoint) | [ESGeoShapePolygon](overview.md#esgeoshapepolygon) | [ESGeoShapeMultiPolygon](overview.md#esgeoshapemultipolygon)*

*Defined in [geo-interfaces.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L22)*

___

###  ESGeoShapeMultiPolygon

Ƭ **ESGeoShapeMultiPolygon**: *object*

*Defined in [geo-interfaces.ts:17](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L17)*

#### Type declaration:

___

###  ESGeoShapePoint

Ƭ **ESGeoShapePoint**: *object*

*Defined in [geo-interfaces.ts:7](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L7)*

#### Type declaration:

___

###  ESGeoShapePolygon

Ƭ **ESGeoShapePolygon**: *object*

*Defined in [geo-interfaces.ts:12](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L12)*

#### Type declaration:

___

###  ESTypeMapping

Ƭ **ESTypeMapping**: *[PropertyESTypeMapping](overview.md#propertyestypemapping) | FieldsESTypeMapping | BasicESTypeMapping | IgnoredESTypeMapping*

*Defined in [elasticsearch-interfaces.ts:179](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L179)*

___

###  ElasticsearchDSLOptions

Ƭ **ElasticsearchDSLOptions**: *object*

*Defined in [elasticsearch-interfaces.ts:5](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L5)*

#### Type declaration:

___

###  ElasticsearchDSLResult

Ƭ **ElasticsearchDSLResult**: *object*

*Defined in [elasticsearch-interfaces.ts:156](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L156)*

#### Type declaration:

___

###  GeoDistanceSort

Ƭ **GeoDistanceSort**: *object*

*Defined in [elasticsearch-interfaces.ts:143](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L143)*

#### Type declaration:

* \[ **field**: *string*\]: [SortOrder](overview.md#sortorder) | geo.GeoDistanceUnit | object

___

###  GeoDistanceUnit

Ƭ **GeoDistanceUnit**: *"miles" | "yards" | "feet" | "inch" | "kilometers" | "meters" | "centimeters" | "millimeters" | "nauticalmiles"*

*Defined in [geo-interfaces.ts:75](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L75)*

___

###  GeoPointInput

Ƭ **GeoPointInput**: *GeoPointArr | GeoPointStr | GeoObjShort | GeoObjLong | [GeoShapePoint](overview.md#geoshapepoint)*

*Defined in [geo-interfaces.ts:56](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L56)*

___

###  GeoShape

Ƭ **GeoShape**: *[GeoShapePoint](overview.md#geoshapepoint) | [GeoShapePolygon](overview.md#geoshapepolygon) | [GeoShapeMultiPolygon](overview.md#geoshapemultipolygon)*

*Defined in [geo-interfaces.ts:45](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L45)*

___

###  GeoShapeMultiPolygon

Ƭ **GeoShapeMultiPolygon**: *object*

*Defined in [geo-interfaces.ts:40](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L40)*

#### Type declaration:

___

###  GeoShapePoint

Ƭ **GeoShapePoint**: *object*

*Defined in [geo-interfaces.ts:30](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L30)*

#### Type declaration:

___

###  GeoShapePolygon

Ƭ **GeoShapePolygon**: *object*

*Defined in [geo-interfaces.ts:35](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L35)*

#### Type declaration:

___

###  GeoSortQuery

Ƭ **GeoSortQuery**: *object*

*Defined in [elasticsearch-interfaces.ts:150](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L150)*

#### Type declaration:

___

###  JoinGeoShape

Ƭ **JoinGeoShape**: *[GeoShape](overview.md#geoshape) | [ESGeoShape](overview.md#esgeoshape)*

*Defined in [geo-interfaces.ts:47](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L47)*

___

###  MACDelimiter

Ƭ **MACDelimiter**: *"space" | "colon" | "dash" | "dot" | "none" | "any"*

*Defined in [misc.ts:1](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/misc.ts#L1)*

___

###  MatchAllQuery

Ƭ **MatchAllQuery**: *object*

*Defined in [elasticsearch-interfaces.ts:139](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L139)*

#### Type declaration:

___

###  PropertyESTypeMapping

Ƭ **PropertyESTypeMapping**: *object*

*Defined in [elasticsearch-interfaces.ts:206](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L206)*

#### Type declaration:

___

###  PropertyESTypes

Ƭ **PropertyESTypes**: *FieldsESTypeMapping | BasicESTypeMapping*

*Defined in [elasticsearch-interfaces.ts:205](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L205)*

___

###  SortOrder

Ƭ **SortOrder**: *"asc" | "desc"*

*Defined in [elasticsearch-interfaces.ts:3](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/elasticsearch-interfaces.ts#L3)*

## Object literals

### `Const` GEO_DISTANCE_UNITS

### ▪ **GEO_DISTANCE_UNITS**: *object*

*Defined in [geo-interfaces.ts:77](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L77)*

###  NM

• **NM**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [geo-interfaces.ts:81](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L81)*

###  centimeter

• **centimeter**: *"centimeters"* = "centimeters"

*Defined in [geo-interfaces.ts:101](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L101)*

###  centimeters

• **centimeters**: *"centimeters"* = "centimeters"

*Defined in [geo-interfaces.ts:102](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L102)*

###  cm

• **cm**: *"centimeters"* = "centimeters"

*Defined in [geo-interfaces.ts:100](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L100)*

###  feet

• **feet**: *"feet"* = "feet"

*Defined in [geo-interfaces.ts:104](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L104)*

###  ft

• **ft**: *"feet"* = "feet"

*Defined in [geo-interfaces.ts:103](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L103)*

###  in

• **in**: *"inch"* = "inch"

*Defined in [geo-interfaces.ts:85](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L85)*

###  inch

• **inch**: *"inch"* = "inch"

*Defined in [geo-interfaces.ts:86](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L86)*

###  inches

• **inches**: *"inch"* = "inch"

*Defined in [geo-interfaces.ts:87](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L87)*

###  kilometer

• **kilometer**: *"kilometers"* = "kilometers"

*Defined in [geo-interfaces.ts:95](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L95)*

###  kilometers

• **kilometers**: *"kilometers"* = "kilometers"

*Defined in [geo-interfaces.ts:96](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L96)*

###  km

• **km**: *"kilometers"* = "kilometers"

*Defined in [geo-interfaces.ts:94](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L94)*

###  m

• **m**: *"meters"* = "meters"

*Defined in [geo-interfaces.ts:91](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L91)*

###  meter

• **meter**: *"meters"* = "meters"

*Defined in [geo-interfaces.ts:92](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L92)*

###  meters

• **meters**: *"meters"* = "meters"

*Defined in [geo-interfaces.ts:93](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L93)*

###  mi

• **mi**: *"miles"* = "miles"

*Defined in [geo-interfaces.ts:78](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L78)*

###  mile

• **mile**: *"miles"* = "miles"

*Defined in [geo-interfaces.ts:80](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L80)*

###  miles

• **miles**: *"miles"* = "miles"

*Defined in [geo-interfaces.ts:79](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L79)*

###  millimeter

• **millimeter**: *"millimeters"* = "millimeters"

*Defined in [geo-interfaces.ts:98](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L98)*

###  millimeters

• **millimeters**: *"millimeters"* = "millimeters"

*Defined in [geo-interfaces.ts:99](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L99)*

###  mm

• **mm**: *"millimeters"* = "millimeters"

*Defined in [geo-interfaces.ts:97](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L97)*

###  nauticalmile

• **nauticalmile**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [geo-interfaces.ts:83](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L83)*

###  nauticalmiles

• **nauticalmiles**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [geo-interfaces.ts:84](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L84)*

###  nmi

• **nmi**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [geo-interfaces.ts:82](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L82)*

###  yard

• **yard**: *"yards"* = "yards"

*Defined in [geo-interfaces.ts:89](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L89)*

###  yards

• **yards**: *"yards"* = "yards"

*Defined in [geo-interfaces.ts:90](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L90)*

###  yd

• **yd**: *"yards"* = "yards"

*Defined in [geo-interfaces.ts:88](https://github.com/terascope/teraslice/blob/b843209f9/packages/types/src/geo-interfaces.ts#L88)*
