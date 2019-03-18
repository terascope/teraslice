---
title: K8s Clustering
sidebar_label: K8s
---

Teraslice supports the use of Kubernetes as a cluster manager.  The following
versions of Kuberenetes have been used:

* `1.10.*`
* `1.11.*`
* `1.12.*`
* `1.13.2`

We are not yet making an effort to ensure compatibility with older Kubernetes
versions, so the newest version listed above is likely to be the best choice.

# Setup

You need Elasticsearch running and listening on a port accessible by the
Teraslice master and worker nodes.  In the case of minikube based deployments
(dev/test only) you'll need to make ES listen on your VirtualBox interface.  The
IP address of that interface is what you need to set as:

    `terafoundation.connectors.elasticsearch.default.host`

in both the `teraslice-master` and `teraslice-worker` ConfigMaps.

## `default` ServiceAccount Binding

In order to run Teraslice Jobs in your Kubernetes cluster the Teraslice master
node will need the ability create, list and delete Kubernetes Jobs, Deployments,
Services and Pods.  Teraslice has the ability to run in an isolated Kubernetes
namespace so users don't have to grant broad permissions to the Teraslice
master.  Users can configure the Teraslice master to use a specific namespace
with the `kubernetes_namespace` configuration option.  Users would then have
to create a Kubernetes `Role` and `RoleBinding` as shown below:

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: teraslice-all-<NAMESPACE>
  namespace: <NAMESPACE>
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
```

```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: teraslice-all-<NAMESPACE>
  namespace: <NAMESPACE>
subjects:
  - kind: ServiceAccount
    name: default
    namespace: <NAMESPACE>
roleRef:
  kind: Role
  name: teraslice-all-<NAMESPACE>
  apiGroup: "rbac.authorization.k8s.io"
```

Currently, Teraslice interacts with Kubernetes using the
`default ServiceAccount` in the configured namespace.

## Master Deployment

The Teraslice master node needs to be deployed in k8s by the user.  It should
be deployed in a namespace mentioned above.  It should have a k8s service that
exposes port `5678` for user interaction.  The cluster master will only show
up in cluster state if it is deployed with the label `clusterName` set to the
clustername modified as follows:

```javascript
clusterName.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 63)
```

It is not necessary that the master be in cluster state for Teraslice to work,
it's just kind of nice to have.

# Kubernetes Specific Configuration Settings

The table below shows the Teraslice configuration settings added
to support k8s based Teraslice deployments.

|        Configuration         |                                                                        Description                                                                         |  Type  |  Notes   |
|:----------------------------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------:|:------:|:--------:|
|        assets_volume         |                               Name of kubernetes volume to be shared across all pods, where Teraslice assets will be stored                                | String | optional |
|       kubernetes_image       |                                                     Name of docker image, default: `teraslice:k8sdev`                                                      | String | optional |
| kubernetes_image_pull_secret |                                                    Secret used to pull docker images from private repo                                                     | String | optional |
|  kubernetes_config_map_name  | Name of the configmap used by worker and execution_controller containers for config.  If this is not provided, the default will be `<CLUSTER_NAME>-worker` | String | optional |
|     kubernetes_namespace     |                                       Kubernetes Namespace that Teraslice will run in, default namespace: 'default'                                        | String | optional |

Note that the `assets_volume` should also be mounted to your Teraslice master pod.

# Teraslice Job Properties

Support for Kubernetes based clustering adds additional properties to a
Teraslice job definition.  These are outlined below.

## Resources

It is possible to set CPU and memory resource constraints for your Teraslice
workers that translate to Kubernetes resource constraints.  Currently you
can specify optional integer values on your job as shown below. The `cpu`
setting is in vcores and the `memory` setting is in bytes.

```json
"cpu": 1,
"memory": 2147483648
```

Setting `cpu` will result in the Kubernetes `resources.requests.cpu` and
`resources.limit.cpu` being set to `cpu` value provided.  Setting `memory`
will result in the Kubernetes `resources.requests.memory` and
`resources.limit.memory` being set to the `memory` value provided. See the
[Kubernetes Resource docs](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/)
for further details on how Kubernetes interprets these values.

## Node Affinity and Tolerance Using Teraslice Job Targets

If you need the workers (and execution controller) of your job to execute on
specific set of nodes or tolerate node taints, you can use the Teraslice
`targets` property on your job.  The simplest form of using `targets` is to
specify a single target and by default Teraslice will configure your workers to
only run on nodes who's labels match the `key` and `value` specified as shown
below:

```json
"targets": [
    {"key": "zone", "value": "west"}
],
```

More advanced options are also available to control how your Teraslice workers
are scheduled in your Kubernetes cluster.  These options can be used by
specifying an optional `constraint` property on the `targets` specified on your
Teraslice job.  The available `constraint`s are:

* `required` - Pods will only be scheduled to nodes that match the label.  If
there are insufficient resources on the target nodes your job may have fewer
workers than requested.  This is the **default** if is `constraint` is omitted.
* `preferred` - Pods will be scheduled to nodes with this label, but if there
are insufficient resources, they may be scheduled on nodes without this label.
* `accepted` - Pods may be scheduled to nodes with the kubernetes taint
provided by this label.  This uses a Kubernetes tolerance.

### Examples

If you want to force pods to run on nodes with a given label, you can simply
specify a target with just a `key` and `value`:

```json
"targets": [
    {"key": "zone", "value": "west"}
],
```

Using the `"constraint": "required"` property, as shown below, achieves the same
thing:

```json
"targets": [
    {"key": "zone", "value": "west", "constraint": "required"}
],
```

Using `"constraint": "preferred"` establishes a looser constraint on the label:

```json
"targets": [
    {"key": "zone", "value": "west", "constraint": "preferred"}
],
```

If you wanted your Teraslice workers to target a set of nodes with a given label
but also wanted to guarantee the availability of these nodes for this workload
by applying a taint, you could use `required` to target the label, then use
`accepted` to tolerate that taint as follows:

```json
"targets": [
    {"key": "zone", "value": "west", "constraint": "required"}
    {"key": "region", "value": "texas", "constraint": "accepted"}
],
```

If you are not familiar with the details of Kubernetes affinity and
taint/tolerance mechanisms you can find more information in the Kubernetes
documentation below:

* [Kubernetes Node Affinity](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity)
* [Kubernetes Taints and Tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/)

### Pod Spec Details

Each of the Teraslice job target `constraint`s are implemented slightly
differently and it may be important for you to know exactly how these get
translated into the Kubernetes manifest.  Those details are described below.

#### Details of the `required` constraint

For each entry in `targets` without a `constraint` or if `contraint` is set to
`required`, the pod spec will include an entry in the `matchExpressions` list
under the `requiredDuringSchedulingIgnoredDuringExecution` affinity property.
The example below is what you would get if you provided two `required` targets:

```yaml
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: zone
                    operator: In
                    values:
                      - west
                  - key: region
                    operator: In
                    values:
                      - texas
