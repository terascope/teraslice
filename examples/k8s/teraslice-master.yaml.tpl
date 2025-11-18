terafoundation:
    log_level: debug
    connectors:
        elasticsearch-next:
            default:
                node:
                    - "http://elasticsearch:9200"
teraslice:
    worker_disconnect_timeout: 60000
    node_disconnect_timeout: 60000
    slicer_timeout: 60000
    shutdown_timeout: 30000
    assets_directory: '/app/assets/'
    cluster_manager_type: "kubernetesV2"
    master: true
    master_hostname: "127.0.0.1"
    kubernetes_image: "teraslice-k8sdev"
    kubernetes_image_pull_secrets:
        - "docker-tera1-secret"
    kubernetes_namespace: "ts-dev1"
    kubernetes_overrides_enabled: true
    kubernetes_priority_class_name: 'high-priority'
    name: "ts-dev1"
    cpu: 1
    memory: 536870912
