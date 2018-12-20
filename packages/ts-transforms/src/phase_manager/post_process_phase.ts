
import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig } from '../interfaces';
import PhaseBase from './base';
import _ from 'lodash';

export default class PostProcessPhase extends PhaseBase {
    private hasPostProcessing: boolean;

    constructor(_opConfig: WatcherConfig, configList:OperationConfig[]) {
        super();

        function isPrimaryPostProcess(config: OperationConfig): boolean {
            return !_.has(config, 'refs') && (_.has(config, 'selector') && _.has(config, 'post_process'));
        }

        function isRefsPostProcess(config: OperationConfig): boolean {
            return _.has(config, 'refs') && _.has(config, 'post_process') ;
        }
        const sequence = [
            { type: 'post_process', filterFn: isPrimaryPostProcess },
            { type: 'post_process', filterFn: isRefsPostProcess }
        ];
        sequence.forEach((loadingConfig) => this.installOps(loadingConfig, configList));
        this.hasPostProcessing = Object.keys(this.phase).length > 0;
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasPostProcessing) return dataArray;
        const resultsList: DataEntity[] = [];

        _.each(dataArray, (data) => {
            const selectors = data.getMetadata('selectors');
            let record: DataEntity | null = data;

            _.forOwn(selectors, (_value, key) => {
                if (this.phase[key]) {
                    record = this.phase[key].reduce<DataEntity | null>((record, fn) => {
                        if (!record) return record;
                        return fn.run(record);
                    }, record);
                }
            });

            if (record && Object.keys(record).length > 0) {
                const secondarySelectors = record.getMetadata('selectors');
                record.setMetadata('selectors', _.assign(selectors, secondarySelectors));
                resultsList.push(record);
            }
        });

        return resultsList;
    }
}
