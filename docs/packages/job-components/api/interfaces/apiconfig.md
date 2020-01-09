---
title: Job Components: `APIConfig`
sidebar_label: APIConfig
---

# Interface: APIConfig

APIConfig is the configuration for loading APIs and Observers
into a ExecutionContext.

## Hierarchy

* **APIConfig**

## Indexable

* \[ **prop**: *string*\]: any

APIConfig is the configuration for loading APIs and Observers
into a ExecutionContext.

## Index

### Properties

* [_name](apiconfig.md#_name)

## Properties

###  _name

• **_name**: *string*

*Defined in [interfaces/jobs.ts:51](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L51)*

The name of the api, this must be unique among any loaded APIs
but can be namespaced by using the format "example:0"
