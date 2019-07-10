---
title: Job Components: `TestContextAPIs`
sidebar_label: TestContextAPIs
---

# Interface: TestContextAPIs

## Hierarchy

  * [ContextAPIs](contextapis.md)

  * **TestContextAPIs**

## Indexable

● \[▪ **namespace**: *string*\]: any

### Index

#### Properties

* [foundation](testcontextapis.md#foundation)

#### Methods

* [getTestClients](testcontextapis.md#gettestclients)
* [registerAPI](testcontextapis.md#registerapi)
* [setTestClients](testcontextapis.md#settestclients)

## Properties

###  foundation

• **foundation**: *[FoundationApis](foundationapis.md)*

*Inherited from [ContextApis](contextapis.md).[foundation](contextapis.md#foundation)*

*Defined in [interfaces/context.ts:82](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/context.ts#L82)*

## Methods

###  getTestClients

▸ **getTestClients**(): *[TestClients](testclients.md)*

*Defined in [test-helpers.ts:100](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/test-helpers.ts#L100)*

**Returns:** *[TestClients](testclients.md)*

___

###  registerAPI

▸ **registerAPI**(`namespace`: *string*, `apis`: *any*): *void*

*Inherited from [ContextApis](contextapis.md).[registerAPI](contextapis.md#registerapi)*

*Defined in [interfaces/context.ts:83](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/context.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`apis` | any |

**Returns:** *void*

___

###  setTestClients

▸ **setTestClients**(`clients`: *[TestClientConfig](testclientconfig.md)[]*): *void*

*Defined in [test-helpers.ts:99](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/test-helpers.ts#L99)*

**Parameters:**

Name | Type |
------ | ------ |
`clients` | [TestClientConfig](testclientconfig.md)[] |

**Returns:** *void*
