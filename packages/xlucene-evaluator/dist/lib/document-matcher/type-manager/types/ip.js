"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_cidr_1 = __importDefault(require("is-cidr"));
const net_1 = require("net");
const ip6addr_1 = __importDefault(require("ip6addr"));
const base_1 = __importDefault(require("./base"));
const utils_1 = require("../../../utils");
const MIN_IPV4_IP = '0.0.0.0';
const MAX_IPV4_IP = '255.255.255.255';
const MIN_IPV6_IP = '0.0.0.0.0.0.0.0';
const MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';
const fnBaseName = 'ipFn';
class IpType extends base_1.default {
    constructor(ipFieldDict) {
        super(fnBaseName);
        this.fields = ipFieldDict;
        utils_1.bindThis(this, IpType);
    }
    processAst(ast) {
        const { filterFnBuilder, createParsedField, fields } = this;
        // used to denote the various filter functions with fnBaseName
        function populateIpQueries(node, _field) {
            const topField = node.field || _field;
            if (topField && fields[topField]) {
                if (node.term) {
                    const argeCidr = is_cidr_1.default(node.term);
                    if (argeCidr > 0) {
                        const range = ip6addr_1.default.createCIDR(node.term);
                        // This needs to be dynamic
                        filterFnBuilder((ip) => {
                            if (is_cidr_1.default(ip) > 0) {
                                const argRange = ip6addr_1.default.createCIDR(ip);
                                const argFirst = argRange.first().toString();
                                const argLast = argRange.last().toString();
                                const rangeFirst = range.first().toString();
                                const rangeLast = range.last().toString();
                                return (range.contains(argFirst) || range.contains(argLast) || argRange.contains(rangeFirst) || argRange.contains(rangeLast));
                            }
                            return range.contains(ip);
                        });
                    }
                    else {
                        filterFnBuilder((ip) => {
                            if (is_cidr_1.default(ip) > 0) {
                                const argRange = ip6addr_1.default.createCIDR(ip);
                                return argRange.contains(node.term);
                            }
                            return ip === node.term;
                        });
                    }
                }
                // RANGE EXPRESSIONS
                if (node.term_max !== undefined) {
                    let { inclusive_min: incMin, inclusive_max: incMax, term_min: minValue, term_max: maxValue } = node;
                    let range;
                    if (minValue === '*' && typeof maxValue === 'string')
                        net_1.isIPv6(maxValue) ? minValue = MIN_IPV6_IP : minValue = MIN_IPV4_IP;
                    if (maxValue === '*' && typeof minValue === 'string')
                        net_1.isIPv6(minValue) ? maxValue = MAX_IPV6_IP : maxValue = MAX_IPV4_IP;
                    // ie ip:{ 0.0.0.0 TO *] ||  ip:{0.0.0.0 TO 1.1.1.1]
                    if (!incMin && incMax) {
                        minValue = ip6addr_1.default.parse(minValue).offset(1).toString();
                        range = ip6addr_1.default.createAddrRange(minValue, maxValue);
                    }
                    // ie age:<10 || age:(<=10 AND >20)
                    if (incMin && !incMax) {
                        maxValue = ip6addr_1.default.parse(maxValue).offset(-1).toString();
                        range = ip6addr_1.default.createAddrRange(minValue, maxValue);
                    }
                    // ie age:<=10, age:>=10, age:(>=10 AND <=20)
                    if (incMin && incMax) {
                        range = ip6addr_1.default.createAddrRange(minValue, maxValue);
                    }
                    // ie age:(>10 AND <20)
                    if (!incMin && !incMax) {
                        minValue = ip6addr_1.default.parse(minValue).offset(1).toString();
                        maxValue = ip6addr_1.default.parse(maxValue).offset(-1).toString();
                        range = ip6addr_1.default.createAddrRange(minValue, maxValue);
                    }
                    filterFnBuilder((ip) => {
                        if (is_cidr_1.default(ip) > 0) {
                            const argRange = ip6addr_1.default.createCIDR(ip);
                            const argFirst = argRange.first().toString();
                            const argLast = argRange.last().toString();
                            const rangeFirst = range.first().toString();
                            const rangeLast = range.last().toString();
                            return (range.contains(argFirst) || range.contains(argLast) || argRange.contains(rangeFirst) || argRange.contains(rangeLast));
                        }
                        return range.contains(ip);
                    });
                }
                return { field: '__parsed', term: createParsedField(topField) };
            }
            return node;
        }
        return this.walkAst(ast, populateIpQueries);
    }
}
exports.default = IpType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbGliL2RvY3VtZW50LW1hdGNoZXIvdHlwZS1tYW5hZ2VyL3R5cGVzL2lwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQ0Esc0RBQTZCO0FBQzdCLDZCQUE0QjtBQUM1QixzREFBOEI7QUFDOUIsa0RBQTZCO0FBQzdCLDBDQUErQztBQUUvQyxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUM7QUFDOUIsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUM7QUFFdEMsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUM7QUFDdEMsTUFBTSxXQUFXLEdBQUcseUNBQXlDLENBQUM7QUFFOUQsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDO0FBRTFCLE1BQXFCLE1BQU8sU0FBUSxjQUFRO0lBR3hDLFlBQVksV0FBbUI7UUFDM0IsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO1FBQzFCLGdCQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxVQUFVLENBQUMsR0FBUTtRQUNmLE1BQU0sRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQzVELDhEQUE4RDtRQUM5RCxTQUFTLGlCQUFpQixDQUFDLElBQVMsRUFBRSxNQUFlO1lBQ2pELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDO1lBRXRDLElBQUksUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDOUIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUNaLE1BQU0sUUFBUSxHQUFHLGlCQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNuQyxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUU7d0JBQ2QsTUFB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