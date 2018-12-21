import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig, } from '../interfaces';
import PhaseBase from './base';
import * as Ops from '../operations';
import _ from 'lodash';

export default class ExtractionPhase extends PhaseBase {
     // @ts-ignore
    private opConfig: WatcherConfig;

    constructor(opConfig: WatcherConfig, configList:OperationConfig[]) {
        super();
        this.opConfig = opConfig;

        const matchRequireTransforms = (config: OperationConfig, _list:OperationConfig[]) => {
            _.forOwn(this.phase, (sequence: Ops.OperationBase[], _key) => {
                sequence.push(new Ops.Extraction(config));
            });
        };

        function isTransformConfig(config: OperationConfig): boolean {
            return !_.has(config, 'follow') && (_.has(config, 'source_field') && _.has(config, 'target_field'));
        }

        function isMatchRequired(config: OperationConfig): boolean {
            return isTransformConfig(config) && _.has(config, 'other_match_required');
        }

        const sequence = [
            { type: 'extraction', filterFn: isTransformConfig },
            { type: 'extraction', filterFn: isMatchRequired, injectFn: matchRequireTransforms },
        ];

        sequence.forEach((loadingConfig) => this.installOps(loadingConfig, configList));
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;

        const resultsList: DataEntity[] = [];
        _.each(dataArray, (record) => {
            const metaData =  record.getMetadata();
            const { selectors } = metaData;
            const results = {};

            _.forOwn(selectors, (_value, key) => {
                if (this.phase[key]) {
                    this.phase[key].forEach(fn => _.merge(results, fn.run(record)));
                }
            });

            if (Object.keys(results).length > 0) {
                const newRecord = new DataEntity(results, metaData);
                resultsList.push(newRecord);
            }
        });

        return resultsList;
    }
}
