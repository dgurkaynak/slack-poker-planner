/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/app.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/app.ts":
/*!********************!*\
  !*** ./src/app.ts ***!
  \********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _opentelemetry_tracing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @opentelemetry/tracing */ "@opentelemetry/tracing");
/* harmony import */ var _opentelemetry_tracing__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_opentelemetry_tracing__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _opentelemetry_exporter_jaeger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @opentelemetry/exporter-jaeger */ "@opentelemetry/exporter-jaeger");
/* harmony import */ var _opentelemetry_exporter_jaeger__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_opentelemetry_exporter_jaeger__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lib/logger */ "./src/lib/logger.ts");
/* harmony import */ var _lib_sqlite__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./lib/sqlite */ "./src/lib/sqlite.ts");
/* harmony import */ var _lib_redis__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./lib/redis */ "./src/lib/redis.ts");
/* harmony import */ var countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! countly-sdk-nodejs */ "countly-sdk-nodejs");
/* harmony import */ var countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! express */ "express");
/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(express__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var body_parser__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! body-parser */ "body-parser");
/* harmony import */ var body_parser__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(body_parser__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var express_handlebars__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! express-handlebars */ "express-handlebars");
/* harmony import */ var express_handlebars__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(express_handlebars__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _routes_oauth__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./routes/oauth */ "./src/routes/oauth.ts");
/* harmony import */ var _routes_pp_command__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./routes/pp-command */ "./src/routes/pp-command.ts");
/* harmony import */ var _routes_interactivity__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./routes/interactivity */ "./src/routes/interactivity.ts");
/* harmony import */ var pretty_ms__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! pretty-ms */ "pretty-ms");
/* harmony import */ var pretty_ms__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(pretty_ms__WEBPACK_IMPORTED_MODULE_12__);
/* harmony import */ var _session_session_model__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./session/session-model */ "./src/session/session-model.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
__webpack_require__(/*! dotenv */ "dotenv").config();


setupTracing();












