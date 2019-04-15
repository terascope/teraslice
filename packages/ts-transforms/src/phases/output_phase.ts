
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { hasKeys } from './utils';
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

    requiredExtractions(data: DataEntity[]) {
        const finalResults: DataEntity[] = [];
        const isKeyMatchRequired = isKeyMatchRequiredFn(this.matchRequirements);

        for (let i = 0; i < data.length; i++) {
            const doc = data[i];
            const { otherExtractionsFound, requireExtractionsFound } = checkDoc(doc, isKeyMatchRequired);
            if (!requireExtractionsFound || (requireExtractionsFound && otherExtractionsFound)) {
                finalResults.push(doc);
            }
        }

        return finalResults;
    }

    public run(data: DataEntity[]): DataEntity[] {
        let results = data;

        if (this.hasRestrictedOutput) {
            results = restrictFields(results, this.restrictOutput);
        }

        if (this.hasRequirements) {
            results = this.requiredExtractions(results);
        }

        return results;
    }
}

function removeKeys(doc: DataEntity, dict: any) {
    for (const key in dict) {
        if (doc[key]) _.unset(doc, key);
    }
}

function restrictFields(data: DataEntity[], restrictOutput: any) {
    const restrictedData: DataEntity[] = [];
    for (let i = 0; i < data.length; i++) {
        const doc = data[i];
        removeKeys(doc, restrictOutput);
        if (hasKeys(doc)) restrictedData.push(doc);
    }
    return restrictedData;
}

function isKeyMatchRequiredFn(matchRequirements:any) {
    return function isKeyMatchRequired(key: string, docSelectorData: object) {
        let bool = false;
        const requiredKey = matchRequirements[key];

        if (requiredKey !== undefined) {
            if (requiredKey === '*') bool = true;
            if (requiredKey !== '*' && docSelectorData[requiredKey]) bool = true;
        }

        return bool;
    };
}

function checkDoc(doc: DataEntity, fn:any) {
    const docSelectorData = doc.getMetadata('selectors');
    let otherExtractionsFound = false;
    let requireExtractionsFound = false;
    for (const key in doc) {
        if (fn(key, docSelectorData)) {
            requireExtractionsFound = true;
        } else {
            otherExtractionsFound = true;
        }
    }
    return { otherExtractionsFound, requireExtractionsFound };
}
