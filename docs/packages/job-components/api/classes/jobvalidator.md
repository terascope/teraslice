---
title: Job Components Jobvalidator
sidebar_label: Jobvalidator
---

[JobValidator](jobvalidator.md) /

# Class: JobValidator

## Hierarchy

* **JobValidator**

### Index

#### Constructors

* [constructor](jobvalidator.md#constructor)

#### Properties

* [schema](jobvalidator.md#schema)

#### Methods

* [hasSchema](jobvalidator.md#hasschema)
* [validateConfig](jobvalidator.md#validateconfig)

## Constructors

###  constructor

\+ **new JobValidator**(`context`: *[Context](../interfaces/context.md)*, `options`: *object*): *[JobValidator](jobvalidator.md)*

*Defined in [src/job-validator.ts:15](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/job-validator.ts#L15)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](../interfaces/context.md) | - |
`options` | object |  {} |

**Returns:** *[JobValidator](jobvalidator.md)*

## Properties

###  schema

• **schema**: *`convict.Schema<any>`*

*Defined in [src/job-validator.ts:13](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/job-validator.ts#L13)*

## Methods

###  hasSchema

▸ **hasSchema**(`obj`: *any*, `name`: *string*): *void*

*Defined in [src/job-validator.ts:85](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/job-validator.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |
`name` | string |

**Returns:** *void*

___

###  validateConfig

▸ **validateConfig**(`jobSpec`: *[JobConfig](../overview.md#jobconfig)*): *[ValidatedJobConfig](../interfaces/validatedjobconfig.md)*

*Defined in [src/job-validator.ts:27](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/job-validator.ts#L27)*

Validate the job configuration, including the Operations and APIs configuration

**Parameters:**

Name | Type |
------ | ------ |
`jobSpec` | [JobConfig](../overview.md#jobconfig) |

**Returns:** *[ValidatedJobConfig](../interfaces/validatedjobconfig.md)*
