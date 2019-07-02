---
title: Job Components Interfaces Context Terasliceconfig
sidebar_label: Interfaces Context Terasliceconfig
---

> Interfaces Context Terasliceconfig for @terascope/job-components

[Globals](../overview.md) / ["interfaces/context"](../modules/_interfaces_context_.md) / [TerasliceConfig](_interfaces_context_.terasliceconfig.md) /

# Interface: TerasliceConfig

## Hierarchy

* **TerasliceConfig**

### Index

#### Properties

* [action_timeout](_interfaces_context_.terasliceconfig.md#action_timeout)
* [analytics_rate](_interfaces_context_.terasliceconfig.md#analytics_rate)
* [assets_directory](_interfaces_context_.terasliceconfig.md#optional-assets_directory)
* [assets_volume](_interfaces_context_.terasliceconfig.md#optional-assets_volume)
* [cluster_manager_type](_interfaces_context_.terasliceconfig.md#cluster_manager_type)
* [cpu](_interfaces_context_.terasliceconfig.md#optional-cpu)
* [hostname](_interfaces_context_.terasliceconfig.md#hostname)
* [index_rollover_frequency](_interfaces_context_.terasliceconfig.md#index_rollover_frequency)
* [kubernetes_config_map_name](_interfaces_context_.terasliceconfig.md#optional-kubernetes_config_map_name)
* [kubernetes_image](_interfaces_context_.terasliceconfig.md#optional-kubernetes_image)
* [kubernetes_image_pull_secret](_interfaces_context_.terasliceconfig.md#optional-kubernetes_image_pull_secret)
* [kubernetes_namespace](_interfaces_context_.terasliceconfig.md#optional-kubernetes_namespace)
* [master](_interfaces_context_.terasliceconfig.md#master)
* [master_hostname](_interfaces_context_.terasliceconfig.md#master_hostname)
* [memory](_interfaces_context_.terasliceconfig.md#optional-memory)
* [name](_interfaces_context_.terasliceconfig.md#name)
* [network_latency_buffer](_interfaces_context_.terasliceconfig.md#network_latency_buffer)
* [node_disconnect_timeout](_interfaces_context_.terasliceconfig.md#node_disconnect_timeout)
* [node_state_interval](_interfaces_context_.terasliceconfig.md#node_state_interval)
* [port](_interfaces_context_.terasliceconfig.md#port)
* [shutdown_timeout](_interfaces_context_.terasliceconfig.md#shutdown_timeout)
* [slicer_allocation_attempts](_interfaces_context_.terasliceconfig.md#slicer_allocation_attempts)
* [slicer_port_range](_interfaces_context_.terasliceconfig.md#slicer_port_range)
* [slicer_timeout](_interfaces_context_.terasliceconfig.md#slicer_timeout)
* [state](_interfaces_context_.terasliceconfig.md#state)
* [worker_disconnect_timeout](_interfaces_context_.terasliceconfig.md#worker_disconnect_timeout)
* [workers](_interfaces_context_.terasliceconfig.md#workers)

## Properties

###  action_timeout

• **action_timeout**: *number | `300000`*

*Defined in [interfaces/context.ts:20](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L20)*

___

###  analytics_rate

• **analytics_rate**: *number | `60000`*

*Defined in [interfaces/context.ts:21](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L21)*

___

### `Optional` assets_directory

• **assets_directory**? : *undefined | string*

*Defined in [interfaces/context.ts:22](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L22)*

___

### `Optional` assets_volume

• **assets_volume**? : *undefined | string*

*Defined in [interfaces/context.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L23)*

___

###  cluster_manager_type

• **cluster_manager_type**: *[ClusterManagerType](../modules/_interfaces_context_.md#clustermanagertype)*

*Defined in [interfaces/context.ts:24](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L24)*

___

### `Optional` cpu

• **cpu**? : *undefined | number*

*Defined in [interfaces/context.ts:26](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L26)*

This will only be available in the context of k8s

___

###  hostname

• **hostname**: *string*

*Defined in [interfaces/context.ts:27](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L27)*

___

###  index_rollover_frequency

• **index_rollover_frequency**: *[IndexRolloverFrequency](_interfaces_context_.indexrolloverfrequency.md)*

*Defined in [interfaces/context.ts:28](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L28)*

___

### `Optional` kubernetes_config_map_name

• **kubernetes_config_map_name**? : *string | "teraslice-worker"*

*Defined in [interfaces/context.ts:29](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L29)*

___

### `Optional` kubernetes_image

• **kubernetes_image**? : *string | "terascope/teraslice"*

*Defined in [interfaces/context.ts:31](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L31)*

___

### `Optional` kubernetes_image_pull_secret

• **kubernetes_image_pull_secret**? : *string | `""`*

*Defined in [interfaces/context.ts:30](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L30)*

___

### `Optional` kubernetes_namespace

• **kubernetes_namespace**? : *string | "default"*

*Defined in [interfaces/context.ts:32](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L32)*

___

###  master

• **master**: *boolean | false*

*Defined in [interfaces/context.ts:34](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L34)*

___

###  master_hostname

• **master_hostname**: *string | "localhost"*

*Defined in [interfaces/context.ts:33](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L33)*

___

### `Optional` memory

• **memory**? : *undefined | number*

*Defined in [interfaces/context.ts:36](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L36)*

This will only be available in the context of k8s

___

###  name

• **name**: *string | "teracluster"*

*Defined in [interfaces/context.ts:37](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L37)*

___

###  network_latency_buffer

• **network_latency_buffer**: *number | `15000`*

*Defined in [interfaces/context.ts:38](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L38)*

___

###  node_disconnect_timeout

• **node_disconnect_timeout**: *number | `300000`*

*Defined in [interfaces/context.ts:39](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L39)*

___

###  node_state_interval

• **node_state_interval**: *number | `5000`*

*Defined in [interfaces/context.ts:40](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L40)*

___

###  port

• **port**: *number | `5678`*

*Defined in [interfaces/context.ts:41](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L41)*

___

###  shutdown_timeout

• **shutdown_timeout**: *number | number*

*Defined in [interfaces/context.ts:42](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L42)*

___

###  slicer_allocation_attempts

• **slicer_allocation_attempts**: *number | `3`*

*Defined in [interfaces/context.ts:43](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L43)*

___

###  slicer_port_range

• **slicer_port_range**: *string | "45679:46678"*

*Defined in [interfaces/context.ts:44](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L44)*

___

###  slicer_timeout

• **slicer_timeout**: *number | `180000`*

*Defined in [interfaces/context.ts:45](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L45)*

___

###  state

• **state**: *[ClusterStateConfig](_interfaces_context_.clusterstateconfig.md)*

*Defined in [interfaces/context.ts:46](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L46)*

___

###  worker_disconnect_timeout

• **worker_disconnect_timeout**: *number | `300000`*

*Defined in [interfaces/context.ts:47](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L47)*

___

###  workers

• **workers**: *number | `4`*

*Defined in [interfaces/context.ts:48](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/context.ts#L48)*
