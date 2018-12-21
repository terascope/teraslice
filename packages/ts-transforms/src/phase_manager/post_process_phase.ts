
import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig } from '../interfaces';
import PhaseBase from './base';
import _ from 'lodash';

export default class PostProcessPhase extends PhaseBase {
    constructor(_opConfig: WatcherConfig, configList:OperationConfig[]) {
        super();

        function isPrimaryPostProcess(config: OperationConfig): boolean {
            return !_.has(config, 'follow') && (_.has(config, 'selector') && _.has(config, 'post_process'));
        }

        function isRefsPostProcess(config: OperationConfig): boolean {
            return _.has(config, 'follow') && _.has(config, 'post_process') ;
        }
        const sequence = [
            { type: 'post_process', filterFn: isPrimaryPostProcess },
            { type: 'post_process', filterFn: isRefsPostProcess }
        ];
        sequence.forEach((loadingConfig) => this.installOps(loadingConfig, configList));
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        _.each(dataArray, (data) => {
            const startingMetaData = data.getMetadata();
            const { selectors } = startingMetaData;
            let record: DataEntity | null = data;

            _.forOwn(selectors, (_value, key) => {
                if (this.phase[key]) {
                    record = this.phase[key].reduce<DataEntity | null>((record, fn) => {
                        if (!record) return record;
                        return fn.run(record);
                    }, record);
                }
            });

            if (record != null && Object.keys(record).length > 0) {
                const postMetaData = record.getMetadata();
                const finalMetaData = _.merge(postMetaData, startingMetaData);
                _.forOwn(finalMetaData, (value, key) => {
                    // @ts-ignore
                    if (key !== 'createdAt') record.setMetadata(key, value);
                });
                resultsList.push(record);
            }
        });

        return resultsList;
    }
}
