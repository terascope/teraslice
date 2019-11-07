---
title: Teraslice CLI: `JobFile`
sidebar_label: JobFile
---

# Class: JobFile

## Hierarchy

* **JobFile**

## Index

### Constructors

* [constructor](jobfile.md#constructor)

### Properties

* [clusterUrl](jobfile.md#clusterurl)
* [content](jobfile.md#content)
* [jobId](jobfile.md#jobid)
* [jobPath](jobfile.md#jobpath)
* [name](jobfile.md#name)
* [version](jobfile.md#version)

### Accessors

* [hasMetaData](jobfile.md#hasmetadata)

### Methods

* [addMetaData](jobfile.md#addmetadata)
* [init](jobfile.md#init)
* [overwrite](jobfile.md#overwrite)
* [readFile](jobfile.md#readfile)
* [validateJob](jobfile.md#validatejob)

## Constructors

###  constructor

\+ **new JobFile**(`argv`: any): *[JobFile](jobfile.md)*

*Defined in [helpers/job-src.ts:23](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`argv` | any |

**Returns:** *[JobFile](jobfile.md)*

## Properties

###  clusterUrl

• **clusterUrl**: *string*

*Defined in [helpers/job-src.ts:22](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L22)*

___

###  content

• **content**: *any*

*Defined in [helpers/job-src.ts:23](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L23)*

___

###  jobId

• **jobId**: *string*

*Defined in [helpers/job-src.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L20)*

___

###  jobPath

• **jobPath**: *string*

*Defined in [helpers/job-src.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L18)*

**`param`** the path to the job file

**`param`** name of job file.

___

###  name

• **name**: *string*

*Defined in [helpers/job-src.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L21)*

___

###  version

• **version**: *string*

*Defined in [helpers/job-src.ts:19](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L19)*

## Accessors

###  hasMetaData

• **get hasMetaData**(): *boolean*

*Defined in [helpers/job-src.ts:75](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L75)*

**Returns:** *boolean*

## Methods

###  addMetaData

▸ **addMetaData**(`id`: string, `clusterUrl`: string): *void*

*Defined in [helpers/job-src.ts:68](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`clusterUrl` | string |

**Returns:** *void*

___

###  init

▸ **init**(): *void*

*Defined in [helpers/job-src.ts:34](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L34)*

**Returns:** *void*

___

###  overwrite

▸ **overwrite**(): *void*

*Defined in [helpers/job-src.ts:79](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L79)*

**Returns:** *void*

___

###  readFile

▸ **readFile**(): *void*

*Defined in [helpers/job-src.ts:61](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L61)*

**Returns:** *void*

___

###  validateJob

▸ **validateJob**(): *void*

*Defined in [helpers/job-src.ts:48](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/job-src.ts#L48)*

**Returns:** *void*
