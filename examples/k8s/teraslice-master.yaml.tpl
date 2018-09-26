terafoundation:
    environment: 'development'
    log_level: debug
    connectors:
        elasticsearch:
            default:
                host:
                    - "elasticsearch:9200"
teraslice:
    worker_disconnect_timeout: 120000
    node_disconnect_timeout: 120000
    slicer_timeout: 60000
    shutdown_timeout: 30000
    assets_directory: '/app/assets/'
    cluster_manager_type: "kubernetes"
    master: true
    master_hostname: "127.0.0.1"
    kubernetes_image: "teraslice-k8sdev"
    kubernetes_image_pull_secrets:
        - "docker-tera1-secret"
    kubernetes_namespace: "ts-dev1"
    name: "ts-dev1"
