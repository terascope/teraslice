
# Utility Helm Chart

This chart creates a utility pod for use with teraslice k8s-env. The container has useful commands such as kcat, curl, ping, vim and jq.

There is also a useful script called fake_stream.sh which allows the container to stream a json file or other line delimited data to a kafka topic.

```sh
kubectl exec -it -n services-dev1 teraslice-utility-65dd78d788-xfp89 -- bash

root@teraslice-utility-65dd78d788-xfp89:~# ./fake_stream.sh /app/data/<my-file.json>
```

Place the file you wish to stream in `/teraslice/e2e/helm/utility/data`.
**NOTE**: If your data file is too large the utility pod will fail to deploy. In that case copy the file into the directory after the pod is up and running.

To use a different utility image set the `UTILITY_SVC_DOCKER_PROJECT_PATH` to the directory containing your `Dockerfile`.
