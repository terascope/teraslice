---
title: Job Components: `JobValidator`
sidebar_label: JobValidator
---

# Class: JobValidator

## Hierarchy

* **JobValidator**

## Index

### Constructors

* [constructor](jobvalidator.md#constructor)

### Properties

* [schema](jobvalidator.md#schema)

### Methods

* [hasSchema](jobvalidator.md#hasschema)
* [validateConfig](jobvalidator.md#validateconfig)

## Constructors

###  constructor

\+ **new JobValidator**(`context`: [Context](../interfaces/context.md), `options`: object): *[JobValidator](jobvalidator.md)*

*Defined in [job-validator.ts:16](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/job-validator.ts#L16)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](../interfaces/context.md) | - |
`options` | object |  {} |

**Returns:** *[JobValidator](jobvalidator.md)*

## Properties

###  schema

• **schema**: *convict.Schema‹any›*

*Defined in [job-validator.ts:14](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/job-validator.ts#L14)*

## Methods

###  hasSchema

▸ **hasSchema**(`obj`: any, `name`: string): *void*

*Defined in [job-validator.ts:86](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/job-validator.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |
`name` | string |

**Returns:** *void*

___

###  validateConfig

▸ **validateConfig**(`jobSpec`: [JobConfig](../overview.md#jobconfig)): *[ValidatedJobConfig](../interfaces/validatedjobconfig.md)*

*Defined in [job-validator.ts:28](https://github.com/terascope/teraslice/blob/0ae31df4/packages/job-components/src/job-validator.ts#L28)*

Validate the job configuration, including the Operations and APIs configuration

**Parameters:**

Name | Type |
------ | ------ |
`jobSpec` | [JobConfig](../overview.md#jobconfig) |

**Returns:** *[ValidatedJobConfig](../interfaces/validatedjobconfig.md)*
