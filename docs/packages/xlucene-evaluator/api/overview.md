---
title: xLucene Evaluator API Overview
sidebar_label: API
---

## Index

### Enumerations

* [ASTType](enums/asttype.md)
* [ESGeoShapeType](enums/esgeoshapetype.md)
* [FieldType](enums/fieldtype.md)
* [GeoShapeRelation](enums/geoshaperelation.md)
* [GeoShapeType](enums/geoshapetype.md)

### Classes

* [CachedParser](classes/cachedparser.md)
* [CachedQueryAccess](classes/cachedqueryaccess.md)
* [CachedTranslator](classes/cachedtranslator.md)
* [DocumentMatcher](classes/documentmatcher.md)
* [Parser](classes/parser.md)
* [QueryAccess](classes/queryaccess.md)
* [SyntaxError](classes/syntaxerror.md)
* [Translator](classes/translator.md)
* [VariableState](classes/variablestate.md)

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
* [JoinQueryResult](interfaces/joinqueryresult.md)
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
* [QueryStringQuery](interfaces/querystringquery.md)
* [Range](interfaces/range.md)
* [RangeExpression](interfaces/rangeexpression.md)
* [RangeNode](interfaces/rangenode.md)
* [RangeQuery](interfaces/rangequery.md)
* [RegExprQuery](interfaces/regexprquery.md)
* [Regexp](interfaces/regexp.md)
* [RestrictOptions](interfaces/restrictoptions.md)
* [RestrictSearchQueryOptions](interfaces/restrictsearchqueryoptions.md)
* [StringDataType](interfaces/stringdatatype.md)
* [Term](interfaces/term.md)
* [TermLikeAST](interfaces/termlikeast.md)
* [TermQuery](interfaces/termquery.md)
* [TypeConfig](interfaces/typeconfig.md)
* [Variables](interfaces/variables.md)
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
* [CoordinateTuple](overview.md#coordinatetuple)
* [CreateJoinQueryOptions](overview.md#createjoinqueryoptions)
* [DateInput](overview.md#dateinput)
* [ESGeoShape](overview.md#esgeoshape)
* [ESGeoShapeMultiPolygon](overview.md#esgeoshapemultipolygon)
* [ESGeoShapePoint](overview.md#esgeoshapepoint)
* [ESGeoShapePolygon](overview.md#esgeoshapepolygon)
* [ElasticsearchDSLOptions](overview.md#elasticsearchdsloptions)
* [ElasticsearchDSLResult](overview.md#elasticsearchdslresult)
* [Expectation](overview.md#expectation)
* [Field](overview.md#field)
* [GeoDistanceSort](overview.md#geodistancesort)
* [GeoDistanceUnit](overview.md#geodistanceunit)
* [GeoPointInput](overview.md#geopointinput)
* [GeoShape](overview.md#geoshape)
* [GeoShapeMultiPolygon](overview.md#geoshapemultipolygon)
* [GeoShapePoint](overview.md#geoshapepoint)
* [GeoShapePolygon](overview.md#geoshapepolygon)
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
* [buildRangeQueryString](overview.md#buildrangequerystring)
* [canFlattenBoolQuery](overview.md#canflattenboolquery)
* [compactFinalQuery](overview.md#compactfinalquery)
* [compareTermDates](overview.md#comparetermdates)
* [coordinateToXlucene](overview.md#coordinatetoxlucene)
* [createJoinQuery](overview.md#createjoinquery)
* [dateRange](overview.md#daterange)
* [findWildcardField](overview.md#findwildcardfield)
* [flattenQuery](overview.md#flattenquery)
* [geoBoundingBox](overview.md#geoboundingbox)
* [geoDistance](overview.md#geodistance)
* [getAnyValue](overview.md#getanyvalue)
* [getField](overview.md#getfield)
* [getLonAndLat](overview.md#getlonandlat)
* [getRelationFn](overview.md#getrelationfn)
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
* [isGeoJSONData](overview.md#isgeojsondata)
* [isGeoShapeMultiPolygon](overview.md#isgeoshapemultipolygon)
* [isGeoShapePoint](overview.md#isgeoshapepoint)
* [isGeoShapePolygon](overview.md#isgeoshapepolygon)
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
* [isWildCardString](overview.md#iswildcardstring)
* [isWildcard](overview.md#iswildcard)
* [isWildcardField](overview.md#iswildcardfield)
* [makeBBox](overview.md#makebbox)
* [makeCircle](overview.md#makecircle)
* [makeContext](overview.md#makecontext)
* [makeCoordinatesFromGeoPoint](overview.md#makecoordinatesfromgeopoint)
* [makeShape](overview.md#makeshape)
* [matchString](overview.md#matchstring)
* [parseGeoDistance](overview.md#parsegeodistance)
* [parseGeoDistanceUnit](overview.md#parsegeodistanceunit)
* [parseGeoPoint](overview.md#parsegeopoint)
* [parseRange](overview.md#parserange)
* [parseWildCard](overview.md#parsewildcard)
* [pointInGeoShape](overview.md#pointingeoshape)
* [polyHasPoint](overview.md#polyhaspoint)
* [polyHasShape](overview.md#polyhasshape)
* [regexp](overview.md#regexp)
* [translateQuery](overview.md#translatequery)
* [validateListCoords](overview.md#validatelistcoords)
* [validateVariables](overview.md#validatevariables)
* [wildcard](overview.md#wildcard)

### Object literals

* [GEO_DISTANCE_UNITS](overview.md#const-geo_distance_units)

## Type aliases

###  AST

Ƭ **AST**: *[EmptyAST](interfaces/emptyast.md) & [LogicalGroup](interfaces/logicalgroup.md) & [Term](interfaces/term.md) & [Conjunction](interfaces/conjunction.md) & [Negation](interfaces/negation.md) & [FieldGroup](interfaces/fieldgroup.md) & [Exists](interfaces/exists.md) & [Range](interfaces/range.md) & [GeoDistance](interfaces/geodistance.md) & [GeoBoundingBox](interfaces/geoboundingbox.md) & [Regexp](interfaces/regexp.md) & [Wildcard](interfaces/wildcard.md) & [FunctionNode](interfaces/functionnode.md)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:17](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L17)*

___

###  AnyAST

Ƭ **AnyAST**: *[EmptyAST](interfaces/emptyast.md) | [LogicalGroup](interfaces/logicalgroup.md) | [Term](interfaces/term.md) | [Conjunction](interfaces/conjunction.md) | [Negation](interfaces/negation.md) | [FieldGroup](interfaces/fieldgroup.md) | [Exists](interfaces/exists.md) | [Range](interfaces/range.md) | [GeoDistance](interfaces/geodistance.md) | [GeoBoundingBox](interfaces/geoboundingbox.md) | [Regexp](interfaces/regexp.md) | [Wildcard](interfaces/wildcard.md) | [FunctionNode](interfaces/functionnode.md)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L22)*

___

###  AnyQuery

Ƭ **AnyQuery**: *[BoolQuery](overview.md#boolquery) | [GeoQuery](interfaces/geoquery.md) | [TermQuery](interfaces/termquery.md) | [MatchQuery](interfaces/matchquery.md) | [MatchPhraseQuery](interfaces/matchphrasequery.md) | [WildcardQuery](interfaces/wildcardquery.md) | [ExistsQuery](interfaces/existsquery.md) | [RegExprQuery](interfaces/regexprquery.md) | [QueryStringQuery](interfaces/querystringquery.md) | [RangeQuery](interfaces/rangequery.md) | [MultiMatchQuery](interfaces/multimatchquery.md)*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:50](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L50)*

___

###  AnyQuerySort

Ƭ **AnyQuerySort**: *[GeoSortQuery](overview.md#geosortquery)*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:199](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L199)*

___

###  BoolQuery

Ƭ **BoolQuery**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:40](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L40)*

#### Type declaration:

___

###  BoolQueryTypes

Ƭ **BoolQueryTypes**: *"filter" | "should" | "must_not"*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:48](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L48)*

___

###  BooleanCB

Ƭ **BooleanCB**: *function*

*Defined in [packages/xlucene-evaluator/src/document-matcher/interfaces.ts:7](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/interfaces.ts#L7)*

#### Type declaration:

▸ (`data`: any): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

___

###  ConstantScoreQuery

Ƭ **ConstantScoreQuery**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:178](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L178)*

#### Type declaration:

___

###  CoordinateTuple

Ƭ **CoordinateTuple**: *[number, number]*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:55](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L55)*

___

###  CreateJoinQueryOptions

Ƭ **CreateJoinQueryOptions**: *object*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:87](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L87)*

#### Type declaration:

___

###  DateInput

Ƭ **DateInput**: *string | number*

*Defined in [packages/xlucene-evaluator/src/document-matcher/interfaces.ts:8](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/interfaces.ts#L8)*

___

###  ESGeoShape

Ƭ **ESGeoShape**: *[ESGeoShapePoint](overview.md#esgeoshapepoint) | [ESGeoShapePolygon](overview.md#esgeoshapepolygon) | [ESGeoShapeMultiPolygon](overview.md#esgeoshapemultipolygon)*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:90](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L90)*

___

###  ESGeoShapeMultiPolygon

Ƭ **ESGeoShapeMultiPolygon**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:85](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L85)*

#### Type declaration:

___

###  ESGeoShapePoint

Ƭ **ESGeoShapePoint**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:75](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L75)*

#### Type declaration:

___

###  ESGeoShapePolygon

Ƭ **ESGeoShapePolygon**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:80](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L80)*

#### Type declaration:

___

###  ElasticsearchDSLOptions

Ƭ **ElasticsearchDSLOptions**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:31](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L31)*

#### Type declaration:

___

###  ElasticsearchDSLResult

Ƭ **ElasticsearchDSLResult**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:201](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L201)*

#### Type declaration:

___

###  Expectation

Ƭ **Expectation**: *[ILiteralExpectation](interfaces/iliteralexpectation.md) | [IClassExpectation](interfaces/iclassexpectation.md) | [IAnyExpectation](interfaces/ianyexpectation.md) | [IEndExpectation](interfaces/iendexpectation.md) | [IOtherExpectation](interfaces/iotherexpectation.md)*

Defined in packages/xlucene-evaluator/src/parser/peg-engine.ts:50

___

###  Field

Ƭ **Field**: *string | null*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:71](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L71)*

___

###  GeoDistanceSort

Ƭ **GeoDistanceSort**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:188](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L188)*

#### Type declaration:

* \[ **field**: *string*\]: [SortOrder](overview.md#sortorder) | [GeoDistanceUnit](overview.md#geodistanceunit) | object

___

###  GeoDistanceUnit

Ƭ **GeoDistanceUnit**: *"miles" | "yards" | "feet" | "inch" | "kilometers" | "meters" | "centimeters" | "millimeters" | "nauticalmiles"*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:57](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L57)*

___

###  GeoPointInput

Ƭ **GeoPointInput**: *GeoPointArr | GeoPointStr | GeoObjShort | GeoObjLong | [GeoShapePoint](overview.md#geoshapepoint)*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:8](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L8)*

___

###  GeoShape

Ƭ **GeoShape**: *[GeoShapePoint](overview.md#geoshapepoint) | [GeoShapePolygon](overview.md#geoshapepolygon) | [GeoShapeMultiPolygon](overview.md#geoshapemultipolygon)*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:53](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L53)*

___

###  GeoShapeMultiPolygon

Ƭ **GeoShapeMultiPolygon**: *object*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:48](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L48)*

#### Type declaration:

___

###  GeoShapePoint

Ƭ **GeoShapePoint**: *object*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:38](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L38)*

#### Type declaration:

___

###  GeoShapePolygon

Ƭ **GeoShapePolygon**: *object*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:43](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L43)*

#### Type declaration:

___

###  GeoSortQuery

Ƭ **GeoSortQuery**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:195](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L195)*

#### Type declaration:

___

###  GroupLike

Ƭ **GroupLike**: *[FieldGroup](interfaces/fieldgroup.md) | [LogicalGroup](interfaces/logicalgroup.md)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:27](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L27)*

___

###  GroupLikeType

Ƭ **GroupLikeType**: *[LogicalGroup](enums/asttype.md#logicalgroup) | [FieldGroup](enums/asttype.md#fieldgroup)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:28](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L28)*

___

###  JoinBy

Ƭ **JoinBy**: *"AND" | "OR"*

*Defined in [packages/xlucene-evaluator/src/interfaces.ts:76](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/interfaces.ts#L76)*

___

###  MatchAllQuery

Ƭ **MatchAllQuery**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:184](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L184)*

#### Type declaration:

___

###  ParseFunction

Ƭ **ParseFunction**: *function*

Defined in packages/xlucene-evaluator/src/parser/peg-engine.ts:5630

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

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:123](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L123)*

___

###  SortOrder

Ƭ **SortOrder**: *"asc" | "desc"*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:11](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L11)*

___

###  TermLike

Ƭ **TermLike**: *[Term](interfaces/term.md) | [Regexp](interfaces/regexp.md) | [Range](interfaces/range.md) | [Wildcard](interfaces/wildcard.md) | [GeoBoundingBox](interfaces/geoboundingbox.md) | [GeoDistance](interfaces/geodistance.md) | [FunctionNode](interfaces/functionnode.md)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:35](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L35)*

___

###  TermLikeType

Ƭ **TermLikeType**: *[Term](enums/asttype.md#term) | [Regexp](enums/asttype.md#regexp) | [Range](enums/asttype.md#range) | [Wildcard](enums/asttype.md#wildcard) | [GeoBoundingBox](enums/asttype.md#geoboundingbox) | [GeoDistance](enums/asttype.md#geodistance) | [Function](enums/asttype.md#function)*

*Defined in [packages/xlucene-evaluator/src/parser/interfaces.ts:36](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/interfaces.ts#L36)*

___

###  TranslatorOptions

Ƭ **TranslatorOptions**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L13)*

#### Type declaration:

___

###  UtilsTranslateQueryOptions

Ƭ **UtilsTranslateQueryOptions**: *object*

*Defined in [packages/xlucene-evaluator/src/translator/interfaces.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/interfaces.ts#L22)*

#### Type declaration:

## Variables

### `Const` groupTypes

• **groupTypes**: *[ASTType](enums/asttype.md)[]* =  [i.ASTType.LogicalGroup, i.ASTType.FieldGroup]

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:107](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L107)*

logical group or field group with flow

___

### `Const` numberDataTypes

• **numberDataTypes**: *[FieldType](enums/fieldtype.md)[]* =  [FieldType.Integer, FieldType.Float]

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:71](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L71)*

___

### `Const` parse

• **parse**: *[ParseFunction](overview.md#parsefunction)* =  peg$parse

Defined in packages/xlucene-evaluator/src/parser/peg-engine.ts:5631

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

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:92](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L92)*

term level queries with field (string|null)

## Functions

###  buildLogicFn

▸ **buildLogicFn**(`parser`: [Parser](classes/parser.md), `typeConfig`: [TypeConfig](interfaces/typeconfig.md)): *function*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/index.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/index.ts#L13)*

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

###  buildRangeQueryString

▸ **buildRangeQueryString**(`node`: [Range](interfaces/range.md)): *string | undefined*

*Defined in [packages/xlucene-evaluator/src/utils.ts:72](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *string | undefined*

___

###  canFlattenBoolQuery

▸ **canFlattenBoolQuery**(`query`: i.BoolQuery, `flattenTo`: i.BoolQueryTypes): *boolean*

*Defined in [packages/xlucene-evaluator/src/translator/utils.ts:398](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/utils.ts#L398)*

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

*Defined in [packages/xlucene-evaluator/src/translator/utils.ts:408](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/utils.ts#L408)*

**Parameters:**

Name | Type |
------ | ------ |
`query?` | i.AnyQuery |

**Returns:** *i.AnyQuery | i.AnyQuery[]*

___

###  compareTermDates

▸ **compareTermDates**(`node`: [Term](interfaces/term.md)): *dateTerm*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts:13](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Term](interfaces/term.md) |

**Returns:** *dateTerm*

___

###  coordinateToXlucene

▸ **coordinateToXlucene**(`cord`: [CoordinateTuple](overview.md#coordinatetuple)): *string*

*Defined in [packages/xlucene-evaluator/src/utils.ts:234](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L234)*

**Parameters:**

Name | Type |
------ | ------ |
`cord` | [CoordinateTuple](overview.md#coordinatetuple) |

**Returns:** *string*

___

###  createJoinQuery

▸ **createJoinQuery**(`input`: AnyObject, `options`: [CreateJoinQueryOptions](overview.md#createjoinqueryoptions)): *[JoinQueryResult](interfaces/joinqueryresult.md)*

*Defined in [packages/xlucene-evaluator/src/utils.ts:313](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L313)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | AnyObject | - |
`options` | [CreateJoinQueryOptions](overview.md#createjoinqueryoptions) |  {} |

**Returns:** *[JoinQueryResult](interfaces/joinqueryresult.md)*

___

###  dateRange

▸ **dateRange**(`node`: [Range](interfaces/range.md)): *dateRangeTerm*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts:49](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/dates.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *dateRangeTerm*

___

###  findWildcardField

▸ **findWildcardField**(`field`: string, `cb`: [BooleanCB](overview.md#booleancb)): *WildcardField*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts:19](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`cb` | [BooleanCB](overview.md#booleancb) |

**Returns:** *WildcardField*

___

###  flattenQuery

▸ **flattenQuery**(`query`: i.AnyQuery | undefined, `flattenTo`: i.BoolQueryTypes): *i.AnyQuery[]*

*Defined in [packages/xlucene-evaluator/src/translator/utils.ts:386](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/utils.ts#L386)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | i.AnyQuery &#124; undefined |
`flattenTo` | i.BoolQueryTypes |

**Returns:** *i.AnyQuery[]*

___

###  geoBoundingBox

▸ **geoBoundingBox**(`node`: [GeoBoundingBox](interfaces/geoboundingbox.md)): *(Anonymous function)*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/geo.ts:39](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/geo.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [GeoBoundingBox](interfaces/geoboundingbox.md) |

**Returns:** *(Anonymous function)*

___

###  geoDistance

▸ **geoDistance**(`node`: [GeoDistance](interfaces/geodistance.md)): *(Anonymous function)*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/geo.ts:18](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/geo.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [GeoDistance](interfaces/geodistance.md) |

**Returns:** *(Anonymous function)*

___

###  getAnyValue

▸ **getAnyValue**(`node`: any): *any*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:81](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *any*

___

###  getField

▸ **getField**(`node`: any): *string | undefined*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:85](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *string | undefined*

___

###  getLonAndLat

▸ **getLonAndLat**(`input`: any, `throwInvalid`: boolean): *[number, number] | null*

*Defined in [packages/xlucene-evaluator/src/utils.ts:146](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L146)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`throwInvalid` | boolean | true |

**Returns:** *[number, number] | null*

___

###  getRelationFn

▸ **getRelationFn**(`relation`: [GeoShapeRelation](enums/geoshaperelation.md), `queryPolygon`: any): *(Anonymous function)*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:144](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L144)*

**Parameters:**

Name | Type |
------ | ------ |
`relation` | [GeoShapeRelation](enums/geoshaperelation.md) |
`queryPolygon` | any |

**Returns:** *(Anonymous function)*

___

###  getTermField

▸ **getTermField**(`node`: [TermLikeAST](interfaces/termlikeast.md)): *string*

*Defined in [packages/xlucene-evaluator/src/translator/utils.ts:382](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/utils.ts#L382)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [TermLikeAST](interfaces/termlikeast.md) |

**Returns:** *string*

___

###  ipRange

▸ **ipRange**(`node`: [Range](interfaces/range.md)): *checkIp*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/ip.ts:89](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/ip.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *checkIp*

___

###  ipTerm

▸ **ipTerm**(`node`: [Term](interfaces/term.md)): *checkIp*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/ip.ts:26](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/ip.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Term](interfaces/term.md) |

**Returns:** *checkIp*

___

###  isBoolQuery

▸ **isBoolQuery**(`query`: any): *query is i.BoolQuery*

*Defined in [packages/xlucene-evaluator/src/translator/utils.ts:404](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/utils.ts#L404)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | any |

**Returns:** *query is i.BoolQuery*

___

###  isBooleanDataType

▸ **isBooleanDataType**(`node`: any): *node is BooleanDataType*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:77](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is BooleanDataType*

___

###  isConjunction

▸ **isConjunction**(`node`: any): *node is Conjunction*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:15](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Conjunction*

___

###  isEmptyAST

▸ **isEmptyAST**(`node`: any): *node is EmptyAST*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:63](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is EmptyAST*

___

###  isExists

▸ **isExists**(`node`: any): *node is Exists*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:27](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Exists*

___

###  isFieldGroup

▸ **isFieldGroup**(`node`: any): *node is FieldGroup*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:23](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is FieldGroup*

___

###  isFunctionExpression

▸ **isFunctionExpression**(`node`: any): *node is FunctionNode*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:43](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is FunctionNode*

___

###  isGeoBoundingBox

▸ **isGeoBoundingBox**(`node`: any): *node is GeoBoundingBox*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:39](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is GeoBoundingBox*

___

###  isGeoDistance

▸ **isGeoDistance**(`node`: any): *node is GeoDistance*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:35](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is GeoDistance*

___

###  isGeoJSONData

▸ **isGeoJSONData**(`input`: any): *input is GeoShape*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:152](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is GeoShape*

___

###  isGeoShapeMultiPolygon

▸ **isGeoShapeMultiPolygon**(`shape`: JoinGeoShape): *shape is GeoShapeMultiPolygon*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:168](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L168)*

**Parameters:**

Name | Type |
------ | ------ |
`shape` | JoinGeoShape |

**Returns:** *shape is GeoShapeMultiPolygon*

___

###  isGeoShapePoint

▸ **isGeoShapePoint**(`shape`: JoinGeoShape): *shape is GeoShapePoint*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:160](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L160)*

**Parameters:**

Name | Type |
------ | ------ |
`shape` | JoinGeoShape |

**Returns:** *shape is GeoShapePoint*

___

###  isGeoShapePolygon

▸ **isGeoShapePolygon**(`shape`: JoinGeoShape): *shape is GeoShapePolygon*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:164](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L164)*

**Parameters:**

Name | Type |
------ | ------ |
`shape` | JoinGeoShape |

**Returns:** *shape is GeoShapePolygon*

___

###  isGroupLike

▸ **isGroupLike**(`node`: any): *node is GroupLikeAST*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:109](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is GroupLikeAST*

___

###  isInfiniteMax

▸ **isInfiniteMax**(`max?`: number | string): *boolean*

*Defined in [packages/xlucene-evaluator/src/utils.ts:40](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`max?` | number &#124; string |

**Returns:** *boolean*

___

###  isInfiniteMin

▸ **isInfiniteMin**(`min?`: number | string): *boolean*

*Defined in [packages/xlucene-evaluator/src/utils.ts:35](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`min?` | number &#124; string |

**Returns:** *boolean*

___

###  isInfiniteValue

▸ **isInfiniteValue**(`input?`: number | string): *boolean*

*Defined in [packages/xlucene-evaluator/src/utils.ts:31](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`input?` | number &#124; string |

**Returns:** *boolean*

___

###  isLogicalGroup

▸ **isLogicalGroup**(`node`: any): *node is LogicalGroup*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:11](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is LogicalGroup*

___

###  isMultiMatch

▸ **isMultiMatch**(`node`: [TermLikeAST](interfaces/termlikeast.md)): *boolean*

*Defined in [packages/xlucene-evaluator/src/translator/utils.ts:378](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/utils.ts#L378)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [TermLikeAST](interfaces/termlikeast.md) |

**Returns:** *boolean*

___

###  isNegation

▸ **isNegation**(`node`: any): *node is Negation*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:19](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Negation*

___

###  isNumberDataType

▸ **isNumberDataType**(`node`: any): *node is NumberDataType*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:73](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is NumberDataType*

___

###  isRange

▸ **isRange**(`node`: any): *node is Range*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:31](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Range*

___

###  isRegexp

▸ **isRegexp**(`node`: any): *node is Regexp*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:47](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Regexp*

___

###  isStringDataType

▸ **isStringDataType**(`node`: any): *node is StringDataType*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:67](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is StringDataType*

___

###  isTerm

▸ **isTerm**(`node`: any): *node is Term*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:59](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Term*

___

###  isTermType

▸ **isTermType**(`node`: any): *node is i.TermLike*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:102](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L102)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is i.TermLike*

___

###  isWildCardString

▸ **isWildCardString**(`term`: string): *boolean*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts:34](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *boolean*

___

###  isWildcard

▸ **isWildcard**(`node`: any): *node is Wildcard*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:51](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Wildcard*

___

###  isWildcardField

▸ **isWildcardField**(`node`: any): *boolean*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:55](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  makeBBox

▸ **makeBBox**(`point1`: [GeoPoint](interfaces/geopoint.md), `point2`: [GeoPoint](interfaces/geopoint.md)): *Feature‹Polygon, null | object›*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:49](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`point1` | [GeoPoint](interfaces/geopoint.md) |
`point2` | [GeoPoint](interfaces/geopoint.md) |

**Returns:** *Feature‹Polygon, null | object›*

___

###  makeCircle

▸ **makeCircle**(`point`: [GeoPoint](interfaces/geopoint.md), `distance`: number, `config`: any): *any*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:45](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPoint](interfaces/geopoint.md) |
`distance` | number |
`config` | any |

**Returns:** *any*

___

###  makeContext

▸ **makeContext**(`args`: any): *object*

*Defined in [packages/xlucene-evaluator/src/parser/context.ts:9](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/context.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`args` | any |

**Returns:** *object*

___

###  makeCoordinatesFromGeoPoint

▸ **makeCoordinatesFromGeoPoint**(`point`: [GeoPoint](interfaces/geopoint.md)): *[CoordinateTuple](overview.md#coordinatetuple)*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:148](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L148)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPoint](interfaces/geopoint.md) |

**Returns:** *[CoordinateTuple](overview.md#coordinatetuple)*

___

###  makeShape

▸ **makeShape**(`geoShape`: JoinGeoShape): *any*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:79](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`geoShape` | JoinGeoShape |

**Returns:** *any*

___

###  matchString

▸ **matchString**(`field`: any, `wildCardQuery`: string): *boolean*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts:41](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | any |
`wildCardQuery` | string |

**Returns:** *boolean*

___

###  parseGeoDistance

▸ **parseGeoDistance**(`str`: string): *[GeoDistanceObj](interfaces/geodistanceobj.md)*

*Defined in [packages/xlucene-evaluator/src/utils.ts:124](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L124)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[GeoDistanceObj](interfaces/geodistanceobj.md)*

___

###  parseGeoDistanceUnit

▸ **parseGeoDistanceUnit**(`input`: string): *[GeoDistanceUnit](overview.md#geodistanceunit)*

*Defined in [packages/xlucene-evaluator/src/utils.ts:137](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L137)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *[GeoDistanceUnit](overview.md#geodistanceunit)*

___

###  parseGeoPoint

▸ **parseGeoPoint**(`point`: [GeoPointInput](overview.md#geopointinput)): *[GeoPoint](interfaces/geopoint.md)*

*Defined in [packages/xlucene-evaluator/src/utils.ts:168](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L168)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) |

**Returns:** *[GeoPoint](interfaces/geopoint.md)*

▸ **parseGeoPoint**(`point`: [GeoPointInput](overview.md#geopointinput), `throwInvalid`: true): *[GeoPoint](interfaces/geopoint.md)*

*Defined in [packages/xlucene-evaluator/src/utils.ts:169](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L169)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) |
`throwInvalid` | true |

**Returns:** *[GeoPoint](interfaces/geopoint.md)*

▸ **parseGeoPoint**(`point`: [GeoPointInput](overview.md#geopointinput), `throwInvalid`: false): *[GeoPoint](interfaces/geopoint.md) | null*

*Defined in [packages/xlucene-evaluator/src/utils.ts:170](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L170)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) |
`throwInvalid` | false |

**Returns:** *[GeoPoint](interfaces/geopoint.md) | null*

___

###  parseRange

▸ **parseRange**(`node`: [Range](interfaces/range.md), `excludeInfinite`: boolean): *[ParsedRange](interfaces/parsedrange.md)*

*Defined in [packages/xlucene-evaluator/src/utils.ts:52](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L52)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`node` | [Range](interfaces/range.md) | - |
`excludeInfinite` | boolean | false |

**Returns:** *[ParsedRange](interfaces/parsedrange.md)*

___

###  parseWildCard

▸ **parseWildCard**(`term`: string): *string*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts:27](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *string*

___

###  pointInGeoShape

▸ **pointInGeoShape**(`searchPoint`: any): *(Anonymous function)*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:59](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`searchPoint` | any |

**Returns:** *(Anonymous function)*

___

###  polyHasPoint

▸ **polyHasPoint**(`polygon`: any): *(Anonymous function)*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:37](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`polygon` | any |

**Returns:** *(Anonymous function)*

___

###  polyHasShape

▸ **polyHasShape**(`queryPolygon`: any, `relation`: [GeoShapeRelation](enums/geoshaperelation.md)): *(Anonymous function)*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:103](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L103)*

**Parameters:**

Name | Type |
------ | ------ |
`queryPolygon` | any |
`relation` | [GeoShapeRelation](enums/geoshaperelation.md) |

**Returns:** *(Anonymous function)*

___

###  regexp

▸ **regexp**(`term`: string): *regexpTerm*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts:4](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *regexpTerm*

___

###  translateQuery

▸ **translateQuery**(`parser`: [Parser](classes/parser.md), `options`: i.UtilsTranslateQueryOptions): *i.ElasticsearchDSLResult*

*Defined in [packages/xlucene-evaluator/src/translator/utils.ts:20](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/translator/utils.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`parser` | [Parser](classes/parser.md) |
`options` | i.UtilsTranslateQueryOptions |

**Returns:** *i.ElasticsearchDSLResult*

___

###  validateListCoords

▸ **validateListCoords**(`coords`: [CoordinateTuple](overview.md#coordinatetuple)[]): *any[]*

*Defined in [packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts:96](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/functions/geo/helpers.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`coords` | [CoordinateTuple](overview.md#coordinatetuple)[] |

**Returns:** *any[]*

___

###  validateVariables

▸ **validateVariables**(`obj`: [Variables](interfaces/variables.md)): *[Variables](interfaces/variables.md)*

*Defined in [packages/xlucene-evaluator/src/parser/utils.ts:113](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/parser/utils.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | [Variables](interfaces/variables.md) |

**Returns:** *[Variables](interfaces/variables.md)*

___

###  wildcard

▸ **wildcard**(`term`: string): *wildcardTerm*

*Defined in [packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts:11](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/document-matcher/logic-builder/string.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`term` | string |

**Returns:** *wildcardTerm*

## Object literals

### `Const` GEO_DISTANCE_UNITS

### ▪ **GEO_DISTANCE_UNITS**: *object*

*Defined in [packages/xlucene-evaluator/src/utils.ts:94](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L94)*

###  NM

• **NM**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [packages/xlucene-evaluator/src/utils.ts:98](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L98)*

###  centimeter

• **centimeter**: *"centimeters"* = "centimeters"

*Defined in [packages/xlucene-evaluator/src/utils.ts:118](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L118)*

###  centimeters

• **centimeters**: *"centimeters"* = "centimeters"

*Defined in [packages/xlucene-evaluator/src/utils.ts:119](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L119)*

###  cm

• **cm**: *"centimeters"* = "centimeters"

*Defined in [packages/xlucene-evaluator/src/utils.ts:117](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L117)*

###  feet

• **feet**: *"feet"* = "feet"

*Defined in [packages/xlucene-evaluator/src/utils.ts:121](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L121)*

###  ft

• **ft**: *"feet"* = "feet"

*Defined in [packages/xlucene-evaluator/src/utils.ts:120](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L120)*

###  in

• **in**: *"inch"* = "inch"

*Defined in [packages/xlucene-evaluator/src/utils.ts:102](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L102)*

###  inch

• **inch**: *"inch"* = "inch"

*Defined in [packages/xlucene-evaluator/src/utils.ts:103](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L103)*

###  inches

• **inches**: *"inch"* = "inch"

*Defined in [packages/xlucene-evaluator/src/utils.ts:104](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L104)*

###  kilometer

• **kilometer**: *"kilometers"* = "kilometers"

*Defined in [packages/xlucene-evaluator/src/utils.ts:112](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L112)*

###  kilometers

• **kilometers**: *"kilometers"* = "kilometers"

*Defined in [packages/xlucene-evaluator/src/utils.ts:113](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L113)*

###  km

• **km**: *"kilometers"* = "kilometers"

*Defined in [packages/xlucene-evaluator/src/utils.ts:111](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L111)*

###  m

• **m**: *"meters"* = "meters"

*Defined in [packages/xlucene-evaluator/src/utils.ts:108](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L108)*

###  meter

• **meter**: *"meters"* = "meters"

*Defined in [packages/xlucene-evaluator/src/utils.ts:109](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L109)*

###  meters

• **meters**: *"meters"* = "meters"

*Defined in [packages/xlucene-evaluator/src/utils.ts:110](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L110)*

###  mi

• **mi**: *"miles"* = "miles"

*Defined in [packages/xlucene-evaluator/src/utils.ts:95](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L95)*

###  mile

• **mile**: *"miles"* = "miles"

*Defined in [packages/xlucene-evaluator/src/utils.ts:97](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L97)*

###  miles

• **miles**: *"miles"* = "miles"

*Defined in [packages/xlucene-evaluator/src/utils.ts:96](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L96)*

###  millimeter

• **millimeter**: *"millimeters"* = "millimeters"

*Defined in [packages/xlucene-evaluator/src/utils.ts:115](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L115)*

###  millimeters

• **millimeters**: *"millimeters"* = "millimeters"

*Defined in [packages/xlucene-evaluator/src/utils.ts:116](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L116)*

###  mm

• **mm**: *"millimeters"* = "millimeters"

*Defined in [packages/xlucene-evaluator/src/utils.ts:114](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L114)*

###  nauticalmile

• **nauticalmile**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [packages/xlucene-evaluator/src/utils.ts:100](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L100)*

###  nauticalmiles

• **nauticalmiles**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [packages/xlucene-evaluator/src/utils.ts:101](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L101)*

###  nmi

• **nmi**: *"nauticalmiles"* = "nauticalmiles"

*Defined in [packages/xlucene-evaluator/src/utils.ts:99](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L99)*

###  yard

• **yard**: *"yards"* = "yards"

*Defined in [packages/xlucene-evaluator/src/utils.ts:106](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L106)*

###  yards

• **yards**: *"yards"* = "yards"

*Defined in [packages/xlucene-evaluator/src/utils.ts:107](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L107)*

###  yd

• **yd**: *"yards"* = "yards"

*Defined in [packages/xlucene-evaluator/src/utils.ts:105](https://github.com/terascope/teraslice/blob/78714a985/packages/xlucene-evaluator/src/utils.ts#L105)*
