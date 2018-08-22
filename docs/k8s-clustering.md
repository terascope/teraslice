# Kubernetes Clustering

** KUBERNETES SUPPORT IS STILL A WORK IN PROGRESS
These notes are intended for contributors only **

Teraslice supports the use of Kubernetes as a cluster manager.  The supported
versions of Kubernetes is:

* `1.10.*`

## Setup

You need Elasticsearch running and listening on a port accessible by the
Teraslice master and worker nodes.  In the case of minikube based deployments
(dev/test only) you'll need to make ES listen on your VirtualBox interface.  The
IP address of that interface is what you need to set as:

    `terafoundation.connectors.elasticsearch.default.host`

in both the `teraslice-master` and `teraslice-worker` ConfigMaps.

### `default` ServiceAccount Binding

As a development workaround, cluster admin privileges should be added to the
default ServiceAccount in the default namespace using the following command:

```
cd example/k8s
kubectl create -f teraslice-default-binding.yaml
```

This may not be appropriate for production environments.

### Kubernetes Specific Configuration Settings

|        Configuration         |                                                                         Description                                                                         |  Type  |  Notes   |
|:----------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------:|:------:|:--------:|
|       kubernetes_image       |                                                      Name of docker image, default: `teraslice:k8sdev`                                                      | String | optional |
| kubernetes_image_pull_secret |                                                     Secret used to pull docker images from private repo                                                     | String | optional |
|  kubernetes_config_map_name  | Name of the configmap used by worker and executcion_controller containers for config.  If this is not provided, the default will be `<CLUSTER_NAME>-worker` | String | optional |

# Makefile

There is a `Makefile` I use to help bootstrap Teraslice and do repetitive tasks,
you can type `make` to see all of the possible targets.

The standard minikube based dev workflow is:

```
cd examples/k8s
export NAMESPACE=ts-dev1
export TERASLICE_K8S_IMAGE=teraslice-k8sdev:1
make build
make setup-all
make show
make register
make example
```

then when you need to make another change to Teraslice, redeploy and run a new
job:

```
make destroy
export TERASLICE_K8S_IMAGE=teraslice-k8sdev:2
make build
make setup
make register
make example
```