function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield _lib_sqlite__WEBPACK_IMPORTED_MODULE_3__["init"]();
        if (process.env.USE_REDIS) {
            yield _lib_redis__WEBPACK_IMPORTED_MODULE_4__["init"]();
            yield _session_session_model__WEBPACK_IMPORTED_MODULE_13__["restore"]();
        }
        yield initServer();
        // If countly env variables exists, start countly stat reporting
        if (process.env.COUNTLY_APP_KEY && process.env.COUNTLY_URL) {
            _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].info({
                msg: `Initing countly`,
                url: process.env.COUNTLY_URL,
                appKey: process.env.COUNTLY_APP_KEY,
            });
            countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_5___default.a.init({
                app_key: process.env.COUNTLY_APP_KEY,
                url: process.env.COUNTLY_URL,
            });
        }
        _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].info({ msg: 'Boot successful!' });
    });
}
function initServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const server = express__WEBPACK_IMPORTED_MODULE_6__();
        // Setup handlebars
        server.engine('html', express_handlebars__WEBPACK_IMPORTED_MODULE_8__({ extname: '.html' }));
        server.set('view engine', 'html');
        server.set('views', 'src/views'); // relative to process.cwd
        // Parse body
        server.use(body_parser__WEBPACK_IMPORTED_MODULE_7__["urlencoded"]({ extended: false }));
        server.use(body_parser__WEBPACK_IMPORTED_MODULE_7__["json"]());
        // Serve static files
        server.use(process.env.BASE_PATH, express__WEBPACK_IMPORTED_MODULE_6__["static"]('src/public')); // relative to process.cwd
        // Setup routes
        initRoutes(server);
        return new Promise((resolve, reject) => {
            server.listen(process.env.PORT, (err) => {
                if (err)
                    return reject(err);
                _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].info({ msg: `Server running`, port: process.env.PORT });
                resolve();
            });
        });
    });
}
function initRoutes(server) {
    const router = express__WEBPACK_IMPORTED_MODULE_6__["Router"]();
    const humanReadableSessionTTL = pretty_ms__WEBPACK_IMPORTED_MODULE_12___default()(Number(process.env.SESSION_TTL), { verbose: true });
    router.get('/', (req, res, next) => {
        res.render('index', {
            layout: false,
            data: {
                SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
                SLACK_SCOPE: process.env.SLACK_SCOPE,
                SLACK_APP_ID: process.env.SLACK_APP_ID,
                COUNTLY_URL: process.env.COUNTLY_URL,
                COUNTLY_APP_KEY: process.env.COUNTLY_APP_KEY,
                HUMAN_READABLE_SESSION_TTL: humanReadableSessionTTL,
            },
        });
    });
    router.get('/privacy', (req, res, next) => {
        res.render('privacy', {
            layout: false,
            data: {
                SLACK_APP_ID: process.env.SLACK_APP_ID,
                COUNTLY_URL: process.env.COUNTLY_URL,
                COUNTLY_APP_KEY: process.env.COUNTLY_APP_KEY,
            },
        });
    });
    router.get('/oauth', _routes_oauth__WEBPACK_IMPORTED_MODULE_9__["OAuthRoute"].handle);
    router.post('/slack/pp-command', _routes_pp_command__WEBPACK_IMPORTED_MODULE_10__["PPCommandRoute"].handle);
    router.post('/slack/pp-slash-command', _routes_pp_command__WEBPACK_IMPORTED_MODULE_10__["PPCommandRoute"].handle);
    router.post('/slack/action-endpoint', _routes_interactivity__WEBPACK_IMPORTED_MODULE_11__["InteractivityRoute"].handle);
    router.post('/slack/interactivity', _routes_interactivity__WEBPACK_IMPORTED_MODULE_11__["InteractivityRoute"].handle);
    router.get('/slack/direct-install', (req, res, next) => {
        const url = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${process.env.SLACK_SCOPE}`;
        res.status(302).redirect(url);
    });
    // Serve under specified base path
    server.use(`${process.env.BASE_PATH}`, router);
}
function setupTracing() {
    return __awaiter(this, void 0, void 0, function* () {
        const traceProvider = new _opentelemetry_tracing__WEBPACK_IMPORTED_MODULE_0__["BasicTracerProvider"]();
        traceProvider.register();
        if (!process.env.REPORT_TRACES) {
            return;
        }
        const exporter = new _opentelemetry_exporter_jaeger__WEBPACK_IMPORTED_MODULE_1__["JaegerExporter"]({
            serviceName: 'pp',
            tags: [],
            host: process.env.JAEGER_HOST,
            port: parseInt(process.env.JAEGER_PORT, 10),
            logger: {
                debug: () => { },
                info: () => { },
                warn: _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].warn.bind(_lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"]),
                error: _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].error.bind(_lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"]),
            },
        });
        traceProvider.addSpanProcessor(new _opentelemetry_tracing__WEBPACK_IMPORTED_MODULE_0__["BatchSpanProcessor"](exporter));
        _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].info({
            msg: `Trace reporter started`,
            jaegerAgent: {
                host: process.env.JAEGER_HOST,
                port: process.env.JAEGER_PORT,
            },
        });
    });
}
main().catch((err) => {
    _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].error({ msg: 'Could not boot', err });
    process.exit(1);
});


/***/ }),

/***/ "./src/lib/logger.ts":
/*!***************************!*\
  !*** ./src/lib/logger.ts ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var pino__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pino */ "pino");
/* harmony import */ var pino__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(pino__WEBPACK_IMPORTED_MODULE_0__);

const logger = pino__WEBPACK_IMPORTED_MODULE_0___default()({
    formatters: {
        level: (label, number) => ({ level: label }),
        bindings: (bindings) => ({}),
    },
});
/* harmony default export */ __webpack_exports__["default"] = (logger);


/***/ }),

/***/ "./src/lib/redis.ts":
/*!**************************!*\
  !*** ./src/lib/redis.ts ***!
  \**************************/
/*! exports provided: init, getSingleton */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "init", function() { return init; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getSingleton", function() { return getSingleton; });
/* harmony import */ var redis__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! redis */ "redis");
/* harmony import */ var redis__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(redis__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./logger */ "./src/lib/logger.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


let client;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        if (client) {
            _logger__WEBPACK_IMPORTED_MODULE_1__["default"].warn({ msg: `Trying to init redis multiple times!` });
            return client;
        }
        _logger__WEBPACK_IMPORTED_MODULE_1__["default"].info({ msg: `Creating redis client...` });
        client = redis__WEBPACK_IMPORTED_MODULE_0__["createClient"](process.env.REDIS_URL);
        yield new Promise((resolve, reject) => {
            client.once('ready', resolve);
            client.once('error', reject);
        });
        client.on('error', (err) => {
            _logger__WEBPACK_IMPORTED_MODULE_1__["default"].error({
                msg: `Unexpected redis error`,
                err,
            });
        });
        return client;
    });
}
function getSingleton() {
    return client;
}


/***/ }),

/***/ "./src/lib/sqlite.ts":
/*!***************************!*\
  !*** ./src/lib/sqlite.ts ***!
  \***************************/
/*! exports provided: init, getSingleton */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "init", function() { return init; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getSingleton", function() { return getSingleton; });
/* harmony import */ var sqlite3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! sqlite3 */ "sqlite3");
/* harmony import */ var sqlite3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(sqlite3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var sqlite__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! sqlite */ "sqlite");
/* harmony import */ var sqlite__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(sqlite__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./logger */ "./src/lib/logger.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



let db;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        if (db) {
            _logger__WEBPACK_IMPORTED_MODULE_2__["default"].warn({ msg: `Trying to init sqlite multiple times!` });
            return db;
        }
        _logger__WEBPACK_IMPORTED_MODULE_2__["default"].info({ msg: `Opening sqlite...` });
        db = yield Object(sqlite__WEBPACK_IMPORTED_MODULE_1__["open"])({
            filename: process.env.DB_FILE,
            driver: sqlite3__WEBPACK_IMPORTED_MODULE_0__["Database"],
        });
        _logger__WEBPACK_IMPORTED_MODULE_2__["default"].info({ msg: `Migrating sqlite...` });
        yield db.migrate();
        return db;
    });
}
function getSingleton() {
    return db;
}


/***/ }),

/***/ "./src/lib/to.ts":
/*!***********************!*\
  !*** ./src/lib/to.ts ***!
  \***********************/
/*! exports provided: to */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "to", function() { return to; });
/**
 * Inspired by
 * https://medium.com/javascript-in-plain-english/how-to-avoid-try-catch-statements-nesting-chaining-in-javascript-a79028b325c5
 */
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function to(promise) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return [undefined, yield promise];
        }
        catch (err) {
            return [err, undefined];
        }
    });
}


/***/ }),

/***/ "./src/lib/trace-decorator.ts":
/*!************************************!*\
  !*** ./src/lib/trace-decorator.ts ***!
  \************************************/
/*! exports provided: Trace, getSpan */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Trace", function() { return Trace; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getSpan", function() { return getSpan; });
/* harmony import */ var async_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! async_hooks */ "async_hooks");
/* harmony import */ var async_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(async_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _opentelemetry_api__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @opentelemetry/api */ "@opentelemetry/api");
/* harmony import */ var _opentelemetry_api__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_opentelemetry_api__WEBPACK_IMPORTED_MODULE_1__);


const asyncLocalStorage = new async_hooks__WEBPACK_IMPORTED_MODULE_0__["AsyncLocalStorage"]();
function Trace(options = {}) {
    return (target, propertyName, propertyDesciptor) => {
        const originalMethod = propertyDesciptor.value;
        const spanName = options.name || propertyName;
        // Replace the method
        propertyDesciptor.value = function (...args) {
            const tracer = _opentelemetry_api__WEBPACK_IMPORTED_MODULE_1__["trace"].getTracer('default');
            const ctx = asyncLocalStorage.getStore();
            const spanOptions = {};
            if (ctx) {
                spanOptions.parent = ctx.span;
            }
            // Start a new span for the method
            const span = tracer.startSpan(spanName, spanOptions);
            // Execute original method
            try {
                const rv = asyncLocalStorage.run({ span }, () => originalMethod.apply(this, args));
                // Auto finish is on, check return value is promise
                // Instead of `instanceof` check, prefer checking `.then()` method exists on object.
                // User may be using custom promise polyfill (https://stackoverflow.com/a/27746324)
                if (typeof rv == 'object' && rv.then && rv.catch) {
                    return rv
                        .then((val) => {
                        // Promise resolved
                        span.end();
                        return val;
                    })
                        .catch((err) => {
                        // Promise is rejected
                        // https://github.com/opentracing/specification/blob/master/semantic_conventions.md
                        span.addEvent('error', {
                            event: 'error',
                            message: err.message,
                            stack: err.stack,
                            'error.kind': err.name,
                        });
                        span.setStatus({
                            code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_1__["CanonicalCode"].UNKNOWN,
                            message: err.message,
                        });
                        span.end();
                        throw err;
                    });
                }
                // If return value is not promise, finish and return
                span.end();
                return rv;
            }
            catch (err) {
                // Method throwed an error
                // https://github.com/opentracing/specification/blob/master/semantic_conventions.md
                span.addEvent('error', {
                    event: 'error',
                    message: err.message,
                    stack: err.stack,
                    'error.kind': err.name,
                });
                span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_1__["CanonicalCode"].UNKNOWN,
                    message: err.message,
                });
                span.end();
                throw err;
            }
        };
        return propertyDesciptor;
    };
}
function getSpan() {
    const ctx = asyncLocalStorage.getStore();
    return ctx === null || ctx === void 0 ? void 0 : ctx.span;
}


/***/ }),

/***/ "./src/routes/interactivity.ts":
/*!*************************************!*\
  !*** ./src/routes/interactivity.ts ***!
  \*************************************/
/*! exports provided: InteractivityRoute */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InteractivityRoute", function() { return InteractivityRoute; });
/* harmony import */ var _lib_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/logger */ "./src/lib/logger.ts");
/* harmony import */ var shortid__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! shortid */ "shortid");
/* harmony import */ var shortid__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(shortid__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_to__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../lib/to */ "./src/lib/to.ts");
/* harmony import */ var _team_team_model__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../team/team-model */ "./src/team/team-model.ts");
/* harmony import */ var _session_session_model__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../session/session-model */ "./src/session/session-model.ts");
/* harmony import */ var _session_session_controller__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../session/session-controller */ "./src/session/session-controller.ts");
/* harmony import */ var countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! countly-sdk-nodejs */ "countly-sdk-nodejs");
/* harmony import */ var countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var lodash_isEmpty__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! lodash/isEmpty */ "lodash/isEmpty");
/* harmony import */ var lodash_isEmpty__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(lodash_isEmpty__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var lodash_uniq__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! lodash/uniq */ "lodash/uniq");
/* harmony import */ var lodash_uniq__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(lodash_uniq__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var lodash_find__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! lodash/find */ "lodash/find");
/* harmony import */ var lodash_find__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(lodash_find__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var lodash_get__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! lodash/get */ "lodash/get");
/* harmony import */ var lodash_get__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(lodash_get__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var lodash_isObject__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! lodash/isObject */ "lodash/isObject");
/* harmony import */ var lodash_isObject__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(lodash_isObject__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @opentelemetry/api */ "@opentelemetry/api");
/* harmony import */ var _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(_opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__);
/* harmony import */ var _lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../lib/trace-decorator */ "./src/lib/trace-decorator.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};














class InteractivityRoute {
    /**
     * POST /slack/action-endpoint
     * POST /slack/interactivity
     * https://api.slack.com/interactivity/handling#payloads
     */
    static handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let payload;
            try {
                payload = JSON.parse(req.body.payload);
            }
            catch (err) {
                const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not parse action payload`,
                    errorId,
                    body: req.body,
                });
                return res.json({
                    text: `Unexpected slack action payload (error code: ${errorId})\n\n` +
                        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            if (payload.token != process.env.SLACK_VERIFICATION_TOKEN) {
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not process action, invalid verification token`,
                    payload,
                });
                return res.json({
                    text: `Invalid slack verification token, please get in touch with the maintainer`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            switch (payload.type) {
                case 'interactive_message': {
                    yield InteractivityRoute.interactiveMessage({ payload, res });
                    return;
                }
                case 'view_submission': {
                    yield InteractivityRoute.viewSubmission({ payload, res });
                    return;
                }
                default: {
                    const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                        msg: `Unexpected interactive-message action callbackId`,
                        errorId,
                        payload,
                    });
                    return res.json({
                        text: `Unexpected payload type (error code: ${errorId})\n\n` +
                            `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                        response_type: 'ephemeral',
                        replace_original: false,
                    });
                }
            }
        });
    }
    /**
     * A user clicks on a button on message
     */
    static interactiveMessage({ payload, // action request payload
    res, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({
                callbackId: payload.callback_id,
                teamId: payload.team.id,
                teamDomain: payload.team.domain,
                userId: payload.user.id,
                userName: payload.user.name,
                channelId: payload.channel.id,
                channelName: payload.channel.name,
            });
            const parts = payload.callback_id.split(':');
            if (parts.length != 2) {
                const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Unexpected interactive message callback id`,
                    errorId,
                    payload,
                });
                span === null || span === void 0 ? void 0 : span.setAttribute('error.id', errorId);
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].INVALID_ARGUMENT,
                    message: `Unexpected callback_id`,
                });
                return res.json({
                    text: `Unexpected interactive message callback id (error code: ${errorId})\n\n` +
                        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            const [action, sessionId] = parts;
            span === null || span === void 0 ? void 0 : span.setAttributes({ action, sessionId });
            const session = _session_session_model__WEBPACK_IMPORTED_MODULE_4__["findById"](sessionId);
            if (!session) {
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].NOT_FOUND,
                    message: 'Session not found',
                });
                return res.json({
                    text: `Ooops, could not find the session, it may be expired or cancelled`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            // Get team
            const [teamErr, team] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_2__["to"])(_team_team_model__WEBPACK_IMPORTED_MODULE_3__["TeamStore"].findById(payload.team.id));
            if (teamErr) {
                const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not get team`,
                    errorId,
                    err: teamErr,
                    payload,
                });
                span === null || span === void 0 ? void 0 : span.setAttribute('error.id', errorId);
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].INTERNAL,
                    message: teamErr.message,
                });
                return res.json({
                    text: `Internal server error, please try again later (error code: ${errorId})\n\n` +
                        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            if (!team) {
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].NOT_FOUND,
                    message: 'Team not found',
                });
                return res.json({
                    text: `Your Slack team (${payload.team.domain}) could not be found, please reinstall Poker Planner on <${process.env.APP_INSTALL_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            switch (action) {
                /**
                 * A user clicked session actions button:
                 * - Reveal
                 * - Cancel
                 */
                case 'action': {
                    const sessionAction = payload.actions[0].value;
                    span === null || span === void 0 ? void 0 : span.setAttributes({ sessionAction });
                    if (sessionAction == 'reveal') {
                        yield InteractivityRoute.revealSession({
                            payload,
                            team,
                            session,
                            res,
                        });
                    }
                    else if (sessionAction == 'cancel') {
                        yield InteractivityRoute.cancelSession({
                            payload,
                            team,
                            session,
                            res,
                        });
                    }
                    else {
                        const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                        _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                            msg: `Unexpected action button clicked`,
                            errorId,
                            sessionAction,
                            payload,
                        });
                        span === null || span === void 0 ? void 0 : span.setAttribute('error.id', errorId);
                        span === null || span === void 0 ? void 0 : span.setStatus({
                            code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].INVALID_ARGUMENT,
                            message: `Unexpected session action`,
                        });
                        res.json({
                            text: `Unexpected action button (error code: ${errorId})\n\n` +
                                `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                            response_type: 'ephemeral',
                            replace_original: false,
                        });
                    }
                    return;
                }
                /**
                 * A user clicked vote point button
                 */
                case 'vote': {
                    yield InteractivityRoute.vote({ payload, team, session, res });
                    return;
                }
                /**
                 * Unexpected action
                 */
                default: {
                    const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                        msg: `Unexpected action`,
                        errorId,
                        action,
                        payload,
                    });
                    span === null || span === void 0 ? void 0 : span.setAttribute('error.id', errorId);
                    span === null || span === void 0 ? void 0 : span.setStatus({
                        code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].INVALID_ARGUMENT,
                        message: `Unexpected action`,
                    });
                    return res.json({
                        text: `Unexpected action (error code: ${errorId})\n\n` +
                            `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                        response_type: 'ephemeral',
                        replace_original: false,
                    });
                }
            }
        });
    }
    /**
     * A user clicks a submit button a view
     */
    static viewSubmission({ payload, // action request payload
    res, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({
                teamId: payload.team.id,
                teamDomain: payload.team.domain,
                userId: payload.user.id,
                userName: payload.user.name,
            });
            const [teamGetErr, team] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_2__["to"])(_team_team_model__WEBPACK_IMPORTED_MODULE_3__["TeamStore"].findById(payload.team.id));
            if (teamGetErr) {
                const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not create session, could not get the team from db`,
                    errorId,
                    err: teamGetErr,
                    payload,
                });
                span === null || span === void 0 ? void 0 : span.setAttribute('error.id', errorId);
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].INTERNAL,
                    message: teamGetErr.message,
                });
                return res.json({
                    text: `Internal server error, please try again later (error code: ${errorId})\n\n` +
                        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            if (!team) {
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].info({
                    msg: `Could not create session, team could not be found`,
                    payload,
                });
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].NOT_FOUND,
                    message: 'Team not found',
                });
                return res.json({
                    text: `Your Slack team (${payload.team.domain}) could not be found, please reinstall Poker Planner on <${process.env.APP_INSTALL_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            const callbackId = payload.view.callback_id;
            span === null || span === void 0 ? void 0 : span.setAttributes({ callbackId });
            switch (callbackId) {
                case 'newSessionModal:submit': {
                    return InteractivityRoute.createSession({ payload, team, res });
                }
                default: {
                    const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                        msg: `Unexpected view-submission action callbackId`,
                        errorId,
                        callbackId,
                        payload,
                    });
                    span === null || span === void 0 ? void 0 : span.setAttribute('error.id', errorId);
                    span === null || span === void 0 ? void 0 : span.setStatus({
                        code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].INVALID_ARGUMENT,
                        message: `Unexpected callback_id`,
                    });
                    return res.json({
                        text: `Unexpected view-submission callback id (error code: ${errorId})\n\n` +
                            `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                        response_type: 'ephemeral',
                        replace_original: false,
                    });
                }
            }
        });
    }
    /**
     * A user submits the `new session` modal.
     */
    static createSession({ payload, // action request payload
    team, res, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["getSpan"])();
            const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
            try {
                ////////////////////////
                // Get the channel id //
                ////////////////////////
                let channelId;
                try {
                    span === null || span === void 0 ? void 0 : span.setAttributes({
                        rawPrivateMetadata: payload.view.private_metadata,
                    });
                    const privateMetadata = JSON.parse(payload.view.private_metadata);
                    channelId = privateMetadata.channelId;
                }
                catch (err) {
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                        msg: 'Could not create session: Cannot parse private_metadata',
                        errorId,
                        err,
                        payload,
                    });
                    throw new Error(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].UNEXPECTED_PAYLOAD);
                }
                if (!channelId) {
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                        msg: 'Could not create session: Missing channelId',
                        errorId,
                        payload,
                    });
                    throw new Error(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].UNEXPECTED_PAYLOAD);
                }
                ///////////////////////////
                // Get the session title //
                ///////////////////////////
                const titleInputState = lodash_get__WEBPACK_IMPORTED_MODULE_10___default()(payload, 'view.state.values.title');
                if (!lodash_isObject__WEBPACK_IMPORTED_MODULE_11___default()(titleInputState) || lodash_isEmpty__WEBPACK_IMPORTED_MODULE_7___default()(titleInputState)) {
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                        msg: 'Could not create session: Title is not an object or empty',
                        errorId,
                        payload,
                    });
                    throw new Error(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].TITLE_REQUIRED);
                }
                const title = titleInputState[Object.keys(titleInputState)[0]]
                    .value;
                span === null || span === void 0 ? void 0 : span.setAttributes({ title });
                if (!title || title.trim().length == 0) {
                    throw new Error(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].TITLE_REQUIRED);
                }
                //////////////////////////
                // Get the participants //
                //////////////////////////
                const participantsInputState = lodash_get__WEBPACK_IMPORTED_MODULE_10___default()(payload, 'view.state.values.participants');
                if (!lodash_isObject__WEBPACK_IMPORTED_MODULE_11___default()(participantsInputState) ||
                    lodash_isEmpty__WEBPACK_IMPORTED_MODULE_7___default()(participantsInputState)) {
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                        msg: 'Could not create session: Participants is not an object or empty',
                        errorId,
                        payload,
                    });
                    throw new Error(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].NO_PARTICIPANTS);
                }
                const participants = participantsInputState[Object.keys(participantsInputState)[0]].selected_users;
                span === null || span === void 0 ? void 0 : span.setAttributes({ participants: participants.join(' ') });
                if (participants.length == 0) {
                    throw new Error(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].NO_PARTICIPANTS);
                }
                ////////////////////
                // Get the points //
                ////////////////////
                const pointsInputState = lodash_get__WEBPACK_IMPORTED_MODULE_10___default()(payload, 'view.state.values.points');
                if (!lodash_isObject__WEBPACK_IMPORTED_MODULE_11___default()(pointsInputState) || lodash_isEmpty__WEBPACK_IMPORTED_MODULE_7___default()(pointsInputState)) {
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                        msg: 'Could not create session: Points is not an object or empty',
                        errorId,
                        payload,
                    });
                    throw new Error(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].INVALID_POINTS);
                }
                const pointsStr = pointsInputState[Object.keys(pointsInputState)[0]].value || '';
                span === null || span === void 0 ? void 0 : span.setAttributes({ points: pointsStr });
                let points = lodash_uniq__WEBPACK_IMPORTED_MODULE_8___default()(pointsStr.match(/\S+/g)) || [];
                if (points.length == 1 && points[0] == 'reset') {
                    points = _session_session_controller__WEBPACK_IMPORTED_MODULE_5__["DEFAULT_POINTS"];
                }
                if (points.length < 2 || points.length > 25) {
                    throw new Error(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].INVALID_POINTS);
                }
                ////////////////////////////
                // Get "other" checkboxes //
                ////////////////////////////
                const otherCheckboxesState = lodash_get__WEBPACK_IMPORTED_MODULE_10___default()(payload, 'view.state.values.other');
                const selectedOptions = lodash_isObject__WEBPACK_IMPORTED_MODULE_11___default()(otherCheckboxesState) && !lodash_isEmpty__WEBPACK_IMPORTED_MODULE_7___default()(otherCheckboxesState)
                    ? otherCheckboxesState[Object.keys(otherCheckboxesState)[0]]
                        .selected_options
                    : [];
                const isProtected = !!lodash_find__WEBPACK_IMPORTED_MODULE_9___default()(selectedOptions, (option) => option.value == 'protected');
                const calculateAverage = !!lodash_find__WEBPACK_IMPORTED_MODULE_9___default()(selectedOptions, (option) => option.value == 'average');
                span === null || span === void 0 ? void 0 : span.setAttributes({ isProtected: `${isProtected}` });
                span === null || span === void 0 ? void 0 : span.setAttributes({ calculateAverage: `${calculateAverage}` });
                // Create session struct
                const session = {
                    id: Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])(),
                    expiresAt: Date.now() + Number(process.env.SESSION_TTL),
                    title,
                    points,
                    votes: {},
                    state: 'active',
                    channelId,
                    userId: payload.user.id,
                    participants,
                    rawPostMessageResponse: undefined,
                    protected: isProtected,
                    average: calculateAverage,
                };
                span === null || span === void 0 ? void 0 : span.setAttributes({
                    sessionId: session.id,
                    channelId,
                    userId: payload.user.id,
                    userName: payload.user.name,
                });
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].info({
                    msg: `Creating a new session`,
                    team: {
                        id: team.id,
                        name: team.name,
                    },
                    user: {
                        id: payload.user.id,
                        name: payload.user.name,
                    },
                    channelId,
                    sessionId: session.id,
                });
                const postMessageResponse = yield _session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionController"].postMessage(session, team);
                session.rawPostMessageResponse = postMessageResponse;
                _session_session_model__WEBPACK_IMPORTED_MODULE_4__["upsert"](session);
                res.send();
                const [upsertSettingErr] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_2__["to"])(_team_team_model__WEBPACK_IMPORTED_MODULE_3__["TeamStore"].upsertSettings(team.id, session.channelId, {
                    [_team_team_model__WEBPACK_IMPORTED_MODULE_3__["ChannelSettingKey"].PARTICIPANTS]: session.participants.join(' '),
                    [_team_team_model__WEBPACK_IMPORTED_MODULE_3__["ChannelSettingKey"].POINTS]: session.points.join(' '),
                    [_team_team_model__WEBPACK_IMPORTED_MODULE_3__["ChannelSettingKey"].PROTECTED]: JSON.stringify(session.protected),
                    [_team_team_model__WEBPACK_IMPORTED_MODULE_3__["ChannelSettingKey"].AVERAGE]: JSON.stringify(session.average),
                }));
                if (upsertSettingErr) {
                    span === null || span === void 0 ? void 0 : span.addEvent('upsert_settings_error', {
                        message: upsertSettingErr.message,
                    });
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                        msg: `Could not upsert settings after creating new session`,
                        session,
                        err: upsertSettingErr,
                    });
                }
                if (process.env.COUNTLY_APP_KEY) {
                    countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_6___default.a.add_event({
                        key: 'topic_created',
                        count: 1,
                        segmentation: {
                            participants: session.participants.length,
                        },
                    });
                }
            }
            catch (err) {
                let shouldLog = true;
                let logLevel = 'error';
                let errorMessage = `Internal server error, please try again later (error code: ${errorId})\n\n` +
                    `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;
                let modalErrors = {};
                const slackErrorCode = err.data && err.data.error;
                if (slackErrorCode) {
                    span === null || span === void 0 ? void 0 : span.setAttributes({ slackErrorCode });
                    errorMessage =
                        `Unexpected Slack API Error: "*${slackErrorCode}*" (error code: ${errorId})\n\n` +
                            `If you think this is an issue, please report to <${process.env.ISSUES_LINK}>`;
                }
                /**
                 * Slack API platform errors
                 */
                if (slackErrorCode == 'not_in_channel') {
                    shouldLog = false;
                    errorMessage =
                        `Poker Planner app is not added to this channel. ` +
                            `Please try again after adding it. ` +
                            `You can simply add the app just by mentioning it, like "*@poker_planner*".`;
                }
                else if (slackErrorCode == 'channel_not_found') {
                    shouldLog = false;
                    errorMessage =
                        `Oops, we couldn't find this channel. ` +
                            `Are you sure that Poker Planner app is added to this channel/conversation? ` +
                            `You can simply add the app by mentioning it, like "*@poker_planner*". ` +
                            `However this may not work in Group DMs, you need to explicitly add it as a ` +
                            `member from conversation details menu. Please try again after adding it.`;
                }
                else if (slackErrorCode == 'token_revoked') {
                    logLevel = 'info';
                    errorMessage =
                        `Poker Planner's access has been revoked for this workspace. ` +
                            `In order to use it, you need to install the app again on ` +
                            `<${process.env.APP_INSTALL_LINK}>`;
                }
                else if (slackErrorCode == 'method_not_supported_for_channel_type') {
                    logLevel = 'info';
                    errorMessage = `Poker Planner cannot be used in this type of conversations.`;
                }
                else if (slackErrorCode == 'missing_scope') {
                    if (err.data.needed == 'mpim:read') {
                        logLevel = 'info';
                        errorMessage =
                            `Poker Planner now supports Group DMs! However it requires ` +
                                `additional permissions that we didn't obtained previously. You need to visit ` +
                                `<${process.env.APP_INSTALL_LINK}> and reinstall the app to enable this feature.`;
                    }
                    else if (err.data.needed == 'usergroups:read') {
                        logLevel = 'info';
                        errorMessage =
                            `Poker Planner now supports @usergroup mentions! However it requires ` +
                                `additional permissions that we didn't obtained previously. You need to visit ` +
                                `<${process.env.APP_INSTALL_LINK}> and reinstall the app to enable this feature.`;
                    }
                }
                else if (
                /**
                 * Internal errors
                 */
                err.message == _session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].NO_PARTICIPANTS) {
                    shouldLog = false;
                    errorMessage = `You must add at least 1 person.`;
                    modalErrors = {
                        participants: errorMessage,
                    };
                }
                else if (err.message == _session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].TITLE_REQUIRED) {
                    shouldLog = false;
                    errorMessage = `Title is required`;
                    modalErrors = {
                        title: errorMessage,
                    };
                }
                else if (err.message == _session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].INVALID_POINTS) {
                    shouldLog = false;
                    errorMessage =
                        `You must provide at least 2 poker points seperated by space, ` +
                            `the maximum is 25.`;
                    modalErrors = {
                        points: errorMessage,
                    };
                }
                else if (err.message == _session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].UNEXPECTED_PAYLOAD) {
                    shouldLog = false;
                    errorMessage =
                        `Oops, Slack API sends a payload that we don't expect. Please try again.\n\n` +
                            `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}> ` +
                            `with following error code: ${errorId}`;
                }
                if (shouldLog) {
                    _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"][logLevel]({
                        msg: `Could not create session`,
                        errorId,
                        err,
                        payload,
                    });
                }
                span === null || span === void 0 ? void 0 : span.setAttributes({
                    'error.id': errorId,
                    userErrorMessage: errorMessage,
                });
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].UNKNOWN,
                    message: err.message,
                });
                // Show the generic errors on a new modal
                if (lodash_isEmpty__WEBPACK_IMPORTED_MODULE_7___default()(modalErrors)) {
                    return res.json({
                        response_action: 'push',
                        view: {
                            type: 'modal',
                            title: {
                                type: 'plain_text',
                                text: 'Poker Planner',
                                emoji: true,
                            },
                            close: {
                                type: 'plain_text',
                                text: 'Close',
                                emoji: true,
                            },
                            blocks: [
                                {
                                    type: 'section',
                                    text: {
                                        type: 'mrkdwn',
                                        text: `:x: ${errorMessage}`,
                                    },
                                },
                            ],
                        },
                    });
                }
                // Show error on form elements
                return res.json({
                    response_action: 'errors',
                    errors: modalErrors,
                });
            }
        });
    }
    /**
     * A user clicks on a vote button.
     */
    static vote({ payload, // action request payload
    team, session, res, }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["getSpan"])();
            const point = payload.actions[0].value;
            span === null || span === void 0 ? void 0 : span.setAttributes({ point });
            _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].info({
                msg: `Voting`,
                point,
                sessionId: session.id,
                team: {
                    id: team.id,
                    name: team.name,
                },
                user: {
                    id: payload.user.id,
                    name: payload.user.name,
                },
            });
            const [voteErr] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_2__["to"])(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionController"].vote(session, team, payload.user.id, point));
            if (voteErr) {
                switch (voteErr.message) {
                    case _session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].SESSION_NOT_ACTIVE: {
                        return res.json({
                            text: `You cannot vote revealed or cancelled session`,
                            response_type: 'ephemeral',
                            replace_original: false,
                        });
                    }
                    case _session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionControllerErrorCode"].ONLY_PARTICIPANTS_CAN_VOTE: {
                        return res.json({
                            text: `You are not a participant of that session`,
                            response_type: 'ephemeral',
                            replace_original: false,
                        });
                    }
                    // Unknown error
                    default: {
                        const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                        let errorMessage = `Internal server error, please try again later (error code: ${errorId})\n\n` +
                            `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;
                        const slackErrorCode = (_b = (_a = voteErr) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error;
                        if (slackErrorCode) {
                            span === null || span === void 0 ? void 0 : span.setAttributes({ slackErrorCode });
                            errorMessage =
                                `Unexpected Slack API Error: "*${slackErrorCode}*", please try again later (error code: ${errorId})\n\n` +
                                    `If you think this is an issue, please report to <${process.env.ISSUES_LINK}>`;
                        }
                        if (slackErrorCode == 'channel_not_found') {
                            errorMessage =
                                `Unexpected Slack API Error: "*${slackErrorCode}*". Are you using Poker Planner on a shared channel? ` +
                                    `Shared channels are not supported due to Slack API limitations.\n\n` +
                                    `If you think this is an issue, please report to <${process.env.ISSUES_LINK}> with this error code: ${errorId}`;
                        }
                        _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                            msg: `Could not vote`,
                            errorId,
                            err: voteErr,
                            payload,
                        });
                        span === null || span === void 0 ? void 0 : span.setAttributes({ 'error.id': errorId });
                        span === null || span === void 0 ? void 0 : span.setStatus({
                            code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].INVALID_ARGUMENT,
                            message: `Unexpected vote error`,
                        });
                        return res.json({
                            text: errorMessage,
                            response_type: 'ephemeral',
                            replace_original: false,
                        });
                    }
                }
            }
            // Successfully voted
            if (process.env.COUNTLY_APP_KEY) {
                countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_6___default.a.add_event({
                    key: 'topic_voted',
                    count: 1,
                    segmentation: {
                        points: payload.actions[0].value,
                    },
                });
            }
            return res.send();
        });
    }
    /**
     * A user clicks reveal button.
     */
    static revealSession({ payload, // action request payload
    team, session, res, }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({
                sessionProtected: session.protected,
                sessionCreatorId: session.userId,
            });
            if (session.protected && session.userId != payload.user.id) {
                return res.json({
                    text: `This session is protected, only the creator can reveal it.`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].info({
                msg: `Revealing votes`,
                sessionId: session.id,
                team: {
                    id: team.id,
                    name: team.name,
                },
                user: {
                    id: payload.user.id,
                    name: payload.user.name,
                },
            });
            const [revealErr] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_2__["to"])(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionController"].revealAndUpdateMessage(session, team, payload.user.id));
            if (revealErr) {
                const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                let errorMessage = `Internal server error, please try again later (error code: ${errorId})\n\n` +
                    `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;
                const slackErrorCode = (_b = (_a = revealErr) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error;
                if (slackErrorCode) {
                    span === null || span === void 0 ? void 0 : span.setAttributes({ slackErrorCode });
                    errorMessage =
                        `Unexpected Slack API Error: "*${slackErrorCode}*", please try again later (error code: ${errorId})\n\n` +
                            `If you think this is an issue, please report to <${process.env.ISSUES_LINK}>`;
                }
                if (slackErrorCode == 'channel_not_found') {
                    errorMessage =
                        `Unexpected Slack API Error: "*${slackErrorCode}*". Are you using Poker Planner on a shared channel? ` +
                            `Shared channels are not supported due to Slack API limitations.\n\n` +
                            `If you think this is an issue, please report to <${process.env.ISSUES_LINK}> with this error code: ${errorId}`;
                }
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not reveal session`,
                    errorId,
                    err: revealErr,
                    payload,
                });
                span === null || span === void 0 ? void 0 : span.setAttributes({ 'error.id': errorId });
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].INTERNAL,
                    message: `Unexpected error while reveal session & update message`,
                });
                return res.json({
                    text: errorMessage,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            if (process.env.COUNTLY_APP_KEY) {
                countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_6___default.a.add_event({
                    key: 'topic_revealed',
                    count: 1,
                    segmentation: {},
                });
            }
            return res.send();
        });
    }
    /**
     * A user clicks cancel button.
     */
    static cancelSession({ payload, // action request payload
    team, session, res, }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({
                sessionProtected: session.protected,
                sessionCreatorId: session.userId,
            });
            if (session.protected && session.userId != payload.user.id) {
                return res.json({
                    text: `This session is protected, only the creator can cancel it.`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].info({
                msg: `Cancelling session`,
                sessionId: session.id,
                team: {
                    id: team.id,
                    name: team.name,
                },
                user: {
                    id: payload.user.id,
                    name: payload.user.name,
                },
            });
            const [cancelErr] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_2__["to"])(_session_session_controller__WEBPACK_IMPORTED_MODULE_5__["SessionController"].cancelAndUpdateMessage(session, team, payload.user.id));
            if (cancelErr) {
                const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_1__["generate"])();
                let errorMessage = `Internal server error, please try again later (error code: ${errorId})\n\n` +
                    `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;
                const slackErrorCode = (_b = (_a = cancelErr) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error;
                if (slackErrorCode) {
                    span === null || span === void 0 ? void 0 : span.setAttributes({ slackErrorCode });
                    errorMessage =
                        `Unexpected Slack API Error: "*${slackErrorCode}*", please try again later (error code: ${errorId})\n\n` +
                            `If you think this is an issue, please report to <${process.env.ISSUES_LINK}>`;
                }
                if (slackErrorCode == 'channel_not_found') {
                    errorMessage =
                        `Unexpected Slack API Error: "*${slackErrorCode}*". Are you using Poker Planner on a shared channel? ` +
                            `Shared channels are not supported due to Slack API limitations.\n\n` +
                            `If you think this is an issue, please report to <${process.env.ISSUES_LINK}> with this error code: ${errorId}`;
                }
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not cancel session`,
                    errorId,
                    err: cancelErr,
                    payload,
                });
                span === null || span === void 0 ? void 0 : span.setAttributes({ 'error.id': errorId });
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_12__["CanonicalCode"].INTERNAL,
                    message: `Unexpected error while cancel session & update message`,
                });
                return res.json({
                    text: errorMessage,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            if (process.env.COUNTLY_APP_KEY) {
                countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_6___default.a.add_event({
                    key: 'topic_cancelled',
                    count: 1,
                    segmentation: {},
                });
            }
            return res.send();
        });
    }
}
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["Trace"])()
], InteractivityRoute, "interactiveMessage", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["Trace"])()
], InteractivityRoute, "viewSubmission", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["Trace"])()
], InteractivityRoute, "createSession", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["Trace"])()
], InteractivityRoute, "vote", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["Trace"])()
], InteractivityRoute, "revealSession", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_13__["Trace"])()
], InteractivityRoute, "cancelSession", null);


/***/ }),

/***/ "./src/routes/oauth.ts":
/*!*****************************!*\
  !*** ./src/routes/oauth.ts ***!
  \*****************************/
/*! exports provided: OAuthRoute */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OAuthRoute", function() { return OAuthRoute; });
/* harmony import */ var _slack_web_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @slack/web-api */ "@slack/web-api");
/* harmony import */ var _slack_web_api__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_slack_web_api__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lib_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/logger */ "./src/lib/logger.ts");
/* harmony import */ var countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! countly-sdk-nodejs */ "countly-sdk-nodejs");
/* harmony import */ var countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _team_team_model__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../team/team-model */ "./src/team/team-model.ts");
/* harmony import */ var shortid__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! shortid */ "shortid");
/* harmony import */ var shortid__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(shortid__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _lib_to__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../lib/to */ "./src/lib/to.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};






class OAuthRoute {
    /**
     * GET /oauth
     */
    static handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Slack-side error, display error message
            if (req.query.error) {
                _lib_logger__WEBPACK_IMPORTED_MODULE_1__["default"].error({
                    msg: `Could not oauth`,
                    err: req.query.error,
                });
                return res.status(500).send(req.query.error);
            }
            // Installed!
            if (req.query.code) {
                const slackWebClient = new _slack_web_api__WEBPACK_IMPORTED_MODULE_0__["WebClient"]();
                const [oauthErr, accessResponse] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_5__["to"])(slackWebClient.oauth.v2.access({
                    client_id: process.env.SLACK_CLIENT_ID,
                    client_secret: process.env.SLACK_CLIENT_SECRET,
                    code: req.query.code,
                }));
                if (oauthErr) {
                    const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_4__["generate"])();
                    _lib_logger__WEBPACK_IMPORTED_MODULE_1__["default"].error({
                        msg: `Could not oauth, slack api call failed`,
                        errorId,
                        err: oauthErr,
                    });
                    return res
                        .status(500)
                        .send(`Internal server error, please try again (error code: ${errorId})\n\n` +
                        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`);
                }
                const [upsertErr, team] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_5__["to"])(_team_team_model__WEBPACK_IMPORTED_MODULE_3__["TeamStore"].upsert({
                    id: accessResponse.team.id,
                    name: accessResponse.team.name,
                    access_token: accessResponse.access_token,
                    scope: accessResponse.scope,
                    user_id: accessResponse.authed_user.id,
                }));
                if (upsertErr) {
                    const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_4__["generate"])();
                    _lib_logger__WEBPACK_IMPORTED_MODULE_1__["default"].error({
                        msg: `Could not oauth, sqlite upsert failed`,
                        errorId,
                        err: upsertErr,
                    });
                    res
                        .status(500)
                        .send(`Internal server error, please try again later (error code: ${errorId})\n\n` +
                        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`);
                }
                if (process.env.COUNTLY_APP_KEY) {
                    countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_2___default.a.add_event({
                        key: 'added_to_team',
                        count: 1,
                        segmentation: {},
                    });
                }
                _lib_logger__WEBPACK_IMPORTED_MODULE_1__["default"].info({
                    msg: `Added to team`,
                    team,
                });
                return res.render('oauth-success', {
                    layout: false,
                    data: {
                        SLACK_APP_ID: process.env.SLACK_APP_ID,
                        TEAM_NAME: team.name,
                    },
                });
            }
            // Unknown error
            const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_4__["generate"])();
            _lib_logger__WEBPACK_IMPORTED_MODULE_1__["default"].error({
                msg: `Could not oauth, unknown error`,
                errorId,
                query: req.query,
            });
            return res
                .status(500)
                .send(`Unknown error (error code: ${errorId})\n\n` +
                `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`);
        });
    }
}


/***/ }),

/***/ "./src/routes/pp-command.ts":
/*!**********************************!*\
  !*** ./src/routes/pp-command.ts ***!
  \**********************************/
/*! exports provided: PPCommandRoute */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PPCommandRoute", function() { return PPCommandRoute; });
/* harmony import */ var _lib_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/logger */ "./src/lib/logger.ts");
/* harmony import */ var countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! countly-sdk-nodejs */ "countly-sdk-nodejs");
/* harmony import */ var countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _team_team_model__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../team/team-model */ "./src/team/team-model.ts");
/* harmony import */ var shortid__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! shortid */ "shortid");
/* harmony import */ var shortid__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(shortid__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _lib_to__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../lib/to */ "./src/lib/to.ts");
/* harmony import */ var lodash_isString__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! lodash/isString */ "lodash/isString");
/* harmony import */ var lodash_isString__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(lodash_isString__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _session_session_controller__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../session/session-controller */ "./src/session/session-controller.ts");
/* harmony import */ var _opentelemetry_api__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @opentelemetry/api */ "@opentelemetry/api");
/* harmony import */ var _opentelemetry_api__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_opentelemetry_api__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _lib_trace_decorator__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../lib/trace-decorator */ "./src/lib/trace-decorator.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};









class PPCommandRoute {
    /**
     * POST /slack/pp-command
     * POST /slack/pp-slash-command
     */
    static handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = req.body;
            if (cmd.token != process.env.SLACK_VERIFICATION_TOKEN) {
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not created session, slack verification token is invalid`,
                    cmd,
                });
                return res.json({
                    text: `Invalid slack verification token, please get in touch with the maintainer`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            if (!lodash_isString__WEBPACK_IMPORTED_MODULE_5___default()(cmd.text)) {
                const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_3__["generate"])();
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not created session, command.text not string`,
                    errorId,
                    cmd,
                });
                return res.json({
                    text: `Unexpected command usage (error code: ${errorId})\n\n` +
                        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            const firstWord = cmd.text.trim().split(' ')[0];
            switch (firstWord) {
                case 'help': {
                    return PPCommandRoute.help(res);
                }
                case 'config': {
                    return yield PPCommandRoute.configure(cmd, res);
                }
                default: {
                    return yield PPCommandRoute.openNewSessionModal(cmd, res);
                }
            }
        });
    }
    /**
     * `/pp some task name`
     */
    static openNewSessionModal(cmd, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_8__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({
                teamId: cmd.team_id,
                teamDomain: cmd.team_domain,
                channelId: cmd.channel_id,
                channelName: cmd.channel_name,
                userId: cmd.user_id,
                userName: cmd.user_name,
                text: cmd.text,
            });
            if (cmd.channel_name == 'directmessage') {
                return res.json({
                    text: `Poker planning cannot be started in direct messages`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            const [teamGetErr, team] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_4__["to"])(_team_team_model__WEBPACK_IMPORTED_MODULE_2__["TeamStore"].findById(cmd.team_id));
            if (teamGetErr) {
                const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_3__["generate"])();
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not created session, could not get the team from db`,
                    errorId,
                    err: teamGetErr,
                    cmd,
                });
                span === null || span === void 0 ? void 0 : span.setAttribute('error.id', errorId);
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_7__["CanonicalCode"].INTERNAL,
                    message: teamGetErr.message,
                });
                return res.json({
                    text: `Internal server error, please try again later (error code: ${errorId})\n\n` +
                        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            if (!team) {
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].info({
                    msg: `Could not created session, team could not be found`,
                    cmd,
                });
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_7__["CanonicalCode"].NOT_FOUND,
                    message: 'Team not found',
                });
                return res.json({
                    text: `Your Slack team (${cmd.team_domain}) could not be found, please reinstall Poker Planner on <${process.env.APP_INSTALL_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            // If permissions are old, show migration message
            if (team.scope ==
                'identify,commands,channels:read,groups:read,users:read,chat:write:bot') {
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].info({
                    msg: `Migration message`,
                    team: {
                        id: team.id,
                        name: team.name,
                    },
                    user: {
                        id: cmd.user_id,
                        name: cmd.user_name,
                    },
                });
                span === null || span === void 0 ? void 0 : span.addEvent('show_migration_message');
                return res.json({
                    text: 'Poker Planner has migrated to ' +
                        "<https://slackhq.com/introducing-a-dramatically-upgraded-slack-app-toolkit|Slack's new app toolkit> " +
                        'which adds granular permissions for better security. We now depend on bot permissions instead of ' +
                        'user permissions. So that you can explicitly manage which channels/conversations Poker Planner can ' +
                        'access. However, this requires a couple of changes:\n\n• In order to obtain new bot permissions ' +
                        'and drop user ones, *you need to reinstall Poker Planner* to your workspace on ' +
                        `<${process.env.APP_INSTALL_LINK}>\n• Before using \`/pp\` command, *Poker Planner app must be ` +
                        'added to that channel/conversation*. You can simply add or invite it by just mentioning the app like ' +
                        '`@poker_planner`. You can also do that from channel/converstion details menu.',
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
            /**
             * From: https://api.slack.com/legacy/interactive-messages
             *
             * Responding right away
             * ---
             * You must respond within 3 seconds. If it takes your application longer
             * to process the request, we recommend responding with a HTTP 200 OK
             * immediately, then use the response_url to respond five times within
             * thirty minutes.
             *
             * Responding incrementally with response_url
             * ---
             * Use the response URL provided in the post to:
             * - Replace the current message
             * - Respond with a public message in the channel
             * - Respond with an ephemeral message in the channel that only the
             * acting user will see
             *
             * You'll be able to use a response_url five times within 30 minutes.
             * After that, it's best to move on to new messages and new interactions.
             */
            try {
                // Prepare settings (participants, points...)
                const [settingsFetchErr, channelSettings] = yield Object(_lib_to__WEBPACK_IMPORTED_MODULE_4__["to"])(_team_team_model__WEBPACK_IMPORTED_MODULE_2__["TeamStore"].fetchSettings(team.id, cmd.channel_id));
                if (settingsFetchErr) {
                    span === null || span === void 0 ? void 0 : span.addEvent('settings_fetch_error', {
                        error: settingsFetchErr.message,
                    });
                }
                const settings = {
                    [_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PARTICIPANTS]: [],
                    [_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].POINTS]: _session_session_controller__WEBPACK_IMPORTED_MODULE_6__["DEFAULT_POINTS"],
                    [_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PROTECTED]: false,
                    [_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].AVERAGE]: false,
                };
                if (channelSettings === null || channelSettings === void 0 ? void 0 : channelSettings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PARTICIPANTS]) {
                    settings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PARTICIPANTS] = channelSettings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PARTICIPANTS].split(' ');
                }
                if (team.custom_points) {
                    settings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].POINTS] = team.custom_points.split(' ');
                }
                if (channelSettings === null || channelSettings === void 0 ? void 0 : channelSettings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].POINTS]) {
                    settings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].POINTS] = channelSettings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].POINTS].split(' ');
                }
                if (channelSettings === null || channelSettings === void 0 ? void 0 : channelSettings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PROTECTED]) {
                    settings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PROTECTED] = JSON.parse(channelSettings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PROTECTED]);
                }
                if (channelSettings === null || channelSettings === void 0 ? void 0 : channelSettings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].AVERAGE]) {
                    settings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].AVERAGE] = JSON.parse(channelSettings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].AVERAGE]);
                }
                yield _session_session_controller__WEBPACK_IMPORTED_MODULE_6__["SessionController"].openModal({
                    triggerId: cmd.trigger_id,
                    team,
                    channelId: cmd.channel_id,
                    title: _session_session_controller__WEBPACK_IMPORTED_MODULE_6__["SessionController"].stripMentions(cmd.text).trim(),
                    participants: settings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PARTICIPANTS],
                    points: settings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].POINTS],
                    isProtected: settings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].PROTECTED],
                    calculateAverage: settings[_team_team_model__WEBPACK_IMPORTED_MODULE_2__["ChannelSettingKey"].AVERAGE],
                });
                // Send acknowledgement back to API -- HTTP 200
                res.send();
                if (process.env.COUNTLY_APP_KEY) {
                    countly_sdk_nodejs__WEBPACK_IMPORTED_MODULE_1___default.a.add_event({
                        key: 'new_session_modal_opened',
                        count: 1,
                        segmentation: {},
                    });
                }
            }
            catch (err) {
                const errorId = Object(shortid__WEBPACK_IMPORTED_MODULE_3__["generate"])();
                _lib_logger__WEBPACK_IMPORTED_MODULE_0__["default"].error({
                    msg: `Could not open modal`,
                    errorId,
                    err,
                    cmd,
                });
                span === null || span === void 0 ? void 0 : span.setAttribute('error.id', errorId);
                span === null || span === void 0 ? void 0 : span.setStatus({
                    code: _opentelemetry_api__WEBPACK_IMPORTED_MODULE_7__["CanonicalCode"].INTERNAL,
                    message: err.message,
                });
                return res.json({
                    text: `Could not open modal (error code: ${errorId})\n\n` +
                        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
                    response_type: 'ephemeral',
                    replace_original: false,
                });
            }
        });
    }
    /**
     * `/pp config ...`
     */
    static configure(cmd, res) {
        return __awaiter(this, void 0, void 0, function* () {
            return res.json({
                text: 'This command is deprecated. The session settings (points, participants, ...) ' +
                    'are now persisted automatically for each channel/conversation.',
                response_type: 'ephemeral',
                replace_original: false,
            });
        });
    }
    /**
     * `/pp help`
     */
    static help(res) {
        return res.json({
            text: ``,
            response_type: 'ephemeral',
            replace_original: false,
            attachments: [
                {
                    color: '#3AA3E3',
                    text: '`/pp`\n' + 'Opens a dialog to start a new poker planning session.',
                },
                {
                    color: '#3AA3E3',
                    text: '`/pp some topic text`\n' +
                        'Opens the same dialog, however title input is automatically ' +
                        'filled with the value you provided.',
                },
            ],
        });
    }
}
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_8__["Trace"])()
], PPCommandRoute, "openNewSessionModal", null);


