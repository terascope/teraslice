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
* [id](jobfile.md#id)
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

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`argv` | any |

**Returns:** *[JobFile](jobfile.md)*

## Properties

###  clusterUrl

• **clusterUrl**: *string*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:21](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L21)*

___

###  content

• **content**: *any*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:22](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L22)*

___

###  id

• **id**: *string*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:19](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L19)*

___

###  jobPath

• **jobPath**: *string*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:17](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L17)*

**`param`** the path to the job file

**`param`** name of job file.

___

###  name

• **name**: *string*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:20](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L20)*

___

###  version

• **version**: *string*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:18](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L18)*

## Accessors

###  hasMetaData

• **get hasMetaData**(): *boolean*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:80](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L80)*

**Returns:** *boolean*

## Methods

###  addMetaData

▸ **addMetaData**(`id`: string, `clusterUrl`: string): *void*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:73](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |
`clusterUrl` | string |

**Returns:** *void*

___

###  init

▸ **init**(): *void*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:33](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L33)*

**Returns:** *void*

___

###  overwrite

▸ **overwrite**(): *void*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:84](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L84)*

**Returns:** *void*

___

###  readFile

▸ **readFile**(): *void*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:60](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L60)*

**Returns:** *void*

___

###  validateJob

▸ **validateJob**(): *void*

*Defined in [packages/teraslice-cli/src/helpers/job-src.ts:47](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-cli/src/helpers/job-src.ts#L47)*

**Returns:** *void*
