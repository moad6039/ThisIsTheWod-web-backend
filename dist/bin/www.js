#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const debug_1 = __importDefault(require("debug"));
const app_1 = __importDefault(require("../app"));
const debug = (0, debug_1.default)("backend:server");
const port = normalizePort(process.env.PORT || "3002");
app_1.default.set("port", port);
const server = http_1.default.createServer(app_1.default);
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
function normalizePort(val) {
    const parsedPort = parseInt(val, 10);
    if (Number.isNaN(parsedPort)) {
        return val;
    }
    if (parsedPort >= 0) {
        return parsedPort;
    }
    return false;
}
function onError(error) {
    if (error.syscall !== "listen") {
        throw error;
    }
    const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
    switch (error.code) {
        case "EACCES":
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}
function onListening() {
    const addr = server.address();
    const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr === null || addr === void 0 ? void 0 : addr.port}`;
    debug(`Listening on ${bind}`);
}
