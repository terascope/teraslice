---
title: Xlucene Evaluator API Overview
sidebar_label: API
---

#### Enumerations

* [ASTType](enums/asttype.md)

#### Classes

* [CachedParser](classes/cachedparser.md)
* [CachedQueryAccess](classes/cachedqueryaccess.md)
* [CachedTranslator](classes/cachedtranslator.md)
* [DocumentMatcher](classes/documentmatcher.md)
* [Parser](classes/parser.md)
* [QueryAccess](classes/queryaccess.md)
* [Translator](classes/translator.md)

#### Interfaces

* [AnyDataType](interfaces/anydatatype.md)
* [BooleanDataType](interfaces/booleandatatype.md)
* [Conjunction](interfaces/conjunction.md)
* [EmptyAST](interfaces/emptyast.md)
* [Exists](interfaces/exists.md)
* [ExistsQuery](interfaces/existsquery.md)
* [FieldGroup](interfaces/fieldgroup.md)
* [GeoBoundingBox](interfaces/geoboundingbox.md)
* [GeoDistance](interfaces/geodistance.md)
* [GeoDistanceObj](interfaces/geodistanceobj.md)
* [GeoPoint](interfaces/geopoint.md)
* [GeoQuery](interfaces/geoquery.md)
* [GroupLikeAST](interfaces/grouplikeast.md)
* [LogicalGroup](interfaces/logicalgroup.md)
* [MultiMatchQuery](interfaces/multimatchquery.md)
* [Negation](interfaces/negation.md)
* [NumberDataType](interfaces/numberdatatype.md)
* [ParsedRange](interfaces/parsedrange.md)
* [PegEngine](interfaces/pegengine.md)
* [PegEngineOptions](interfaces/pegengineoptions.md)
* [QueryAccessConfig](interfaces/queryaccessconfig.md)
* [Range](interfaces/range.md)
* [RangeExpression](interfaces/rangeexpression.md)
* [RangeNode](interfaces/rangenode.md)
* [RangeQuery](interfaces/rangequery.md)
* [RegExprQuery](interfaces/regexprquery.md)
* [Regexp](interfaces/regexp.md)
* [StringDataType](interfaces/stringdatatype.md)
* [Term](interfaces/term.md)
* [TermLikeAST](interfaces/termlikeast.md)
* [TermQuery](interfaces/termquery.md)
* [TypeConfig](interfaces/typeconfig.md)
* [Wildcard](interfaces/wildcard.md)
* [WildcardQuery](interfaces/wildcardquery.md)

#### Type aliases

