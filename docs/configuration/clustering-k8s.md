---
title: Kubernetes Clustering
sidebar_label: Kubernetes Clustering
---

Teraslice supports the use of Kubernetes as a cluster manager. The following
versions of Kubernetes have been used:

* `1.22.*`
* `1.20.*`
* `1.19.*`
* `1.18.*`
* `1.17.*`
* `1.16.*`
* `1.13.2`
* `1.12.*`
* `1.11.*`
* `1.10.*`

We are not yet making an effort to ensure compatibility with older Kubernetes
versions, so the newest version listed above is likely to be the best choice.

## Setup

You need Elasticsearch running and listening on a port accessible by the
Teraslice master and worker nodes.  In the case of minikube based deployments
(dev/test only) you'll need to make ES listen on your VirtualBox interface.  The
IP address of that interface is what you need to set as:

```yaml
terafoundation.connectors.elasticsearch_next.default.node
```

in both the `teraslice-master` and `teraslice-worker` ConfigMaps.

## ServiceAccount Binding

In order to run Teraslice Jobs in your Kubernetes cluster the Teraslice master
node will need the ability create, list and delete Kubernetes Jobs, Deployments,
Services and Pods.  Teraslice has the ability to run in an isolated Kubernetes
namespace so users don't have to grant broad permissions to the Teraslice
master.  Users can configure the Teraslice master to use a specific namespace
with the `kubernetes_namespace` configuration option.  Users would then have
to create a Kubernetes `ServiceAccount`, `Role` and `RoleBinding` as shown below:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: master-service-account
  namespace: ts-dev1
```

Make sure to reference this `ServiceAccount` in the master deployment configuration by setting `spec.template.spec.serviceAccountName` to `master-service-account` inside of [/e2e/k8s/masterDeployment.yaml](../../e2e/k8s/masterDeployment.yaml).

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: teraslice-master-role-ts-dev1
  namespace: ts-dev1
rules:
  - apiGroups: [""]  # Core API group for resources like pods, configmaps
    resources: ["pods", "configmaps", "services"]
    verbs: ["get", "create", "delete", "list", "update", "patch"]
  - apiGroups: ["apps"]  # Apps API group for deployments and replica sets
    resources: ["deployments", "replicasets"]
    verbs: ["get", "create", "delete", "list", "update", "patch"]
  - apiGroups: ["batch"]  # batch API group for jobs
    resources: ["jobs"]
    verbs: ["get", "create", "delete", "list", "update", "patch"]

```

```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: teraslice-master-<NAMESPACE>
  namespace: <NAMESPACE>
subjects:
  - kind: ServiceAccount
    name: master-service-account
    namespace: <NAMESPACE>
roleRef:
  kind: Role
  name: teraslice-master-role-<NAMESPACE>
  apiGroup: "rbac.authorization.k8s.io"
```

## Master Deployment

The Teraslice master node needs to be deployed in k8s by the user.  It should
be deployed in a namespace mentioned above.  It should have a k8s service that
exposes port `5678` for user interaction.  The cluster master will only show
up in cluster state if it is deployed with the label `clusterName` set to the
cluster name modified as follows:

```js
clusterName.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 63)
```

It is not necessary that the master be in cluster state for Teraslice to work,
it's just kind of nice to have.

## Kubernetes Specific Configuration Settings

The table below shows the Teraslice Master configuration settings added to
support k8s based Teraslice deployments.

|         Configuration          |                                                                        Description                                                                         |  Type   |  Notes   |
|:------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------:|:-------:|:--------:|
|         assets_volume          |                               Name of kubernetes volume to be shared across all pods, where Teraslice assets will be stored                                | String  | optional |
|    cpu_execution_controller    |                                           CPU resources to use for Execution Controller request and limit values                                           | Number  | optional |
|  execution_controller_targets  |                                       array of `{"key": "rack", "value": "alpha"}` targets for execution controllers                                       | String  | optional |
|   kubernetes_api_poll_delay    |                               Specify the delay between attempts to poll the kubernetes API, `1000` by default                                            | Number  |  optional  |
|        kubernetes_image        |                                                     Name of docker image, default: `teraslice:k8sdev`                                                      | String  | optional |
|  kubernetes_image_pull_secret  |                                                    Secret used to pull docker images from private repo                                                     | String  | optional |
|   kubernetes_config_map_name   | Name of the configmap used by worker and execution_controller containers for config.  If this is not provided, the default will be `<CLUSTER_NAME>-worker` | String  | optional |
|      kubernetes_namespace      |                                       Kubernetes Namespace that Teraslice will run in, default namespace: 'default'                                        | String  | optional |
|  kubernetes_overrides_enabled  |                                       Enable the `pod_spec_override` feature on job definitions, `false` by default.                                       | Boolean | optional |
| kubernetes_priority_class_name |                            Priority class that the Teraslice master, execution controller, and stateful workers should run with                            | String  | optional |
| kubernetes_worker_antiaffinity |                                   If `true`, pod antiaffinity will be enabled for Teraslice workers, `false` by default                                    | Boolean | optional |
|  memory_execution_controller   |                                         Memory resources to use for Execution Controller request and limit values                                          | Number  | optional |

