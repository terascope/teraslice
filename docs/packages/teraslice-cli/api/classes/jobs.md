---
title: Teraslice CLI: `Jobs`
sidebar_label: Jobs
---

# Class: Jobs

## Hierarchy

* **Jobs**

## Index

### Constructors

* [constructor](jobs.md#constructor)

### Properties

* [activeStatus](jobs.md#activestatus)
* [allJobsStopped](jobs.md#alljobsstopped)
* [config](jobs.md#config)
* [jobsList](jobs.md#jobslist)
* [jobsListChecked](jobs.md#jobslistchecked)
* [jobsListInitial](jobs.md#jobslistinitial)
* [teraslice](jobs.md#teraslice)

### Accessors

* [list](jobs.md#list)

### Methods

* [addWorkers](jobs.md#addworkers)
* [awaitStatus](jobs.md#awaitstatus)
* [changeStatus](jobs.md#changestatus)
* [checkJobsStart](jobs.md#checkjobsstart)
* [checkJobsStop](jobs.md#checkjobsstop)
* [checkWorkerCount](jobs.md#checkworkercount)
* [controllerStatus](jobs.md#controllerstatus)
* [pause](jobs.md#pause)
* [recover](jobs.md#recover)
* [restart](jobs.md#restart)
* [resume](jobs.md#resume)
* [run](jobs.md#run)
* [save](jobs.md#save)
* [start](jobs.md#start)
* [status](jobs.md#status)
* [statusCheck](jobs.md#statuscheck)
* [stop](jobs.md#stop)
* [workers](jobs.md#workers)

## Constructors

###  constructor

\+ **new Jobs**(`cliConfig`: any): *[Jobs](jobs.md)*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`cliConfig` | any |

**Returns:** *[Jobs](jobs.md)*

## Properties

###  activeStatus

• **activeStatus**: *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L22)*

___

###  allJobsStopped

• **allJobsStopped**: *boolean*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L21)*

___

###  config

• **config**: *any*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L17)*

**`param`** config object

___

###  jobsList

• **jobsList**: *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:19](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L19)*

___

###  jobsListChecked

• **jobsListChecked**: *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L23)*

___

###  jobsListInitial

• **jobsListInitial**: *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L20)*

___

###  teraslice

• **teraslice**: *[TerasliceUtil](terasliceutil.md)*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L18)*

## Accessors

###  list

• **get list**(): *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:35](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L35)*

**Returns:** *string[]*

## Methods

###  addWorkers

▸ **addWorkers**(`expectedJobs`: any[], `actualJobs`: any[]): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:270](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L270)*

**Parameters:**

Name | Type |
------ | ------ |
`expectedJobs` | any[] |
`actualJobs` | any[] |

**Returns:** *Promise‹void›*

___

###  awaitStatus

▸ **awaitStatus**(): *Promise‹ExecutionStatus›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:79](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L79)*

**Returns:** *Promise‹ExecutionStatus›*

___

###  changeStatus

▸ **changeStatus**(`jobs`: any[], `action`: string): *Promise‹null | void[]›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:371](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L371)*

**Parameters:**

Name | Type |
------ | ------ |
`jobs` | any[] |
`action` | string |

**Returns:** *Promise‹null | void[]›*

___

###  checkJobsStart

▸ **checkJobsStart**(`statusList`: any[]): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:353](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L353)*

**Parameters:**

Name | Type |
------ | ------ |
`statusList` | any[] |

**Returns:** *Promise‹void›*

___

###  checkJobsStop

▸ **checkJobsStop**(`statusList`: any[]): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:339](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L339)*

**Parameters:**

Name | Type |
------ | ------ |
`statusList` | any[] |

**Returns:** *Promise‹void›*

___

###  checkWorkerCount

▸ **checkWorkerCount**(`expectedJobs`: any[], `actualJobs`: any[], `addedWorkers`: boolean): *Promise‹boolean›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:293](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L293)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`expectedJobs` | any[] | - |
`actualJobs` | any[] | - |
`addedWorkers` | boolean | false |

**Returns:** *Promise‹boolean›*

___

###  controllerStatus

▸ **controllerStatus**(`result`: any[], `jobStatus`: string, `controllerList`: any): *Promise‹any[]›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:325](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L325)*

**Parameters:**

Name | Type |
------ | ------ |
`result` | any[] |
`jobStatus` | string |
`controllerList` | any |

**Returns:** *Promise‹any[]›*

___

###  pause

▸ **pause**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:46](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L46)*

**Returns:** *Promise‹void›*

___

###  recover

▸ **recover**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:61](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L61)*

**Returns:** *Promise‹void›*

___

###  restart

▸ **restart**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:54](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L54)*

**Returns:** *Promise‹void›*

___

###  resume

▸ **resume**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:50](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L50)*

**Returns:** *Promise‹void›*

___

###  run

▸ **run**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:71](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L71)*

**Returns:** *Promise‹void›*

___

###  save

▸ **save**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:75](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L75)*

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(`action`: string): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:138](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L138)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`action` | string | "start" |

**Returns:** *Promise‹void›*

___

###  status

▸ **status**(`saveState`: boolean, `showJobs`: boolean): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:84](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L84)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`saveState` | boolean | false |
`showJobs` | boolean | true |

**Returns:** *Promise‹void›*

___

###  statusCheck

▸ **statusCheck**(`statusList`: string[]): *Promise‹string[]›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:119](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L119)*

**Parameters:**

Name | Type |
------ | ------ |
`statusList` | string[] |

**Returns:** *Promise‹string[]›*

___

###  stop

▸ **stop**(`action`: string): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:202](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L202)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`action` | string | "stop" |

**Returns:** *Promise‹void›*

___

###  workers

▸ **workers**(): *Promise‹string›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:39](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/jobs.ts#L39)*

**Returns:** *Promise‹string›*