/***/ }),

/***/ "./src/session/session-controller.ts":
/*!*******************************************!*\
  !*** ./src/session/session-controller.ts ***!
  \*******************************************/
/*! exports provided: DEFAULT_POINTS, SessionControllerErrorCode, SessionController, buildMessageAttachments */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DEFAULT_POINTS", function() { return DEFAULT_POINTS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SessionControllerErrorCode", function() { return SessionControllerErrorCode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SessionController", function() { return SessionController; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "buildMessageAttachments", function() { return buildMessageAttachments; });
/* harmony import */ var _session_model__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./session-model */ "./src/session/session-model.ts");
/* harmony import */ var lodash_chunk__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash/chunk */ "lodash/chunk");
/* harmony import */ var lodash_chunk__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash_chunk__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var lodash_map__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lodash/map */ "lodash/map");
/* harmony import */ var lodash_map__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lodash_map__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var lodash_groupBy__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lodash/groupBy */ "lodash/groupBy");
/* harmony import */ var lodash_groupBy__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lodash_groupBy__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _slack_web_api__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @slack/web-api */ "@slack/web-api");
/* harmony import */ var _slack_web_api__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_slack_web_api__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _lib_logger__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../lib/logger */ "./src/lib/logger.ts");
/* harmony import */ var _lib_trace_decorator__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../lib/trace-decorator */ "./src/lib/trace-decorator.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};







