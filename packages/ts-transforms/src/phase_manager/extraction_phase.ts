
import { DataEntity } from '@terascope/job-components';
import _ from 'lodash';
import { OperationConfig, WatcherConfig, Operation } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class ExtractionPhase extends PhaseBase {
     // @ts-ignore
    private opConfig: WatcherConfig;

    constructor(opConfig: WatcherConfig, configList:OperationConfig[], opsManager: OperationsManager) {
        super();
        this.opConfig = opConfig;
        const Extraction = opsManager.getTransform('extraction');
        const matchRequireTransforms = (config: OperationConfig, _list:OperationConfig[]) => {
            _.forOwn(this.phase, (sequence: Operation[], _key) => {
                sequence.push(new Extraction(config));
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

        sequence.forEach((loadingConfig) => this.installOps(loadingConfig, configList, opsManager));
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
                    this.phase[key].forEach((fn) => {
                        const newRecord = fn.run(record);
                        if (newRecord) _.merge(metaData, newRecord.getMetadata());
                        return _.merge(results, newRecord);
                    });
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
