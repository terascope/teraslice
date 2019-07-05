---
title: Elasticsearch Store API Overview
sidebar_label: API
---

#### Classes

* [Cluster](classes/cluster.md)
* [IndexManager](classes/indexmanager.md)
* [IndexModel](classes/indexmodel.md)
* [IndexStore](classes/indexstore.md)

#### Interfaces

* [BulkResponse](interfaces/bulkresponse.md)
* [BulkResponseItem](interfaces/bulkresponseitem.md)
* [DataSchema](interfaces/dataschema.md)
* [IndexConfig](interfaces/indexconfig.md)
* [IndexModelConfig](interfaces/indexmodelconfig.md)
* [IndexModelOptions](interfaces/indexmodeloptions.md)
* [IndexModelRecord](interfaces/indexmodelrecord.md)
* [IndexSchema](interfaces/indexschema.md)
* [IndexSettings](interfaces/indexsettings.md)
* [MigrateIndexConfig](interfaces/migrateindexconfig.md)

#### Type aliases

* [AsyncFn](overview.md#asyncfn)
* [BulkAction](overview.md#bulkaction)
* [BulkResponseItems](overview.md#bulkresponseitems)
* [CreateRecordInput](overview.md#createrecordinput)
* [ErrorLike](overview.md#errorlike)
* [FindOneOptions](overview.md#findoneoptions)
* [FindOptions](overview.md#findoptions)
* [SanitizeFields](overview.md#sanitizefields)
* [Shard](overview.md#shard)
* [TimeSeriesFormat](overview.md#timeseriesformat)
* [UpdateRecordInput](overview.md#updaterecordinput)

#### Variables

* [MAX_RETRIES](overview.md#const-max_retries)
* [RETRY_DELAY](overview.md#const-retry_delay)
* [buildNestPath](overview.md#const-buildnestpath)
* [formatIndexName](overview.md#const-formatindexname)
* [getDataVersion](overview.md#const-getdataversion)
* [getDataVersionStr](overview.md#const-getdataversionstr)
* [getErrorMessages](overview.md#const-geterrormessages)
* [getErrorType](overview.md#const-geterrortype)
* [getFirstKey](overview.md#const-getfirstkey)
* [getFirstValue](overview.md#const-getfirstvalue)
* [getIndexMapping](overview.md#const-getindexmapping)
* [getRolloverFrequency](overview.md#const-getrolloverfrequency)
* [getSchemaVersion](overview.md#const-getschemaversion)
* [getSchemaVersionStr](overview.md#const-getschemaversionstr)
* [getStatusCode](overview.md#const-getstatuscode)
* [isSimpleIndex](overview.md#const-issimpleindex)
* [isTemplatedIndex](overview.md#const-istemplatedindex)
* [isTimeSeriesIndex](overview.md#const-istimeseriesindex)
* [verifyIndexShards](overview.md#const-verifyindexshards)

#### Functions

* [addDefaultMapping](overview.md#adddefaultmapping)
* [addDefaultSchema](overview.md#adddefaultschema)
* [filterBulkRetries](overview.md#filterbulkretries)
* [getBulkResponseItem](overview.md#getbulkresponseitem)
* [getErrorMessage](overview.md#geterrormessage)
* [getRetryConfig](overview.md#getretryconfig)
* [getTimeByField](overview.md#gettimebyfield)
* [getTypesFromProperties](overview.md#gettypesfromproperties)
* [getXLuceneTypesFromMapping](overview.md#getxlucenetypesfrommapping)
* [getXluceneTypeFromESType](overview.md#getxlucenetypefromestype)
* [isNotNil](overview.md#const-isnotnil)
* [isValidClient](overview.md#isvalidclient)
* [isValidName](overview.md#isvalidname)
* [isValidNamespace](overview.md#isvalidnamespace)
* [makeId](overview.md#makeid)
* [mergeDefaults](overview.md#mergedefaults)
* [shardsPath](overview.md#shardspath)
* [throwValidationError](overview.md#throwvalidationerror)
* [timeseriesIndex](overview.md#timeseriesindex)
* [toInstanceName](overview.md#toinstancename)
* [validateIndexConfig](overview.md#validateindexconfig)

#### Object literals

* [mapping](overview.md#const-mapping)
* [schema](overview.md#const-schema)

## Type aliases

###  AsyncFn

Ƭ **AsyncFn**: *function*

*Defined in [interfaces.ts:156](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L156)*

#### Type declaration:

▸ (): *`Promise<T>`*

___

###  BulkAction

Ƭ **BulkAction**: *"index" | "create" | "delete" | "update"*

*Defined in [interfaces.ts:158](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L158)*

___

###  BulkResponseItems

Ƭ **BulkResponseItems**: *object*

*Defined in [interfaces.ts:172](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L172)*

#### Type declaration:

___

###  CreateRecordInput

Ƭ **CreateRecordInput**: *`Omit<T, keyof IndexModelRecord>`*

*Defined in [interfaces.ts:195](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L195)*

___

###  ErrorLike

Ƭ **ErrorLike**: *object | `ErrorObject` | string*

*Defined in [utils/errors.ts:43](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/errors.ts#L43)*

___

###  FindOneOptions

Ƭ **FindOneOptions**: *object*

*Defined in [interfaces.ts:244](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L244)*

#### Type declaration:

___

###  FindOptions

Ƭ **FindOptions**: *object*

*Defined in [interfaces.ts:236](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L236)*

#### Type declaration:

___

###  SanitizeFields

Ƭ **SanitizeFields**: *object*

*Defined in [interfaces.ts:226](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L226)*

#### Type declaration:

● \[▪ **field**: *string*\]: "trimAndToLower" | "trim" | "toSafeString"

___

###  Shard

Ƭ **Shard**: *object*

*Defined in [interfaces.ts:180](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L180)*

#### Type declaration:

___

###  TimeSeriesFormat

Ƭ **TimeSeriesFormat**: *"daily" | "monthly" | "yearly"*

*Defined in [interfaces.ts:113](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L113)*

___

###  UpdateRecordInput

Ƭ **UpdateRecordInput**: *`Partial<Omit<T, keyof IndexModelRecord>>` & object*

*Defined in [interfaces.ts:196](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/interfaces.ts#L196)*

## Variables

### `Const` MAX_RETRIES

• **MAX_RETRIES**: *`2` | `100`* =  isTest ? 2 : 100

*Defined in [utils/retry-config.ts:3](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/retry-config.ts#L3)*

___

### `Const` RETRY_DELAY

• **RETRY_DELAY**: *`50` | `500`* =  isTest ? 50 : 500

*Defined in [utils/retry-config.ts:4](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/retry-config.ts#L4)*

___

### `Const` buildNestPath

• **buildNestPath**: *function* =  R.pipe(
    R.reject((v: string) => !v) as any,
    R.map(R.trim),
    R.join('.')
)

*Defined in [utils/misc.ts:43](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L43)*

#### Type declaration:

▸ (`paths`: *undefined | string[]*): *string*

**Parameters:**

Name | Type |
------ | ------ |
`paths` | undefined \| string[] |

___

### `Const` formatIndexName

• **formatIndexName**: *function* =  R.pipe(
    R.reject((v: string) => !v) as any,
    R.map(R.trim),
    R.join('-')
)

*Defined in [utils/misc.ts:37](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L37)*

#### Type declaration:

▸ (`strs`: *undefined | string[]*): *string*

**Parameters:**

Name | Type |
------ | ------ |
`strs` | undefined \| string[] |

___

### `Const` getDataVersion

• **getDataVersion**: *function* =  R.pathOr(1, ['version'])

*Defined in [utils/misc.ts:30](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L30)*

#### Type declaration:

▸ (`obj`: *any*): *any*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

___

### `Const` getDataVersionStr

• **getDataVersionStr**: *function* =  R.pipe(
    getDataVersion,
    R.toString as any,
    R.prepend('v')
) as any

*Defined in [utils/misc.ts:31](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L31)*

#### Type declaration:

▸ (`config`: *any*): *string*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

___

### `Const` getErrorMessages

• **getErrorMessages**: *function* =  R.pipe(
    R.map(getErrorMessage),
    R.join(', ')
)

*Defined in [utils/errors.ts:31](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/errors.ts#L31)*

#### Type declaration:

▸ (`errors`: *[ErrorLike](overview.md#errorlike)[]*): *string*

**Parameters:**

Name | Type |
------ | ------ |
`errors` | [ErrorLike](overview.md#errorlike)[] |

___

### `Const` getErrorType

• **getErrorType**: *function* =  R.pathOr('', ['error', 'type'])

*Defined in [utils/errors.ts:36](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/errors.ts#L36)*

#### Type declaration:

▸ (`obj`: *any*): *any*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

___

### `Const` getFirstKey

• **getFirstKey**: *`getFirstFn`* =  R.pipe(
    // @ts-ignore
    R.keys,
    R.head
)

*Defined in [utils/misc.ts:13](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L13)*

___

### `Const` getFirstValue

• **getFirstValue**: *`getFirstFn`* =  R.pipe(
    // @ts-ignore
    R.values,
    R.head
)

*Defined in [utils/misc.ts:7](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L7)*

___

### `Const` getIndexMapping

• **getIndexMapping**: *function* =  R.path(['indexSchema', 'mapping'])

*Defined in [utils/misc.ts:19](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L19)*

#### Type declaration:

▸ (`obj`: *any*): *`T` | undefined*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

___

### `Const` getRolloverFrequency

• **getRolloverFrequency**: *function* =  R.pathOr('monthly', ['indexSchema', 'rollover_frequency'])

*Defined in [utils/misc.ts:21](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L21)*

#### Type declaration:

▸ (`obj`: *any*): *any*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

___

### `Const` getSchemaVersion

• **getSchemaVersion**: *function* =  R.pathOr(1, ['indexSchema', 'version'])

*Defined in [utils/misc.ts:23](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L23)*

#### Type declaration:

▸ (`obj`: *any*): *any*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

___

### `Const` getSchemaVersionStr

• **getSchemaVersionStr**: *function* =  R.pipe(
    getSchemaVersion,
    R.toString as any,
    R.prepend('s')
) as any

*Defined in [utils/misc.ts:24](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L24)*

#### Type declaration:

▸ (`config`: *any*): *string*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

___

### `Const` getStatusCode

• **getStatusCode**: *function* =  R.pipe(
    R.ifElse(R.has('statusCode'), R.path(['statusCode']), R.path(['status'])),
    R.defaultTo(500)
)

*Defined in [utils/errors.ts:38](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/errors.ts#L38)*

#### Type declaration:

▸ (`error`: *[ErrorLike](overview.md#errorlike)*): *number*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [ErrorLike](overview.md#errorlike) |

___

### `Const` isSimpleIndex

• **isSimpleIndex**: *`indexFn`* =  R.both(
    isNotNil,
    R.both(
        R.has('mapping'),
        R.pipe(
            R.path(['template']),
            R.isNil
        )
    )
)

*Defined in [utils/validation.ts:67](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/validation.ts#L67)*

___

### `Const` isTemplatedIndex

• **isTemplatedIndex**: *`indexFn`* =  R.both(isNotNil, R.both(R.has('mapping'), R.propEq('template', true)))

*Defined in [utils/validation.ts:78](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/validation.ts#L78)*

___

### `Const` isTimeSeriesIndex

• **isTimeSeriesIndex**: *`indexFn`* =  R.both(isTemplatedIndex, R.propEq('timeseries', true))

*Defined in [utils/validation.ts:80](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/validation.ts#L80)*

___

### `Const` verifyIndexShards

• **verifyIndexShards**: *function* =  R.pipe(
    // @ts-ignore
    R.filter((shard: i.Shard) => shard.primary),
    R.all((shard: i.Shard) => shard.stage === 'DONE')
)

*Defined in [utils/elasticsearch.ts:23](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/elasticsearch.ts#L23)*

#### Type declaration:

▸ (`shards`: *`i.Shard`[]*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`shards` | `i.Shard`[] |

## Functions

###  addDefaultMapping

▸ **addDefaultMapping**(`input`: *object*): *object*

*Defined in [utils/model.ts:44](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object |

**Returns:** *object*

___

###  addDefaultSchema

▸ **addDefaultSchema**(`input`: *object*): *object*

*Defined in [utils/model.ts:48](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object |

**Returns:** *object*

___

###  filterBulkRetries

▸ **filterBulkRetries**<**T**>(`records`: *`T`[]*, `result`: *[BulkResponse](interfaces/bulkresponse.md)*): *`T`[]*

*Defined in [utils/elasticsearch.ts:45](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/elasticsearch.ts#L45)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`records` | `T`[] |
`result` | [BulkResponse](interfaces/bulkresponse.md) |

**Returns:** *`T`[]*

___

###  getBulkResponseItem

▸ **getBulkResponseItem**(`input`: *any*): *`BulkResponseItemResult`*

*Defined in [utils/elasticsearch.ts:107](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/elasticsearch.ts#L107)*

Get the first key and value from the bulk response:

Here is an example input:

```json
{
"index": {
"_index": "test",
"_type": "type1",
"_id": "1",
"_version": 1,
"result": "created",
"_shards": {
"total": 2,
"successful": 1,
"failed": 0
},
"created": true,
"status": 201
}
}
```

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any |  {} |

**Returns:** *`BulkResponseItemResult`*

___

###  getErrorMessage

▸ **getErrorMessage**(`err`: *[ErrorLike](overview.md#errorlike)*): *string*

*Defined in [utils/errors.ts:19](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/errors.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | [ErrorLike](overview.md#errorlike) |

**Returns:** *string*

___

###  getRetryConfig

▸ **getRetryConfig**(): *`Partial<PRetryConfig>`*

*Defined in [utils/retry-config.ts:6](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/retry-config.ts#L6)*

**Returns:** *`Partial<PRetryConfig>`*

___

###  getTimeByField

▸ **getTimeByField**(`field`: *string*): *function*

*Defined in [utils/elasticsearch.ts:8](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/elasticsearch.ts#L8)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`field` | string | "" |

**Returns:** *function*

▸ (`input`: *any*): *number*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

___

###  getTypesFromProperties

▸ **getTypesFromProperties**(`properties`: *`MappingProperties`*, `basePath`: *string*): *`TypeMappingPair`[]*

*Defined in [utils/elasticsearch.ts:133](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/elasticsearch.ts#L133)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`properties` | `MappingProperties` | - |
`basePath` | string | "" |

**Returns:** *`TypeMappingPair`[]*

___

###  getXLuceneTypesFromMapping

▸ **getXLuceneTypesFromMapping**(`mapping`: *any*): *`TypeConfig` | undefined*

*Defined in [utils/elasticsearch.ts:114](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/elasticsearch.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`mapping` | any |

**Returns:** *`TypeConfig` | undefined*

___

###  getXluceneTypeFromESType

▸ **getXluceneTypeFromESType**(`type?`: *undefined | string*): *`FieldType` | undefined*

*Defined in [utils/elasticsearch.ts:152](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/elasticsearch.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`type?` | undefined \| string |

**Returns:** *`FieldType` | undefined*

___

### `Const` isNotNil

▸ **isNotNil**(`input`: *any*): *boolean*

*Defined in [utils/misc.ts:3](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/misc.ts#L3)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isValidClient

▸ **isValidClient**(`input`: *any*): *boolean*

*Defined in [utils/validation.ts:57](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/validation.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isValidName

▸ **isValidName**(`name`: *string*): *false | true | `""`*

*Defined in [utils/validation.ts:8](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/validation.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *false | true | `""`*

___

###  isValidNamespace

▸ **isValidNamespace**(`namespace`: *string*): *false | true | `""`*

*Defined in [utils/validation.ts:12](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/validation.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |

**Returns:** *false | true | `""`*

___

###  makeId

▸ **makeId**(`len`: *number*): *`Promise<string>`*

*Defined in [utils/model.ts:57](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L57)*

Make unique URL friendly id

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`len` | number | 12 |

**Returns:** *`Promise<string>`*

___

###  mergeDefaults

▸ **mergeDefaults**(`source`: *object*, `from`: *object*): *object*

*Defined in [utils/model.ts:70](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L70)*

Deep copy two levels deep (useful for mapping and schema)

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`source` | object | - |
`from` | object |  {} |

**Returns:** *object*

___

###  shardsPath

▸ **shardsPath**(`index`: *string*): *function*

*Defined in [utils/elasticsearch.ts:19](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/elasticsearch.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *function*

▸ (`stats`: *any*): *`i.Shard`[]*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | any |

___

###  throwValidationError

▸ **throwValidationError**(`errors`: *[ErrorLike](overview.md#errorlike)[] | null | undefined*): *string | null*

*Defined in [utils/errors.ts:5](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/errors.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`errors` | [ErrorLike](overview.md#errorlike)[] \| null \| undefined |

**Returns:** *string | null*

___

###  timeseriesIndex

▸ **timeseriesIndex**(`index`: *string*, `timeSeriesFormat`: *`i.TimeSeriesFormat`*): *string*

*Defined in [utils/elasticsearch.ts:29](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/elasticsearch.ts#L29)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`index` | string | - |
`timeSeriesFormat` | `i.TimeSeriesFormat` | "monthly" |

**Returns:** *string*

___

###  toInstanceName

▸ **toInstanceName**(`name`: *string*): *string*

*Defined in [utils/model.ts:89](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *string*

___

###  validateIndexConfig

▸ **validateIndexConfig**(`config`: *any*): *boolean*

*Defined in [utils/validation.ts:17](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/validation.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *boolean*

## Object literals

### `Const` mapping

### ▪ **mapping**: *object*

*Defined in [utils/model.ts:6](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L6)*

ElasticSearch Mapping

###  dynamic

• **dynamic**: *boolean* = false

*Defined in [utils/model.ts:10](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L10)*

▪ **_all**: *object*

*Defined in [utils/model.ts:7](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L7)*

* **enabled**: *boolean* = false

▪ **properties**: *object*

*Defined in [utils/model.ts:11](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L11)*

* **created**: *object*

  * **type**: *string* = "date"

* **id**: *object*

  * **type**: *string* = "keyword"

* **updated**: *object*

  * **type**: *string* = "date"

___

### `Const` schema

### ▪ **schema**: *object*

*Defined in [utils/model.ts:25](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L25)*

JSON Schema

###  additionalProperties

• **additionalProperties**: *boolean* = false

*Defined in [utils/model.ts:26](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L26)*

###  required

• **required**: *string[]* =  ['id', 'created', 'updated']

*Defined in [utils/model.ts:41](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L41)*

▪ **properties**: *object*

*Defined in [utils/model.ts:27](https://github.com/terascope/teraslice/blob/d3a803c3/packages/elasticsearch-store/src/utils/model.ts#L27)*

* **created**: *object*

  * **format**: *string* = "date-time"

* **description**: *object*

  * **type**: *string* = "string"

* **id**: *object*

  * **type**: *string* = "string"

* **updated**: *object*

  * **format**: *string* = "date-time"

