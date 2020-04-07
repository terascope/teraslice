---
title: xLucene Parser API Overview
sidebar_label: API
---

## Index

### Enumerations

* [ASTType](enums/asttype.md)

### Classes

* [CachedParser](classes/cachedparser.md)
* [Parser](classes/parser.md)
* [SyntaxError](classes/syntaxerror.md)

### Interfaces

* [AnyDataType](interfaces/anydatatype.md)
* [BooleanDataType](interfaces/booleandatatype.md)
* [Conjunction](interfaces/conjunction.md)
* [EmptyAST](interfaces/emptyast.md)
* [Exists](interfaces/exists.md)
* [FieldGroup](interfaces/fieldgroup.md)
* [FunctionConfig](interfaces/functionconfig.md)
* [FunctionDefinition](interfaces/functiondefinition.md)
* [FunctionMethods](interfaces/functionmethods.md)
* [FunctionMethodsResults](interfaces/functionmethodsresults.md)
* [FunctionNode](interfaces/functionnode.md)
* [GeoBoundingBox](interfaces/geoboundingbox.md)
* [GeoDistance](interfaces/geodistance.md)
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
* [Negation](interfaces/negation.md)
* [NumberDataType](interfaces/numberdatatype.md)
* [ParsedRange](interfaces/parsedrange.md)
* [ParserOptions](interfaces/parseroptions.md)
* [Range](interfaces/range.md)
* [RangeNode](interfaces/rangenode.md)
* [Regexp](interfaces/regexp.md)
* [StringDataType](interfaces/stringdatatype.md)
* [Term](interfaces/term.md)
* [TermLikeAST](interfaces/termlikeast.md)
* [Wildcard](interfaces/wildcard.md)

### Type aliases

