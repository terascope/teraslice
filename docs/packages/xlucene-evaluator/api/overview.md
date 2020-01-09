---
title: xLucene Evaluator API Overview
sidebar_label: API
---

## Index

### Enumerations

* [ASTType](enums/asttype.md)
* [FieldType](enums/fieldtype.md)

### Classes

* [CachedParser](classes/cachedparser.md)
* [CachedQueryAccess](classes/cachedqueryaccess.md)
* [CachedTranslator](classes/cachedtranslator.md)
* [DocumentMatcher](classes/documentmatcher.md)
* [Parser](classes/parser.md)
* [QueryAccess](classes/queryaccess.md)
* [SyntaxError](classes/syntaxerror.md)
* [Translator](classes/translator.md)

### Interfaces

* [AnyDataType](interfaces/anydatatype.md)
* [BooleanDataType](interfaces/booleandatatype.md)
* [Conjunction](interfaces/conjunction.md)
* [DocumentMatcherOptions](interfaces/documentmatcheroptions.md)
* [EmptyAST](interfaces/emptyast.md)
* [Exists](interfaces/exists.md)
* [ExistsQuery](interfaces/existsquery.md)
* [FieldGroup](interfaces/fieldgroup.md)
* [FunctionConfig](interfaces/functionconfig.md)
* [FunctionDefinition](interfaces/functiondefinition.md)
* [FunctionMethods](interfaces/functionmethods.md)
* [FunctionMethodsResults](interfaces/functionmethodsresults.md)
* [FunctionNode](interfaces/functionnode.md)
* [GeoBoundingBox](interfaces/geoboundingbox.md)
* [GeoDistance](interfaces/geodistance.md)
* [GeoDistanceObj](interfaces/geodistanceobj.md)
* [GeoPoint](interfaces/geopoint.md)
* [GeoQuery](interfaces/geoquery.md)
* [GroupLikeAST](interfaces/grouplikeast.md)
* [IAnyExpectation](interfaces/ianyexpectation.md)
* [IClassExpectation](interfaces/iclassexpectation.md)
* [IClassParts](interfaces/iclassparts.md)
* [IEndExpectation](interfaces/iendexpectation.md)
* [IFilePosition](interfaces/ifileposition.md)
* [IFileRange](interfaces/ifilerange.md)
* [ILiteralExpectation](interfaces/iliteralexpectation.md)
* [IOtherExpectation](interfaces/iotherexpectation.md)
* [IParseOptions](interfaces/iparseoptions.md)
* [LogicalGroup](interfaces/logicalgroup.md)
* [MatchPhraseQuery](interfaces/matchphrasequery.md)
* [MatchQuery](interfaces/matchquery.md)
* [MultiMatchQuery](interfaces/multimatchquery.md)
* [Negation](interfaces/negation.md)
* [NumberDataType](interfaces/numberdatatype.md)
* [ParsedRange](interfaces/parsedrange.md)
* [ParserOptions](interfaces/parseroptions.md)
* [QueryAccessConfig](interfaces/queryaccessconfig.md)
* [QueryAccessOptions](interfaces/queryaccessoptions.md)
* [Range](interfaces/range.md)
* [RangeExpression](interfaces/rangeexpression.md)
* [RangeNode](interfaces/rangenode.md)
* [RangeQuery](interfaces/rangequery.md)
* [RegExprQuery](interfaces/regexprquery.md)
* [Regexp](interfaces/regexp.md)
* [RestrictSearchQueryOptions](interfaces/restrictsearchqueryoptions.md)
* [StringDataType](interfaces/stringdatatype.md)
* [Term](interfaces/term.md)
* [TermLikeAST](interfaces/termlikeast.md)
* [TermQuery](interfaces/termquery.md)
* [TypeConfig](interfaces/typeconfig.md)
* [Wildcard](interfaces/wildcard.md)
* [WildcardQuery](interfaces/wildcardquery.md)

