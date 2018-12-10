
import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig, OperationsDictionary, NormalizedConfig } from '../interfaces';
import PhaseBase from './base';
import _ from 'lodash';
import * as Operations from '../operations'

export default class PostProcessPhase implements PhaseBase {
      //@ts-ignore
    private opConfig: WatcherConfig;
    private postProcessPhase: OperationsDictionary;
    private hasPostProcessing: boolean;

    constructor(opConfig: WatcherConfig, configList:OperationConfig[]) {
        this.opConfig = opConfig;
        const postProcessPhase: OperationsDictionary = {};
        //TODO: look to refactor this
        _.forEach(configList, (config: OperationConfig) => {
            //post_process first
            if (config.selector && config.post_process && !config.refs) {
                const Op = Operations.opNames[config.post_process];
                if (!Op) throw new Error(`could not find post_process module config: ${JSON.stringify(config)}`);
                if (!postProcessPhase[config.selector]) postProcessPhase[config.selector] = [];
                postProcessPhase[config.selector].push(new Op(config))
            }
        });

        _.forEach(configList, (config: OperationConfig) => {
            // then do validations
            if (config.selector && config.validation && !config.refs) {
                const Op = Operations.opNames[config.validation];
                if (!Op) throw new Error(`could not find validation module ${JSON.stringify(config)}`);
                if (!postProcessPhase[config.selector]) postProcessPhase[config.selector] = [];
                postProcessPhase[config.selector].push(new Op(config))
            }
        });

        _.forEach(configList, (config: OperationConfig) => {          
            // convert refs to selectors
            if (config.refs) {
                const configData = this.normalizeConfig(config, configList)
                const opType = config.validation || config.post_process;
                const Op = Operations.opNames[opType as string];
                if (!Op) throw new Error(`could not find ${opType} module, config: ${JSON.stringify(config)}`);

                if (!postProcessPhase[configData.originalSelector]) postProcessPhase[configData.originalSelector] = [];
                postProcessPhase[configData.originalSelector].push(new Op(configData.configuration));
            }
        });
        this.postProcessPhase = postProcessPhase;
        this.hasPostProcessing = Object.keys(postProcessPhase).length > 0;
    }

    normalizeConfig(config: OperationConfig, configList:OperationConfig[]): NormalizedConfig {
        let originalSelector: string;
        let targetConfig: OperationConfig

        function findConfiguration(myConfig: OperationConfig) {
            if (myConfig.refs) {
                const id = myConfig.refs;
                const referenceConfig = configList.find(obj => obj.id === id);
                if (!referenceConfig) throw new Error(`could not find configuration id for refs ${id}`);
                if (!targetConfig) targetConfig = referenceConfig;
                // recurse
                if (referenceConfig.refs) {
                    findConfiguration(referenceConfig);
                } else {
                    originalSelector = referenceConfig.selector;
                }
            } else {
                originalSelector = myConfig.selector;
            }
        }

        findConfiguration(config);
        // @ts-ignore
        if (!originalSelector || !targetConfig) throw new Error('could not find orignal selector and target configuration')
        const finalConfig = _.assign({}, targetConfig, config);
        return { originalSelector, configuration: finalConfig };
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
                    results = postProcessPhase[key].reduce<DataEntity | null>((record, fn) => fn.run(record), results);
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