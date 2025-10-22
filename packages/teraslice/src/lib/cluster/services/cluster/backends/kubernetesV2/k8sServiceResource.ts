import { V1Service } from '@kubernetes/client-node';
import { Logger } from '@terascope/core-utils';
import type { Config, ExecutionConfig } from '@terascope/types';
import { convertToTSResource, makeTemplate } from './utils.js';
import { K8sConfig, NodeType, TSService } from './interfaces.js';
import { K8sResource } from './k8sResource.js';

export class K8sServiceResource extends K8sResource<TSService> {
    nodeType: NodeType = 'execution_controller';
    nameInfix = 'exc';
    templateGenerator: (config: K8sConfig) => TSService;
    templateConfig;
    resource;
    exName: string;
    exUid: string;

    /**
     * K8sServiceResource allows the generation of a k8s service based on a template.
     * After creating the object, the k8s service is accessible on the objects
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
        this.templateGenerator = makeTemplate('services', this.nodeType);
        this.templateConfig = this._makeConfig(this.nameInfix, exName, exUid);

        const k8sService = new V1Service();
        Object.assign(k8sService, this.templateGenerator(this.templateConfig));
        this.resource = convertToTSResource(k8sService);
    }
}