const DEFAULT_POINTS = [
    '0',
    '0.5',
    '1',
    '2',
    '3',
    '5',
    '8',
    '13',
    '20',
    '40',
    '100',
    '∞',
    '?',
];
var SessionControllerErrorCode;
(function (SessionControllerErrorCode) {
    SessionControllerErrorCode["NO_PARTICIPANTS"] = "no_participants";
    SessionControllerErrorCode["TITLE_REQUIRED"] = "title_required";
    SessionControllerErrorCode["UNEXPECTED_PAYLOAD"] = "unexpected_payload";
    SessionControllerErrorCode["INVALID_POINTS"] = "invalid_points";
    SessionControllerErrorCode["SESSION_NOT_ACTIVE"] = "session_not_active";
    SessionControllerErrorCode["ONLY_PARTICIPANTS_CAN_VOTE"] = "only_participants_can_vote";
})(SessionControllerErrorCode || (SessionControllerErrorCode = {}));
class SessionController {
    /**
     * Sends a message for the provided session.
     * CAUTION: Participants must resolved before using this method.
     */
    static postMessage(session, team) {
        return __awaiter(this, void 0, void 0, function* () {
            const slackWebClient = new _slack_web_api__WEBPACK_IMPORTED_MODULE_4__["WebClient"](team.access_token);
            const votesText = lodash_map__WEBPACK_IMPORTED_MODULE_2___default()(session.participants.sort(), (userId) => `<@${userId}>: awaiting`).join('\n');
            return slackWebClient.chat.postMessage({
                channel: session.channelId,
                text: `Title: *${session.title}*\n\nVotes:\n${votesText}`,
                attachments: buildMessageAttachments(session),
            });
        });
    }
    /**
     * Opens a `new session` modal
     */
    static openModal({ triggerId, team, channelId, title, participants, points, isProtected, calculateAverage, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const slackWebClient = new _slack_web_api__WEBPACK_IMPORTED_MODULE_4__["WebClient"](team.access_token);
            const protectedCheckboxesOption = {
                text: {
                    type: 'plain_text',
                    text: 'Protected (prevent others to cancel or reveal this session)',
                    emoji: true,
                },
                value: 'protected',
            };
            const averageCheckboxesOption = {
                text: {
                    type: 'plain_text',
                    text: 'Calculate the average (only numeric points will be used)',
                    emoji: true,
                },
                value: 'average',
            };
            let initialOptions = undefined;
            if (isProtected) {
                initialOptions = initialOptions || [];
                initialOptions.push(protectedCheckboxesOption);
            }
            if (calculateAverage) {
                initialOptions = initialOptions || [];
                initialOptions.push(averageCheckboxesOption);
            }
            yield slackWebClient.views.open({
                trigger_id: triggerId,
                view: {
                    callback_id: `newSessionModal:submit`,
                    private_metadata: JSON.stringify({ channelId }),
                    type: 'modal',
                    title: {
                        type: 'plain_text',
                        text: 'Poker Planner',
                        emoji: true,
                    },
                    submit: {
                        type: 'plain_text',
                        text: 'Start New Session',
                        emoji: true,
                    },
                    close: {
                        type: 'plain_text',
                        text: 'Cancel',
                        emoji: true,
                    },
                    blocks: [
                        {
                            type: 'input',
                            block_id: 'title',
                            element: {
                                type: 'plain_text_input',
                                placeholder: {
                                    type: 'plain_text',
                                    text: 'Write a topic for this voting session',
                                    emoji: true,
                                },
                                initial_value: title || '',
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Title',
                                emoji: true,
                            },
                        },
                        {
                            type: 'input',
                            block_id: 'participants',
                            element: {
                                type: 'multi_users_select',
                                placeholder: {
                                    type: 'plain_text',
                                    text: 'Add users',
                                    emoji: true,
                                },
                                initial_users: participants,
                                // max_selected_items: 25,
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Participants',
                                emoji: true,
                            },
                        },
                        {
                            type: 'input',
                            block_id: 'points',
                            element: {
                                type: 'plain_text_input',
                                placeholder: {
                                    type: 'plain_text',
                                    text: 'Change poker points',
                                    emoji: true,
                                },
                                initial_value: points.join(' ') || DEFAULT_POINTS.join(' '),
                            },
                            hint: {
                                type: 'plain_text',
                                text: 'Enter points separated by space',
                                emoji: true,
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Points',
                                emoji: true,
                            },
                        },
                        {
                            type: 'input',
                            block_id: 'other',
                            optional: true,
                            element: {
                                type: 'checkboxes',
                                options: [protectedCheckboxesOption, averageCheckboxesOption],
                                initial_options: initialOptions,
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Other',
                                emoji: true,
                            },
                        },
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: '> :bulb: These options will be *remembered* the next time you create a session *on this channel*.',
                            },
                        },
                    ],
                },
            });
        });
    }
    /**
     * Updates the session message as revealing all the votes.
     * And clean-up the session from store.
     */
    static revealAndUpdateMessage(session, team, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            session.state = 'revealed';
            yield SessionController.updateMessage(session, team, userId);
            yield _session_model__WEBPACK_IMPORTED_MODULE_0__["remove"](session.id);
        });
    }
    /**
     * Updates the session message as cancelled.
     * And clean-up the session from store.
     */
    static cancelAndUpdateMessage(session, team, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            session.state = 'cancelled';
            yield SessionController.updateMessage(session, team, userId);
            yield _session_model__WEBPACK_IMPORTED_MODULE_0__["remove"](session.id);
        });
    }
    /**
     *
     */
    static vote(session, team, userId, point) {
        return __awaiter(this, void 0, void 0, function* () {
            if (session.state != 'active') {
                throw new Error(SessionControllerErrorCode.SESSION_NOT_ACTIVE);
            }
            if (session.participants.indexOf(userId) == -1) {
                throw new Error(SessionControllerErrorCode.ONLY_PARTICIPANTS_CAN_VOTE);
            }
            session.votes[userId] = point;
            session.state =
                Object.keys(session.votes).length == session.participants.length
                    ? 'revealed'
                    : 'active';
            if (session.state == 'revealed') {
                yield SessionController.updateMessage(session, team); // do not send userId
                yield _session_model__WEBPACK_IMPORTED_MODULE_0__["remove"](session.id);
                _lib_logger__WEBPACK_IMPORTED_MODULE_5__["default"].info({
                    msg: `Auto revealing votes`,
                    sessionId: session.id,
                    team: {
                        id: team.id,
                        name: team.name,
                    },
                });
                return;
            }
            // Voting is still active
            yield SessionController.updateMessage(session, team);
            _session_model__WEBPACK_IMPORTED_MODULE_0__["upsert"](session);
        });
    }
    /**
     * Updates session message according to session state.
     */
    static updateMessage(session, team, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const slackWebClient = new _slack_web_api__WEBPACK_IMPORTED_MODULE_4__["WebClient"](team.access_token);
            if (session.state == 'revealed') {
                const voteGroups = lodash_groupBy__WEBPACK_IMPORTED_MODULE_3___default()(session.participants, (userId) => session.votes[userId] || 'not-voted');
                const votesText = Object.keys(voteGroups)
                    .sort((a, b) => session.points.indexOf(a) - session.points.indexOf(b))
                    .map((point) => {
                    const votes = voteGroups[point];
                    const peopleText = votes.length == 1 ? `1 person` : `${votes.length} people`;
                    const userIds = votes
                        .sort()
                        .map((userId) => `<@${userId}>`)
                        .join(', ');
                    if (point == 'not-voted') {
                        return `${peopleText} *did not vote* (${userIds})`;
                    }
                    return `${peopleText} voted *${point}* (${userIds})`;
                })
                    .join('\n');
                let averageText = '';
                if (session.average) {
                    const average = SessionController.getAverage(session.votes);
                    averageText = average
                        ? `\nAverage: ${SessionController.getAverage(session.votes)}`
                        : '';
                }
                yield slackWebClient.chat.update({
                    ts: session.rawPostMessageResponse.ts,
                    channel: session.rawPostMessageResponse.channel,
                    text: userId
                        ? `Title: *${session.title}* (revealed by <@${userId}>)\n\nResult:\n${votesText}${averageText}`
                        : `Title: *${session.title}*\n\nResult:\n${votesText}${averageText}`,
                    attachments: [],
                });
            }
            else if (session.state == 'cancelled') {
                yield slackWebClient.chat.update({
                    ts: session.rawPostMessageResponse.ts,
                    channel: session.rawPostMessageResponse.channel,
                    text: userId
                        ? `Title: *${session.title}* (cancelled by <@${userId}>)`
                        : `Title: *${session.title}* (cancelled)`,
                    attachments: [],
                });
            }
            else {
                const votesText = lodash_map__WEBPACK_IMPORTED_MODULE_2___default()(session.participants.sort(), (userId) => {
                    if (session.votes.hasOwnProperty(userId)) {
                        return `<@${userId}>: :white_check_mark:`;
                    }
                    return `<@${userId}>: awaiting`;
                }).join('\n');
                yield slackWebClient.chat.update({
                    ts: session.rawPostMessageResponse.ts,
                    channel: session.rawPostMessageResponse.channel,
                    text: `Title: *${session.title}*\n\nVotes:\n${votesText}`,
                    attachments: buildMessageAttachments(session),
                });
            }
        });
    }
    /**
     * For given votes, calculate average point
     */
    static getAverage(votes) {
        const numericPoints = Object.values(votes)
            .filter(SessionController.isNumeric)
            .map(parseFloat);
        if (numericPoints.length < 1)
            return false;
        return (numericPoints.reduce((a, b) => a + b) / numericPoints.length).toFixed(1);
    }
    static isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    /**
     * For a given slack slash-command text, remove mentions
     */
    static stripMentions(text) {
        return text
            .replace(/<@(.*?)>/g, '')
            .replace(/<!(.*?)>/g, '')
            .replace(/\s\s+/g, ' ')
            .trim();
    }
}
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_6__["Trace"])()
], SessionController, "postMessage", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_6__["Trace"])()
], SessionController, "openModal", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_6__["Trace"])()
], SessionController, "revealAndUpdateMessage", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_6__["Trace"])()
], SessionController, "cancelAndUpdateMessage", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_6__["Trace"])()
], SessionController, "vote", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_6__["Trace"])()
], SessionController, "updateMessage", null);
function buildMessageAttachments(session) {
    const pointAttachments = lodash_chunk__WEBPACK_IMPORTED_MODULE_1___default()(session.points, 5).map((points) => {
        return {
            text: '',
            fallback: 'You are unable to vote',
            callback_id: `vote:${session.id}`,
            color: '#3AA3E3',
            attachment_type: 'default',
            actions: points.map((point) => ({
                name: 'point',
                text: point,
                type: 'button',
                value: point,
            })),
        };
    });
    return [
        ...pointAttachments,
        {
            text: 'Actions',
            fallback: 'You are unable to send action',
            callback_id: `action:${session.id}`,
            color: '#3AA3E3',
            attachment_type: 'default',
            actions: [
                {
                    name: 'action',
                    text: 'Reveal',
                    type: 'button',
                    value: 'reveal',
                    style: 'danger',
                },
                {
                    name: 'action',
                    text: 'Cancel',
                    type: 'button',
                    value: 'cancel',
                    style: 'danger',
                },
            ],
        },
    ];
}


