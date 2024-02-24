"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_config_1 = require("./config/database-config");
const error_middleware_1 = __importDefault(require("./utills/error/error.middleware"));
const user_route_1 = __importDefault(require("./routes/user-route"));
const app = (0, express_1.default)();
dotenv_1.default.config();
app.use(express_1.default.json());
app.use("/customer/api/v1/user", user_route_1.default);
// Error handler middleware
app.use(error_middleware_1.default);
const start = async () => {
    const port = process.env.PORT || 5000;
    try {
        app.listen(port, () => {
            console.log(`SERVER IS LISTENING ON PORT ${port}..!`);
            (0, database_config_1.connectDB)();
        });
    }
    catch (e) {
        console.log(e);
    }
};
start();