Note that the `assets_volume` should also be mounted to your Teraslice master pod.

Targets specified in the `execution_controller_targets` setting will result in
required NodeAffinities and tolerations being added to the execution controller
Jobs so that they can be targeted to specific parts of your k8s infrastructure.

In order for the setting `kubernetes_priority_class_name` to be useful, you
must create a Kubernetes `PriorityClass` with an appropriate priority for your
Kubernetes cluster.  See the
[Kubernetes `PriorityClass` documentation](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/)
for details.

## Teraslice Job Properties

Support for Kubernetes based clustering adds additional properties to a
Teraslice job definition.  These are outlined below.

### Ephemeral Storage

If your Teraslice job uses a processor that needs temporary local storage that
persists in the Kubernetes Pod across container restarts, you can set the
Teraslice Job Property `ephemeral_storage` to `true` on your job as shown
below.  This will create an [`emptyDir`](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)
style Ephemeral Volume accessible in your pod at the path `/ephemeral0`.

```json
    "ephemeral_storage": true
```

### External Ports

If for some reason you need to expose ports on your Teraslice workers in
Kubernetes, you can do so with the `external_ports` job property.  You can
provide either a simple number (that matches the port) or you can specify an
object with `name` (a string) and `port` (a number) properties.

```json
    "external_ports": [
        9090,
        {"name": "metrics", "port": 3333}
    ]
```

A job containing the `external_ports` shown above would result in the following
Kubernetes snippet:

```yaml
    ports:
    - containerPort: 9090
      protocol: TCP
    - containerPort: 3333
      name: metrics
      protocol: TCP
```

The reason this was added was to expose a Prometheus exporter on Teraslice
worker pods.

### Labels

Key value pairs added into a job's `labels` array, as shown below, will result
in labels being added to the k8s resources.  The k8s labels will be prefixed
with `job.teraslice.terascope.io/`.

```json
    "labels": {
        "key1": "value1"
    },
```

If `labels` is omitted, the k8s resources will just have the standard set of
labels that Teraslice uses.

### Resources

It is possible to set CPU and memory resource constraints for your Teraslice
Workers that translate to Kubernetes resource constraints.  Resources for
Execution Controllers are handled separately and described below.

#### New Method for Setting Resources

The new method for setting CPU and memory resources on Teraslice workers allows
you to explicitly set the CPU and memory requests and limits separately on the
Teraslice Job, which will result in the Kubernetes deployment for the Teraslice
workers having the corresponding resource set.  You may set any combination of
the following resources on your job or omit them entirely.

```json
"resources_requests_cpu": 0.25,
"resources_limits_cpu": 1,
"resources_requests_memory": 128000000,
"resources_limits_memory": 536870912,
```