* [AST](overview.md#ast)
* [AnyAST](overview.md#anyast)
* [Expectation](overview.md#expectation)
* [Field](overview.md#field)
* [FunctionElasticsearchOptions](overview.md#functionelasticsearchoptions)
* [GroupLike](overview.md#grouplike)
* [GroupLikeType](overview.md#groupliketype)
* [ParseFunction](overview.md#parsefunction)
* [RangeOperator](overview.md#rangeoperator)
* [TermLike](overview.md#termlike)
* [TermLikeType](overview.md#termliketype)

### Variables

* [groupTypes](overview.md#const-grouptypes)
* [numberDataTypes](overview.md#const-numberdatatypes)
* [parse](overview.md#const-parse)
* [termTypes](overview.md#const-termtypes)

### Functions

* [buildRangeQueryString](overview.md#buildrangequerystring)
* [coordinateToXlucene](overview.md#coordinatetoxlucene)
* [getAnyValue](overview.md#getanyvalue)
* [getField](overview.md#getfield)
* [getRelationFn](overview.md#getrelationfn)
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
* [isNegation](overview.md#isnegation)
* [isNumberDataType](overview.md#isnumberdatatype)
* [isRange](overview.md#isrange)
* [isRegexp](overview.md#isregexp)
* [isStringDataType](overview.md#isstringdatatype)
* [isTerm](overview.md#isterm)
* [isTermType](overview.md#istermtype)
* [isWildcard](overview.md#iswildcard)
* [isWildcardField](overview.md#iswildcardfield)
* [makeBBox](overview.md#makebbox)
* [makeCircle](overview.md#makecircle)
* [makeContext](overview.md#makecontext)
* [makeCoordinatesFromGeoPoint](overview.md#makecoordinatesfromgeopoint)
* [makeShape](overview.md#makeshape)
* [parseRange](overview.md#parserange)
* [pointInGeoShape](overview.md#pointingeoshape)
* [polyHasPoint](overview.md#polyhaspoint)
* [polyHasShape](overview.md#polyhasshape)
* [validateListCoords](overview.md#validatelistcoords)
* [validateVariables](overview.md#validatevariables)

## Type aliases

###  AST

Ƭ **AST**: *[EmptyAST](interfaces/emptyast.md) & [LogicalGroup](interfaces/logicalgroup.md) & [Term](interfaces/term.md) & [Conjunction](interfaces/conjunction.md) & [Negation](interfaces/negation.md) & [FieldGroup](interfaces/fieldgroup.md) & [Exists](interfaces/exists.md) & [Range](interfaces/range.md) & [GeoDistance](interfaces/geodistance.md) & [GeoBoundingBox](interfaces/geoboundingbox.md) & [Regexp](interfaces/regexp.md) & [Wildcard](interfaces/wildcard.md) & [FunctionNode](interfaces/functionnode.md)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:10](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L10)*

___

###  AnyAST

Ƭ **AnyAST**: *[EmptyAST](interfaces/emptyast.md) | [LogicalGroup](interfaces/logicalgroup.md) | [Term](interfaces/term.md) | [Conjunction](interfaces/conjunction.md) | [Negation](interfaces/negation.md) | [FieldGroup](interfaces/fieldgroup.md) | [Exists](interfaces/exists.md) | [Range](interfaces/range.md) | [GeoDistance](interfaces/geodistance.md) | [GeoBoundingBox](interfaces/geoboundingbox.md) | [Regexp](interfaces/regexp.md) | [Wildcard](interfaces/wildcard.md) | [FunctionNode](interfaces/functionnode.md)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:15](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L15)*

___

###  Expectation

Ƭ **Expectation**: *[ILiteralExpectation](interfaces/iliteralexpectation.md) | [IClassExpectation](interfaces/iclassexpectation.md) | [IAnyExpectation](interfaces/ianyexpectation.md) | [IEndExpectation](interfaces/iendexpectation.md) | [IOtherExpectation](interfaces/iotherexpectation.md)*

Defined in packages/xlucene-parser/src/peg-engine.ts:50

___

###  Field

Ƭ **Field**: *string | null*

*Defined in [packages/xlucene-parser/src/interfaces.ts:64](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L64)*

___

###  FunctionElasticsearchOptions

Ƭ **FunctionElasticsearchOptions**: *object & Record‹string, any›*

*Defined in [packages/xlucene-parser/src/interfaces.ts:181](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L181)*

___

###  GroupLike

Ƭ **GroupLike**: *[FieldGroup](interfaces/fieldgroup.md) | [LogicalGroup](interfaces/logicalgroup.md)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:20](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L20)*

___

###  GroupLikeType

Ƭ **GroupLikeType**: *[LogicalGroup](enums/asttype.md#logicalgroup) | [FieldGroup](enums/asttype.md#fieldgroup)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:21](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L21)*

___

###  ParseFunction

Ƭ **ParseFunction**: *function*

Defined in packages/xlucene-parser/src/peg-engine.ts:5630

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

*Defined in [packages/xlucene-parser/src/interfaces.ts:116](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L116)*

___

###  TermLike

Ƭ **TermLike**: *[Term](interfaces/term.md) | [Regexp](interfaces/regexp.md) | [Range](interfaces/range.md) | [Wildcard](interfaces/wildcard.md) | [GeoBoundingBox](interfaces/geoboundingbox.md) | [GeoDistance](interfaces/geodistance.md) | [FunctionNode](interfaces/functionnode.md)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:28](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L28)*

___

###  TermLikeType

Ƭ **TermLikeType**: *[Term](enums/asttype.md#term) | [Regexp](enums/asttype.md#regexp) | [Range](enums/asttype.md#range) | [Wildcard](enums/asttype.md#wildcard) | [GeoBoundingBox](enums/asttype.md#geoboundingbox) | [GeoDistance](enums/asttype.md#geodistance) | [Function](enums/asttype.md#function)*

*Defined in [packages/xlucene-parser/src/interfaces.ts:29](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/interfaces.ts#L29)*

## Variables

### `Const` groupTypes

• **groupTypes**: *[ASTType](enums/asttype.md)[]* =  [i.ASTType.LogicalGroup, i.ASTType.FieldGroup]

*Defined in [packages/xlucene-parser/src/utils.ts:109](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L109)*

logical group or field group with flow

___

### `Const` numberDataTypes

• **numberDataTypes**: *xLuceneFieldType[]* =  [
    xLuceneFieldType.Integer, xLuceneFieldType.Float
]

*Defined in [packages/xlucene-parser/src/utils.ts:71](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L71)*

___

### `Const` parse

• **parse**: *[ParseFunction](overview.md#parsefunction)* =  peg$parse

Defined in packages/xlucene-parser/src/peg-engine.ts:5631

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

*Defined in [packages/xlucene-parser/src/utils.ts:94](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L94)*

term level queries with field (string|null)

## Functions

###  buildRangeQueryString

▸ **buildRangeQueryString**(`node`: [Range](interfaces/range.md)): *string | undefined*

*Defined in [packages/xlucene-parser/src/utils.ts:161](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L161)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | [Range](interfaces/range.md) |

**Returns:** *string | undefined*

___

###  coordinateToXlucene

▸ **coordinateToXlucene**(`cord`: CoordinateTuple): *string*

*Defined in [packages/xlucene-parser/src/utils.ts:183](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L183)*

**Parameters:**

Name | Type |
------ | ------ |
`cord` | CoordinateTuple |

**Returns:** *string*

___

###  getAnyValue

▸ **getAnyValue**(`node`: any): *any*

*Defined in [packages/xlucene-parser/src/utils.ts:83](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *any*

___

###  getField

▸ **getField**(`node`: any): *string | undefined*

*Defined in [packages/xlucene-parser/src/utils.ts:87](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *string | undefined*

___

###  getRelationFn

▸ **getRelationFn**(`relation`: GeoShapeRelation, `queryPolygon`: any): *(Anonymous function)*

*Defined in [packages/xlucene-parser/src/functions/geo/helpers.ts:144](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/functions/geo/helpers.ts#L144)*

**Parameters:**

Name | Type |
------ | ------ |
`relation` | GeoShapeRelation |
`queryPolygon` | any |

**Returns:** *(Anonymous function)*

___

###  isBooleanDataType

▸ **isBooleanDataType**(`node`: any): *node is BooleanDataType*

*Defined in [packages/xlucene-parser/src/utils.ts:79](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is BooleanDataType*

___

###  isConjunction

▸ **isConjunction**(`node`: any): *node is Conjunction*

*Defined in [packages/xlucene-parser/src/utils.ts:15](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Conjunction*

___

###  isEmptyAST

▸ **isEmptyAST**(`node`: any): *node is EmptyAST*

*Defined in [packages/xlucene-parser/src/utils.ts:63](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is EmptyAST*

___

###  isExists

▸ **isExists**(`node`: any): *node is Exists*

*Defined in [packages/xlucene-parser/src/utils.ts:27](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Exists*

___

###  isFieldGroup

▸ **isFieldGroup**(`node`: any): *node is FieldGroup*

*Defined in [packages/xlucene-parser/src/utils.ts:23](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is FieldGroup*

___

###  isFunctionExpression

▸ **isFunctionExpression**(`node`: any): *node is FunctionNode*

*Defined in [packages/xlucene-parser/src/utils.ts:43](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is FunctionNode*

___

###  isGeoBoundingBox

▸ **isGeoBoundingBox**(`node`: any): *node is GeoBoundingBox*

*Defined in [packages/xlucene-parser/src/utils.ts:39](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is GeoBoundingBox*

___

###  isGeoDistance

▸ **isGeoDistance**(`node`: any): *node is GeoDistance*

*Defined in [packages/xlucene-parser/src/utils.ts:35](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is GeoDistance*

___

###  isGroupLike

▸ **isGroupLike**(`node`: any): *node is GroupLikeAST*

*Defined in [packages/xlucene-parser/src/utils.ts:111](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L111)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is GroupLikeAST*

___

###  isInfiniteMax

▸ **isInfiniteMax**(`max?`: number | string): *boolean*

*Defined in [packages/xlucene-parser/src/utils.ts:129](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L129)*

**Parameters:**

Name | Type |
------ | ------ |
`max?` | number &#124; string |

**Returns:** *boolean*

___

###  isInfiniteMin

▸ **isInfiniteMin**(`min?`: number | string): *boolean*

*Defined in [packages/xlucene-parser/src/utils.ts:124](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L124)*

**Parameters:**

Name | Type |
------ | ------ |
`min?` | number &#124; string |

**Returns:** *boolean*

___

###  isInfiniteValue

▸ **isInfiniteValue**(`input?`: number | string): *boolean*

*Defined in [packages/xlucene-parser/src/utils.ts:120](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`input?` | number &#124; string |

**Returns:** *boolean*

___

###  isLogicalGroup

▸ **isLogicalGroup**(`node`: any): *node is LogicalGroup*

*Defined in [packages/xlucene-parser/src/utils.ts:11](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is LogicalGroup*

___

###  isNegation

▸ **isNegation**(`node`: any): *node is Negation*

*Defined in [packages/xlucene-parser/src/utils.ts:19](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Negation*

___

###  isNumberDataType

▸ **isNumberDataType**(`node`: any): *node is NumberDataType*

*Defined in [packages/xlucene-parser/src/utils.ts:75](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is NumberDataType*

___

###  isRange

▸ **isRange**(`node`: any): *node is Range*

*Defined in [packages/xlucene-parser/src/utils.ts:31](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Range*

___

###  isRegexp

▸ **isRegexp**(`node`: any): *node is Regexp*

*Defined in [packages/xlucene-parser/src/utils.ts:47](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Regexp*

___

###  isStringDataType

▸ **isStringDataType**(`node`: any): *node is StringDataType*

*Defined in [packages/xlucene-parser/src/utils.ts:67](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is StringDataType*

___

###  isTerm

▸ **isTerm**(`node`: any): *node is Term*

*Defined in [packages/xlucene-parser/src/utils.ts:59](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Term*

___

###  isTermType

▸ **isTermType**(`node`: any): *node is i.TermLike*

*Defined in [packages/xlucene-parser/src/utils.ts:104](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is i.TermLike*

___

###  isWildcard

▸ **isWildcard**(`node`: any): *node is Wildcard*

*Defined in [packages/xlucene-parser/src/utils.ts:51](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *node is Wildcard*

___

###  isWildcardField

▸ **isWildcardField**(`node`: any): *boolean*

*Defined in [packages/xlucene-parser/src/utils.ts:55](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | any |

**Returns:** *boolean*

___

###  makeBBox

▸ **makeBBox**(`point1`: GeoPoint, `point2`: GeoPoint): *Feature‹Polygon, null | object›*

*Defined in [packages/xlucene-parser/src/functions/geo/helpers.ts:49](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/functions/geo/helpers.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`point1` | GeoPoint |
`point2` | GeoPoint |

**Returns:** *Feature‹Polygon, null | object›*

___

###  makeCircle

▸ **makeCircle**(`point`: GeoPoint, `distance`: number, `config`: any): *any*

*Defined in [packages/xlucene-parser/src/functions/geo/helpers.ts:45](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/functions/geo/helpers.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | GeoPoint |
`distance` | number |
`config` | any |

**Returns:** *any*

___

###  makeContext

▸ **makeContext**(`args`: any): *object*

*Defined in [packages/xlucene-parser/src/context.ts:22](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/context.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`args` | any |

**Returns:** *object*

___

###  makeCoordinatesFromGeoPoint

▸ **makeCoordinatesFromGeoPoint**(`point`: GeoPoint): *CoordinateTuple*

*Defined in [packages/xlucene-parser/src/functions/geo/helpers.ts:148](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/functions/geo/helpers.ts#L148)*

**Parameters:**

Name | Type |
------ | ------ |
`point` | GeoPoint |

**Returns:** *CoordinateTuple*

___

###  makeShape

▸ **makeShape**(`geoShape`: JoinGeoShape): *any*

*Defined in [packages/xlucene-parser/src/functions/geo/helpers.ts:79](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/functions/geo/helpers.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`geoShape` | JoinGeoShape |

**Returns:** *any*

___

###  parseRange

▸ **parseRange**(`node`: [Range](interfaces/range.md), `excludeInfinite`: boolean): *[ParsedRange](interfaces/parsedrange.md)*

*Defined in [packages/xlucene-parser/src/utils.ts:141](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L141)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`node` | [Range](interfaces/range.md) | - |
`excludeInfinite` | boolean | false |

**Returns:** *[ParsedRange](interfaces/parsedrange.md)*

___

###  pointInGeoShape

▸ **pointInGeoShape**(`searchPoint`: any): *(Anonymous function)*

*Defined in [packages/xlucene-parser/src/functions/geo/helpers.ts:59](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/functions/geo/helpers.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`searchPoint` | any |

**Returns:** *(Anonymous function)*

___

###  polyHasPoint

▸ **polyHasPoint**(`polygon`: any): *(Anonymous function)*

*Defined in [packages/xlucene-parser/src/functions/geo/helpers.ts:37](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/functions/geo/helpers.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`polygon` | any |

**Returns:** *(Anonymous function)*

___

###  polyHasShape

▸ **polyHasShape**(`queryPolygon`: any, `relation`: GeoShapeRelation): *(Anonymous function)*

*Defined in [packages/xlucene-parser/src/functions/geo/helpers.ts:103](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/functions/geo/helpers.ts#L103)*

**Parameters:**

Name | Type |
------ | ------ |
`queryPolygon` | any |
`relation` | GeoShapeRelation |

**Returns:** *(Anonymous function)*

___

###  validateListCoords

▸ **validateListCoords**(`coords`: CoordinateTuple[]): *any[]*

*Defined in [packages/xlucene-parser/src/functions/geo/helpers.ts:96](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/functions/geo/helpers.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`coords` | CoordinateTuple[] |

**Returns:** *any[]*

___

###  validateVariables

▸ **validateVariables**(`obj`: xLuceneVariables): *xLuceneVariables*

*Defined in [packages/xlucene-parser/src/utils.ts:115](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-parser/src/utils.ts#L115)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | xLuceneVariables |

**Returns:** *xLuceneVariables*
