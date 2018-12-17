
import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig, OperationsDictionary, NormalizedConfig, ConfigResults } from '../interfaces';
import PhaseBase from './base';
import _ from 'lodash';
import * as Operations from '../operations'

export default class PostProcessPhase implements PhaseBase {
    private postProcessPhase: OperationsDictionary;
    private hasPostProcessing: boolean;

    constructor(_opConfig: WatcherConfig, configList:OperationConfig[]) {
        this.postProcessPhase = {};
        const sequence = [
            { type: 'post_process', filterFn: (config: OperationConfig) => config.selector && config.post_process && !config.refs },
            { type: 'validation', filterFn: (config: OperationConfig) => config.selector && config.validation && !config.refs },
            { type: 'post_process', filterFn: (config: OperationConfig) => config.refs && config.post_process },
            { type: 'validation', filterFn: (config: OperationConfig) => config.refs && config.validation },
        ];
        sequence.forEach((loadingConfig) => this.installOps(loadingConfig, configList));
        this.transformRequirements(configList)
        this.hasPostProcessing = Object.keys(this.postProcessPhase).length > 0;
    }

    installOps({ type, filterFn }: { type: string, filterFn: Function }, configList:OperationConfig[]) {
        const { postProcessPhase } = this;
        _.forEach(configList, (config: OperationConfig) => {          
            if (filterFn(config)) {
                const configData = this.normalizeConfig(config, configList);
                const opType = config[type];
                const Op = Operations.opNames[opType as string];
                if (!Op) throw new Error(`could not find ${opType} module, config: ${JSON.stringify(config)}`);
                if (!postProcessPhase[configData.registrationSelector]) postProcessPhase[configData.registrationSelector] = [];
                postProcessPhase[configData.registrationSelector].push(new Op(configData.configuration));
            }
        });
    }

    transformRequirements(configList:OperationConfig[]) {
        const requirements = {};
        _.each(configList, (config: OperationConfig) => {
            if (config.other_match_required) {
                const key = config.target_field || config.source_field;
                requirements[key as string] = true;
            }
        });
        if (Object.keys(requirements).length > 0) {
            const Op = Operations.Keys;
            if (Object.keys(this.postProcessPhase).length === 0) {
                this.postProcessPhase['*'] = [];
            }
            _.forOwn(this.postProcessPhase, (sequence: Operations.OperationBase[], _key) => {
                sequence.push(new Op(requirements));
            });
        }
    }

    normalizeConfig(config: OperationConfig, configList:OperationConfig[]): NormalizedConfig {
        const data = { registrationSelector: config.selector, targetConfig: null };

        function findConfiguration(myConfig: OperationConfig, container: ConfigResults): ConfigResults {
            if (myConfig.refs) {
                const id = myConfig.refs;
                const referenceConfig = configList.find(obj => obj.id === id);
                if (!referenceConfig) throw new Error(`could not find configuration id for refs ${id}`);
                if (!container.targetConfig) container.targetConfig = referenceConfig;
                // recurse
                if (referenceConfig.refs) {
                     return findConfiguration(referenceConfig, container);
                } else {
                    if (referenceConfig.selector) container.registrationSelector = referenceConfig.selector;
                }
            } else {
                if (!container.targetConfig) container.targetConfig = myConfig;
            }
            return container;
        }

         const { registrationSelector, targetConfig } = findConfiguration(config, data);
        if (!registrationSelector || !targetConfig) throw new Error('could not find orignal selector and target configuration');
        // a validation/post-op source is the target_field of the previous op
        const formattedTargetConfig = {};
        if (targetConfig.target_field) formattedTargetConfig['source_field'] = targetConfig.target_field
        const finalConfig = _.assign({}, config, formattedTargetConfig);

        return { configuration: finalConfig, registrationSelector };
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        const { postProcessPhase, hasPostProcessing } = this;
        if (!hasPostProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        _.each(dataArray, (record) => {
            const selectors = record.getMetadata('selectors');
            let results: DataEntity | null = record;

            _.forOwn(selectors, (_value, key) => {
                if (postProcessPhase[key]) {
                    results = postProcessPhase[key].reduce<DataEntity | null>((record, fn) => {
                        if (!record) return record;
                        return fn.run(record);
                    }, results);
                }
            });

            if (results && Object.keys(results).length > 0) {
                const secondarySelectors = results.getMetadata('selectors');
                results.setMetadata('selectors', _.assign(selectors, secondarySelectors))
                resultsList.push(results);
            }
        });

        return resultsList;
    }
}
