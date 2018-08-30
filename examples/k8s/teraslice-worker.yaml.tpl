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
    master: false
    master_hostname: "teraslice-master"
    kubernetes_image: "teraslice-k8sdev"
    name: "terak8s"
