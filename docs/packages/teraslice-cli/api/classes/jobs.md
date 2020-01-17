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

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:24](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`cliConfig` | any |

**Returns:** *[Jobs](jobs.md)*

## Properties

###  activeStatus

• **activeStatus**: *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:23](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L23)*

___

###  allJobsStopped

• **allJobsStopped**: *boolean*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:22](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L22)*

___

###  config

• **config**: *any*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:18](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L18)*

**`param`** config object

___

###  jobsList

• **jobsList**: *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:20](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L20)*

___

###  jobsListChecked

• **jobsListChecked**: *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:24](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L24)*

___

###  jobsListInitial

• **jobsListInitial**: *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:21](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L21)*

___

###  teraslice

• **teraslice**: *[TerasliceUtil](terasliceutil.md)*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:19](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L19)*

## Accessors

###  list

• **get list**(): *string[]*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:36](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L36)*

**Returns:** *string[]*

## Methods

###  addWorkers

▸ **addWorkers**(`expectedJobs`: any[], `actualJobs`: any[]): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:273](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L273)*

**Parameters:**

Name | Type |
------ | ------ |
`expectedJobs` | any[] |
`actualJobs` | any[] |

**Returns:** *Promise‹void›*

___

###  awaitStatus

▸ **awaitStatus**(`desiredStatus`: ExecutionStatus, `jobId`: string, `timeout`: number): *Promise‹ExecutionStatus›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:79](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L79)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`desiredStatus` | ExecutionStatus | - |
`jobId` | string | - |
`timeout` | number | 0 |

**Returns:** *Promise‹ExecutionStatus›*

___

###  changeStatus

▸ **changeStatus**(`jobs`: any[], `action`: string): *Promise‹null | void[]›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:374](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L374)*

**Parameters:**

Name | Type |
------ | ------ |
`jobs` | any[] |
`action` | string |

**Returns:** *Promise‹null | void[]›*

___

###  checkJobsStart

▸ **checkJobsStart**(`statusList`: any[]): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:356](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L356)*

**Parameters:**

Name | Type |
------ | ------ |
`statusList` | any[] |

**Returns:** *Promise‹void›*

___

###  checkJobsStop

▸ **checkJobsStop**(`statusList`: any[]): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:342](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L342)*

**Parameters:**

Name | Type |
------ | ------ |
`statusList` | any[] |

**Returns:** *Promise‹void›*

___

###  checkWorkerCount

▸ **checkWorkerCount**(`expectedJobs`: any[], `actualJobs`: any[], `addedWorkers`: boolean): *Promise‹boolean›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:296](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L296)*

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

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:328](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L328)*

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

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:46](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L46)*

**Returns:** *Promise‹void›*

___

###  recover

▸ **recover**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:61](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L61)*

**Returns:** *Promise‹void›*

___

###  restart

▸ **restart**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:54](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L54)*

**Returns:** *Promise‹void›*

___

###  resume

▸ **resume**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:50](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L50)*

**Returns:** *Promise‹void›*

___

###  run

▸ **run**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:71](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L71)*

**Returns:** *Promise‹void›*

___

###  save

▸ **save**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:75](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L75)*

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(`action`: string): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:141](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L141)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`action` | string | "start" |

**Returns:** *Promise‹void›*

___

###  status

▸ **status**(`saveState`: boolean, `showJobs`: boolean): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:87](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L87)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`saveState` | boolean | false |
`showJobs` | boolean | true |

**Returns:** *Promise‹void›*

___

###  statusCheck

▸ **statusCheck**(`statusList`: string[]): *Promise‹string[]›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:122](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L122)*

**Parameters:**

Name | Type |
------ | ------ |
`statusList` | string[] |

**Returns:** *Promise‹string[]›*

___

###  stop

▸ **stop**(`action`: string): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:205](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L205)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`action` | string | "stop" |

**Returns:** *Promise‹void›*

___

###  workers

▸ **workers**(): *Promise‹void›*

*Defined in [packages/teraslice-cli/src/helpers/jobs.ts:40](https://github.com/terascope/teraslice/blob/78714a985/packages/teraslice-cli/src/helpers/jobs.ts#L40)*

**Returns:** *Promise‹void›*
