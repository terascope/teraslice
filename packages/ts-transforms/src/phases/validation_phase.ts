
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { OperationConfig, WatcherConfig } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class ValidationPhase extends PhaseBase {
    constructor(_opConfig: WatcherConfig, configList:OperationConfig[], opsManager: OperationsManager) {
        super();

        function isPrimaryValidation(config: OperationConfig): boolean {
            return !_.has(config, 'follow') && (_.has(config, 'selector') && _.has(config, 'validation'));
        }

        function isRefsValidation(config: OperationConfig): boolean {
            return _.has(config, 'follow') && _.has(config, 'validation') ;
        }

        const sequence = [
            { type: 'validation', filterFn: isPrimaryValidation },
            { type: 'validation', filterFn: isRefsValidation },
        ];
        sequence.forEach((loadingConfig) => this.installOps(loadingConfig, configList, opsManager));
    }

    run(dataArray: DataEntity[]): DataEntity[] {
        if (!this.hasProcessing) return dataArray;
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
                resultsList.push(record);
            }
        });

        return resultsList;
    }
}
