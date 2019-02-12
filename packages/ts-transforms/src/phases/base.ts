
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { OperationConfig, NormalizedConfig, OperationsPipline, ConfigResults, injectFn, filterFn } from '../interfaces';
import { OperationsManager } from '../operations';

export default abstract class PhaseBase {
    readonly phase: OperationsPipline;
    public hasProcessing: boolean;

    constructor() {
        this.phase = {};
        this.hasProcessing = false;
    }

    abstract run(data: DataEntity[]): DataEntity[];

    protected installOps({ type, filterFn, injectFn }: { type: string, filterFn: filterFn, injectFn?:injectFn} , configList:OperationConfig[], opsManager: OperationsManager) {

        const loadOp = (opName: string, configData: NormalizedConfig) => {
            const Op = opsManager.getTransform(opName as string);
            if (!this.phase[configData.registrationSelector]) this.phase[configData.registrationSelector] = [];
            this.phase[configData.registrationSelector].push(new Op(configData.configuration));

        };

        _.forEach(configList, (config: OperationConfig, _ind, list) => {
            if (filterFn(config)) {
                if (injectFn) {
                    injectFn(config, list);
                }
                if (!injectFn && !config.other_match_required) {
                    const configData = this.normalizeConfig(config, type, configList);
                    if (type === 'selector') loadOp('selector', configData);
                    if (type === 'extraction') loadOp('extraction', configData);
                    if (type === 'post_process') {
                        if (config['post_process']) loadOp(config['post_process'], configData);
                        if (config['validation']) loadOp(config['validation'], configData);
                    }
                }
            }
        });
        this.hasProcessing = Object.keys(this.phase).length > 0;
    }

    protected normalizeConfig(config: OperationConfig, type: string, configList:OperationConfig[]): NormalizedConfig {
        const data = { registrationSelector: config.selector, targetConfig: null };

        function findConfiguration(myConfig: OperationConfig, container: ConfigResults): ConfigResults {
            if (myConfig.follow) {
                const id = myConfig.follow;
                const referenceConfig = configList.find(obj => obj.tag === id);
                if (!referenceConfig) throw new Error(`could not find configuration tag identifier for follow ${id}`);
                if (!container.targetConfig && referenceConfig.target_field) container.targetConfig = referenceConfig;
                // recurse
                if (referenceConfig.follow) {
                    return findConfiguration(referenceConfig, container);
                }
                if (referenceConfig.selector) container.registrationSelector = referenceConfig.selector;
            } else {
                if (!container.targetConfig) container.targetConfig = myConfig;
                if (!container.registrationSelector && myConfig.selector) container.registrationSelector = myConfig.selector;
            }
            return container;
        }

        const { registrationSelector, targetConfig } = findConfiguration(config, data);
        if (!config.other_match_required && !registrationSelector || !targetConfig) throw new Error('could not find orignal selector and target configuration');
        // a validation/post-op source is the target_field of the previous op
        const formattedTargetConfig = {};
        // TODO: look at this deeper
        if (!(config.follow && config.source_field) && targetConfig.target_field && (type === 'validation' || type === 'post_process')) {
            formattedTargetConfig['source_field'] = targetConfig.target_field;
        }
        const finalConfig = _.assign({}, config, formattedTargetConfig);

        return { configuration: finalConfig, registrationSelector: registrationSelector as string };
    }
}
