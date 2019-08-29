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

*Defined in [helpers/jobs.ts:23](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`cliConfig` | any |

**Returns:** *[Jobs](jobs.md)*

## Properties

###  activeStatus

• **activeStatus**: *string[]*

*Defined in [helpers/jobs.ts:22](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L22)*

___

###  allJobsStopped

• **allJobsStopped**: *boolean*

*Defined in [helpers/jobs.ts:21](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L21)*

___

###  config

• **config**: *any*

*Defined in [helpers/jobs.ts:17](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L17)*

**`param`** config object

___

###  jobsList

• **jobsList**: *string[]*

*Defined in [helpers/jobs.ts:19](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L19)*

___

###  jobsListChecked

• **jobsListChecked**: *string[]*

*Defined in [helpers/jobs.ts:23](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L23)*

___

###  jobsListInitial

• **jobsListInitial**: *string[]*

*Defined in [helpers/jobs.ts:20](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L20)*

___

###  teraslice

• **teraslice**: *[TerasliceUtil](terasliceutil.md)*

*Defined in [helpers/jobs.ts:18](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L18)*

## Accessors

###  list

• **get list**(): *string[]*

*Defined in [helpers/jobs.ts:35](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L35)*

**Returns:** *string[]*

## Methods

###  addWorkers

▸ **addWorkers**(`expectedJobs`: any[], `actualJobs`: any[]): *Promise‹void›*

*Defined in [helpers/jobs.ts:261](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L261)*

**Parameters:**

Name | Type |
------ | ------ |
`expectedJobs` | any[] |
`actualJobs` | any[] |

**Returns:** *Promise‹void›*

___

###  changeStatus

▸ **changeStatus**(`jobs`: any[], `action`: string): *Promise‹[void, void, void, void, void, void, void, void, void, void]›*

*Defined in [helpers/jobs.ts:362](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L362)*

**Parameters:**

Name | Type |
------ | ------ |
`jobs` | any[] |
`action` | string |

**Returns:** *Promise‹[void, void, void, void, void, void, void, void, void, void]›*

___

###  checkJobsStart

▸ **checkJobsStart**(`statusList`: any[]): *Promise‹void›*

*Defined in [helpers/jobs.ts:344](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L344)*

**Parameters:**

Name | Type |
------ | ------ |
`statusList` | any[] |

**Returns:** *Promise‹void›*

___

###  checkJobsStop

▸ **checkJobsStop**(`statusList`: any[]): *Promise‹void›*

*Defined in [helpers/jobs.ts:330](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L330)*

**Parameters:**

Name | Type |
------ | ------ |
`statusList` | any[] |

**Returns:** *Promise‹void›*

___

###  checkWorkerCount

▸ **checkWorkerCount**(`expectedJobs`: any[], `actualJobs`: any[], `addedWorkers`: boolean): *Promise‹boolean›*

*Defined in [helpers/jobs.ts:284](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L284)*

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

*Defined in [helpers/jobs.ts:316](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L316)*

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

*Defined in [helpers/jobs.ts:45](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L45)*

**Returns:** *Promise‹void›*

___

###  recover

▸ **recover**(): *Promise‹void›*

*Defined in [helpers/jobs.ts:60](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L60)*

**Returns:** *Promise‹void›*

___

###  restart

▸ **restart**(): *Promise‹void›*

*Defined in [helpers/jobs.ts:53](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L53)*

**Returns:** *Promise‹void›*

___

###  resume

▸ **resume**(): *Promise‹void›*

*Defined in [helpers/jobs.ts:49](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L49)*

**Returns:** *Promise‹void›*

___

###  run

▸ **run**(): *Promise‹void›*

*Defined in [helpers/jobs.ts:70](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L70)*

**Returns:** *Promise‹void›*

___

###  save

▸ **save**(): *Promise‹void›*

*Defined in [helpers/jobs.ts:74](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L74)*

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(`action`: string): *Promise‹void›*

*Defined in [helpers/jobs.ts:131](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L131)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`action` | string | "start" |

**Returns:** *Promise‹void›*

___

###  status

▸ **status**(`saveState`: boolean, `showJobs`: boolean): *Promise‹void›*

*Defined in [helpers/jobs.ts:78](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L78)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`saveState` | boolean | false |
`showJobs` | boolean | true |

**Returns:** *Promise‹void›*

___

###  statusCheck

▸ **statusCheck**(`statusList`: string[]): *Promise‹string[]›*

*Defined in [helpers/jobs.ts:112](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`statusList` | string[] |

**Returns:** *Promise‹string[]›*

___

###  stop

▸ **stop**(`action`: string): *Promise‹void›*

*Defined in [helpers/jobs.ts:193](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L193)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`action` | string | "stop" |

**Returns:** *Promise‹void›*

___

###  workers

▸ **workers**(): *Promise‹void›*

*Defined in [helpers/jobs.ts:39](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/jobs.ts#L39)*

**Returns:** *Promise‹void›*