/***/ }),

/***/ "./src/session/session-model.ts":
/*!**************************************!*\
  !*** ./src/session/session-model.ts ***!
  \**************************************/
/*! exports provided: findById, restore, upsert, remove */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "findById", function() { return findById; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restore", function() { return restore; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "upsert", function() { return upsert; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "remove", function() { return remove; });
/* harmony import */ var _lib_redis__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/redis */ "./src/lib/redis.ts");
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! util */ "util");
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(util__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../lib/logger */ "./src/lib/logger.ts");
/* harmony import */ var lodash_pickBy__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lodash/pickBy */ "lodash/pickBy");
/* harmony import */ var lodash_pickBy__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lodash_pickBy__WEBPACK_IMPORTED_MODULE_3__);
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};




/**
 * Redis key stuff.
 */
function getRedisKeyMatcher() {
    return `${process.env.REDIS_NAMESPACE}:session:*`;
}
function buildRedisKey(sessionId) {
    return `${process.env.REDIS_NAMESPACE}:session:${sessionId}`;
}
/**
 * In memory sessions object.
 */
let sessions = {};
/**
 * Simple getter by session id.
 */
function findById(id) {
    return sessions[id];
}
/**
 * Restores all the sessions from redis.
 */
function restore() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.USE_REDIS)
            return;
        // Scan session keys in redis
        const client = _lib_redis__WEBPACK_IMPORTED_MODULE_0__["getSingleton"]();
        const scanAsync = Object(util__WEBPACK_IMPORTED_MODULE_1__["promisify"])(client.scan.bind(client));
        const keys = [];
        let cursor = '0';
        do {
            const response = yield scanAsync(cursor, 'MATCH', getRedisKeyMatcher());
            cursor = response[0];
            keys.push(...response[1]);
        } while (cursor !== '0');
        // Get these keys
        if (keys.length > 0) {
            const mgetAsync = Object(util__WEBPACK_IMPORTED_MODULE_1__["promisify"])(client.mget.bind(client));
            const rawSessions = yield mgetAsync(keys);
            rawSessions.forEach((rawSession) => {
                if (!rawSession)
                    return;
                try {
                    const session = JSON.parse(rawSession);
                    sessions[session.id] = session;
                }
                catch (err) {
                    // NOOP
                }
            });
        }
        _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].info({
            msg: 'Sessions restored from redis',
            count: Object.keys(sessions).length,
        });
    });
}
/**
 * Holds persisting timeout ids.
 */