### Type aliases

* [AST](overview.md#ast)
* [AnyAST](overview.md#anyast)
* [AnyQuery](overview.md#anyquery)
* [AnyQuerySort](overview.md#anyquerysort)
* [BoolQuery](overview.md#boolquery)
* [BoolQueryTypes](overview.md#boolquerytypes)
* [BooleanCB](overview.md#booleancb)
* [ConstantScoreQuery](overview.md#constantscorequery)
* [CreateJoinQueryOptions](overview.md#createjoinqueryoptions)
* [DateInput](overview.md#dateinput)
* [ElasticsearchDSLOptions](overview.md#elasticsearchdsloptions)
* [ElasticsearchDSLResult](overview.md#elasticsearchdslresult)
* [Expectation](overview.md#expectation)
* [Field](overview.md#field)
* [GeoDistanceSort](overview.md#geodistancesort)
* [GeoDistanceUnit](overview.md#geodistanceunit)
* [GeoPointInput](overview.md#geopointinput)
* [GeoSortQuery](overview.md#geosortquery)
* [GroupLike](overview.md#grouplike)
* [GroupLikeType](overview.md#groupliketype)
* [JoinBy](overview.md#joinby)
* [MatchAllQuery](overview.md#matchallquery)
* [ParseFunction](overview.md#parsefunction)
* [RangeOperator](overview.md#rangeoperator)
* [SortOrder](overview.md#sortorder)
* [TermLike](overview.md#termlike)
* [TermLikeType](overview.md#termliketype)
* [TranslatorOptions](overview.md#translatoroptions)
* [UtilsTranslateQueryOptions](overview.md#utilstranslatequeryoptions)

### Variables

* [groupTypes](overview.md#const-grouptypes)
* [numberDataTypes](overview.md#const-numberdatatypes)
* [parse](overview.md#const-parse)
* [termTypes](overview.md#const-termtypes)

### Functions

* [buildLogicFn](overview.md#buildlogicfn)
* [canFlattenBoolQuery](overview.md#canflattenboolquery)
* [compactFinalQuery](overview.md#compactfinalquery)
* [compareTermDates](overview.md#comparetermdates)
* [createJoinQuery](overview.md#createjoinquery)
* [dateRange](overview.md#daterange)
* [findWildcardField](overview.md#findwildcardfield)
* [flattenQuery](overview.md#flattenquery)
* [geoBoundingBox](overview.md#geoboundingbox)
* [geoDistance](overview.md#geodistance)
* [geoMatcher](overview.md#geomatcher)
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
* [isFunctionExpression](overview.md#isfunctionexpression)
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
* [makeContext](overview.md#makecontext)
* [parseGeoDistance](overview.md#parsegeodistance)
* [parseGeoDistanceUnit](overview.md#parsegeodistanceunit)
* [parseGeoPoint](overview.md#parsegeopoint)
* [parseRange](overview.md#parserange)
* [regexp](overview.md#regexp)
* [translateQuery](overview.md#translatequery)
* [wildcard](overview.md#wildcard)

### Object literals

* [GEO_DISTANCE_UNITS](overview.md#const-geo_distance_units)

## Type aliases

###  AST

Ƭ **AST**: *[EmptyAST](interfaces/emptyast.md) & [LogicalGroup](interfaces/logicalgroup.md) & [Term](interfaces/term.md) & [Conjunction](interfaces/conjunction.md) & [Negation](interfaces/negation.md) & [FieldGroup](interfaces/fieldgroup.md) & [Exists](interfaces/exists.md) & [Range](interfaces/range.md) & [GeoDistance](interfaces/geodistance.md) & [GeoBoundingBox](interfaces/geoboundingbox.md) & [Regexp](interfaces/regexp.md) & [Wildcard](interfaces/wildcard.md) & [FunctionNode](interfaces/functionnode.md)*

*Defined in [parser/interfaces.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L16)*

___

###  AnyAST

Ƭ **AnyAST**: *[EmptyAST](interfaces/emptyast.md) | [LogicalGroup](interfaces/logicalgroup.md) | [Term](interfaces/term.md) | [Conjunction](interfaces/conjunction.md) | [Negation](interfaces/negation.md) | [FieldGroup](interfaces/fieldgroup.md) | [Exists](interfaces/exists.md) | [Range](interfaces/range.md) | [GeoDistance](interfaces/geodistance.md) | [GeoBoundingBox](interfaces/geoboundingbox.md) | [Regexp](interfaces/regexp.md) | [Wildcard](interfaces/wildcard.md) | [FunctionNode](interfaces/functionnode.md)*

*Defined in [parser/interfaces.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L21)*

___

###  AnyQuery

Ƭ **AnyQuery**: *[BoolQuery](overview.md#boolquery) | [GeoQuery](interfaces/geoquery.md) | [TermQuery](interfaces/termquery.md) | [MatchQuery](interfaces/matchquery.md) | [MatchPhraseQuery](interfaces/matchphrasequery.md) | [WildcardQuery](interfaces/wildcardquery.md) | [ExistsQuery](interfaces/existsquery.md) | [RegExprQuery](interfaces/regexprquery.md) | [RangeQuery](interfaces/rangequery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

*Defined in [translator/interfaces.ts:45](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L45)*

___

###  AnyQuerySort

Ƭ **AnyQuerySort**: *[GeoSortQuery](overview.md#geosortquery)*

*Defined in [translator/interfaces.ts:157](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L157)*

___

###  BoolQuery

Ƭ **BoolQuery**: *object*

*Defined in [translator/interfaces.ts:35](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L35)*

#### Type declaration:

___

###  BoolQueryTypes

Ƭ **BoolQueryTypes**: *"filter" | "should" | "must_not"*

*Defined in [translator/interfaces.ts:43](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L43)*

___

###  BooleanCB

Ƭ **BooleanCB**: *function*

*Defined in [document-matcher/interfaces.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/interfaces.ts#L7)*

#### Type declaration:

▸ (`data`: any): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

___

###  ConstantScoreQuery

Ƭ **ConstantScoreQuery**: *object*

*Defined in [translator/interfaces.ts:136](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L136)*

#### Type declaration:

___

###  CreateJoinQueryOptions

Ƭ **CreateJoinQueryOptions**: *object*

*Defined in [utils.ts:165](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L165)*

#### Type declaration:

___

###  DateInput

Ƭ **DateInput**: *string | number*

*Defined in [document-matcher/interfaces.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/interfaces.ts#L8)*

___

###  ElasticsearchDSLOptions

Ƭ **ElasticsearchDSLOptions**: *object*

*Defined in [translator/interfaces.ts:26](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L26)*

#### Type declaration:

___

###  ElasticsearchDSLResult

Ƭ **ElasticsearchDSLResult**: *object*

*Defined in [translator/interfaces.ts:159](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L159)*

#### Type declaration:

___

###  Expectation

Ƭ **Expectation**: *[ILiteralExpectation](interfaces/iliteralexpectation.md) | [IClassExpectation](interfaces/iclassexpectation.md) | [IAnyExpectation](interfaces/ianyexpectation.md) | [IEndExpectation](interfaces/iendexpectation.md) | [IOtherExpectation](interfaces/iotherexpectation.md)*

Defined in parser/peg-engine.ts:50

___

###  Field

Ƭ **Field**: *string | null*

*Defined in [parser/interfaces.ts:69](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L69)*

___

###  GeoDistanceSort

Ƭ **GeoDistanceSort**: *object*

*Defined in [translator/interfaces.ts:146](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L146)*

#### Type declaration:

* \[ **field**: *string*\]: [SortOrder](overview.md#sortorder) | [GeoDistanceUnit](overview.md#geodistanceunit) | object

___

###  GeoDistanceUnit

Ƭ **GeoDistanceUnit**: *"miles" | "yards" | "feet" | "inch" | "kilometers" | "meters" | "centimeters" | "millimeters" | "nauticalmiles"*

*Defined in [interfaces.ts:24](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/interfaces.ts#L24)*

___

###  GeoPointInput

Ƭ **GeoPointInput**: *GeoPointArr | GeoPointStr | GeoObjShort | GeoObjLong | number[] | object*

*Defined in [interfaces.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/interfaces.ts#L6)*

___

###  GeoSortQuery

Ƭ **GeoSortQuery**: *object*

*Defined in [translator/interfaces.ts:153](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L153)*

#### Type declaration:

___

###  GroupLike

Ƭ **GroupLike**: *[FieldGroup](interfaces/fieldgroup.md) | [LogicalGroup](interfaces/logicalgroup.md)*

*Defined in [parser/interfaces.ts:26](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L26)*

___

###  GroupLikeType

Ƭ **GroupLikeType**: *[LogicalGroup](enums/asttype.md#logicalgroup) | [FieldGroup](enums/asttype.md#fieldgroup)*

*Defined in [parser/interfaces.ts:27](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L27)*

___

###  JoinBy

Ƭ **JoinBy**: *"AND" | "OR"*

*Defined in [interfaces.ts:41](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/interfaces.ts#L41)*

___

###  MatchAllQuery

Ƭ **MatchAllQuery**: *object*

*Defined in [translator/interfaces.ts:142](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L142)*

#### Type declaration:

___

###  ParseFunction

Ƭ **ParseFunction**: *function*

Defined in parser/peg-engine.ts:5296

#### Type declaration:

▸ (`input`: string, `options?`: [IParseOptions](interfaces/iparseoptions.md)): *any*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`options?` | [IParseOptions](interfaces/iparseoptions.md) |

___

###  RangeOperator

Ƭ **RangeOperator**: *"gte" | "gt" | "lt" | "lte"*

*Defined in [parser/interfaces.ts:121](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L121)*

___

###  SortOrder

Ƭ **SortOrder**: *"asc" | "desc"*

*Defined in [translator/interfaces.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L8)*

___

###  TermLike

Ƭ **TermLike**: *[Term](interfaces/term.md) | [Regexp](interfaces/regexp.md) | [Range](interfaces/range.md) | [Wildcard](interfaces/wildcard.md) | [GeoBoundingBox](interfaces/geoboundingbox.md) | [GeoDistance](interfaces/geodistance.md) | [FunctionNode](interfaces/functionnode.md)*

*Defined in [parser/interfaces.ts:34](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L34)*

___

###  TermLikeType

Ƭ **TermLikeType**: *[Term](enums/asttype.md#term) | [Regexp](enums/asttype.md#regexp) | [Range](enums/asttype.md#range) | [Wildcard](enums/asttype.md#wildcard) | [GeoBoundingBox](enums/asttype.md#geoboundingbox) | [GeoDistance](enums/asttype.md#geodistance) | [Function](enums/asttype.md#function)*

*Defined in [parser/interfaces.ts:35](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/interfaces.ts#L35)*

___

###  TranslatorOptions

Ƭ **TranslatorOptions**: *object*

*Defined in [translator/interfaces.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L10)*

#### Type declaration:

___

###  UtilsTranslateQueryOptions

Ƭ **UtilsTranslateQueryOptions**: *object*

*Defined in [translator/interfaces.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/interfaces.ts#L18)*

#### Type declaration:

## Variables

### `Const` groupTypes

• **groupTypes**: *[ASTType](enums/asttype.md)[]* =  [i.ASTType.LogicalGroup, i.ASTType.FieldGroup]

*Defined in [parser/utils.ts:97](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L97)*

logical group or field group with flow

___

### `Const` numberDataTypes

• **numberDataTypes**: *[FieldType](enums/fieldtype.md)[]* =  [FieldType.Integer, FieldType.Float]

*Defined in [parser/utils.ts:61](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L61)*

___

### `Const` parse

• **parse**: *[ParseFunction](overview.md#parsefunction)* =  peg$parse

Defined in parser/peg-engine.ts:5297

___

### `Const` termTypes

• **termTypes**: *[ASTType](enums/asttype.md)[]* =  [
    i.ASTType.Term,
    i.ASTType.Regexp,
    i.ASTType.Range,
    i.ASTType.Wildcard,
    i.ASTType.GeoDistance,
    i.ASTType.GeoBoundingBox,
    i.ASTType.Function
]

*Defined in [parser/utils.ts:82](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L82)*

term level queries with field (string|null)

## Functions

###  buildLogicFn

▸ **buildLogicFn**(`parser`: [Parser](classes/parser.md), `typeConfig`: [TypeConfig](interfaces/typeconfig.md)): *function*

*Defined in [document-matcher/logic-builder/index.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/index.ts#L17)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`parser` | [Parser](classes/parser.md) | - |
`typeConfig` | [TypeConfig](interfaces/typeconfig.md) |  {} |

**Returns:** *function*

▸ (`data`: any): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

___

###  canFlattenBoolQuery

▸ **canFlattenBoolQuery**(`query`: i.BoolQuery, `flattenTo`: i.BoolQueryTypes): *boolean*

*Defined in [translator/utils.ts:359](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/utils.ts#L359)*

This prevents double nested queries that do the same thing

**Parameters:**

Name | Type |
------ | ------ |
`query` | i.BoolQuery |
`flattenTo` | i.BoolQueryTypes |

**Returns:** *boolean*

___

###  compactFinalQuery

▸ **compactFinalQuery**(`query?`: i.AnyQuery): *i.AnyQuery | i.AnyQuery[]*

*Defined in [translator/utils.ts:369](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/utils.ts#L369)*

**Parameters:**

Name | Type |
------ | ------ |
`query?` | i.AnyQuery |

**Returns:** *i.AnyQuery | i.AnyQuery[]*

___

###  compareTermDates

▸ **compareTermDates**(`node`: [Term](interfaces/term.md)): *dateTerm*

*Defined in [document-matcher/logic-builder/dates.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Term](interfaces/term.md) |

**Returns:** *dateTerm*

___

###  createJoinQuery

▸ **createJoinQuery**(`input`: AnyObject, `options`: [CreateJoinQueryOptions](overview.md#createjoinqueryoptions)): *string*

*Defined in [utils.ts:172](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L172)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | AnyObject | - |
`options` | [CreateJoinQueryOptions](overview.md#createjoinqueryoptions) |  {} |

**Returns:** *string*

___

###  dateRange

▸ **dateRange**(`node`: [Range](interfaces/range.md)): *dateRangeTerm*

*Defined in [document-matcher/logic-builder/dates.ts:51](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *dateRangeTerm*

___

###  findWildcardField

▸ **findWildcardField**(`field`: string, `cb`: [BooleanCB](overview.md#booleancb)): *WildcardField*

*Defined in [document-matcher/logic-builder/string.ts:28](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`cb` | [BooleanCB](overview.md#booleancb) |

**Returns:** *WildcardField*

___

###  flattenQuery

▸ **flattenQuery**(`query`: i.AnyQuery | undefined, `flattenTo`: i.BoolQueryTypes): *i.AnyQuery[]*

*Defined in [translator/utils.ts:347](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/utils.ts#L347)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | i.AnyQuery &#124; undefined |
`flattenTo` | i.BoolQueryTypes |

**Returns:** *i.AnyQuery[]*

___

###  geoBoundingBox

▸ **geoBoundingBox**(`node`: [GeoBoundingBox](interfaces/geoboundingbox.md)): *(Anonymous function)*

*Defined in [document-matcher/logic-builder/geo.ts:40](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/geo.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [GeoBoundingBox](interfaces/geoboundingbox.md) |

**Returns:** *(Anonymous function)*

___

###  geoDistance

▸ **geoDistance**(`node`: [GeoDistance](interfaces/geodistance.md)): *(Anonymous function)*

*Defined in [document-matcher/logic-builder/geo.ts:19](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/geo.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [GeoDistance](interfaces/geodistance.md) |

**Returns:** *(Anonymous function)*

___

###  geoMatcher

▸ **geoMatcher**(`polygon`: any): *(Anonymous function)*

*Defined in [parser/functions/geo/helpers.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`polygon` | any |

**Returns:** *(Anonymous function)*

___

###  getAnyValue

▸ **getAnyValue**(`node`: any): *any*

*Defined in [parser/utils.ts:71](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L71)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *any*

___

###  getField

▸ **getField**(`node`: any): *string | undefined*

*Defined in [parser/utils.ts:75](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *string | undefined*

___

###  getLonAndLat

▸ **getLonAndLat**(`input`: any, `throwInvalid`: boolean): *[number, number]*

*Defined in [utils.ts:112](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L112)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`throwInvalid` | boolean | true |

**Returns:** *[number, number]*

___

###  getRangeValues

▸ **getRangeValues**(`node`: [Range](interfaces/range.md)): *object*

*Defined in [document-matcher/logic-builder/dates.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *object*

___

###  getTermField

▸ **getTermField**(`node`: [TermLikeAST](interfaces/termlikeast.md)): *string*

*Defined in [translator/utils.ts:343](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/utils.ts#L343)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [TermLikeAST](interfaces/termlikeast.md) |

**Returns:** *string*

___

###  ipRange

▸ **ipRange**(`node`: [Range](interfaces/range.md)): *checkIp*

*Defined in [document-matcher/logic-builder/ip.ts:78](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/ip.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *checkIp*

___

###  ipTerm

▸ **ipTerm**(`node`: [Term](interfaces/term.md)): *checkIp*

*Defined in [document-matcher/logic-builder/ip.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/ip.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Term](interfaces/term.md) |

**Returns:** *checkIp*

___

###  isBoolQuery

▸ **isBoolQuery**(`query`: any): *boolean*

*Defined in [translator/utils.ts:365](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/utils.ts#L365)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | any |

**Returns:** *boolean*

___

###  isBooleanDataType

▸ **isBooleanDataType**(`node`: any): *boolean*

*Defined in [parser/utils.ts:67](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isConjunction

▸ **isConjunction**(`node`: any): *boolean*

*Defined in [parser/utils.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isEmptyAST

▸ **isEmptyAST**(`node`: any): *boolean*

*Defined in [parser/utils.ts:53](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isExists

▸ **isExists**(`node`: any): *boolean*

*Defined in [parser/utils.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isFieldGroup

▸ **isFieldGroup**(`node`: any): *boolean*

*Defined in [parser/utils.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isFunctionExpression

▸ **isFunctionExpression**(`node`: any): *boolean*

*Defined in [parser/utils.ts:37](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isGeoBoundingBox

▸ **isGeoBoundingBox**(`node`: any): *boolean*

*Defined in [parser/utils.ts:33](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isGeoDistance

▸ **isGeoDistance**(`node`: any): *boolean*

*Defined in [parser/utils.ts:29](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isGroupLike

▸ **isGroupLike**(`node`: any): *boolean*

*Defined in [parser/utils.ts:99](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L99)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isInfiniteMax

▸ **isInfiniteMax**(`max?`: number | string): *boolean*

*Defined in [utils.ts:33](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`max?` | number &#124; string |

**Returns:** *boolean*

___

###  isInfiniteMin

▸ **isInfiniteMin**(`min?`: number | string): *boolean*

*Defined in [utils.ts:28](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`min?` | number &#124; string |

**Returns:** *boolean*

___

###  isInfiniteValue

▸ **isInfiniteValue**(`input?`: number | string): *boolean*

*Defined in [utils.ts:24](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`input?` | number &#124; string |

**Returns:** *boolean*

___

###  isLogicalGroup

▸ **isLogicalGroup**(`node`: any): *boolean*

*Defined in [parser/utils.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isMultiMatch

▸ **isMultiMatch**(`node`: [TermLikeAST](interfaces/termlikeast.md)): *boolean*

*Defined in [translator/utils.ts:339](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/utils.ts#L339)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [TermLikeAST](interfaces/termlikeast.md) |

**Returns:** *boolean*

___

###  isNegation

▸ **isNegation**(`node`: any): *boolean*

*Defined in [parser/utils.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isNumberDataType

▸ **isNumberDataType**(`node`: any): *boolean*

*Defined in [parser/utils.ts:63](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isRange

▸ **isRange**(`node`: any): *boolean*

*Defined in [parser/utils.ts:25](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isRegexp

▸ **isRegexp**(`node`: any): *boolean*

*Defined in [parser/utils.ts:41](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isStringDataType

▸ **isStringDataType**(`node`: any): *boolean*

*Defined in [parser/utils.ts:57](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isTerm

▸ **isTerm**(`node`: any): *boolean*

*Defined in [parser/utils.ts:49](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isTermType

▸ **isTermType**(`node`: any): *boolean*

*Defined in [parser/utils.ts:92](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  isWildCard

▸ **isWildCard**(`term`: string): *boolean*

*Defined in [document-matcher/logic-builder/string.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *boolean*

___

###  isWildcard

▸ **isWildcard**(`node`: any): *boolean*

*Defined in [parser/utils.ts:45](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/utils.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  makeContext

▸ **makeContext**(`args`: any): *object*

*Defined in [parser/context.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/parser/context.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`args` | any |

**Returns:** *object*

___

###  parseGeoDistance

▸ **parseGeoDistance**(`str`: string): *[GeoDistanceObj](interfaces/geodistanceobj.md)*

*Defined in [utils.ts:90](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L90)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[GeoDistanceObj](interfaces/geodistanceobj.md)*

___

###  parseGeoDistanceUnit

▸ **parseGeoDistanceUnit**(`input`: string): *[GeoDistanceUnit](overview.md#geodistanceunit)*

*Defined in [utils.ts:103](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L103)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *[GeoDistanceUnit](overview.md#geodistanceunit)*

___

###  parseGeoPoint

▸ **parseGeoPoint**(`point`: [GeoPointInput](overview.md#geopointinput)): *[GeoPoint](interfaces/geopoint.md)*

*Defined in [utils.ts:129](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L129)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) |

**Returns:** *[GeoPoint](interfaces/geopoint.md)*

▸ **parseGeoPoint**(`point`: [GeoPointInput](overview.md#geopointinput), `throwInvalid`: true): *[GeoPoint](interfaces/geopoint.md)*

*Defined in [utils.ts:130](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L130)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) |
`throwInvalid` | true |

**Returns:** *[GeoPoint](interfaces/geopoint.md)*

▸ **parseGeoPoint**(`point`: [GeoPointInput](overview.md#geopointinput), `throwInvalid`: false): *[GeoPoint](interfaces/geopoint.md) | null*

*Defined in [utils.ts:131](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L131)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) |
`throwInvalid` | false |

**Returns:** *[GeoPoint](interfaces/geopoint.md) | null*

___

###  parseRange

▸ **parseRange**(`node`: [Range](interfaces/range.md), `excludeInfinite`: boolean): *[ParsedRange](interfaces/parsedrange.md)*

*Defined in [utils.ts:45](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L45)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`node` | [Range](interfaces/range.md) | - |
`excludeInfinite` | boolean | false |

**Returns:** *[ParsedRange](interfaces/parsedrange.md)*

___

###  regexp

▸ **regexp**(`term`: string): *regexpTerm*

*Defined in [document-matcher/logic-builder/string.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *regexpTerm*

___

###  translateQuery

▸ **translateQuery**(`parser`: [Parser](classes/parser.md), `options`: i.UtilsTranslateQueryOptions): *i.ElasticsearchDSLResult*

*Defined in [translator/utils.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/translator/utils.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`parser` | [Parser](classes/parser.md) |
`options` | i.UtilsTranslateQueryOptions |

**Returns:** *i.ElasticsearchDSLResult*

___

###  wildcard

▸ **wildcard**(`term`: string): *wildcardTerm*

*Defined in [document-matcher/logic-builder/string.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *wildcardTerm*

## Object literals

### `Const` GEO_DISTANCE_UNITS

### ▪ **GEO_DISTANCE_UNITS**: *object*

*Defined in [utils.ts:60](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L60)*

###  NM

• **NM**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [utils.ts:64](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L64)*

###  centimeter

• **centimeter**: *"centimeters"* = "centimeters"

*Defined in [utils.ts:84](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L84)*

###  centimeters

• **centimeters**: *"centimeters"* = "centimeters"

*Defined in [utils.ts:85](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L85)*

###  cm

• **cm**: *"centimeters"* = "centimeters"

*Defined in [utils.ts:83](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L83)*

###  feet

• **feet**: *"feet"* = "feet"

*Defined in [utils.ts:87](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L87)*

###  ft

• **ft**: *"feet"* = "feet"

*Defined in [utils.ts:86](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L86)*

###  in

• **in**: *"inch"* = "inch"

*Defined in [utils.ts:68](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L68)*

###  inch

• **inch**: *"inch"* = "inch"

*Defined in [utils.ts:69](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L69)*

###  inches

• **inches**: *"inch"* = "inch"

*Defined in [utils.ts:70](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L70)*

###  kilometer

• **kilometer**: *"kilometers"* = "kilometers"

*Defined in [utils.ts:78](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L78)*

###  kilometers

• **kilometers**: *"kilometers"* = "kilometers"

*Defined in [utils.ts:79](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L79)*

###  km

• **km**: *"kilometers"* = "kilometers"

*Defined in [utils.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L77)*

###  m

• **m**: *"meters"* = "meters"

*Defined in [utils.ts:74](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L74)*

###  meter

• **meter**: *"meters"* = "meters"

*Defined in [utils.ts:75](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L75)*

###  meters

• **meters**: *"meters"* = "meters"

*Defined in [utils.ts:76](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L76)*

###  mi

• **mi**: *"miles"* = "miles"

*Defined in [utils.ts:61](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L61)*

###  mile

• **mile**: *"miles"* = "miles"

*Defined in [utils.ts:63](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L63)*

###  miles

• **miles**: *"miles"* = "miles"

*Defined in [utils.ts:62](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L62)*

###  millimeter

• **millimeter**: *"millimeters"* = "millimeters"

*Defined in [utils.ts:81](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L81)*

###  millimeters

• **millimeters**: *"millimeters"* = "millimeters"

*Defined in [utils.ts:82](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L82)*

###  mm

• **mm**: *"millimeters"* = "millimeters"

*Defined in [utils.ts:80](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L80)*

###  nauticalmile

• **nauticalmile**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [utils.ts:66](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L66)*

###  nauticalmiles

• **nauticalmiles**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [utils.ts:67](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L67)*

###  nmi

• **nmi**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [utils.ts:65](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L65)*

###  yard

• **yard**: *"yards"* = "yards"

*Defined in [utils.ts:72](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L72)*

###  yards

• **yards**: *"yards"* = "yards"

*Defined in [utils.ts:73](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L73)*

###  yd

• **yd**: *"yards"* = "yards"

*Defined in [utils.ts:71](https://github.com/terascope/teraslice/blob/d8feecc03/packages/xlucene-evaluator/src/utils.ts#L71)*