The cpu settings are in [Kubernetes CPU Units](https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/#cpu-units)
and the memory settings are in bytes.

Note: The old method of setting just `cpu` or `memory` on the job or in the
Teraslice master config file will be ignored if any of the new `resource_*` job
properties are configured.

#### Old Method for Setting Resources

**DEPRECATED** This older method of specifying CPU and memory resources should
be avoided and will be removed in future versions.  They are only present
briefly to aid in the migration of jobs.

You can specify optional integer values on your job or in the Teraslice master
configuration as shown below. The `cpu` setting is in vcores and the `memory`
setting is in bytes.  Teraslice `cpu` and `memory` settings on your Teraslice
Job override any settings in the master configuration.  Both are optional,
excluding them results in Teraslice Worker pods with no resource requests or
limits.

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

#### Execution Controller Resources

Teraslice Execution Controllers typically have vastly different resource needs
from Workers on the same Job so you can now set these separately.  By default,
the Kubernetes pods for Teraslice Execution controllers automatically get the
following resource requests and limits:

```json
"cpu_execution_controller": 0.5,
"memory_execution_controller": 512000000 // 512 MB
```

These defaults can be overridden either in your Teraslice Job or in the
Teraslice Master configuration.  Settings on your Teraslice Job override the
settings in the Master configuration.  The behavior of these two settings is
the same as the Worker settings with the exception of the default being applied
in the Execution Controller case.

### Stateful Workers

Teraslice jobs which use processors that maintain internal state might need
special handling in Kubernetes.  To support this we have the job property
`stateful`.  Setting it `stateful: true` in your Teraslice job will result the
following things:

* Teraslice workers for this job will have `priorityClassName` set equal to the
`kubernetes_priority_class_name` setting.  This is meant to prevent preemption
of the worker pods which could otherwise happen.
* All of the Teraslice worker pods will have the Kubernetes label
`job-property.teraslice.terascope.io/stateful: true`.

This property is a boolean, so is simply set like:

```json
"stateful": true
```

### Node Affinity and Tolerance Using Teraslice Job Targets

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

#### Examples

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

For each entry in `targets` without a `constraint` or if `constraint` is set to
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

### Attach existing volumes

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

### Pod `.spec` Overrides

Teraslice provides the `pod_spec_override` job property which allows the user to
specify any arbitrary Kubernetes configuration to be overlaid on the
[pod](https://kubernetes.io/docs/concepts/workloads/pods/) `.spec` for both the
execution controller and worker pods.  This allows users to "sneak" in
functionality that we have not yet explicitly implemented.

For instance, this feature can be used to add `initContainers` or `hostAliases`.
A `pod_spec_override` must be in the form of JSON that maps directly to the
appropriate YAML for the Kubernetes resource.  An example of a
`pod_spec_override` that could be added to a job is shown below:

```json
    "pod_spec_override": {
        "initContainers": [
            {
                "name": "init-hello-world",
                "image": "busybox:1.28",
                "command": [
                    "sh",
                    "-c",
                    "echo 'HELLO WORLD'"
                ]
            }
        ]
    },
```

**NOTE:** In certain circumstances, this feature could be abused by a malicious
job author, so it is off by default.  It can be enabled by setting
`kubernetes_overrides_enabled: true`.

### Prometheus Metrics

If using Prometheus for metrics gathering, you can start an exporter that will serve metrics at the following url: <br/>`http://localhost:<port>/metrics`.<br/>
The following properties will override the matching property set within the `terafoundation` configuration.
* `prom_metrics_enabled` - start a Prometheus exporter server
* `prom_metrics_port` - port the server will listen on
* `prom_metrics_add_default` - collect default metrics recommended by Prometheus as well as Node.js-specific metrics

## Kubernetes Labels

We automatically add labels to the Kubernetes resources created by Teraslice.
For resources related to specific jobs they will be labeled with the following:

* `app.kubernetes.io/component` - `execution_controller` or `worker`
* `app.kubernetes.io/instance` - the Teraslice cluster instance name
* `app.kubernetes.io/name` - always the string: `teraslice`
* `teraslice.terascope.io/exId` - the `exId`
* `teraslice.terascope.io/jobId` - the `jobId`
* `teraslice.terascope.io/jobName` - Teraslice job name, possibly modified

Note that the Teraslice job name is used in creating and labelling some of the
Kubernetes resources.  Rather than enforce kubernetes strict DNS naming
conventions on Teraslice job names, we modify the incoming Teraslice names to
fit those conventions.  This may result in the `jobName` label being non-unique,
`jobId` should be used instead.  Teraslice doesn't actually even enforce
uniqueness of job names, so doing so here wouldn't make sense.

## Development

### Running the Master in Minikube

This development setup should be used after most of your dev iterations are
complete to more fully emulate a production environment.  The Teraslice master
will be built as a container and executed in Minikube.

There is a `Makefile` I use to help bootstrap Teraslice and do repetitive tasks,
you can type `make` to see all of the possible targets.

The standard minikube based dev workflow is and requires the `teraslice-cli`
version `0.5.1` or higher.

Minikube now uses the Docker driver by default. If your Minikube is using a different driver skip to [Using a VM Minikube Driver](#using-a-vm-minikube-driver)

**If you are using the Docker Minikube Driver**

Terminal 1:
```bash
cd examples/k8s
export NAMESPACE=ts-dev1
export TERASLICE_K8S_IMAGE=teraslice-k8sdev:1
export TERASLICE_MODE=minikube
minikube start --memory 4096 --cpus 4
make build
make setup-all
make show
```

Confirm that both teraslice-master and elasticsearch are ready and available.  You may have to repeat the `make show` command periodically until you see that everything is up and running.
At this point the curl commands to elasticsearch and teraslice-master should have failed. We need to open tunnels from our local machine to these ports within minikube.

In two new terminal windows run the following commands. These must be left open to communicate with either service within minikube.

Terminal 2 - Open tunnel to elasticsearch:
```bash
minikube -n ts-dev1 service elasticsearch --url
```
Terminal 3 - Open tunnel to teraslice-master:
```bash
minikube -n ts-dev1 service teraslice-master --url
```
Return to the original terminal.

```bash
export ES_URL=http://path/to/elasticsearch/tunnel # copy the URL returned in terminal 2
export TERASLICE_MASTER_URL=http://path/to/teraslice-master/tunnel # copy the URL returned in terminal 3

earl aliases remove ts-minikube-dev1
earl aliases add ts-minikube-dev1 $TERASLICE_MASTER_URL

make show
make register
make start
```

At this point you should be able to access your Teraslice instance using the tunnel in terminal 3:

```bash
curl -Ss $TERASLICE_MASTER_URL
{
    "arch": "x64",
    "clustering_type": "kubernetes",
    "name": "ts-dev1",
    "node_version": "v8.12.0",
    "platform": "linux",
    "teraslice_version": "v0.49.0"
}
```

Or using `ts-top`:

```bash
ts-top -p <port listed in terminal 3> localhost
```

And Elasticsearch should be accessible using the tunnel in terminal 2:

```bash
curl -Ss $ES_URL
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
---
**Using a VM Minikube Driver:**
```bash
cd examples/k8s
export NAMESPACE=ts-dev1
export TERASLICE_K8S_IMAGE=teraslice-k8sdev:1
export TERASLICE_MODE=minikube
minikube start --memory 4096 --cpus 4
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

Or using `ts-top`:

```bash
ts-top -p 30678 $(minikube ip)
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
---
**Modifying Teraslice**

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

### Running the Master in Locally

This development setup allows for quicker iterations because the Teraslice
master runs outside of Minikube and doesn't require a docker build to happen.
Though this method is only suitable for work that doesn't require changes to the
containers used by the Teraslice Workers or Execution Controllers.  Only changes
local to the master will work.

```bash
cd examples/k8s
export NAMESPACE=ts-dev1
export TERASLICE_K8S_IMAGE=teraslice-k8sdev:1
export TERASLICE_MODE=hybrid
minikube start --memory 4096 --cpus 4
eval $(minikube docker-env)
make build
make setup-all
make show
make register
make start
# restart master
make master-stop
```

At this point you should be able to access your Teraslice instance on port 5678
on localhost:

```bash
curl -Ss localhost:5678
{
    "arch": "x64",
    "clustering_type": "kubernetes",
    "name": "ts-dev1",
    "node_version": "v8.12.0",
    "platform": "linux",
    "teraslice_version": "v0.49.0"
}
```

Or using `ts-top`:

```bash
ts-top
```

And Elasticsearch should be accessible on port 30200, just like in the minikube
case:

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

When you need to make another change to Teraslice, stop, then start the master
and run a new job:

```bash
# stop currently running job
make stop
# stop teraslice master
make master-stop
# use ps to wait for the teraslice master to stop
# make changes to code
# start teraslice master
make master-start
# start job
make start
```

To tear everything down and start over, all you have to do is run:

```bash
make destroy-all
```

### How to run tests

How to run just the unit tests on kubernetes backend:

```bash
# make sure dependencies are installed and typescript compiled
yarn setup
# run tests
DEBUG=True npx jest --detectOpenHandles packages/teraslice/test/lib/cluster/services/cluster/backends/kubernetes/
```
