import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig, } from '../interfaces';
import PhaseBase from './base';
import * as Ops from '../operations';
import _ from 'lodash';

export default class TransformPhase extends PhaseBase {
     // @ts-ignore
    private opConfig: WatcherConfig;
    private hasTransforms: boolean;

    constructor(opConfig: WatcherConfig, configList:OperationConfig[]) {
        super();
        this.opConfig = opConfig;

        const matchRequireTransforms = (config: OperationConfig, _list:OperationConfig[]) => {
            _.forOwn(this.phase, (sequence: Ops.OperationBase[], _key) => {
                sequence.push(new Ops.Transform(config));
            });
        };

        function isTransformConfig(config: OperationConfig): boolean {
            return !_.has(config, 'refs') && (_.has(config, 'source_field') && _.has(config, 'target_field'));
        }

        function isMatchRequired(config: OperationConfig): boolean {
            return isTransformConfig(config) && _.has(config, 'other_match_required');
        }

        const sequence = [
            { type: 'transform', filterFn: isTransformConfig },
            { type: 'transform', filterFn: isMatchRequired, injectFn: matchRequireTransforms },
        ];

        sequence.forEach((loadingConfig) => this.installOps(loadingConfig, configList));
        this.hasTransforms = Object.keys(this.phase).length > 0;
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasTransforms) return dataArray;

        const resultsList: DataEntity[] = [];
        _.each(dataArray, (record) => {
            const selectors = record.getMetadata('selectors');
            const results = {};

            _.forOwn(selectors, (_value, key) => {
                if (this.phase[key]) {
                    this.phase[key].forEach(fn => _.merge(results, fn.run(record)));
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
