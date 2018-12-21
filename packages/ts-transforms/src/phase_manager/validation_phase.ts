import { DataEntity } from '@terascope/job-components';
import { OperationConfig, WatcherConfig } from '../interfaces';
import PhaseBase from './base';
import _ from 'lodash';
import * as Operations from '../operations';

export default class ValidationPhase extends PhaseBase {
    constructor(_opConfig: WatcherConfig, configList:OperationConfig[]) {
        super();

        function isPrimaryValidation(config: OperationConfig): boolean {
            return !_.has(config, 'follow') && (_.has(config, 'selector') && _.has(config, 'validation'));
        }

        function isRefsValidation(config: OperationConfig): boolean {
            return _.has(config, 'follow') && _.has(config, 'validation') ;
        }

        function isMatchRequired(config: OperationConfig): boolean {
            return _.has(config, 'other_match_required');
        }

        const extractionRequirements = _.once((_config, configList:OperationConfig[]) => {
            const requirements = {};
            _.each(configList, (config: OperationConfig) => {
                if (config.other_match_required) {
                    const key = config.target_field || config.source_field;
                    requirements[key as string] = true;
                }
            });
            if (Object.keys(requirements).length > 0) {
                if (!this.phase['__all']) this.phase['__all'] = [];
                this.phase.__all.push(new Operations.RequiredExtractions(requirements));
            }
        });

        const sequence = [
            { type: 'validation', filterFn: isPrimaryValidation },
            { type: 'validation', filterFn: isRefsValidation },
            { type: 'validation', filterFn: isMatchRequired, injectFn: extractionRequirements }
        ];
        sequence.forEach((loadingConfig) => this.installOps(loadingConfig, configList));
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

            if (this.phase.__all) {
                record = this.phase.__all.reduce<DataEntity | null>((record, fn) => {
                    if (!record) return record;
                    return fn.run(record);
                }, record);
            }

            if (record && Object.keys(record).length > 0) {
                resultsList.push(record);
            }
        });

        return resultsList;
    }
}
