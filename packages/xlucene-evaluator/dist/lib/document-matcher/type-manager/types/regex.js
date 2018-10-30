'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __importDefault(require("./base"));
const utils_1 = require("../../../utils");
class RegexType extends base_1.default {
    constructor(regexDict) {
        super();
        this.fields = regexDict;
        utils_1.bindThis(this, RegexType);
    }
    processAst(ast) {
        const { fields, walkAst } = this;
        function parseRegex(node, _field) {
            const topField = node.field || _field;
            if (fields[topField]) {
                const term = `(data.${topField} ? data.${topField}.match(/^(${node.term})\\b/) !== null : false)`;
                return { field: '__parsed', term };
            }
            return node;
        }
        return walkAst(ast, parseRegex);
    }
}
exports.default = RegexType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbGliL2RvY3VtZW50LW1hdGNoZXIvdHlwZS1tYW5hZ2VyL3R5cGVzL3JlZ2V4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFFYixrREFBOEI7QUFDOUIsMENBQStDO0FBRS9DLE1BQXFCLFNBQVUsU0FBUSxjQUFRO0lBRzNDLFlBQVksU0FBaUI7UUFDekIsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztRQUN4QixnQkFBUSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQsVUFBVSxDQUFDLEdBQVE7UUFDZixNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztRQUVqQyxTQUFTLFVBQVUsQ0FBQyxJQUFTLEVBQUUsTUFBYztZQUN6QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sQ0FBQztZQUN0QyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDbEIsTUFBTSxJQUFJLEdBQUcsU0FBUyxRQUFRLFdBQVcsUUFBUSxhQUFhLElBQUksQ0FBQyxJQUFJLDBCQUEwQixDQUFDO2dCQUNsRyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUN0QztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDcEMsQ0FBQztDQUNKO0FBdEJELDRCQXNCQyJ9