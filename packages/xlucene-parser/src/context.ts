import {
    parseGeoDistance,
    parseGeoPoint,
    toFloatOrThrow,
    toIntegerOrThrow,
} from '@terascope/utils';
import {
    GeoPoint,
    xLuceneFieldType,
    xLuceneTypeConfig,
} from '@terascope/types';
import * as i from './interfaces';
import * as utils from './utils';

const inferredFieldTypes = Object.freeze({
    [xLuceneFieldType.String]: true,
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function makeContext(arg: i.ContextArg) {
    let typeConfig: xLuceneTypeConfig;
    // eslint-disable-next-line
    ({ typeConfig = {} } = arg);
    if (!typeConfig) {
        throw new Error('xLucene Parser given invalid context');
    }

    /**
    * Propagate the default field on a field group expression
    */
    function propagateDefaultField(node: i.AnyAST, field: string): void {
        if (!node) return;

        if (utils.isRange(node)) {
            node.field ??= field;
            const fieldType = getFieldType(node.field);
            if (fieldType) node.field_type = fieldType;

            coerceTermType(node.left, node.field);
            if (node.right) coerceTermType(node.right, node.field);
            return;
        }

        if (utils.isTermType(node)) {
            node.field ??= field;
            coerceTermType(node, node.field);
            return;
        }

        if (utils.isNegation(node)) {
            propagateDefaultField(node.node, field);
            return;
        }

        if (utils.isGroupLike(node)) {
            for (const conj of node.flow) {
                propagateDefaultField(conj, field);
            }
            return;
        }

        if (utils.isConjunction(node)) {
            for (const conj of node.nodes) {
                propagateDefaultField(conj, field);
            }
        }
    }

    // The following functions are javascript functions and not
    // peg grammar because this is based off configuration passed
    // in and cannot be inferred by the syntax

    function getFieldType(field: string): xLuceneFieldType|undefined {
        if (!field) return;
        return typeConfig[field];
    }

    function isInferredTermType(field: string): boolean {
        const fieldType = getFieldType(field);
        if (!fieldType) return false;
        return inferredFieldTypes[fieldType] === true;
    }

    // parse an inferred field type
    function parseInferredTermType(field: string, value: any): i.TermLikeAST {
        const fieldType = getFieldType(field);
        const term: any = {
            type: i.ASTType.Term,
            field_type: fieldType,
        };

        if (fieldType === xLuceneFieldType.String) {
            term.quoted = false;
            term.value = {
                type: 'value',
                value: String(value),
            };
            return term;
        }

        utils.logger.warn(`Unsupported field inferred field type ${fieldType} for field ${field}`);
        term.value = { type: 'value', value };
        return term;
    }

    function coerceTermType(node: any, _field?: string): void {
        if (!node) return;

        const field = node.field || _field;
        if (!field) return;

        let fieldType = getFieldType(field);

        if (fieldType === xLuceneFieldType.AnalyzedString) {
            node.analyzed = true;
        }

        // in the case of analyzed fields we should update the
        // node to indicate so non-term level queries can be performed
        if (!node.analyzed && utils.isTermType(node) && !typeConfig[field] && field.includes('.')) {
            const parentField = field.split('.').slice(0, -1)[0];
            const parentType = typeConfig[parentField];
            if (parentType && parentType !== xLuceneFieldType.Object) {
                fieldType = parentType;
                node.analyzed = true;
            }
        }

        // we only want to coerce raw values with a field type
        if (fieldType && node.value?.type === 'value') {
            _coerceTermValue(node, field, fieldType);
        }

        // update the field type after the coercion
        if (fieldType) node.field_type = fieldType;
    }

    function _coerceTermValue(
        node: any,
        field: string,
        fieldType: xLuceneFieldType
    ): void {
        const value = node.value.value as any;
        utils.logger.trace(
            `coercing field "${field}":${value} type of ${node.field_type} to ${fieldType}`
        );

        if (node.type === i.ASTType.Term && fieldType === xLuceneFieldType.IPRange) {
            Object.assign(node, utils.createIPRangeFromTerm(node, value));
            return;
        }

        if (node.field_type !== fieldType && fieldType === xLuceneFieldType.Boolean) {
            node.type = i.ASTType.Term;
            delete node.quoted;
            delete node.restricted;
            if (value === 'true') {
                node.value = { type: 'value', value: true };
            }
            if (value === 'false') {
                node.value = { type: 'value', value: false };
            }
            return;
        }

        if (node.field_type !== fieldType && fieldType === xLuceneFieldType.Integer) {
            node.type = i.ASTType.Term;
            delete node.quoted;
            delete node.restricted;
            node.value = {
                type: 'value',
                value: toIntegerOrThrow(value)
            };
            return;
        }

        if (node.field_type !== fieldType && fieldType === xLuceneFieldType.Float) {
            node.type = i.ASTType.Term;
            delete node.quoted;
            delete node.restricted;
            node.value = {
                type: 'value',
                value: toFloatOrThrow(value),
            };
            return;
        }

        if (node.field_type !== fieldType && fieldType === xLuceneFieldType.String) {
            node.type = i.ASTType.Term;
            node.quoted ??= false;
            node.value = {
                type: 'value',
                value: String(value),
            };
        }
    }

    function throwOnOldGeoUsage(
        term: i.GeoBoundingBox|i.GeoDistance, field: string
    ): never {
        function formatPoint(point: GeoPoint) {
            return `"${point.lat},${point.lon}"`;
        }

        if (term.type === i.ASTType.GeoBoundingBox) {
            const example = `${field}:geoBox(bottom_right:${formatPoint(term.bottom_right)}, top_left:${formatPoint(term.top_left)})`;
            throw new Error(`Invalid geo bounding box syntax, please use "${example}" syntax instead`);
        }

        const example = `${field}:geoDistance(point:${formatPoint(term)}, distance:${term.distance})`;
        throw new Error(`Invalid geo distance syntax, please use "${example}" syntax instead`);
    }

    return {
        logger: utils.logger,
        parseGeoPoint,
        parseGeoDistance,
        coerceTermType,
        parseInferredTermType,
        isInferredTermType,
        propagateDefaultField,
        getFieldType,
        throwOnOldGeoUsage,
    };
}
