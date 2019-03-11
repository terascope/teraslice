
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { WatcherConfig, OutputValidation } from '../interfaces';
import PhaseBase from './base';
import { OperationsManager } from '../operations';

export default class OutputPhase extends PhaseBase {
    private restrictOutput: object;
    private matchRequirements: object;
    private hasRestrictedOutput: boolean;
    private hasRequirements: boolean;

    constructor(opConfig: WatcherConfig, outputConfig:OutputValidation, _opsManager: OperationsManager) {
        super(opConfig);
        this.restrictOutput = outputConfig.restrictOutput;
        this.matchRequirements = outputConfig.matchRequirements;
        this.hasRequirements = _.keys(this.matchRequirements).length > 0;
        this.hasRestrictedOutput = _.keys(this.restrictOutput).length > 0;
    }

    restrictFields(data: DataEntity[]) {
        const restrictedData: DataEntity[] = [];
        _.each(data, (doc: DataEntity) => {
            _.forOwn(this.restrictOutput, (_value, key) => {
                _.unset(doc, key);
            });
            if (_.keys(doc).length > 0) restrictedData.push(doc);
        });
        return restrictedData;
    }

    isKeyMatchRequired(key: string, docSelectorData: object): boolean {
        let bool = false;
        const requiredKey = this.matchRequirements[key];

        if (requiredKey !== undefined) {
            if (requiredKey === '*') bool = true;
            if (requiredKey !== '*' && docSelectorData[requiredKey]) bool = true;
        }

        return bool;
    }

    requiredExtractions(data: DataEntity[]) {
        const finalResults: DataEntity[] = [];

        _.each(data, (doc: DataEntity) => {
            let otherExtractionsFound = false;
            let requireExtractionsFound = false;
            const docSelectorData = doc.getMetadata('selectors');

            _.forOwn(doc, (_value, key) => {
                if (this.isKeyMatchRequired(key, docSelectorData)) {
                    requireExtractionsFound = true;
                } else {
                    otherExtractionsFound = true;
                }
            });

            if (!requireExtractionsFound || (requireExtractionsFound && otherExtractionsFound)) {
                finalResults.push(doc);
            }
        });

        return finalResults;
    }

    public run(data: DataEntity[]): DataEntity[] {
        let results = data;

        if (this.hasRestrictedOutput) {
            results = this.restrictFields(results);
        }

        if (this.hasRequirements) {
            results = this.requiredExtractions(results);
        }

        return results;
    }
}