* [AST](overview.md#ast)
* [AnyAST](overview.md#anyast)
* [AnyQuery](overview.md#anyquery)
* [BoolQuery](overview.md#boolquery)
* [BoolQueryTypes](overview.md#boolquerytypes)
* [BooleanCB](overview.md#booleancb)
* [ConstantScoreQuery](overview.md#constantscorequery)
* [DataType](overview.md#datatype)
* [DateInput](overview.md#dateinput)
* [ElasticsearchDSLResult](overview.md#elasticsearchdslresult)
* [Field](overview.md#field)
* [FieldType](overview.md#fieldtype)
* [GeoObjLong](overview.md#geoobjlong)
* [GeoObjShort](overview.md#geoobjshort)
* [GeoPointArr](overview.md#geopointarr)
* [GeoPointInput](overview.md#geopointinput)
* [GeoPointStr](overview.md#geopointstr)
* [GroupLike](overview.md#grouplike)
* [GroupLikeType](overview.md#groupliketype)
* [MatchAllQuery](overview.md#matchallquery)
* [RangeOperator](overview.md#rangeoperator)
* [TermLike](overview.md#termlike)
* [TermLikeType](overview.md#termliketype)

#### Variables

* [groupTypes](overview.md#const-grouptypes)
* [numberDataTypes](overview.md#const-numberdatatypes)
* [termTypes](overview.md#const-termtypes)

#### Functions

* [buildAnyQuery](overview.md#buildanyquery)
* [buildBoolQuery](overview.md#buildboolquery)
* [buildConjunctionQuery](overview.md#buildconjunctionquery)
* [buildExistsQuery](overview.md#buildexistsquery)
* [buildGeoBoundingBoxQuery](overview.md#buildgeoboundingboxquery)
* [buildGeoDistanceQuery](overview.md#buildgeodistancequery)
* [buildLogicFn](overview.md#buildlogicfn)
* [buildMultiMatchQuery](overview.md#buildmultimatchquery)
* [buildNegationQuery](overview.md#buildnegationquery)
* [buildRangeQuery](overview.md#buildrangequery)
* [buildRegExprQuery](overview.md#buildregexprquery)
* [buildTermLevelQuery](overview.md#buildtermlevelquery)
* [buildTermQuery](overview.md#buildtermquery)
* [buildWildcardQuery](overview.md#buildwildcardquery)
* [canFlattenBoolQuery](overview.md#canflattenboolquery)
* [compactFinalQuery](overview.md#compactfinalquery)
* [compareTermDates](overview.md#comparetermdates)
* [dateRange](overview.md#daterange)
* [findWildcardField](overview.md#findwildcardfield)
* [flattenQuery](overview.md#flattenquery)
* [geoBoundingBox](overview.md#geoboundingbox)
* [geoDistance](overview.md#geodistance)
* [getAnyValue](overview.md#getanyvalue)
* [getField](overview.md#getfield)
* [getLonAndLat](overview.md#getlonandlat)
* [getRangeValues](overview.md#getrangevalues)
* [getTermField](overview.md#gettermfield)
* [ipRange](overview.md#iprange)
* [ipTerm](overview.md#ipterm)
* [isBoolQuery](overview.md#isboolquery)
* [isBooleanDataType](overview.md#isbooleandatatype)
* [isConjunction](overview.md#isconjunction)
* [isEmptyAST](overview.md#isemptyast)
* [isExists](overview.md#isexists)
* [isFieldGroup](overview.md#isfieldgroup)
* [isGeoBoundingBox](overview.md#isgeoboundingbox)
* [isGeoDistance](overview.md#isgeodistance)
* [isGroupLike](overview.md#isgrouplike)
* [isInfiniteMax](overview.md#isinfinitemax)
* [isInfiniteMin](overview.md#isinfinitemin)
* [isInfiniteValue](overview.md#isinfinitevalue)
* [isLogicalGroup](overview.md#islogicalgroup)
* [isMultiMatch](overview.md#ismultimatch)
* [isNegation](overview.md#isnegation)
* [isNumberDataType](overview.md#isnumberdatatype)
* [isRange](overview.md#isrange)
* [isRegexp](overview.md#isregexp)
* [isStringDataType](overview.md#isstringdatatype)
* [isTerm](overview.md#isterm)
* [isTermType](overview.md#istermtype)
* [isWildCard](overview.md#iswildcard)
* [isWildcard](overview.md#iswildcard)
* [parseGeoDistance](overview.md#parsegeodistance)
* [parseGeoPoint](overview.md#parsegeopoint)
* [parseRange](overview.md#parserange)
* [regexp](overview.md#regexp)
* [wildcard](overview.md#wildcard)

#### Object literals

* [GEO_DISTANCE_UNITS](overview.md#const-geo_distance_units)

## Type aliases

###  AST

Ƭ **AST**: *[EmptyAST](interfaces/emptyast.md) & [LogicalGroup](interfaces/logicalgroup.md) & [Term](interfaces/term.md) & [Conjunction](interfaces/conjunction.md) & [Negation](interfaces/negation.md) & [FieldGroup](interfaces/fieldgroup.md) & [Exists](interfaces/exists.md) & [Range](interfaces/range.md) & [GeoDistance](interfaces/geodistance.md) & [GeoBoundingBox](interfaces/geoboundingbox.md) & [Regexp](interfaces/regexp.md) & [Wildcard](interfaces/wildcard.md)*

*Defined in [parser/interfaces.ts:3](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/interfaces.ts#L3)*

___

###  AnyAST

Ƭ **AnyAST**: *[EmptyAST](interfaces/emptyast.md) | [LogicalGroup](interfaces/logicalgroup.md) | [Term](interfaces/term.md) | [Conjunction](interfaces/conjunction.md) | [Negation](interfaces/negation.md) | [FieldGroup](interfaces/fieldgroup.md) | [Exists](interfaces/exists.md) | [Range](interfaces/range.md) | [GeoDistance](interfaces/geodistance.md) | [GeoBoundingBox](interfaces/geoboundingbox.md) | [Regexp](interfaces/regexp.md) | [Wildcard](interfaces/wildcard.md)*

*Defined in [parser/interfaces.ts:8](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/interfaces.ts#L8)*

___

###  AnyQuery

Ƭ **AnyQuery**: *[BoolQuery](overview.md#boolquery) | [GeoQuery](interfaces/geoquery.md) | [TermQuery](interfaces/termquery.md) | [WildcardQuery](interfaces/wildcardquery.md) | [ExistsQuery](interfaces/existsquery.md) | [RegExprQuery](interfaces/regexprquery.md) | [RangeQuery](interfaces/rangequery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

*Defined in [translator/interfaces.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/interfaces.ts#L13)*

___

###  BoolQuery

Ƭ **BoolQuery**: *object*

*Defined in [translator/interfaces.ts:3](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/interfaces.ts#L3)*

#### Type declaration:

___

###  BoolQueryTypes

Ƭ **BoolQueryTypes**: *"filter" | "should" | "must_not"*

*Defined in [translator/interfaces.ts:11](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/interfaces.ts#L11)*

___

###  BooleanCB

Ƭ **BooleanCB**: *function*

*Defined in [interfaces.ts:8](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/interfaces.ts#L8)*

#### Type declaration:

▸ (`data`: *any*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

___

###  ConstantScoreQuery

Ƭ **ConstantScoreQuery**: *object*

*Defined in [translator/interfaces.ts:72](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/interfaces.ts#L72)*

#### Type declaration:

___

###  DataType

Ƭ **DataType**: *"string" | "number" | "integer" | "float" | "boolean"*

*Defined in [parser/interfaces.ts:49](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/interfaces.ts#L49)*

___

###  DateInput

Ƭ **DateInput**: *string | number*

*Defined in [interfaces.ts:15](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/interfaces.ts#L15)*

___

###  ElasticsearchDSLResult

Ƭ **ElasticsearchDSLResult**: *object*

*Defined in [translator/interfaces.ts:82](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/interfaces.ts#L82)*

#### Type declaration:

___

###  Field

Ƭ **Field**: *string | null*

*Defined in [parser/interfaces.ts:47](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/interfaces.ts#L47)*

___

###  FieldType

Ƭ **FieldType**: *"geo" | "date" | "ip" | "string" | "number" | "float" | "boolean" | "object"*

*Defined in [interfaces.ts:3](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/interfaces.ts#L3)*

___

###  GeoObjLong

Ƭ **GeoObjLong**: *object*

*Defined in [interfaces.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/interfaces.ts#L13)*

#### Type declaration:

___

###  GeoObjShort

Ƭ **GeoObjShort**: *object*

*Defined in [interfaces.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/interfaces.ts#L12)*

#### Type declaration:

___

###  GeoPointArr

Ƭ **GeoPointArr**: *[number, number]*

*Defined in [interfaces.ts:10](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/interfaces.ts#L10)*

___

###  GeoPointInput

Ƭ **GeoPointInput**: *[GeoPointArr](overview.md#geopointarr) | [GeoPointStr](overview.md#geopointstr) | [GeoObjShort](overview.md#geoobjshort) | [GeoObjLong](overview.md#geoobjlong)*

*Defined in [interfaces.ts:14](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/interfaces.ts#L14)*

___

###  GeoPointStr

Ƭ **GeoPointStr**: *string*

*Defined in [interfaces.ts:11](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/interfaces.ts#L11)*

___

###  GroupLike

Ƭ **GroupLike**: *[FieldGroup](interfaces/fieldgroup.md) | [LogicalGroup](interfaces/logicalgroup.md)*

*Defined in [parser/interfaces.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/interfaces.ts#L13)*

___

###  GroupLikeType

Ƭ **GroupLikeType**: *[LogicalGroup](enums/asttype.md#logicalgroup) | [FieldGroup](enums/asttype.md#fieldgroup)*

*Defined in [parser/interfaces.ts:14](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/interfaces.ts#L14)*

___

###  MatchAllQuery

Ƭ **MatchAllQuery**: *object*

*Defined in [translator/interfaces.ts:78](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/interfaces.ts#L78)*

#### Type declaration:

___

###  RangeOperator

Ƭ **RangeOperator**: *"gte" | "gt" | "lt" | "lte"*

*Defined in [parser/interfaces.ts:94](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/interfaces.ts#L94)*

___

###  TermLike

Ƭ **TermLike**: *[Term](interfaces/term.md) | [Regexp](interfaces/regexp.md) | [Range](interfaces/range.md) | [Wildcard](interfaces/wildcard.md) | [GeoBoundingBox](interfaces/geoboundingbox.md) | [GeoDistance](interfaces/geodistance.md)*

*Defined in [parser/interfaces.ts:21](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/interfaces.ts#L21)*

___

###  TermLikeType

Ƭ **TermLikeType**: *[Term](enums/asttype.md#term) | [Regexp](enums/asttype.md#regexp) | [Range](enums/asttype.md#range) | [Wildcard](enums/asttype.md#wildcard) | [GeoBoundingBox](enums/asttype.md#geoboundingbox) | [GeoDistance](enums/asttype.md#geodistance)*

*Defined in [parser/interfaces.ts:22](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/interfaces.ts#L22)*

## Variables

### `Const` groupTypes

• **groupTypes**: *[ASTType](enums/asttype.md)[]* =  [i.ASTType.LogicalGroup, i.ASTType.FieldGroup]

*Defined in [parser/utils.ts:91](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L91)*

logical group or field group with flow

___

### `Const` numberDataTypes

• **numberDataTypes**: *`i.DataType`[]* =  ['number', 'integer', 'float']

*Defined in [parser/utils.ts:56](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L56)*

___

### `Const` termTypes

• **termTypes**: *[ASTType](enums/asttype.md)[]* =  [
    i.ASTType.Term,
    i.ASTType.Regexp,
    i.ASTType.Range,
    i.ASTType.Wildcard,
    i.ASTType.GeoBoundingBox,
    i.ASTType.GeoDistance,
]

*Defined in [parser/utils.ts:77](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L77)*

term level queries with field (string|null)

## Functions

###  buildAnyQuery

▸ **buildAnyQuery**(`node`: *`p.AST`*, `parser`: *[Parser](classes/parser.md)*): *`i.AnyQuery` | undefined*

*Defined in [translator/utils.ts:8](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | `p.AST` |
`parser` | [Parser](classes/parser.md) |

**Returns:** *`i.AnyQuery` | undefined*

___

###  buildBoolQuery

▸ **buildBoolQuery**(`node`: *[GroupLikeAST](interfaces/grouplikeast.md)*, `parser`: *[Parser](classes/parser.md)*): *`i.BoolQuery` | undefined*

*Defined in [translator/utils.ts:212](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L212)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [GroupLikeAST](interfaces/grouplikeast.md) |
`parser` | [Parser](classes/parser.md) |

**Returns:** *`i.BoolQuery` | undefined*

___

###  buildConjunctionQuery

▸ **buildConjunctionQuery**(`conj`: *[Conjunction](interfaces/conjunction.md)*, `parser`: *[Parser](classes/parser.md)*): *`i.BoolQuery`*

*Defined in [translator/utils.ts:231](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L231)*

**Parameters:**

Name | Type |
------ | ------ |
`conj` | [Conjunction](interfaces/conjunction.md) |
`parser` | [Parser](classes/parser.md) |

**Returns:** *`i.BoolQuery`*

___

###  buildExistsQuery

▸ **buildExistsQuery**(`node`: *[Exists](interfaces/exists.md)*): *[ExistsQuery](interfaces/existsquery.md)*

*Defined in [translator/utils.ts:201](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L201)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Exists](interfaces/exists.md) |

**Returns:** *[ExistsQuery](interfaces/existsquery.md)*

___

###  buildGeoBoundingBoxQuery

▸ **buildGeoBoundingBoxQuery**(`node`: *[GeoBoundingBox](interfaces/geoboundingbox.md)*): *[GeoQuery](interfaces/geoquery.md) | undefined*

*Defined in [translator/utils.ts:92](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [GeoBoundingBox](interfaces/geoboundingbox.md) |

**Returns:** *[GeoQuery](interfaces/geoquery.md) | undefined*

___

###  buildGeoDistanceQuery

▸ **buildGeoDistanceQuery**(`node`: *[GeoDistance](interfaces/geodistance.md)*): *[GeoQuery](interfaces/geoquery.md) | undefined*

*Defined in [translator/utils.ts:108](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [GeoDistance](interfaces/geodistance.md) |

**Returns:** *[GeoQuery](interfaces/geoquery.md) | undefined*

___

###  buildLogicFn

▸ **buildLogicFn**(`parser`: *[Parser](classes/parser.md)*, `typeConfig`: *[TypeConfig](interfaces/typeconfig.md)*): *function*

*Defined in [document-matcher/logic-builder/index.ts:11](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/index.ts#L11)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`parser` | [Parser](classes/parser.md) | - |
`typeConfig` | [TypeConfig](interfaces/typeconfig.md) |  {} |

**Returns:** *function*

▸ (`data`: *any*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

___

###  buildMultiMatchQuery

▸ **buildMultiMatchQuery**(`node`: *[TermLikeAST](interfaces/termlikeast.md)*, `query`: *string*): *[MultiMatchQuery](interfaces/multimatchquery.md)*

*Defined in [translator/utils.ts:77](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [TermLikeAST](interfaces/termlikeast.md) |
`query` | string |

**Returns:** *[MultiMatchQuery](interfaces/multimatchquery.md)*

___

###  buildNegationQuery

▸ **buildNegationQuery**(`node`: *[Negation](interfaces/negation.md)*, `parser`: *[Parser](classes/parser.md)*): *`i.BoolQuery` | undefined*

*Defined in [translator/utils.ts:260](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L260)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Negation](interfaces/negation.md) |
`parser` | [Parser](classes/parser.md) |

**Returns:** *`i.BoolQuery` | undefined*

___

###  buildRangeQuery

▸ **buildRangeQuery**(`node`: *[Range](interfaces/range.md)*): *[RangeQuery](interfaces/rangequery.md) | [MultiMatchQuery](interfaces/multimatchquery.md) | undefined*

*Defined in [translator/utils.ts:126](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L126)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *[RangeQuery](interfaces/rangequery.md) | [MultiMatchQuery](interfaces/multimatchquery.md) | undefined*

___

###  buildRegExprQuery

▸ **buildRegExprQuery**(`node`: *[Regexp](interfaces/regexp.md)*): *[RegExprQuery](interfaces/regexprquery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

*Defined in [translator/utils.ts:183](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L183)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Regexp](interfaces/regexp.md) |

**Returns:** *[RegExprQuery](interfaces/regexprquery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

___

###  buildTermLevelQuery

▸ **buildTermLevelQuery**(`node`: *[TermLikeAST](interfaces/termlikeast.md)*): *`i.AnyQuery` | undefined*

*Defined in [translator/utils.ts:45](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [TermLikeAST](interfaces/termlikeast.md) |

**Returns:** *`i.AnyQuery` | undefined*

___

###  buildTermQuery

▸ **buildTermQuery**(`node`: *[Term](interfaces/term.md)*): *[TermQuery](interfaces/termquery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

*Defined in [translator/utils.ts:147](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L147)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Term](interfaces/term.md) |

**Returns:** *[TermQuery](interfaces/termquery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

___

###  buildWildcardQuery

▸ **buildWildcardQuery**(`node`: *[Wildcard](interfaces/wildcard.md)*): *[WildcardQuery](interfaces/wildcardquery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

*Defined in [translator/utils.ts:165](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L165)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Wildcard](interfaces/wildcard.md) |

**Returns:** *[WildcardQuery](interfaces/wildcardquery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

___

###  canFlattenBoolQuery

▸ **canFlattenBoolQuery**(`query`: *`i.BoolQuery`*, `flattenTo`: *`i.BoolQueryTypes`*): *boolean*

*Defined in [translator/utils.ts:254](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L254)*

This prevents double nested queries that do the same thing

**Parameters:**

Name | Type |
------ | ------ |
`query` | `i.BoolQuery` |
`flattenTo` | `i.BoolQueryTypes` |

**Returns:** *boolean*

___

###  compactFinalQuery

▸ **compactFinalQuery**(`query?`: *`i.AnyQuery`*): *`i.AnyQuery` | `i.AnyQuery`[]*

*Defined in [translator/utils.ts:277](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L277)*

**Parameters:**

Name | Type |
------ | ------ |
`query?` | `i.AnyQuery` |

**Returns:** *`i.AnyQuery` | `i.AnyQuery`[]*

___

###  compareTermDates

▸ **compareTermDates**(`node`: *[Term](interfaces/term.md)*): *`dateTerm`*

*Defined in [document-matcher/logic-builder/dates.ts:10](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Term](interfaces/term.md) |

**Returns:** *`dateTerm`*

___

###  dateRange

▸ **dateRange**(`node`: *[Range](interfaces/range.md)*): *`dateRangeTerm`*

*Defined in [document-matcher/logic-builder/dates.ts:49](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *`dateRangeTerm`*

___

###  findWildcardField

▸ **findWildcardField**(`field`: *string*, `cb`: *[BooleanCB](overview.md#booleancb)*): *`WildcardField`*

*Defined in [document-matcher/logic-builder/string.ts:28](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`cb` | [BooleanCB](overview.md#booleancb) |

**Returns:** *`WildcardField`*

___

###  flattenQuery

▸ **flattenQuery**(`query`: *`i.AnyQuery` | undefined*, `flattenTo`: *`i.BoolQueryTypes`*): *`i.AnyQuery`[]*

*Defined in [translator/utils.ts:245](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L245)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | `i.AnyQuery` \| undefined |
`flattenTo` | `i.BoolQueryTypes` |

**Returns:** *`i.AnyQuery`[]*

___

###  geoBoundingBox

▸ **geoBoundingBox**(`node`: *[GeoBoundingBox](interfaces/geoboundingbox.md)*): *`(Anonymous function)`*

*Defined in [document-matcher/logic-builder/geo.ts:36](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/geo.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [GeoBoundingBox](interfaces/geoboundingbox.md) |

**Returns:** *`(Anonymous function)`*

___

###  geoDistance

▸ **geoDistance**(`node`: *[GeoDistance](interfaces/geodistance.md)*): *`(Anonymous function)`*

*Defined in [document-matcher/logic-builder/geo.ts:17](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/geo.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [GeoDistance](interfaces/geodistance.md) |

**Returns:** *`(Anonymous function)`*

___

###  getAnyValue

▸ **getAnyValue**(`node`: *any*): *any*

*Defined in [parser/utils.ts:66](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *any*

___

###  getField

▸ **getField**(`node`: *any*): *string | undefined*

*Defined in [parser/utils.ts:70](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *string | undefined*

___

###  getLonAndLat

▸ **getLonAndLat**(`input`: *any*, `throwInvalid`: *boolean*): *[number, number]*

*Defined in [utils.ts:59](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L59)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`throwInvalid` | boolean | true |

**Returns:** *[number, number]*

___

###  getRangeValues

▸ **getRangeValues**(`node`: *[Range](interfaces/range.md)*): *object*

*Defined in [document-matcher/logic-builder/dates.ts:18](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *object*

___

###  getTermField

▸ **getTermField**(`node`: *[TermLikeAST](interfaces/termlikeast.md)*): *string*

*Defined in [translator/utils.ts:88](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [TermLikeAST](interfaces/termlikeast.md) |

**Returns:** *string*

___

###  ipRange

▸ **ipRange**(`node`: *[Range](interfaces/range.md)*): *`checkIp`*

*Defined in [document-matcher/logic-builder/ip.ts:72](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/ip.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *`checkIp`*

___

###  ipTerm

▸ **ipTerm**(`node`: *[Term](interfaces/term.md)*): *`checkIp`*

*Defined in [document-matcher/logic-builder/ip.ts:14](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/ip.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Term](interfaces/term.md) |

**Returns:** *`checkIp`*

___

###  isBoolQuery

▸ **isBoolQuery**(`query`: *any*): *boolean*

*Defined in [translator/utils.ts:273](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L273)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | any |

**Returns:** *boolean*

___

###  isBooleanDataType

▸ **isBooleanDataType**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:62](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isConjunction

▸ **isConjunction**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:8](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isEmptyAST

▸ **isEmptyAST**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:48](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isExists

▸ **isExists**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:20](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isFieldGroup

▸ **isFieldGroup**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:16](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isGeoBoundingBox

▸ **isGeoBoundingBox**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:32](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isGeoDistance

▸ **isGeoDistance**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:28](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isGroupLike

▸ **isGroupLike**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:93](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L93)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isInfiniteMax

▸ **isInfiniteMax**(`max?`: *number | string*): *boolean*

*Defined in [utils.ts:16](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`max?` | number \| string |

**Returns:** *boolean*

___

###  isInfiniteMin

▸ **isInfiniteMin**(`min?`: *number | string*): *boolean*

*Defined in [utils.ts:11](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`min?` | number \| string |

**Returns:** *boolean*

___

###  isInfiniteValue

▸ **isInfiniteValue**(`input?`: *number | string*): *boolean*

*Defined in [utils.ts:7](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`input?` | number \| string |

**Returns:** *boolean*

___

###  isLogicalGroup

▸ **isLogicalGroup**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:4](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isMultiMatch

▸ **isMultiMatch**(`node`: *[TermLikeAST](interfaces/termlikeast.md)*): *boolean*

*Defined in [translator/utils.ts:73](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/translator/utils.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [TermLikeAST](interfaces/termlikeast.md) |

**Returns:** *boolean*

___

###  isNegation

▸ **isNegation**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isNumberDataType

▸ **isNumberDataType**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:58](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isRange

▸ **isRange**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:24](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isRegexp

▸ **isRegexp**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:36](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isStringDataType

▸ **isStringDataType**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:52](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isTerm

▸ **isTerm**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:44](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isTermType

▸ **isTermType**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:86](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isWildCard

▸ **isWildCard**(`term`: *string*): *boolean*

*Defined in [document-matcher/logic-builder/string.ts:20](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *boolean*

___

###  isWildcard

▸ **isWildcard**(`node`: *any*): *boolean*

*Defined in [parser/utils.ts:40](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/parser/utils.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  parseGeoDistance

▸ **parseGeoDistance**(`str`: *string*): *[GeoDistanceObj](interfaces/geodistanceobj.md)*

*Defined in [utils.ts:43](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[GeoDistanceObj](interfaces/geodistanceobj.md)*

___

###  parseGeoPoint

▸ **parseGeoPoint**(`point`: *[GeoPointInput](overview.md#geopointinput) | number[] | object*): *number[]*

*Defined in [utils.ts:70](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) \| number[] \| object |

**Returns:** *number[]*

▸ **parseGeoPoint**(`point`: *[GeoPointInput](overview.md#geopointinput) | number[] | object*, `throwInvalid`: *true*): *number[]*

*Defined in [utils.ts:71](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L71)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) \| number[] \| object |
`throwInvalid` | true |

**Returns:** *number[]*

▸ **parseGeoPoint**(`point`: *[GeoPointInput](overview.md#geopointinput) | number[] | object*, `throwInvalid`: *false*): *number[] | null*

*Defined in [utils.ts:72](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) \| number[] \| object |
`throwInvalid` | false |

**Returns:** *number[] | null*

___

###  parseRange

▸ **parseRange**(`node`: *[Range](interfaces/range.md)*, `excludeInfinite`: *boolean*): *[ParsedRange](interfaces/parsedrange.md)*

*Defined in [utils.ts:28](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L28)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`node` | [Range](interfaces/range.md) | - |
`excludeInfinite` | boolean | false |

**Returns:** *[ParsedRange](interfaces/parsedrange.md)*

___

###  regexp

▸ **regexp**(`term`: *string*): *`regexpTerm`*

*Defined in [document-matcher/logic-builder/string.ts:5](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *`regexpTerm`*

___

###  wildcard

▸ **wildcard**(`term`: *string*): *`wildcardTerm`*

*Defined in [document-matcher/logic-builder/string.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *`wildcardTerm`*

## Object literals

### `Const` GEO_DISTANCE_UNITS

### ▪ **GEO_DISTANCE_UNITS**: *object*

*Defined in [utils.ts:153](https://github.com/terascope/teraslice/blob/a3992c27/packages/xlucene-evaluator/src/utils.ts#L153)*
