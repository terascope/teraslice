"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function bindThis(instance, cls) {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
        .filter((name) => {
        const method = instance[name];
        return method instanceof Function && method !== cls;
    })
        .forEach((mtd) => {
        instance[mtd] = instance[mtd].bind(instance);
    });
}
exports.bindThis = bindThis;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsU0FBZ0IsUUFBUSxDQUFDLFFBQWUsRUFBRSxHQUFVO0lBQ2hELE9BQU8sTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDN0QsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDYixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsT0FBTyxNQUFNLFlBQVksUUFBUSxJQUFJLE1BQU0sS0FBSyxHQUFHLENBQUM7SUFDeEQsQ0FBQyxDQUFDO1NBQ0QsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDYixRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQUMsQ0FBQztBQUNYLENBQUM7QUFURCw0QkFTQyJ9