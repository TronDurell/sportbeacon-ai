"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testEnv_1 = require("./utils/testEnv");
exports.default = async () => {
    await (0, testEnv_1.cleanupEnv)();
};
//# sourceMappingURL=teardown.js.map