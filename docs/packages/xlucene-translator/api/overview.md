---
title: xLucene Translator API Overview
sidebar_label: API
---

## Index

### Classes

* [CachedQueryAccess](classes/cachedqueryaccess.md)
* [CachedTranslator](classes/cachedtranslator.md)
* [QueryAccess](classes/queryaccess.md)
* [Translator](classes/translator.md)

### Interfaces

* [QueryAccessConfig](interfaces/queryaccessconfig.md)
* [QueryAccessOptions](interfaces/queryaccessoptions.md)
* [RestrictOptions](interfaces/restrictoptions.md)
* [RestrictSearchQueryOptions](interfaces/restrictsearchqueryoptions.md)

### Type aliases

* [TranslatorOptions](overview.md#translatoroptions)
* [UtilsTranslateQueryOptions](overview.md#utilstranslatequeryoptions)

### Functions

* [canFlattenBoolQuery](overview.md#canflattenboolquery)
* [compactFinalQuery](overview.md#compactfinalquery)
* [flattenQuery](overview.md#flattenquery)
* [getTermField](overview.md#gettermfield)
* [isBoolQuery](overview.md#isboolquery)
* [isMultiMatch](overview.md#ismultimatch)
* [translateQuery](overview.md#translatequery)

## Type aliases

###  TranslatorOptions

Ƭ **TranslatorOptions**: *object*

*Defined in [xlucene-translator/src/translator/interfaces.ts:10](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/interfaces.ts#L10)*

#### Type declaration:

___

###  UtilsTranslateQueryOptions

Ƭ **UtilsTranslateQueryOptions**: *object*

*Defined in [xlucene-translator/src/translator/interfaces.ts:19](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/interfaces.ts#L19)*

#### Type declaration:

## Functions

###  canFlattenBoolQuery

▸ **canFlattenBoolQuery**(`query`: i.BoolQuery, `flattenTo`: i.BoolQueryTypes): *boolean*

*Defined in [xlucene-translator/src/translator/utils.ts:421](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/utils.ts#L421)*

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

*Defined in [xlucene-translator/src/translator/utils.ts:431](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/utils.ts#L431)*

**Parameters:**

Name | Type |
------ | ------ |
`query?` | i.AnyQuery |

**Returns:** *i.AnyQuery | i.AnyQuery[]*

___

###  flattenQuery

▸ **flattenQuery**(`query`: i.AnyQuery | undefined, `flattenTo`: i.BoolQueryTypes): *i.AnyQuery[]*

*Defined in [xlucene-translator/src/translator/utils.ts:409](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/utils.ts#L409)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | i.AnyQuery &#124; undefined |
`flattenTo` | i.BoolQueryTypes |

**Returns:** *i.AnyQuery[]*

___

###  getTermField

▸ **getTermField**(`node`: TermLikeAST): *string*

*Defined in [xlucene-translator/src/translator/utils.ts:405](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/utils.ts#L405)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | TermLikeAST |

**Returns:** *string*

___

###  isBoolQuery

▸ **isBoolQuery**(`query`: any): *query is i.BoolQuery*

*Defined in [xlucene-translator/src/translator/utils.ts:427](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/utils.ts#L427)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | any |

**Returns:** *query is i.BoolQuery*

___

###  isMultiMatch

▸ **isMultiMatch**(`node`: TermLikeAST): *boolean*

*Defined in [xlucene-translator/src/translator/utils.ts:401](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/utils.ts#L401)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | TermLikeAST |

**Returns:** *boolean*

___

###  translateQuery

▸ **translateQuery**(`parser`: Parser, `options`: [UtilsTranslateQueryOptions](overview.md#utilstranslatequeryoptions)): *i.ElasticsearchDSLResult*

*Defined in [xlucene-translator/src/translator/utils.ts:27](https://github.com/terascope/teraslice/blob/f95bb5556/packages/xlucene-translator/src/translator/utils.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`parser` | Parser |
`options` | [UtilsTranslateQueryOptions](overview.md#utilstranslatequeryoptions) |

**Returns:** *i.ElasticsearchDSLResult*
