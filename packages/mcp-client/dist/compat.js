// Backwards-compat shims for generated MCP client
// Reintroduce `ItemStatus` enum used throughout the application
export var ItemStatus;
(function (ItemStatus) {
    ItemStatus["NOT_STARTED"] = "NOT_STARTED";
    ItemStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ItemStatus["COMPLETED"] = "COMPLETED";
})(ItemStatus || (ItemStatus = {}));