const persistTimeouts = {};
/**
 * Updates/inserts the session. This method immediately updates in-memory
 * database. However if redis is being used, we delay (debounce) persisting
 * of a session for 1 second.
 */
function upsert(session) {
    sessions[session.id] = session;
    // If using redis, debounce persisting
    if (process.env.USE_REDIS) {
        if (persistTimeouts[session.id])
            clearTimeout(persistTimeouts[session.id]);
        persistTimeouts[session.id] = setTimeout(() => persist(session.id), 1000);
    }
}
/**
 * Reads a session from in-memory db, and persists to redis.
 */
function persist(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.USE_REDIS)
            return;
        // Immediately delete the timeout key
        delete persistTimeouts[sessionId];
        // If specified session is not in in-memory db,
        // it must be deleted, so NOOP.
        const session = sessions[sessionId];
        if (!session)
            return;
        // If specified session is expired, NOOP.
        // We expect that its redis record is/will-be deleted by its TTL.
        const remainingTTL = session.expiresAt - Date.now();
        if (remainingTTL <= 0)
            return;
        const client = _lib_redis__WEBPACK_IMPORTED_MODULE_0__["getSingleton"]();
        const setAsync = Object(util__WEBPACK_IMPORTED_MODULE_1__["promisify"])(client.set.bind(client));
        try {
            yield setAsync(buildRedisKey(session.id), JSON.stringify(session), 'PX', remainingTTL);
        }
        catch (err) {
            _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].error({
                msg: 'Could not persist session',
                err,
                session,
                remainingTTL,
            });
        }
    });
}
/**
 * Deletes the session.
 */
