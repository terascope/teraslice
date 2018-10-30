'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dates_1 = __importDefault(require("./types/dates"));
const ip_1 = __importDefault(require("./types/ip"));
const geo_1 = __importDefault(require("./types/geo"));
const regex_1 = __importDefault(require("./types/regex"));
const typeMapping = {
    date: dates_1.default,
    ip: ip_1.default,
    geo: geo_1.default,
    regex: regex_1.default
};
class TypeManager {
    constructor(typeConfig) {
        this.typeList = this._buildFieldListConfig(typeConfig);
    }
    _buildFieldListConfig(typeConfig) {
        const typeList = [];
        const results = {};
        if (!typeConfig)
            return typeList;
        for (const field in typeConfig) {
            const type = typeConfig[field];
            if (typeMapping[type]) {
                if (!results[type])
                    results[type] = {};
                results[type][field] = true;
            }
        }
        for (const type in results) {
            const TypeClass = typeMapping[type];
            typeList.push(new TypeClass(results[type]));
        }
        return typeList;
    }
    processAst(ast) {
        return this.typeList.reduce((ast, type) => {
            return type.processAst(ast);
        }, ast);
    }
    formatData(doc) {
        return this.typeList.reduce((doc, type) => {
            return type.formatData(doc);
        }, doc);
    }
    injectTypeFilterFns() {
        return this.typeList.reduce((prev, type) => {
            const filterFns = type.injectTypeFilterFns();
            if (filterFns !== null) {
                Object.assign(prev, filterFns);
            }
            return prev;
        }, {});
    }
}
exports.default = TypeManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2RvY3VtZW50LW1hdGNoZXIvdHlwZS1tYW5hZ2VyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7QUFFYiwwREFBcUM7QUFDckMsb0RBQWdDO0FBQ2hDLHNEQUFrQztBQUNsQywwREFBc0M7QUFLdEMsTUFBTSxXQUFXLEdBQUc7SUFDaEIsSUFBSSxFQUFFLGVBQVE7SUFDZCxFQUFFLEVBQUUsWUFBTTtJQUNWLEdBQUcsRUFBRSxhQUFPO0lBQ1osS0FBSyxFQUFFLGVBQVM7Q0FDbkIsQ0FBQztBQUVGLE1BQXFCLFdBQVc7SUFHNUIsWUFBWSxVQUE2QjtRQUNyQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRU8scUJBQXFCLENBQUMsVUFBNEI7UUFDdEQsTUFBTSxRQUFRLEdBQWMsRUFBRSxDQUFDO1FBQy9CLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUVuQixJQUFJLENBQUMsVUFBVTtZQUFFLE9BQU8sUUFBUSxDQUFDO1FBRWpDLEtBQUssTUFBTSxLQUFLLElBQUksVUFBVSxFQUFFO1lBQzVCLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQixJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7b0JBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQzthQUMvQjtTQUNKO1FBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxPQUFPLEVBQUU7WUFDeEIsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvQztRQUVELE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFFTSxVQUFVLENBQUMsR0FBUTtRQUN0QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRU0sVUFBVSxDQUFDLEdBQVc7UUFDekIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN0QyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ1osQ0FBQztJQUVNLG1CQUFtQjtRQUN0QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3ZDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdDLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtnQkFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDbEM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDWCxDQUFDO0NBQ0o7QUFsREQsOEJBa0RDIn0=