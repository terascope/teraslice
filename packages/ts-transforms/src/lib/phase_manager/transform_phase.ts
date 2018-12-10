import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig, OperationsDictionary } from '../interfaces';
import PhaseBase from './base';
import * as Ops from '../operations';
import _ from 'lodash';

export default class TransformPhase implements PhaseBase {
     //@ts-ignore
    private opConfig: WatcherConfig;
    private transformPhase: OperationsDictionary;
    private hasTransforms: boolean;

    constructor(opConfig: WatcherConfig, configList:OperationConfig[]){
        this.opConfig = opConfig;
        const transformPhase: OperationsDictionary = {};

        _.forEach(configList, (config: OperationConfig) => {
            if (!config.refs && (config.source_field && config.target_field)) {
                if (!transformPhase[config.selector]) transformPhase[config.selector] = [];
                transformPhase[config.selector].push(new Ops.Transform(config))
            }
        });
        this.transformPhase = transformPhase;
        this.hasTransforms = Object.keys(transformPhase).length > 0;
    }

    run(dataArray: DataEntity[]): DataEntity[]{
        const { transformPhase, hasTransforms } = this;
        if (!hasTransforms) return dataArray;

        const resultsList: DataEntity[] = [];
        _.each(dataArray, (record) => {
            const selectors = record.getMetadata('selectors');
            let results = {};
            _.forOwn(selectors, (_value, key) => {
                if (transformPhase[key]) {
                    transformPhase[key].forEach(fn => _.merge(results, fn.run(record)));
                }
            });

            if (Object.keys(results).length > 0) {
                const newRecord = new DataEntity(results, { selectors });
                resultsList.push(newRecord);
            }
        });

        return resultsList;
    }
}
