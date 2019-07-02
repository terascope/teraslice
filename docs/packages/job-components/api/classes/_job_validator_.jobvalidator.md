---
title: Job Components Job Validator Jobvalidator
sidebar_label: Job Validator Jobvalidator
---

> Job Validator Jobvalidator for @terascope/job-components

[Globals](../overview.md) / ["job-validator"](../modules/_job_validator_.md) / [JobValidator](_job_validator_.jobvalidator.md) /

# Class: JobValidator

## Hierarchy

* **JobValidator**

### Index

#### Constructors

* [constructor](_job_validator_.jobvalidator.md#constructor)

#### Properties

* [schema](_job_validator_.jobvalidator.md#schema)

#### Methods

* [hasSchema](_job_validator_.jobvalidator.md#hasschema)
* [validateConfig](_job_validator_.jobvalidator.md#validateconfig)

## Constructors

###  constructor

\+ **new JobValidator**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*, `options`: *object*): *[JobValidator](_job_validator_.jobvalidator.md)*

*Defined in [job-validator.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-validator.ts#L15)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) | - |
`options` | object |  {} |

**Returns:** *[JobValidator](_job_validator_.jobvalidator.md)*

## Properties

###  schema

• **schema**: *`convict.Schema<any>`*

*Defined in [job-validator.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-validator.ts#L13)*

## Methods

###  hasSchema

▸ **hasSchema**(`obj`: *any*, `name`: *string*): *void*

*Defined in [job-validator.ts:85](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-validator.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |
`name` | string |

**Returns:** *void*

___

###  validateConfig

▸ **validateConfig**(`jobSpec`: *[JobConfig](../modules/_interfaces_jobs_.md#jobconfig)*): *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md)*

*Defined in [job-validator.ts:27](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-validator.ts#L27)*

Validate the job configuration, including the Operations and APIs configuration

**Parameters:**

Name | Type |
------ | ------ |
`jobSpec` | [JobConfig](../modules/_interfaces_jobs_.md#jobconfig) |

**Returns:** *[ValidatedJobConfig](../interfaces/_interfaces_jobs_.validatedjobconfig.md)*
