---
title: Elasticsearch Store API Overview
sidebar_label: API
---

## Index

### Classes

* [Cluster](classes/cluster.md)
* [IndexManager](classes/indexmanager.md)
* [IndexModel](classes/indexmodel.md)
* [IndexStore](classes/indexstore.md)

### Interfaces

* [BulkResponse](interfaces/bulkresponse.md)
* [BulkResponseItem](interfaces/bulkresponseitem.md)
* [DataSchema](interfaces/dataschema.md)
* [IndexConfig](interfaces/indexconfig.md)
* [IndexModelConfig](interfaces/indexmodelconfig.md)
* [IndexModelOptions](interfaces/indexmodeloptions.md)
* [IndexModelRecord](interfaces/indexmodelrecord.md)
* [IndexSchema](interfaces/indexschema.md)
* [MigrateIndexOptions](interfaces/migrateindexoptions.md)

### Type aliases

* [AsyncFn](overview.md#asyncfn)
* [BulkAction](overview.md#bulkaction)
* [BulkResponseItems](overview.md#bulkresponseitems)
* [CreateRecordInput](overview.md#createrecordinput)
* [ErrorLike](overview.md#errorlike)
* [FindOneOptions](overview.md#findoneoptions)
* [FindOptions](overview.md#findoptions)
* [MigrateIndexStoreOptions](overview.md#migrateindexstoreoptions)
* [SanitizeFields](overview.md#sanitizefields)
* [Shard](overview.md#shard)
* [TimeSeriesFormat](overview.md#timeseriesformat)
* [UpdateRecordInput](overview.md#updaterecordinput)

### Variables

* [MAX_RETRIES](overview.md#const-max_retries)
* [RETRY_DELAY](overview.md#const-retry_delay)
* [buildNestPath](overview.md#const-buildnestpath)
* [formatIndexName](overview.md#const-formatindexname)
* [getDataVersion](overview.md#const-getdataversion)
* [getDataVersionStr](overview.md#const-getdataversionstr)
* [getErrorMessages](overview.md#const-geterrormessages)
* [getErrorType](overview.md#const-geterrortype)
* [getIndexMapping](overview.md#const-getindexmapping)
* [getRolloverFrequency](overview.md#const-getrolloverfrequency)
* [getSchemaVersion](overview.md#const-getschemaversion)
* [getSchemaVersionStr](overview.md#const-getschemaversionstr)
* [getStatusCode](overview.md#const-getstatuscode)
* [isSimpleIndex](overview.md#const-issimpleindex)
* [isTemplatedIndex](overview.md#const-istemplatedindex)
* [isTimeSeriesIndex](overview.md#const-istimeseriesindex)
* [verifyIndexShards](overview.md#const-verifyindexshards)

### Functions

* [addDefaultMapping](overview.md#adddefaultmapping)
* [addDefaultSchema](overview.md#adddefaultschema)
* [filterBulkRetries](overview.md#filterbulkretries)
* [fixMappingRequest](overview.md#fixmappingrequest)
* [getBulkResponseItem](overview.md#getbulkresponseitem)
* [getESVersion](overview.md#getesversion)
* [getErrorMessage](overview.md#geterrormessage)
* [getFirstKey](overview.md#getfirstkey)
* [getFirstValue](overview.md#getfirstvalue)
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

### Object literals

* [mapping](overview.md#const-mapping)
* [schema](overview.md#const-schema)

## Type aliases

###  AsyncFn

Ƭ **AsyncFn**: *function*

*Defined in [interfaces.ts:156](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L156)*

#### Type declaration:

▸ (): *Promise‹T›*

___

###  BulkAction

Ƭ **BulkAction**: *"index" | "create" | "delete" | "update"*

*Defined in [interfaces.ts:158](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L158)*

___

###  BulkResponseItems

Ƭ **BulkResponseItems**: *object*

*Defined in [interfaces.ts:172](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L172)*

#### Type declaration:

___

###  CreateRecordInput

Ƭ **CreateRecordInput**: *Omit‹T, keyof IndexModelRecord› & object*

*Defined in [interfaces.ts:204](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L204)*

___

###  ErrorLike

Ƭ **ErrorLike**: *object | ErrorObject | string*

*Defined in [utils/errors.ts:43](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/errors.ts#L43)*

___

###  FindOneOptions

Ƭ **FindOneOptions**: *object*

*Defined in [interfaces.ts:258](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L258)*

#### Type declaration:

___

###  FindOptions

Ƭ **FindOptions**: *object*

*Defined in [interfaces.ts:250](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L250)*

#### Type declaration:

___

###  MigrateIndexStoreOptions

Ƭ **MigrateIndexStoreOptions**: *Omit‹[MigrateIndexOptions](interfaces/migrateindexoptions.md), "config"›*

*Defined in [interfaces.ts:271](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L271)*

___

###  SanitizeFields

Ƭ **SanitizeFields**: *object*

*Defined in [interfaces.ts:241](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L241)*

#### Type declaration:

* \[ **field**: *string*\]: "trimAndToLower" | "trim" | "toSafeString"

___

###  Shard

Ƭ **Shard**: *object*

*Defined in [interfaces.ts:180](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L180)*

#### Type declaration:

___

###  TimeSeriesFormat

Ƭ **TimeSeriesFormat**: *"daily" | "monthly" | "yearly"*

*Defined in [interfaces.ts:119](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L119)*

___

###  UpdateRecordInput

Ƭ **UpdateRecordInput**: *Partial‹Omit‹T, keyof IndexModelRecord›› & object*

*Defined in [interfaces.ts:208](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/interfaces.ts#L208)*

## Variables

### `Const` MAX_RETRIES

• **MAX_RETRIES**: *2 | 100* =  isTest ? 2 : 100

*Defined in [utils/retry-config.ts:3](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/retry-config.ts#L3)*

___

### `Const` RETRY_DELAY

• **RETRY_DELAY**: *50 | 500* =  isTest ? 50 : 500

*Defined in [utils/retry-config.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/retry-config.ts#L4)*

___

### `Const` buildNestPath

• **buildNestPath**: *function* =  R.pipe(
    R.reject((v: string) => !v) as any,
    R.map(R.trim),
    R.join('.')
)

*Defined in [utils/misc.ts:36](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L36)*

#### Type declaration:

▸ (`paths`: undefined | string[]): *string*

**Parameters:**

Name | Type |
------ | ------ |
`paths` | undefined &#124; string[] |

___

### `Const` formatIndexName

• **formatIndexName**: *function* =  R.pipe(
    R.reject((v: string) => !v) as any,
    R.map(R.trim),
    R.join('-')
)

*Defined in [utils/misc.ts:30](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L30)*

#### Type declaration:

▸ (`strs`: undefined | string[]): *string*

**Parameters:**

Name | Type |
------ | ------ |
`strs` | undefined &#124; string[] |

___

### `Const` getDataVersion

• **getDataVersion**: *function* =  R.pathOr(1, ['version'])

*Defined in [utils/misc.ts:23](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L23)*

#### Type declaration:

▸ (`obj`: any): *any*

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

*Defined in [utils/misc.ts:24](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L24)*

#### Type declaration:

▸ (`config`: any): *string*

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

*Defined in [utils/errors.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/errors.ts#L5)*

#### Type declaration:

▸ (`errors`: [ErrorLike](overview.md#errorlike)[]): *string*

**Parameters:**

Name | Type |
------ | ------ |
`errors` | [ErrorLike](overview.md#errorlike)[] |

___

### `Const` getErrorType

• **getErrorType**: *function* =  R.pathOr('', ['error', 'type'])

*Defined in [utils/errors.ts:36](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/errors.ts#L36)*

#### Type declaration:

▸ (`obj`: any): *any*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

___

### `Const` getIndexMapping

• **getIndexMapping**: *function* =  R.path(['index_schema', 'mapping'])

*Defined in [utils/misc.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L12)*

#### Type declaration:

▸ (`obj`: any): *T | undefined*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

___

### `Const` getRolloverFrequency

• **getRolloverFrequency**: *function* =  R.pathOr('monthly', ['index_schema', 'rollover_frequency'])

*Defined in [utils/misc.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L14)*

#### Type declaration:

▸ (`obj`: any): *any*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

___

### `Const` getSchemaVersion

• **getSchemaVersion**: *function* =  R.pathOr(1, ['index_schema', 'version'])

*Defined in [utils/misc.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L16)*

#### Type declaration:

▸ (`obj`: any): *any*

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

*Defined in [utils/misc.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L17)*

#### Type declaration:

▸ (`config`: any): *string*

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

*Defined in [utils/errors.ts:38](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/errors.ts#L38)*

#### Type declaration:

▸ (`error`: [ErrorLike](overview.md#errorlike)): *number*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [ErrorLike](overview.md#errorlike) |

___

### `Const` isSimpleIndex

• **isSimpleIndex**: *indexFn* =  R.both(
    isNotNil,
    R.both(
        R.has('mapping'),
        R.pipe(
            R.path(['template']),
            R.isNil
        )
    )
)

*Defined in [utils/validation.ts:70](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/validation.ts#L70)*

___

### `Const` isTemplatedIndex

• **isTemplatedIndex**: *indexFn* =  R.both(isNotNil, R.both(R.has('mapping'), R.propEq('template', true)))

*Defined in [utils/validation.ts:81](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/validation.ts#L81)*

___

### `Const` isTimeSeriesIndex

• **isTimeSeriesIndex**: *indexFn* =  R.both(isTemplatedIndex, R.propEq('timeseries', true))

*Defined in [utils/validation.ts:83](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/validation.ts#L83)*

___

### `Const` verifyIndexShards

• **verifyIndexShards**: *function* =  R.pipe(
    // @ts-ignore
    R.filter((shard: i.Shard) => shard.primary),
    R.all((shard: i.Shard) => shard.stage === 'DONE')
)

*Defined in [utils/elasticsearch.ts:24](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L24)*

#### Type declaration:

▸ (`shards`: i.Shard[]): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`shards` | i.Shard[] |

## Functions

###  addDefaultMapping

▸ **addDefaultMapping**(`input`: ESTypeMappings): *ESTypeMappings*

*Defined in [utils/model.ts:51](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | ESTypeMappings |

**Returns:** *ESTypeMappings*

___

###  addDefaultSchema

▸ **addDefaultSchema**(`input`: object): *object*

*Defined in [utils/model.ts:55](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object |

**Returns:** *object*

___

###  filterBulkRetries

▸ **filterBulkRetries**<**T**>(`records`: T[], `result`: [BulkResponse](interfaces/bulkresponse.md)): *T[]*

*Defined in [utils/elasticsearch.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L46)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`records` | T[] |
`result` | [BulkResponse](interfaces/bulkresponse.md) |

**Returns:** *T[]*

___

###  fixMappingRequest

▸ **fixMappingRequest**(`client`: Client, `_params`: any, `isTemplate`: boolean): *any*

*Defined in [utils/elasticsearch.ts:175](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L175)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`_params` | any |
`isTemplate` | boolean |

**Returns:** *any*

___

###  getBulkResponseItem

▸ **getBulkResponseItem**(`input`: any): *BulkResponseItemResult*

*Defined in [utils/elasticsearch.ts:108](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L108)*

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

**Returns:** *BulkResponseItemResult*

___

###  getESVersion

▸ **getESVersion**(`client`: Client): *number*

*Defined in [utils/elasticsearch.ts:166](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L166)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |

**Returns:** *number*

___

###  getErrorMessage

▸ **getErrorMessage**(`err`: [ErrorLike](overview.md#errorlike)): *string*

*Defined in [utils/errors.ts:24](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/errors.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | [ErrorLike](overview.md#errorlike) |

**Returns:** *string*

___

###  getFirstKey

▸ **getFirstKey**<**T**>(`input`: T): *keyof T | undefined*

*Defined in [utils/misc.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L8)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | T |

**Returns:** *keyof T | undefined*

___

###  getFirstValue

▸ **getFirstValue**<**T**>(`input`: object): *T | undefined*

*Defined in [utils/misc.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L5)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`input` | object |

**Returns:** *T | undefined*

___

###  getRetryConfig

▸ **getRetryConfig**(): *Partial‹PRetryConfig›*

*Defined in [utils/retry-config.ts:6](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/retry-config.ts#L6)*

**Returns:** *Partial‹PRetryConfig›*

___

###  getTimeByField

▸ **getTimeByField**(`field`: string): *function*

*Defined in [utils/elasticsearch.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L9)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`field` | string | "" |

**Returns:** *function*

▸ (`input`: any): *number*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

___

###  getTypesFromProperties

▸ **getTypesFromProperties**(`properties`: MappingProperties, `basePath`: string): *TypeMappingPair[]*

*Defined in [utils/elasticsearch.ts:134](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L134)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`properties` | MappingProperties | - |
`basePath` | string | "" |

**Returns:** *TypeMappingPair[]*

___

###  getXLuceneTypesFromMapping

▸ **getXLuceneTypesFromMapping**(`mapping`: any): *TypeConfig | undefined*

*Defined in [utils/elasticsearch.ts:115](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L115)*

**Parameters:**

Name | Type |
------ | ------ |
`mapping` | any |

**Returns:** *TypeConfig | undefined*

___

###  getXluceneTypeFromESType

▸ **getXluceneTypeFromESType**(`type?`: undefined | string): *FieldType | undefined*

*Defined in [utils/elasticsearch.ts:153](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L153)*

**Parameters:**

Name | Type |
------ | ------ |
`type?` | undefined &#124; string |

**Returns:** *FieldType | undefined*

___

### `Const` isNotNil

▸ **isNotNil**(`input`: any): *boolean*

*Defined in [utils/misc.ts:3](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/misc.ts#L3)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isValidClient

▸ **isValidClient**(`input`: any): *boolean*

*Defined in [utils/validation.ts:60](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/validation.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isValidName

▸ **isValidName**(`name`: string): *false | true | ""*

*Defined in [utils/validation.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/validation.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *false | true | ""*

___

###  isValidNamespace

▸ **isValidNamespace**(`namespace`: string): *false | true | ""*

*Defined in [utils/validation.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/validation.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |

**Returns:** *false | true | ""*

___

###  makeId

▸ **makeId**(`len`: number): *Promise‹string›*

*Defined in [utils/model.ts:64](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L64)*

Make unique URL friendly id

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`len` | number | 12 |

**Returns:** *Promise‹string›*

___

###  mergeDefaults

▸ **mergeDefaults**<**T**>(`source`: T, `from`: Partial‹T›): *T*

*Defined in [utils/model.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L77)*

Deep copy two levels deep (useful for mapping and schema)

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`source` | T |
`from` | Partial‹T› |

**Returns:** *T*

___

###  shardsPath

▸ **shardsPath**(`index`: string): *function*

*Defined in [utils/elasticsearch.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | string |

**Returns:** *function*

▸ (`stats`: any): *i.Shard[]*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | any |

___

###  throwValidationError

▸ **throwValidationError**(`errors`: [ErrorLike](overview.md#errorlike)[] | null | undefined): *string | null*

*Defined in [utils/errors.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/errors.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`errors` | [ErrorLike](overview.md#errorlike)[] &#124; null &#124; undefined |

**Returns:** *string | null*

___

###  timeseriesIndex

▸ **timeseriesIndex**(`index`: string, `timeSeriesFormat`: i.TimeSeriesFormat): *string*

*Defined in [utils/elasticsearch.ts:30](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/elasticsearch.ts#L30)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`index` | string | - |
`timeSeriesFormat` | i.TimeSeriesFormat | "monthly" |

**Returns:** *string*

___

###  toInstanceName

▸ **toInstanceName**(`name`: string): *string*

*Defined in [utils/model.ts:96](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *string*

___

###  validateIndexConfig

▸ **validateIndexConfig**(`config`: any): *boolean*

*Defined in [utils/validation.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/validation.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *boolean*

## Object literals

### `Const` mapping

### ▪ **mapping**: *object*

*Defined in [utils/model.ts:7](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L7)*

ElasticSearch Mapping

###  dynamic

• **dynamic**: *false* = false

*Defined in [utils/model.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L11)*

▪ **_all**: *object*

*Defined in [utils/model.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L8)*

* **enabled**: *false* = false

▪ **properties**: *object*

*Defined in [utils/model.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L12)*

* **client_id**: *object*

  * **type**: *"integer"* = "integer"

* **created**: *object*

  * **type**: *"date"* = "date"

* **id**: *object*

  * **type**: *"keyword"* = "keyword"

* **updated**: *object*

  * **type**: *"date"* = "date"

___

### `Const` schema

### ▪ **schema**: *object*

*Defined in [utils/model.ts:29](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L29)*

JSON Schema

###  additionalProperties

• **additionalProperties**: *boolean* = false

*Defined in [utils/model.ts:30](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L30)*

###  required

• **required**: *string[]* =  ['id', 'client_id', 'created', 'updated']

*Defined in [utils/model.ts:48](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L48)*

▪ **properties**: *object*

*Defined in [utils/model.ts:31](https://github.com/terascope/teraslice/blob/d8feecc03/packages/elasticsearch-store/src/utils/model.ts#L31)*

* **client_id**: *object*

  * **default**: *number* = 1

  * **minimum**: *number* = 0

  * **multipleOf**: *number* = 1

  * **type**: *string* = "number"

* **created**: *object*

  * **format**: *string* = "date-time"

* **id**: *object*

  * **type**: *string* = "string"

* **updated**: *object*

  * **format**: *string* = "date-time"
