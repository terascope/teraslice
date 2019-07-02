---
title: Job Components Job Schemas
sidebar_label: Job Schemas
---

> Job Schemas for @terascope/job-components

[Globals](../overview.md) / ["job-schemas"](_job_schemas_.md) /

# External module: "job-schemas"

### Index

#### Variables

* [makeJobSchema](_job_schemas_.md#const-makejobschema)

#### Functions

* [jobSchema](_job_schemas_.md#jobschema)

#### Object literals

* [apiSchema](_job_schemas_.md#const-apischema)
* [opSchema](_job_schemas_.md#const-opschema)

## Variables

### `Const` makeJobSchema

• **makeJobSchema**: *[jobSchema](_job_schemas_.md#jobschema)* =  jobSchema

*Defined in [job-schemas.ts:231](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-schemas.ts#L231)*

## Functions

###  jobSchema

▸ **jobSchema**(`context`: *[Context](../interfaces/_interfaces_context_.context.md)*): *`convict.Schema<any>`*

*Defined in [job-schemas.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-schemas.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](../interfaces/_interfaces_context_.context.md) |

**Returns:** *`convict.Schema<any>`*

## Object literals

### `Const` apiSchema

### ▪ **apiSchema**: *object*

*Defined in [job-schemas.ts:258](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-schemas.ts#L258)*

▪ **_name**: *object*

*Defined in [job-schemas.ts:259](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-schemas.ts#L259)*

* **default**: *string* = ""

* **doc**: *string* =  `The _name property is required, and it is required to be unqiue
        but can be suffixed with a identifier by using the format "example:0",
        anything after the ":" is stripped out when searching for the file or folder.`

* **format**: *"required_String"* = "required_String"

___

### `Const` opSchema

### ▪ **opSchema**: *object*

*Defined in [job-schemas.ts:233](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-schemas.ts#L233)*

▪ **_dead_letter_action**: *object*

*Defined in [job-schemas.ts:244](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-schemas.ts#L244)*

* **default**: *string* = "none"

* **doc**: *string* =  `This action will specify what to do when failing to parse or transform a record. ​​​​​
​​​​​The following builtin actions are supported: ​​​
​​​​​  - "throw": throw the original error ​​​​​
​​​​​  - "log": log the error and the data ​​​​​
​​​​​  - "none": (default) skip the error entirely

​​​​​If none of the actions are specified it will try and use a registered Dead Letter Queue API under that name.
The API must be already be created by a operation before it can used.​`.trim()

* **format**: *"optional_String"* = "optional_String"

▪ **_encoding**: *object*

*Defined in [job-schemas.ts:239](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-schemas.ts#L239)*

* **default**: *string* = "json"

* **doc**: *string* = "Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`."

* **format**: *"json"[]* =  dataEncodings

▪ **_op**: *object*

*Defined in [job-schemas.ts:234](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/job-schemas.ts#L234)*

* **default**: *string* = ""

* **doc**: *string* = "Name of operation, , it must reflect the name of the file or folder"

* **format**: *"required_String"* = "required_String"
