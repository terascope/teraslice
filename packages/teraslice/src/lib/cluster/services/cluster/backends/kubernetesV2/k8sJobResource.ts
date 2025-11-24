import { V1Job } from '@kubernetes/client-node';
import { Logger } from '@terascope/core-utils';
import type { Config, ExecutionConfig } from '@terascope/types';
import { convertToTSResource, makeTemplate } from './utils.js';
import { K8sConfig, NodeType, TSJob } from './interfaces.js';
import { K8sResource } from './k8sResource.js';

export class K8sJobResource extends K8sResource<TSJob> {
    nodeType: NodeType = 'execution_controller';
    nameInfix = 'exc';
    templateGenerator: (config: K8sConfig) => V1Job;
    templateConfig;
    resource;

    /**
     * K8sJobResource allows the generation of a k8s job based on a template.
     * After creating the object, the k8s job is accessible on the objects
     * .resource property.
     *
     * @param {Object} terasliceConfig - teraslice cluster config from context
     * @param {Object} execution - teraslice execution
     * @param {Logger} logger - teraslice logger
     */
    constructor(
        terasliceConfig: Config,
        execution: ExecutionConfig,
        logger: Logger
    ) {
        super(terasliceConfig, execution, logger);
        this.templateGenerator = makeTemplate('jobs', this.nodeType);
        this.templateConfig = this._makeConfig(this.nameInfix);
        const k8sJob = new V1Job();
        Object.assign(k8sJob, this.templateGenerator(this.templateConfig));
        this.resource = convertToTSResource(k8sJob);

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

        // Execution controller targets are required nodeAffinities, if
        // required job targets are also supplied, then *all* of the matches
        // will have to be satisfied for the job to be scheduled.  This also
        // adds tolerations for any specified targets
        this._setExecutionControllerTargets(this.resource);

        // override must happen last
        if (this.terasliceConfig.kubernetes_overrides_enabled) {
            this._mergePodSpecOverlay(this.resource);
        }
    }
}
