---
title: Job Components Apiconfig
sidebar_label: Apiconfig
---

[APIConfig](apiconfig.md) /

# Interface: APIConfig

APIConfig is the configuration for loading APIs and Observers
into a ExecutionContext.

## Hierarchy

* **APIConfig**

## Indexable

● \[▪ **prop**: *string*\]: any

APIConfig is the configuration for loading APIs and Observers
into a ExecutionContext.

### Index

#### Properties

* [_name](apiconfig.md#_name)

## Properties

###  _name

• **_name**: *string*

*Defined in [src/interfaces/jobs.ts:46](https://github.com/terascope/teraslice/tree/5f4f0ae4e2e522131e7b050bf1df57afbaf8e1c9/packages/job-components/src/interfaces/jobs.ts#L46)*

The name of the api, this must be unique among any loaded APIs
but can be namespaced by using the format "example:0"
