# Starting teraslice using helm and helmfile

```
kind create cluster --config kindConfig.yaml
```

```
kind load docker-image --name k8s-env ghcr.io/terascope/teraslice:v2.7.0-nodev22.9.0
```

```
docker exec -it k8s-env-control-plane crictl images
```

```
helmfile diff
```

```
helmfile sync
```