function remove(id) {
    return __awaiter(this, void 0, void 0, function* () {
        delete sessions[id];
        if (process.env.USE_REDIS) {
            const client = _lib_redis__WEBPACK_IMPORTED_MODULE_0__["getSingleton"]();
            const delAsync = Object(util__WEBPACK_IMPORTED_MODULE_1__["promisify"])(client.del.bind(client));
            yield delAsync(buildRedisKey(id));
        }
    });
}
/**
 * Set a interval that deletes expired sessions
 */
setInterval(() => {
    const now = Date.now();
    const previousSessionCount = Object.keys(sessions).length;
    sessions = lodash_pickBy__WEBPACK_IMPORTED_MODULE_3___default()(sessions, (session) => {
        const remainingTTL = session.expiresAt - now;
        return remainingTTL > 0;
    });
    const expiredSessionCount = previousSessionCount - Object.keys(sessions).length;
    if (expiredSessionCount > 0) {
        _lib_logger__WEBPACK_IMPORTED_MODULE_2__["default"].info({
            msg: 'Cleaned up expired sessions',
            count: expiredSessionCount,
        });
    }
}, 60000);


/***/ }),

/***/ "./src/team/team-model.ts":
/*!********************************!*\
  !*** ./src/team/team-model.ts ***!
  \********************************/
