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

* [AnyInput](overview.md#anyinput)
* [AsyncFn](overview.md#asyncfn)
* [BulkAction](overview.md#bulkaction)
* [BulkResponseItems](overview.md#bulkresponseitems)
* [CreateRecordInput](overview.md#createrecordinput)
* [ErrorLike](overview.md#errorlike)
* [FindOneOptions](overview.md#findoneoptions)
* [FindOptions](overview.md#findoptions)
* [JoinBy](overview.md#joinby)
* [MigrateIndexStoreOptions](overview.md#migrateindexstoreoptions)
* [ReadHook](overview.md#readhook)
* [SanitizeFields](overview.md#sanitizefields)
* [Shard](overview.md#shard)
* [TimeSeriesFormat](overview.md#timeseriesformat)
* [UpdateBody](overview.md#updatebody)
* [UpdateRecordInput](overview.md#updaterecordinput)
* [WriteHook](overview.md#writehook)

### Variables

* [MAX_RETRIES](overview.md#const-max_retries)
* [RETRY_DELAY](overview.md#const-retry_delay)

### Functions

* [addDefaultSchema](overview.md#adddefaultschema)
* [filterBulkRetries](overview.md#filterbulkretries)
* [fixMappingRequest](overview.md#fixmappingrequest)
* [formatIndexName](overview.md#formatindexname)
* [getBulkResponseItem](overview.md#getbulkresponseitem)
* [getDataVersion](overview.md#getdataversion)
* [getDataVersionStr](overview.md#getdataversionstr)
* [getESVersion](overview.md#getesversion)
* [getErrorMessage](overview.md#geterrormessage)
* [getErrorMessages](overview.md#geterrormessages)
* [getErrorType](overview.md#geterrortype)
* [getRetryConfig](overview.md#getretryconfig)
* [getRolloverFrequency](overview.md#getrolloverfrequency)
* [getSchemaVersion](overview.md#getschemaversion)
* [getSchemaVersionStr](overview.md#getschemaversionstr)
* [getTimeByField](overview.md#gettimebyfield)
* [isTemplatedIndex](overview.md#istemplatedindex)
* [isTimeSeriesIndex](overview.md#istimeseriesindex)
* [isValidClient](overview.md#isvalidclient)
* [isValidName](overview.md#isvalidname)
* [isValidNamespace](overview.md#isvalidnamespace)
* [makeDataValidator](overview.md#makedatavalidator)
* [makeId](overview.md#makeid)
* [makeRecordDataType](overview.md#makerecorddatatype)
* [mergeDefaults](overview.md#mergedefaults)
* [shardsPath](overview.md#shardspath)
* [throwValidationError](overview.md#throwvalidationerror)
* [timeseriesIndex](overview.md#timeseriesindex)
* [toInstanceName](overview.md#toinstancename)
* [validateId](overview.md#validateid)
* [validateIds](overview.md#validateids)
* [validateIndexConfig](overview.md#validateindexconfig)
* [verifyIndexShards](overview.md#verifyindexshards)

### Object literals

* [schema](overview.md#const-schema)

## Type aliases

###  AnyInput

Ƭ **AnyInput**: *object*

*Defined in [index-store.ts:815](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L815)*

#### Type declaration:

___

###  AsyncFn

Ƭ **AsyncFn**: *function*

*Defined in [interfaces.ts:158](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L158)*

#### Type declaration:

▸ (): *Promise‹T›*

___

###  BulkAction

Ƭ **BulkAction**: *"index" | "create" | "delete" | "update"*

*Defined in [interfaces.ts:160](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L160)*

___

###  BulkResponseItems

Ƭ **BulkResponseItems**: *object*

*Defined in [interfaces.ts:174](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L174)*

#### Type declaration:

___

###  CreateRecordInput

Ƭ **CreateRecordInput**: *Omit‹T, keyof IndexModelRecord› & object*

*Defined in [interfaces.ts:211](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L211)*

___

###  ErrorLike

Ƭ **ErrorLike**: *object | ErrorObject | string*

*Defined in [utils/errors.ts:38](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/errors.ts#L38)*

___

###  FindOneOptions

Ƭ **FindOneOptions**: *object*

*Defined in [interfaces.ts:265](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L265)*

#### Type declaration:

___

###  FindOptions

Ƭ **FindOptions**: *object*

*Defined in [interfaces.ts:256](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L256)*

#### Type declaration:

___

###  JoinBy

Ƭ **JoinBy**: *"AND" | "OR"*

*Defined in [index-store.ts:816](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L816)*

___

###  MigrateIndexStoreOptions

Ƭ **MigrateIndexStoreOptions**: *Omit‹[MigrateIndexOptions](interfaces/migrateindexoptions.md), "config"›*

*Defined in [interfaces.ts:279](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L279)*

___

###  ReadHook

Ƭ **ReadHook**: *function*

*Defined in [index-store.ts:820](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L820)*

#### Type declaration:

▸ (`doc`: T, `critical`: boolean): *T | false*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | T |
`critical` | boolean |

___

###  SanitizeFields

Ƭ **SanitizeFields**: *object*

*Defined in [interfaces.ts:247](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L247)*

#### Type declaration:

* \[ **field**: *string*\]: "trimAndToLower" | "trim" | "toSafeString"

___

###  Shard

Ƭ **Shard**: *object*

*Defined in [interfaces.ts:182](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L182)*

#### Type declaration:

___

###  TimeSeriesFormat

Ƭ **TimeSeriesFormat**: *"daily" | "monthly" | "yearly"*

*Defined in [interfaces.ts:126](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L126)*

___

###  UpdateBody

Ƭ **UpdateBody**: *object | object*

*Defined in [index-store.ts:817](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L817)*

___

###  UpdateRecordInput

Ƭ **UpdateRecordInput**: *Partial‹Omit‹T, keyof IndexModelRecord›› & object*

*Defined in [interfaces.ts:215](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/interfaces.ts#L215)*

___

###  WriteHook

Ƭ **WriteHook**: *function*

*Defined in [index-store.ts:819](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/index-store.ts#L819)*

#### Type declaration:

▸ (`doc`: Partial‹T›, `critical`: boolean): *T | Partial‹T›*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | Partial‹T› |
`critical` | boolean |

## Variables

### `Const` MAX_RETRIES

• **MAX_RETRIES**: *2 | 100* =  isTest ? 2 : 100

*Defined in [utils/retry-config.ts:3](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/retry-config.ts#L3)*

___

### `Const` RETRY_DELAY

• **RETRY_DELAY**: *50 | 500* =  isTest ? 50 : 500

*Defined in [utils/retry-config.ts:4](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/retry-config.ts#L4)*

## Functions

###  addDefaultSchema

▸ **addDefaultSchema**(`input`: object): *object*

*Defined in [utils/model.ts:51](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/model.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | object |

**Returns:** *object*

___

###  filterBulkRetries

▸ **filterBulkRetries**<**T**>(`records`: T[], `result`: [BulkResponse](interfaces/bulkresponse.md)): *T[]*

*Defined in [utils/elasticsearch.ts:36](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/elasticsearch.ts#L36)*

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

*Defined in [utils/elasticsearch.ts:114](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/elasticsearch.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |
`_params` | any |
`isTemplate` | boolean |

**Returns:** *any*

___

###  formatIndexName

▸ **formatIndexName**(`strs`: undefined | string[]): *string*

*Defined in [utils/misc.ts:24](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/misc.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`strs` | undefined &#124; string[] |

**Returns:** *string*

___

###  getBulkResponseItem

▸ **getBulkResponseItem**(`input`: any): *BulkResponseItemResult*

*Defined in [utils/elasticsearch.ts:98](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/elasticsearch.ts#L98)*

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

###  getDataVersion

▸ **getDataVersion**(`config`: any): *number*

*Defined in [utils/misc.ts:16](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/misc.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *number*

___

###  getDataVersionStr

▸ **getDataVersionStr**(`config`: any): *string*

*Defined in [utils/misc.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/misc.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *string*

___

###  getESVersion

▸ **getESVersion**(`client`: Client): *number*

*Defined in [utils/elasticsearch.ts:105](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/elasticsearch.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`client` | Client |

**Returns:** *number*

___

###  getErrorMessage

▸ **getErrorMessage**(`err`: [ErrorLike](overview.md#errorlike)): *string*

*Defined in [utils/errors.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/errors.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | [ErrorLike](overview.md#errorlike) |

**Returns:** *string*

___

###  getErrorMessages

▸ **getErrorMessages**(`errors`: [ErrorLike](overview.md#errorlike)[]): *string*

*Defined in [utils/errors.ts:4](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/errors.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`errors` | [ErrorLike](overview.md#errorlike)[] |

**Returns:** *string*

___

###  getErrorType

▸ **getErrorType**(`err`: any): *string*

*Defined in [utils/errors.ts:34](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/errors.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`err` | any |

**Returns:** *string*

___

###  getRetryConfig

▸ **getRetryConfig**(): *Partial‹PRetryConfig›*

*Defined in [utils/retry-config.ts:6](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/retry-config.ts#L6)*

**Returns:** *Partial‹PRetryConfig›*

___

###  getRolloverFrequency

▸ **getRolloverFrequency**(`config`: any): *[TimeSeriesFormat](overview.md#timeseriesformat)*

*Defined in [utils/misc.ts:4](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/misc.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *[TimeSeriesFormat](overview.md#timeseriesformat)*

___

###  getSchemaVersion

▸ **getSchemaVersion**(`config`: any): *number*

*Defined in [utils/misc.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/misc.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *number*

___

###  getSchemaVersionStr

▸ **getSchemaVersionStr**(`config`: any): *string*

*Defined in [utils/misc.ts:12](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/misc.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *string*

___

###  getTimeByField

▸ **getTimeByField**(`field`: string): *function*

*Defined in [utils/elasticsearch.ts:6](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/elasticsearch.ts#L6)*

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

###  isTemplatedIndex

▸ **isTemplatedIndex**(`config?`: [IndexSchema](interfaces/indexschema.md)): *boolean*

*Defined in [utils/validation.ts:113](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/validation.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`config?` | [IndexSchema](interfaces/indexschema.md) |

**Returns:** *boolean*

___

###  isTimeSeriesIndex

▸ **isTimeSeriesIndex**(`config?`: [IndexSchema](interfaces/indexschema.md)): *boolean*

*Defined in [utils/validation.ts:117](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/validation.ts#L117)*

**Parameters:**

Name | Type |
------ | ------ |
`config?` | [IndexSchema](interfaces/indexschema.md) |

**Returns:** *boolean*

___

###  isValidClient

▸ **isValidClient**(`input`: any): *input is Client*

*Defined in [utils/validation.ts:105](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/validation.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is Client*

___

###  isValidName

▸ **isValidName**(`name`: string): *false | true | ""*

*Defined in [utils/validation.ts:7](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/validation.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *false | true | ""*

___

###  isValidNamespace

▸ **isValidNamespace**(`namespace`: string): *false | true | ""*

*Defined in [utils/validation.ts:24](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/validation.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |

**Returns:** *false | true | ""*

___

###  makeDataValidator

▸ **makeDataValidator**(`dataSchema`: [DataSchema](interfaces/dataschema.md), `logger`: Logger): *(Anonymous function)*

*Defined in [utils/validation.ts:29](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/validation.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`dataSchema` | [DataSchema](interfaces/dataschema.md) |
`logger` | Logger |

**Returns:** *(Anonymous function)*

___

###  makeId

▸ **makeId**(`len`: number): *Promise‹string›*

*Defined in [utils/model.ts:60](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/model.ts#L60)*

Make unique URL friendly id

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`len` | number | 12 |

**Returns:** *Promise‹string›*

___

###  makeRecordDataType

▸ **makeRecordDataType**(`arg`: object): *DataType*

*Defined in [utils/model.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/model.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | object |

**Returns:** *DataType*

___

###  mergeDefaults

▸ **mergeDefaults**<**T**>(`source`: T, `from`: Partial‹T›): *T*

*Defined in [utils/model.ts:73](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/model.ts#L73)*

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

*Defined in [utils/elasticsearch.ts:10](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/elasticsearch.ts#L10)*

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

*Defined in [utils/errors.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/errors.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`errors` | [ErrorLike](overview.md#errorlike)[] &#124; null &#124; undefined |

**Returns:** *string | null*

___

###  timeseriesIndex

▸ **timeseriesIndex**(`index`: string, `timeSeriesFormat`: i.TimeSeriesFormat): *string*

*Defined in [utils/elasticsearch.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/elasticsearch.ts#L20)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`index` | string | - |
`timeSeriesFormat` | i.TimeSeriesFormat | "monthly" |

**Returns:** *string*

___

###  toInstanceName

▸ **toInstanceName**(`name`: string): *string*

*Defined in [utils/model.ts:92](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/model.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *string*

___

###  validateId

▸ **validateId**(`id`: any, `action`: string, `throwError`: boolean): *id is string*

*Defined in [utils/validation.ts:11](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/validation.ts#L11)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`id` | any | - |
`action` | string | - |
`throwError` | boolean | true |

**Returns:** *id is string*

___

###  validateIds

▸ **validateIds**(`ids`: any, `action`: string): *string[]*

*Defined in [utils/validation.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/validation.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`ids` | any |
`action` | string |

**Returns:** *string[]*

___

###  validateIndexConfig

▸ **validateIndexConfig**(`config`: any): *config is IndexConfig*

*Defined in [utils/validation.ts:62](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/validation.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | any |

**Returns:** *config is IndexConfig*

___

###  verifyIndexShards

▸ **verifyIndexShards**(`shards`: i.Shard[]): *boolean*

*Defined in [utils/elasticsearch.ts:14](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/elasticsearch.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`shards` | i.Shard[] |

**Returns:** *boolean*

## Object literals

### `Const` schema

### ▪ **schema**: *object*

*Defined in [utils/model.ts:7](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/model.ts#L7)*

JSON Schema

###  additionalProperties

• **additionalProperties**: *boolean* = false

*Defined in [utils/model.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/model.ts#L8)*

###  required

• **required**: *string[]* =  ['_key', 'client_id']

*Defined in [utils/model.ts:30](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/model.ts#L30)*

▪ **properties**: *object*

*Defined in [utils/model.ts:9](https://github.com/terascope/teraslice/blob/653cf7530/packages/elasticsearch-store/src/utils/model.ts#L9)*

* **_created**: *object*

  * **format**: *string* = "date-time"

* **_deleted**: *object*

  * **default**: *boolean* = false

  * **type**: *string* = "boolean"

* **_key**: *object*

  * **type**: *string* = "string"

* **_updated**: *object*

  * **format**: *string* = "date-time"

* **client_id**: *object*

  * **default**: *number* = 1

  * **minimum**: *number* = 0

  * **multipleOf**: *number* = 1

  * **type**: *string* = "number"
