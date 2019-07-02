---
title: Job Components Config Validators
sidebar_label: Config Validators
---

> Config Validators for @terascope/job-components

[Globals](../overview.md) / ["config-validators"](_config_validators_.md) /

# External module: "config-validators"

### Index

#### Functions

* [validateAPIConfig](_config_validators_.md#validateapiconfig)
* [validateJobConfig](_config_validators_.md#validatejobconfig)
* [validateOpConfig](_config_validators_.md#validateopconfig)

## Functions

###  validateAPIConfig

▸ **validateAPIConfig**<**T**>(`inputSchema`: *`convict.Schema<any>`*, `inputConfig`: *any*): *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T`*

*Defined in [config-validators.ts:33](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/config-validators.ts#L33)*

Merges the provided inputSchema with commonSchema and then validates the
provided apiConfig against the resulting schema.

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`inputSchema` | `convict.Schema<any>` |
`inputConfig` | any |

**Returns:** *[APIConfig](../interfaces/_interfaces_jobs_.apiconfig.md) & `T`*

___

###  validateJobConfig

▸ **validateJobConfig**<**T**>(`inputSchema`: *`convict.Schema<any>`*, `inputConfig`: *any*): *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md) & `T`*

*Defined in [config-validators.ts:51](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/config-validators.ts#L51)*

Merges the provided inputSchema with commonSchema and then validates the
provided jobConfig against the resulting schema.

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`inputSchema` | `convict.Schema<any>` |
`inputConfig` | any |

**Returns:** *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md) & `T`*

___

###  validateOpConfig

▸ **validateOpConfig**<**T**>(`inputSchema`: *`convict.Schema<any>`*, `inputConfig`: *any*): *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*

*Defined in [config-validators.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/config-validators.ts#L15)*

Merges the provided inputSchema with commonSchema and then validates the
provided opConfig against the resulting schema.

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`inputSchema` | `convict.Schema<any>` |
`inputConfig` | any |

**Returns:** *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*
