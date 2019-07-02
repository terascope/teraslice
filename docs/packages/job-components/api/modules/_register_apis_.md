---
title: Job Components Register Apis
sidebar_label: Register Apis
---

> Register Apis for @terascope/job-components

[Globals](../overview.md) / ["register-apis"](_register_apis_.md) /

# External module: "register-apis"

### Index

#### Functions

* [getAssetPath](_register_apis_.md#getassetpath)
* [getClient](_register_apis_.md#getclient)
* [getOpConfig](_register_apis_.md#getopconfig)
* [registerApis](_register_apis_.md#registerapis)

## Functions

###  getAssetPath

▸ **getAssetPath**(`assetDir`: *string*, `assets`: *string[]*, `name`: *string*): *`Promise<string>`*

*Defined in [register-apis.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/register-apis.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`assetDir` | string |
`assets` | string[] |
`name` | string |

**Returns:** *`Promise<string>`*

___

###  getClient

▸ **getClient**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*, `config`: *[GetClientConfig](../interfaces/_interfaces_context_.getclientconfig.md)*, `type`: *string*): *any*

*Defined in [register-apis.ts:53](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/register-apis.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) |
`config` | [GetClientConfig](../interfaces/_interfaces_context_.getclientconfig.md) |
`type` | string |

**Returns:** *any*

___

###  getOpConfig

▸ **getOpConfig**(`job`: *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md)*, `name`: *string*): *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) | undefined*

*Defined in [register-apis.ts:8](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/register-apis.ts#L8)*

Get the first opConfig from an operation name

**Parameters:**

Name | Type |
------ | ------ |
`job` | [ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md) |
`name` | string |

**Returns:** *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) | undefined*

___

###  registerApis

▸ **registerApis**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*, `job`: *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md) | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*, `assetIds?`: *string[]*): *void*

*Defined in [register-apis.ts:83](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/register-apis.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) |
`job` | [ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md) \| [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |
`assetIds?` | string[] |

**Returns:** *void*
