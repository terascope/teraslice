"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseType {
    constructor(fnBaseName) {
        this.fnID = 0;
        this.injectorFns = {};
        if (fnBaseName)
            this.fnBaseName = fnBaseName;
        this.filterFnBuilder = (cb) => {
            this.fnID += 1;
            this.injectorFns[`${this.fnBaseName}${this.fnID}`] = cb;
        };
        this.createParsedField = (field) => {
            const { fnBaseName, fnID } = this;
            return `${fnBaseName}${fnID}(data.${field})`;
        };
        this.injectTypeFilterFns = () => {
            const { injectorFns } = this;
            return Object.keys(injectorFns).length > 0 ? injectorFns : null;
        };
    }
    // TODO: look to see if this can be combined with other walkAst method
    walkAst(ast, cb) {
        function walk(ast, _field) {
            const topField = ast.field || _field;
            const node = cb(ast, topField);
            if (node.right) {
                node.right = walk(node.right, topField);
            }
            if (node.left) {
                node.left = walk(node.left, topField);
            }
            return node;
        }
        return walk(ast);
    }
    processAst(ast) {
        return ast;
    }
    formatData(data) {
        return data;
    }
}
exports.default = BaseType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9saWIvZG9jdW1lbnQtbWF0Y2hlci90eXBlLW1hbmFnZXIvdHlwZXMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLE1BQXFCLFFBQVE7SUFRekIsWUFBWSxVQUFtQjtRQUMzQixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNkLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLElBQUksVUFBVTtZQUFFLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBRTdDLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxFQUFZLEVBQVEsRUFBRTtZQUMxQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM1RCxDQUFDLENBQUM7UUFFRixJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxLQUFhLEVBQVUsRUFBRTtZQUMvQyxNQUFNLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQztZQUNsQyxPQUFPLEdBQUcsVUFBVSxHQUFHLElBQUksU0FBUyxLQUFLLEdBQUcsQ0FBQztRQUNqRCxDQUFDLENBQUM7UUFFRixJQUFJLENBQUMsbUJBQW1CLEdBQUcsR0FBRyxFQUFFO1lBQzVCLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFDN0IsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3BFLENBQUMsQ0FBQztJQUNOLENBQUM7SUFDRCxzRUFBc0U7SUFDL0QsT0FBTyxDQUFDLEdBQVEsRUFBRSxFQUFZO1FBRWpDLFNBQVMsSUFBSSxDQUFDLEdBQVEsRUFBRSxNQUFlO1lBQ25DLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDO1lBQ3JDLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFL0IsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNaLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDM0M7WUFFRCxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ1gsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUN6QztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBRU0sVUFBVSxDQUFDLEdBQVE7UUFDdEIsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0lBRU0sVUFBVSxDQUFDLElBQVk7UUFDMUIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKO0FBdkRELDJCQXVEQyJ9