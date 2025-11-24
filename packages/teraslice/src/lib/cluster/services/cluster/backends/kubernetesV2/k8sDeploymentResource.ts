import { V1Deployment } from '@kubernetes/client-node';
import { Logger } from '@terascope/core-utils';
import type { Config, ExecutionConfig } from '@terascope/types';
import { convertToTSResource, makeTemplate } from './utils.js';
import { K8sConfig, NodeType, TSDeployment } from './interfaces.js';
import { K8sResource } from './k8sResource.js';

export class K8sDeploymentResource extends K8sResource<TSDeployment> {
    nodeType: NodeType = 'worker';
    nameInfix = 'wkr';
    templateGenerator: (config: K8sConfig) => V1Deployment;
    templateConfig;
    resource;
    exName: string;
    exUid: string;

    /**
     * K8sDeploymentResource allows the generation of a k8s deployment based on a template.
     * After creating the object, the k8s deployment is accessible on the objects
     * .resource property.
     *
     * @param {Object} terasliceConfig - teraslice cluster config from context
     * @param {Object} execution - teraslice execution
     * @param {Logger} logger - teraslice logger
     * @param {String} exName - name from execution resource
     * @param {String} exUid - uid from execution resource
     */
    constructor(
        terasliceConfig: Config,
        execution: ExecutionConfig,
        logger: Logger,
        exName: string,
        exUid: string
    ) {
        super(terasliceConfig, execution, logger);
        this.execution = execution;
        this.logger = logger;
        this.terasliceConfig = terasliceConfig;
        this.exName = exName;
        this.exUid = exUid;
        this.templateGenerator = makeTemplate('deployments', this.nodeType);
        this.templateConfig = this._makeConfig(this.nameInfix, exName, exUid);
        const k8sDeployment = new V1Deployment();
        Object.assign(k8sDeployment, this.templateGenerator(this.templateConfig));
        this.resource = convertToTSResource(k8sDeployment);

        this._setJobLabels(this.resource);

        // Apply job `targets` setting as k8s nodeAffinity
        // We assume that multiple targets require both to match ...
        // NOTE: If you specify multiple `matchExpressions` associated with
        // `nodeSelectorTerms`, then the pod can be scheduled onto a node
        // only if *all* `matchExpressions` can be satisfied.
        this._setTargets(this.resource);
        this._setResources(this.resource);
        this._setVolumes(this.resource);
        if (process.env.MOUNT_LOCAL_TERASLICE !== undefined) {
            this._mountLocalTeraslice(this.resource);
        }
        this._setEnvVariables();
        this._setAssetsVolume(this.resource);
        this._setImagePullSecret(this.resource);
        this._setEphemeralStorage(this.resource);
        this._setExternalPorts(this.resource);
        this._setPriorityClassName(this.resource);
        this._setWorkerAntiAffinity(this.resource);

        // override must happen last
        if (this.terasliceConfig.kubernetes_overrides_enabled) {
            this._mergePodSpecOverlay(this.resource);
        }
    }
}
