---
title: Data Access: `SearchAccess`
sidebar_label: SearchAccess
---

# Class: SearchAccess

Using a DataAccess ACL, limit queries to
specific fields and records

## Hierarchy

* **SearchAccess**

## Index

### Constructors

* [constructor](searchaccess.md#constructor)

### Properties

* [config](searchaccess.md#config)
* [spaceConfig](searchaccess.md#spaceconfig)

### Methods

* [getSearchParams](searchaccess.md#private-getsearchparams)
* [getSearchResponse](searchaccess.md#getsearchresponse)
* [performSearch](searchaccess.md#performsearch)
* [restrictSearchQuery](searchaccess.md#restrictsearchquery)

## Constructors

###  constructor

\+ **new SearchAccess**(`config`: [DataAccessConfig](../interfaces/dataaccessconfig.md), `logger`: `Logger`): *[SearchAccess](searchaccess.md)*

*Defined in [search-access.ts:19](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-access/src/search-access.ts#L19)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`config` | [DataAccessConfig](../interfaces/dataaccessconfig.md) | - |
`logger` | `Logger` |  _logger |

**Returns:** *[SearchAccess](searchaccess.md)*

## Properties

###  config

• **config**: *[DataAccessConfig](../interfaces/dataaccessconfig.md)*

*Defined in [search-access.ts:16](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-access/src/search-access.ts#L16)*

___

###  spaceConfig

• **spaceConfig**: *[SpaceSearchConfig](../interfaces/spacesearchconfig.md)*

*Defined in [search-access.ts:17](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-access/src/search-access.ts#L17)*

## Methods

### `Private` getSearchParams

▸ **getSearchParams**(`query`: [InputQuery](../interfaces/inputquery.md)): *`SearchParams`*

*Defined in [search-access.ts:90](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-access/src/search-access.ts#L90)*

Validate and get elasticsearch search request parameters

**Parameters:**

Name | Type |
------ | ------ |
`query` | [InputQuery](../interfaces/inputquery.md) |

**Returns:** *`SearchParams`*

___

###  getSearchResponse

▸ **getSearchResponse**(`response`: `SearchResponse<any>`, `query`: [InputQuery](../interfaces/inputquery.md), `params`: `SearchParams`): *object*

*Defined in [search-access.ts:185](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-access/src/search-access.ts#L185)*

Format the results or error from the performSearch

**Parameters:**

Name | Type |
------ | ------ |
`response` | `SearchResponse<any>` |
`query` | [InputQuery](../interfaces/inputquery.md) |
`params` | `SearchParams` |

**Returns:** *object*

___

###  performSearch

▸ **performSearch**(`client`: `Client`, `query`: [InputQuery](../interfaces/inputquery.md)): *`Promise<object>`*

*Defined in [search-access.ts:54](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-access/src/search-access.ts#L54)*

Safely search a space given an elasticsearch client and a valid query

**Parameters:**

Name | Type |
------ | ------ |
`client` | `Client` |
`query` | [InputQuery](../interfaces/inputquery.md) |

**Returns:** *`Promise<object>`*

___

###  restrictSearchQuery

▸ **restrictSearchQuery**(`query?`: undefined | string, `params?`: `es.SearchParams`, `esVersion`: number): *`SearchParams`*

*Defined in [search-access.ts:47](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/data-access/src/search-access.ts#L47)*

Converts a restricted xlucene query to an elasticsearch search query

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`query?` | undefined \| string | - |
`params?` | `es.SearchParams` | - |
`esVersion` | number | 6 |

**Returns:** *`SearchParams`*