```


#### Details of the `preferred` constraint

For each entry in `targets` with a `constraint` set to `preferred`, the pod spec
will include a separate preference in the list under the
`preferredDuringSchedulingIgnoredDuringExecution` affinity property.  For now,
all of these preferences will assume a weight of `1`.  The example
below is what you would get if you provided two `preferred` targets:

```yaml
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 1
              preference:
                matchExpressions:
                  - key: zone
                    operator: In
                    values:
                      - west
            - weight: 1
              preference:
                matchExpressions:
                  - key: region
                    operator: In
                    values:
                      - texas
```


#### Details of the `accepted` constraint

For each entry in `targets` with a `constraint` set to `accepted`, the pod spec
will include a separate toleration in the list under the `tolerations` property.
Both the `key` and `value` provided in the target will be used to match the
taint.  The example below is what you would get if you provided two `accepted`
targets:

```yaml
      tolerations:
        - key: zone
          operator: Equal
          value: west
          effect: NoSchedule
        - key: region
          operator: Equal
          value: texas
          effect: NoSchedule
```


## Attach existing volumes

One or more volumes can be specified on your job and these volumes will be
attached to your worker and execution controller pods at runtime.  The volumes
and their volume claims must exist prior to job execution.  Note that the `name`
property should be the name of the Kubernetes `persistentVolumeClaim`.  The
`path` is where the volume will be mounted within the containers in your pod.

```json
"volumes": [
    {"name": "teraslice-data1", "path": "/data"}
],
```

# Makefile

There is a `Makefile` I use to help bootstrap Teraslice and do repetitive tasks,
you can type `make` to see all of the possible targets.

The standard minikube based dev workflow is and requires the `teraslice-cli`
version `0.5.1` or higher:

```bash
cd examples/k8s
export NAMESPACE=ts-dev1
export TERASLICE_K8S_IMAGE=teraslice-k8sdev:1
minikube start --memory 4096 --cpus 4
eval $(minikube docker-env)
make build
make setup-all
make show
make register
make start
```

At this point you should be able to access your Teraslice instance on port 30678
on the minikube ip:

```bash
curl -Ss $(minikube ip):30678
{
    "arch": "x64",
    "clustering_type": "kubernetes",
    "name": "ts-dev1",
    "node_version": "v8.12.0",
    "platform": "linux",
    "teraslice_version": "v0.49.0"
}
```

And Elasticsearch should be accessible on port 30200:

```bash
curl -Ss $(minikube ip):30200
{
  "name" : "0iE0zM1",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "_Ba0EHSLSCmN_ebEfc4eGg",
  "version" : {
    "number" : "5.6.10",
    "build_hash" : "b727a60",
    "build_date" : "2018-06-06T15:48:34.860Z",
    "build_snapshot" : false,
    "lucene_version" : "6.6.1"
  },
  "tagline" : "You Know, for Search"
}
```

When you need to make another change to Teraslice, redeploy and run a new
job:

```bash
make rebuild
```

To tear everything down and start over, all you have to do is run:

```bash
make destroy-all
```

and start at `make build` above.