/*! exports provided: ChannelSettingKey, TeamStore */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ChannelSettingKey", function() { return ChannelSettingKey; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TeamStore", function() { return TeamStore; });
/* harmony import */ var _lib_sqlite__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/sqlite */ "./src/lib/sqlite.ts");
/* harmony import */ var _lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/trace-decorator */ "./src/lib/trace-decorator.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


var ChannelSettingKey;
(function (ChannelSettingKey) {
    ChannelSettingKey["PARTICIPANTS"] = "participants";
    ChannelSettingKey["POINTS"] = "points";
    ChannelSettingKey["PROTECTED"] = "protected";
    ChannelSettingKey["AVERAGE"] = "average";
})(ChannelSettingKey || (ChannelSettingKey = {}));
class TeamStore {
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttribute('id', id);
            const db = _lib_sqlite__WEBPACK_IMPORTED_MODULE_0__["getSingleton"]();
            return db.get('SELECT * FROM team WHERE id = ?', id);
        });
    }
    static create({ id, name, access_token, scope, user_id, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({ id, name, scope, user_id });
            const db = _lib_sqlite__WEBPACK_IMPORTED_MODULE_0__["getSingleton"]();
            yield db.run(`INSERT INTO
          team (id, name, access_token, scope, user_id)
        VALUES
          ($id, $name, $access_token, $scope, $user_id)`, {
                $id: id,
                $name: name,
                $access_token: access_token,
                $scope: scope,
                $user_id: user_id,
            });
        });
    }
    static update({ id, name, access_token, scope, user_id, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({ id, name, scope, user_id });
            const db = _lib_sqlite__WEBPACK_IMPORTED_MODULE_0__["getSingleton"]();
            yield db.run(`UPDATE
        team
      SET
        name = $name,
        access_token = $access_token,
        scope = $scope,
        user_id = $user_id
      WHERE
        id = $id`, {
                $id: id,
                $name: name,
                $access_token: access_token,
                $scope: scope,
                $user_id: user_id,
            });
        });
    }
    static upsert({ id, name, access_token, scope, user_id, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({ id, name, scope, user_id });
            const team = yield TeamStore.findById(id);
            if (!team) {
                yield TeamStore.create({ id, name, access_token, scope, user_id });
            }
            else {
                yield TeamStore.update({ id, name, access_token, scope, user_id });
            }
            return TeamStore.findById(id);
        });
    }
    static fetchSettings(teamId, channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({ teamId, channelId });
            const db = _lib_sqlite__WEBPACK_IMPORTED_MODULE_0__["getSingleton"]();
            const settingRows = yield db.all(`SELECT
        setting_key,
        setting_value
      FROM
        channel_settings
      WHERE
        team_id = $teamId AND
        channel_id = $channelId;`, {
                $teamId: teamId,
                $channelId: channelId,
            });
            const rv = {};
            settingRows.forEach((row) => {
                rv[row.setting_key] = row.setting_value;
            });
            return rv;
        });
    }
    static upsertSettings(teamId, channelId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = Object.keys(settings).map((settingKey) => TeamStore.upsertSetting(teamId, channelId, settingKey, settings[settingKey]));
            yield Promise.all(tasks);
        });
    }
    static upsertSetting(teamId, channelId, key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["getSpan"])();
            span === null || span === void 0 ? void 0 : span.setAttributes({ teamId, channelId, key, value });
            const db = _lib_sqlite__WEBPACK_IMPORTED_MODULE_0__["getSingleton"]();
            yield db.run(`INSERT INTO
        channel_settings (team_id, channel_id, setting_key, setting_value)
      VALUES (
        $teamId,
        $channelId,
        $settingKey,
        $settingValue
      )
      ON CONFLICT(team_id, channel_id, setting_key)
      DO UPDATE SET setting_value = $settingValue;`, {
                $teamId: teamId,
                $channelId: channelId,
                $settingKey: key,
                $settingValue: value,
            });
        });
    }
}
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["Trace"])({ name: 'team.findById' })
], TeamStore, "findById", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["Trace"])({ name: 'team.create' })
], TeamStore, "create", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["Trace"])({ name: 'team.update' })
], TeamStore, "update", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["Trace"])({ name: 'team.upsert' })
], TeamStore, "upsert", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["Trace"])()
], TeamStore, "fetchSettings", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["Trace"])()
], TeamStore, "upsertSettings", null);
__decorate([
    Object(_lib_trace_decorator__WEBPACK_IMPORTED_MODULE_1__["Trace"])()
], TeamStore, "upsertSetting", null);


/***/ }),

/***/ "@opentelemetry/api":
/*!*************************************!*\
  !*** external "@opentelemetry/api" ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@opentelemetry/api");

/***/ }),

/***/ "@opentelemetry/exporter-jaeger":
/*!*************************************************!*\
  !*** external "@opentelemetry/exporter-jaeger" ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@opentelemetry/exporter-jaeger");

/***/ }),

/***/ "@opentelemetry/tracing":
/*!*****************************************!*\
  !*** external "@opentelemetry/tracing" ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@opentelemetry/tracing");

/***/ }),

/***/ "@slack/web-api":
/*!*********************************!*\
  !*** external "@slack/web-api" ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@slack/web-api");

/***/ }),

/***/ "async_hooks":
/*!******************************!*\
  !*** external "async_hooks" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("async_hooks");

/***/ }),

/***/ "body-parser":
/*!******************************!*\
  !*** external "body-parser" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),

/***/ "countly-sdk-nodejs":
/*!*************************************!*\
  !*** external "countly-sdk-nodejs" ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("countly-sdk-nodejs");

/***/ }),

/***/ "dotenv":
/*!*************************!*\
  !*** external "dotenv" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("dotenv");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),

/***/ "express-handlebars":
/*!*************************************!*\
  !*** external "express-handlebars" ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("express-handlebars");

/***/ }),

/***/ "lodash/chunk":
/*!*******************************!*\
  !*** external "lodash/chunk" ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/chunk");

/***/ }),

/***/ "lodash/find":
/*!******************************!*\
  !*** external "lodash/find" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/find");

/***/ }),

/***/ "lodash/get":
/*!*****************************!*\
  !*** external "lodash/get" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/get");

/***/ }),

/***/ "lodash/groupBy":
/*!*********************************!*\
  !*** external "lodash/groupBy" ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/groupBy");

/***/ }),

/***/ "lodash/isEmpty":
/*!*********************************!*\
  !*** external "lodash/isEmpty" ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/isEmpty");

/***/ }),

/***/ "lodash/isObject":
/*!**********************************!*\
  !*** external "lodash/isObject" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/isObject");

/***/ }),

/***/ "lodash/isString":
/*!**********************************!*\
  !*** external "lodash/isString" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/isString");

/***/ }),

/***/ "lodash/map":
/*!*****************************!*\
  !*** external "lodash/map" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/map");

/***/ }),

/***/ "lodash/pickBy":
/*!********************************!*\
  !*** external "lodash/pickBy" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/pickBy");

/***/ }),

/***/ "lodash/uniq":
/*!******************************!*\
  !*** external "lodash/uniq" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash/uniq");

/***/ }),

/***/ "pino":
/*!***********************!*\
  !*** external "pino" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("pino");

/***/ }),

/***/ "pretty-ms":
/*!****************************!*\
  !*** external "pretty-ms" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("pretty-ms");

/***/ }),

/***/ "redis":
/*!************************!*\
  !*** external "redis" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("redis");

/***/ }),

/***/ "shortid":
/*!**************************!*\
  !*** external "shortid" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("shortid");

/***/ }),

/***/ "sqlite":
/*!*************************!*\
  !*** external "sqlite" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("sqlite");

/***/ }),

/***/ "sqlite3":
/*!**************************!*\
  !*** external "sqlite3" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("sqlite3");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ })

/******/ });
//# sourceMappingURL=app.js.map