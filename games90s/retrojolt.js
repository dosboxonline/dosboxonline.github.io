﻿var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   2.0.0
 */
(function () {
    "use strict";
    function $$utils$$objectOrFunction(x) {
        return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }
    function $$utils$$isFunction(x) {
        return typeof x === 'function';
    }
    function $$utils$$isMaybeThenable(x) {
        return typeof x === 'object' && x !== null;
    }
    var $$utils$$_isArray;
    if (!Array.isArray) {
        $$utils$$_isArray = function (x) {
            return Object.prototype.toString.call(x) === '[object Array]';
        };
    }
    else {
        $$utils$$_isArray = Array.isArray;
    }
    var $$utils$$isArray = $$utils$$_isArray;
    var $$utils$$now = Date.now || function () { return new Date().getTime(); };
    function $$utils$$F() { }
    var $$utils$$o_create = (Object.create || function (o) {
        if (arguments.length > 1) {
            throw new Error('Second argument not supported');
        }
        if (typeof o !== 'object') {
            throw new TypeError('Argument must be an object');
        }
        $$utils$$F.prototype = o;
        return new $$utils$$F();
    });
    var $$asap$$len = 0;
    var $$asap$$default = function asap(callback, arg) {
        $$asap$$queue[$$asap$$len] = callback;
        $$asap$$queue[$$asap$$len + 1] = arg;
        $$asap$$len += 2;
        if ($$asap$$len === 2) {
            $$asap$$scheduleFlush();
        }
    };
    var $$asap$$browserGlobal = (typeof window !== 'undefined') ? window : {};
    var $$asap$$BrowserMutationObserver = $$asap$$browserGlobal.MutationObserver || $$asap$$browserGlobal.WebKitMutationObserver;
    var $$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
        typeof importScripts !== 'undefined' &&
        typeof MessageChannel !== 'undefined';
    function $$asap$$useNextTick() {
        return function () {
            process.nextTick($$asap$$flush);
        };
    }
    function $$asap$$useMutationObserver() {
        var iterations = 0;
        var observer = new $$asap$$BrowserMutationObserver($$asap$$flush);
        var node = document.createTextNode('');
        observer.observe(node, { characterData: true });
        return function () {
            node.data = (iterations = ++iterations % 2);
        };
    }
    function $$asap$$useMessageChannel() {
        var channel = new MessageChannel();
        channel.port1.onmessage = $$asap$$flush;
        return function () {
            channel.port2.postMessage(0);
        };
    }
    function $$asap$$useSetTimeout() {
        return function () {
            setTimeout($$asap$$flush, 1);
        };
    }
    var $$asap$$queue = new Array(1000);
    function $$asap$$flush() {
        for (var i = 0; i < $$asap$$len; i += 2) {
            var callback = $$asap$$queue[i];
            var arg = $$asap$$queue[i + 1];
            callback(arg);
            $$asap$$queue[i] = undefined;
            $$asap$$queue[i + 1] = undefined;
        }
        $$asap$$len = 0;
    }
    var $$asap$$scheduleFlush;
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
        $$asap$$scheduleFlush = $$asap$$useNextTick();
    }
    else if ($$asap$$BrowserMutationObserver) {
        $$asap$$scheduleFlush = $$asap$$useMutationObserver();
    }
    else if ($$asap$$isWorker) {
        $$asap$$scheduleFlush = $$asap$$useMessageChannel();
    }
    else {
        $$asap$$scheduleFlush = $$asap$$useSetTimeout();
    }
    function $$$internal$$noop() { }
    var $$$internal$$PENDING = void 0;
    var $$$internal$$FULFILLED = 1;
    var $$$internal$$REJECTED = 2;
    var $$$internal$$GET_THEN_ERROR = new $$$internal$$ErrorObject();
    function $$$internal$$selfFullfillment() {
        return new TypeError("You cannot resolve a promise with itself");
    }
    function $$$internal$$cannotReturnOwn() {
        return new TypeError('A promises callback cannot return that same promise.');
    }
    function $$$internal$$getThen(promise) {
        try {
            return promise.then;
        }
        catch (error) {
            $$$internal$$GET_THEN_ERROR.error = error;
            return $$$internal$$GET_THEN_ERROR;
        }
    }
    function $$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
        try {
            then.call(value, fulfillmentHandler, rejectionHandler);
        }
        catch (e) {
            return e;
        }
    }
    function $$$internal$$handleForeignThenable(promise, thenable, then) {
        $$asap$$default(function (promise) {
            var sealed = false;
            var error = $$$internal$$tryThen(then, thenable, function (value) {
                if (sealed) {
                    return;
                }
                sealed = true;
                if (thenable !== value) {
                    $$$internal$$resolve(promise, value);
                }
                else {
                    $$$internal$$fulfill(promise, value);
                }
            }, function (reason) {
                if (sealed) {
                    return;
                }
                sealed = true;
                $$$internal$$reject(promise, reason);
            }, 'Settle: ' + (promise._label || ' unknown promise'));
            if (!sealed && error) {
                sealed = true;
                $$$internal$$reject(promise, error);
            }
        }, promise);
    }
    function $$$internal$$handleOwnThenable(promise, thenable) {
        if (thenable._state === $$$internal$$FULFILLED) {
            $$$internal$$fulfill(promise, thenable._result);
        }
        else if (promise._state === $$$internal$$REJECTED) {
            $$$internal$$reject(promise, thenable._result);
        }
        else {
            $$$internal$$subscribe(thenable, undefined, function (value) {
                $$$internal$$resolve(promise, value);
            }, function (reason) {
                $$$internal$$reject(promise, reason);
            });
        }
    }
    function $$$internal$$handleMaybeThenable(promise, maybeThenable) {
        if (maybeThenable.constructor === promise.constructor) {
            $$$internal$$handleOwnThenable(promise, maybeThenable);
        }
        else {
            var then = $$$internal$$getThen(maybeThenable);
            if (then === $$$internal$$GET_THEN_ERROR) {
                $$$internal$$reject(promise, $$$internal$$GET_THEN_ERROR.error);
            }
            else if (then === undefined) {
                $$$internal$$fulfill(promise, maybeThenable);
            }
            else if ($$utils$$isFunction(then)) {
                $$$internal$$handleForeignThenable(promise, maybeThenable, then);
            }
            else {
                $$$internal$$fulfill(promise, maybeThenable);
            }
        }
    }
    function $$$internal$$resolve(promise, value) {
        if (promise === value) {
            $$$internal$$reject(promise, $$$internal$$selfFullfillment());
        }
        else if ($$utils$$objectOrFunction(value)) {
            $$$internal$$handleMaybeThenable(promise, value);
        }
        else {
            $$$internal$$fulfill(promise, value);
        }
    }
    function $$$internal$$publishRejection(promise) {
        if (promise._onerror) {
            promise._onerror(promise._result);
        }
        $$$internal$$publish(promise);
    }
    function $$$internal$$fulfill(promise, value) {
        if (promise._state !== $$$internal$$PENDING) {
            return;
        }
        promise._result = value;
        promise._state = $$$internal$$FULFILLED;
        if (promise._subscribers.length === 0) {
        }
        else {
            $$asap$$default($$$internal$$publish, promise);
        }
    }
    function $$$internal$$reject(promise, reason) {
        if (promise._state !== $$$internal$$PENDING) {
            return;
        }
        promise._state = $$$internal$$REJECTED;
        promise._result = reason;
        $$asap$$default($$$internal$$publishRejection, promise);
    }
    function $$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
        var subscribers = parent._subscribers;
        var length = subscribers.length;
        parent._onerror = null;
        subscribers[length] = child;
        subscribers[length + $$$internal$$FULFILLED] = onFulfillment;
        subscribers[length + $$$internal$$REJECTED] = onRejection;
        if (length === 0 && parent._state) {
            $$asap$$default($$$internal$$publish, parent);
        }
    }
    function $$$internal$$publish(promise) {
        var subscribers = promise._subscribers;
        var settled = promise._state;
        if (subscribers.length === 0) {
            return;
        }
        var child, callback, detail = promise._result;
        for (var i = 0; i < subscribers.length; i += 3) {
            child = subscribers[i];
            callback = subscribers[i + settled];
            if (child) {
                $$$internal$$invokeCallback(settled, child, callback, detail);
            }
            else {
                callback(detail);
            }
        }
        promise._subscribers.length = 0;
    }
    function $$$internal$$ErrorObject() {
        this.error = null;
    }
    var $$$internal$$TRY_CATCH_ERROR = new $$$internal$$ErrorObject();
    function $$$internal$$tryCatch(callback, detail) {
        try {
            return callback(detail);
        }
        catch (e) {
            $$$internal$$TRY_CATCH_ERROR.error = e;
            return $$$internal$$TRY_CATCH_ERROR;
        }
    }
    function $$$internal$$invokeCallback(settled, promise, callback, detail) {
        var hasCallback = $$utils$$isFunction(callback), value, error, succeeded, failed;
        if (hasCallback) {
            value = $$$internal$$tryCatch(callback, detail);
            if (value === $$$internal$$TRY_CATCH_ERROR) {
                failed = true;
                error = value.error;
                value = null;
            }
            else {
                succeeded = true;
            }
            if (promise === value) {
                $$$internal$$reject(promise, $$$internal$$cannotReturnOwn());
                return;
            }
        }
        else {
            value = detail;
            succeeded = true;
        }
        if (promise._state !== $$$internal$$PENDING) {
        }
        else if (hasCallback && succeeded) {
            $$$internal$$resolve(promise, value);
        }
        else if (failed) {
            $$$internal$$reject(promise, error);
        }
        else if (settled === $$$internal$$FULFILLED) {
            $$$internal$$fulfill(promise, value);
        }
        else if (settled === $$$internal$$REJECTED) {
            $$$internal$$reject(promise, value);
        }
    }
    function $$$internal$$initializePromise(promise, resolver) {
        try {
            resolver(function resolvePromise(value) {
                $$$internal$$resolve(promise, value);
            }, function rejectPromise(reason) {
                $$$internal$$reject(promise, reason);
            });
        }
        catch (e) {
            $$$internal$$reject(promise, e);
        }
    }
    function $$$enumerator$$makeSettledResult(state, position, value) {
        if (state === $$$internal$$FULFILLED) {
            return {
                state: 'fulfilled',
                value: value
            };
        }
        else {
            return {
                state: 'rejected',
                reason: value
            };
        }
    }
    function $$$enumerator$$Enumerator(Constructor, input, abortOnReject, label) {
        this._instanceConstructor = Constructor;
        this.promise = new Constructor($$$internal$$noop, label);
        this._abortOnReject = abortOnReject;
        if (this._validateInput(input)) {
            this._input = input;
            this.length = input.length;
            this._remaining = input.length;
            this._init();
            if (this.length === 0) {
                $$$internal$$fulfill(this.promise, this._result);
            }
            else {
                this.length = this.length || 0;
                this._enumerate();
                if (this._remaining === 0) {
                    $$$internal$$fulfill(this.promise, this._result);
                }
            }
        }
        else {
            $$$internal$$reject(this.promise, this._validationError());
        }
    }
    $$$enumerator$$Enumerator.prototype._validateInput = function (input) {
        return $$utils$$isArray(input);
    };
    $$$enumerator$$Enumerator.prototype._validationError = function () {
        return new Error('Array Methods must be provided an Array');
    };
    $$$enumerator$$Enumerator.prototype._init = function () {
        this._result = new Array(this.length);
    };
    var $$$enumerator$$default = $$$enumerator$$Enumerator;
    $$$enumerator$$Enumerator.prototype._enumerate = function () {
        var length = this.length;
        var promise = this.promise;
        var input = this._input;
        for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
            this._eachEntry(input[i], i);
        }
    };
    $$$enumerator$$Enumerator.prototype._eachEntry = function (entry, i) {
        var c = this._instanceConstructor;
        if ($$utils$$isMaybeThenable(entry)) {
            if (entry.constructor === c && entry._state !== $$$internal$$PENDING) {
                entry._onerror = null;
                this._settledAt(entry._state, i, entry._result);
            }
            else {
                this._willSettleAt(c.resolve(entry), i);
            }
        }
        else {
            this._remaining--;
            this._result[i] = this._makeResult($$$internal$$FULFILLED, i, entry);
        }
    };
    $$$enumerator$$Enumerator.prototype._settledAt = function (state, i, value) {
        var promise = this.promise;
        if (promise._state === $$$internal$$PENDING) {
            this._remaining--;
            if (this._abortOnReject && state === $$$internal$$REJECTED) {
                $$$internal$$reject(promise, value);
            }
            else {
                this._result[i] = this._makeResult(state, i, value);
            }
        }
        if (this._remaining === 0) {
            $$$internal$$fulfill(promise, this._result);
        }
    };
    $$$enumerator$$Enumerator.prototype._makeResult = function (state, i, value) {
        return value;
    };
    $$$enumerator$$Enumerator.prototype._willSettleAt = function (promise, i) {
        var enumerator = this;
        $$$internal$$subscribe(promise, undefined, function (value) {
            enumerator._settledAt($$$internal$$FULFILLED, i, value);
        }, function (reason) {
            enumerator._settledAt($$$internal$$REJECTED, i, reason);
        });
    };
    var $$promise$all$$default = function all(entries, label) {
        return new $$$enumerator$$default(this, entries, true, label).promise;
    };
    var $$promise$race$$default = function race(entries, label) {
        var Constructor = this;
        var promise = new Constructor($$$internal$$noop, label);
        if (!$$utils$$isArray(entries)) {
            $$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
            return promise;
        }
        var length = entries.length;
        function onFulfillment(value) {
            $$$internal$$resolve(promise, value);
        }
        function onRejection(reason) {
            $$$internal$$reject(promise, reason);
        }
        for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
            $$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
        }
        return promise;
    };
    var $$promise$resolve$$default = function resolve(object, label) {
        var Constructor = this;
        if (object && typeof object === 'object' && object.constructor === Constructor) {
            return object;
        }
        var promise = new Constructor($$$internal$$noop, label);
        $$$internal$$resolve(promise, object);
        return promise;
    };
    var $$promise$reject$$default = function reject(reason, label) {
        var Constructor = this;
        var promise = new Constructor($$$internal$$noop, label);
        $$$internal$$reject(promise, reason);
        return promise;
    };
    var $$es6$promise$promise$$counter = 0;
    function $$es6$promise$promise$$needsResolver() {
        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }
    function $$es6$promise$promise$$needsNew() {
        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }
    var $$es6$promise$promise$$default = $$es6$promise$promise$$Promise;
    function $$es6$promise$promise$$Promise(resolver) {
        this._id = $$es6$promise$promise$$counter++;
        this._state = undefined;
        this._result = undefined;
        this._subscribers = [];
        if ($$$internal$$noop !== resolver) {
            if (!$$utils$$isFunction(resolver)) {
                $$es6$promise$promise$$needsResolver();
            }
            if (!(this instanceof $$es6$promise$promise$$Promise)) {
                $$es6$promise$promise$$needsNew();
            }
            $$$internal$$initializePromise(this, resolver);
        }
    }
    $$es6$promise$promise$$Promise.all = $$promise$all$$default;
    $$es6$promise$promise$$Promise.race = $$promise$race$$default;
    $$es6$promise$promise$$Promise.resolve = $$promise$resolve$$default;
    $$es6$promise$promise$$Promise.reject = $$promise$reject$$default;
    $$es6$promise$promise$$Promise.prototype = {
        constructor: $$es6$promise$promise$$Promise,
        then: function (onFulfillment, onRejection) {
            var parent = this;
            var state = parent._state;
            if (state === $$$internal$$FULFILLED && !onFulfillment || state === $$$internal$$REJECTED && !onRejection) {
                return this;
            }
            var child = new this.constructor($$$internal$$noop);
            var result = parent._result;
            if (state) {
                var callback = arguments[state - 1];
                $$asap$$default(function () {
                    $$$internal$$invokeCallback(state, child, callback, result);
                });
            }
            else {
                $$$internal$$subscribe(parent, child, onFulfillment, onRejection);
            }
            return child;
        },
        'catch': function (onRejection) {
            return this.then(null, onRejection);
        }
    };
    var $$es6$promise$polyfill$$default = function polyfill() {
        var local;
        if (typeof global !== 'undefined') {
            local = global;
        }
        else if (typeof window !== 'undefined' && window.document) {
            local = window;
        }
        else {
            local = self;
        }
        var es6PromiseSupport = "Promise" in local &&
            "resolve" in local.Promise &&
            "reject" in local.Promise &&
            "all" in local.Promise &&
            "race" in local.Promise &&
            (function () {
                var resolve;
                new local.Promise(function (r) { resolve = r; });
                return $$utils$$isFunction(resolve);
            }());
        if (!es6PromiseSupport) {
            local.Promise = $$es6$promise$promise$$default;
        }
    };
    var es6$promise$umd$$ES6Promise = {
        'Promise': $$es6$promise$promise$$default,
        'polyfill': $$es6$promise$polyfill$$default
    };
    if (typeof define === 'function' && define['amd']) {
        define(function () { return es6$promise$umd$$ES6Promise; });
    }
    else if (typeof module !== 'undefined' && module['exports']) {
        module['exports'] = es6$promise$umd$$ES6Promise;
    }
    else if (typeof this !== 'undefined') {
        this['ES6Promise'] = es6$promise$umd$$ES6Promise;
    }
}).call(this);
!function (a) { if ("object" == typeof exports && "undefined" != typeof module)
    module.exports = a();
else if ("function" == typeof define && define.amd)
    define([], a);
else {
    var b;
    b = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, b.BrowserFS = a();
} }(function () {
    var a;
    return function b(a, c, d) { function e(g, h) { if (!c[g]) {
        if (!a[g]) {
            var i = "function" == typeof require && require;
            if (!h && i)
                return i(g, !0);
            if (f)
                return f(g, !0);
            var j = new Error("Cannot find module '" + g + "'");
            throw j.code = "MODULE_NOT_FOUND", j;
        }
        var k = c[g] = { exports: {} };
        a[g][0].call(k.exports, function (b) { var c = a[g][1][b]; return e(c ? c : b); }, k, k.exports, b, a, c, d);
    } return c[g].exports; } for (var f = "function" == typeof require && require, g = 0; g < d.length; g++)
        e(d[g]); return e; }({ 1: [function (b, c, d) { !function () { function b() { } function d(a) { var b = !1; return function () { if (b)
                throw new Error("Callback was already called."); b = !0, a.apply(this, arguments); }; } function e(a) { var b = !1; return function () { b || (b = !0, a.apply(this, arguments)); }; } function f(a) { return K(a) || "number" == typeof a.length && a.length >= 0 && a.length % 1 === 0; } function g(a, b) { return f(a) ? h(a, b) : l(a, b); } function h(a, b) { for (var c = -1, d = a.length; ++c < d;)
                b(a[c], c, a); } function i(a, b) { for (var c = -1, d = a.length, e = Array(d); ++c < d;)
                e[c] = b(a[c], c, a); return e; } function j(a) { return i(Array(a), function (a, b) { return b; }); } function k(a, b, c) { return h(a, function (a, d, e) { c = b(c, a, d, e); }), c; } function l(a, b) { h(L(a), function (c) { b(a[c], c); }); } function m(a) { var b, c, d = -1; return f(a) ? (b = a.length, function () { return d++, b > d ? d : null; }) : (c = L(a), b = c.length, function () { return d++, b > d ? c[d] : null; }); } function n(a, b) { b = b || 0; var c = -1, d = a.length; b && (d -= b, d = 0 > d ? 0 : d); for (var e = Array(d); ++c < d;)
                e[c] = a[c + b]; return e; } function o(a) { return function (b, c, d) { return a(b, d); }; } function p(a) { return function (c, f, g) { g = e(g || b), c = c || []; var h = m(c); if (0 >= a)
                return g(null); var i = !1, j = 0, k = !1; !function l() { if (i && 0 >= j)
                return g(null); for (; a > j && !k;) {
                var b = h();
                if (null === b)
                    return i = !0, void (0 >= j && g(null));
                j += 1, f(c[b], b, d(function (a) { j -= 1, a ? (g(a), k = !0) : l(); }));
            } }(); }; } function q(a) { return function (b, c, d) { return a(H.eachOf, b, c, d); }; } function r(a, b) { return function (c, d, e) { return b(p(a), c, d, e); }; } function s(a) { return function (b, c, d) { return a(H.eachOfSeries, b, c, d); }; } function t(a, c, d, f) { f = e(f || b); var g = []; a(c, function (a, b, c) { d(a, function (a, d) { g[b] = d, c(a); }); }, function (a) { f(a, g); }); } function u(a) { return r(a, t); } function v(a, b, c, d) { var e = []; b = i(b, function (a, b) { return { index: b, value: a }; }), a(b, function (a, b, d) { c(a.value, function (b) { b && e.push(a), d(); }); }, function () { d(i(e.sort(function (a, b) { return a.index - b.index; }), function (a) { return a.value; })); }); } function w(a, b, c, d) { var e = []; b = i(b, function (a, b) { return { index: b, value: a }; }), a(b, function (a, b, d) { c(a.value, function (b) { b || e.push(a), d(); }); }, function () { d(i(e.sort(function (a, b) { return a.index - b.index; }), function (a) { return a.value; })); }); } function x(a, c, d, e) { a(c, function (a, c, f) { d(a, function (c) { c ? (e(a), e = b) : f(); }); }, function () { e(); }); } function y(a, c, d) { d = d || b; var e = f(c) ? [] : {}; a(c, function (a, b, c) { a(function (a) { var d = n(arguments, 1); d.length <= 1 && (d = d[0]), e[b] = d, c(a); }); }, function (a) { d(a, e); }); } function z(a, b, c, d) { var e = []; a(b, function (a, b, d) { c(a, function (a, b) { e = e.concat(b || []), d(a); }); }, function (a) { d(a, e); }); } function A(a, c, e) { function f(a, c, d, e) { if (null != e && "function" != typeof e)
                throw new Error("task callback must be a function"); return a.started = !0, K(c) || (c = [c]), 0 === c.length && a.idle() ? H.setImmediate(function () { a.drain(); }) : (h(c, function (c) { var f = { data: c, callback: e || b }; d ? a.tasks.unshift(f) : a.tasks.push(f), a.tasks.length === a.concurrency && a.saturated(); }), void H.setImmediate(a.process)); } function g(a, b) { return function () { j -= 1; var c = arguments; h(b, function (a) { a.callback.apply(a, c); }), a.tasks.length + j === 0 && a.drain(), a.process(); }; } if (null == c)
                c = 1;
            else if (0 === c)
                throw new Error("Concurrency must not be zero"); var j = 0, k = { tasks: [], concurrency: c, saturated: b, empty: b, drain: b, started: !1, paused: !1, push: function (a, b) { f(k, a, !1, b); }, kill: function () { k.drain = b, k.tasks = []; }, unshift: function (a, b) { f(k, a, !0, b); }, process: function () { if (!k.paused && j < k.concurrency && k.tasks.length)
                    for (; j < k.concurrency && k.tasks.length;) {
                        var b = e ? k.tasks.splice(0, e) : k.tasks.splice(0, k.tasks.length), c = i(b, function (a) { return a.data; });
                        0 === k.tasks.length && k.empty(), j += 1;
                        var f = d(g(k, b));
                        a(c, f);
                    } }, length: function () { return k.tasks.length; }, running: function () { return j; }, idle: function () { return k.tasks.length + j === 0; }, pause: function () { k.paused = !0; }, resume: function () { if (k.paused !== !1) {
                    k.paused = !1;
                    for (var a = Math.min(k.concurrency, k.tasks.length), b = 1; a >= b; b++)
                        H.setImmediate(k.process);
                } } }; return k; } function B(a) { return function (b) { var c = n(arguments, 1); b.apply(null, c.concat([function (b) { var c = n(arguments, 1); "undefined" != typeof console && (b ? console.error && console.error(b) : console[a] && h(c, function (b) { console[a](b); })); }])); }; } function C(a) { return function (b, c, d) { a(j(b), c, d); }; } function D(a, b) { function c() { var c = this, d = n(arguments), e = d.pop(); return a(b, function (a, b, e) { a.apply(c, d.concat([e])); }, e); } if (arguments.length > 2) {
                var d = n(arguments, 2);
                return c.apply(this, d);
            } return c; } function E(a) { return function () { var b = n(arguments), c = b.pop(); b.push(function () { var a = arguments; d ? H.setImmediate(function () { c.apply(null, a); }) : c.apply(null, a); }); var d = !0; a.apply(this, b), d = !1; }; } var F, G, H = {}; F = "object" == typeof window && this === window ? window : "object" == typeof global && this === global ? global : this, null != F && (G = F.async), H.noConflict = function () { return F.async = G, H; }; var I, J = Object.prototype.toString, K = Array.isArray || function (a) { return "[object Array]" === J.call(a); }, L = Object.keys || function (a) { var b = []; for (var c in a)
                a.hasOwnProperty(c) && b.push(c); return b; }; "function" == typeof setImmediate && (I = setImmediate), "undefined" != typeof process && process.nextTick ? (H.nextTick = process.nextTick, I ? H.setImmediate = function (a) { I(a); } : H.setImmediate = H.nextTick) : I ? (H.nextTick = function (a) { I(a); }, H.setImmediate = H.nextTick) : (H.nextTick = function (a) { setTimeout(a, 0); }, H.setImmediate = H.nextTick), H.forEach = H.each = function (a, b, c) { return H.eachOf(a, o(b), c); }, H.forEachSeries = H.eachSeries = function (a, b, c) { return H.eachOfSeries(a, o(b), c); }, H.forEachLimit = H.eachLimit = function (a, b, c, d) { return p(b)(a, o(c), d); }, H.forEachOf = H.eachOf = function (a, c, h) { function i(a) { a ? h(a) : (k += 1, k >= j && h(null)); } h = e(h || b), a = a || []; var j = f(a) ? a.length : L(a).length, k = 0; return j ? void g(a, function (b, e) { c(a[e], e, d(i)); }) : h(null); }, H.forEachOfSeries = H.eachOfSeries = function (a, c, f) { function g() { var b = !0; return null === i ? f(null) : (c(a[i], i, d(function (a) { if (a)
                f(a);
            else {
                if (i = h(), null === i)
                    return f(null);
                b ? H.nextTick(g) : g();
            } })), void (b = !1)); } f = e(f || b), a = a || []; var h = m(a), i = h(); g(); }, H.forEachOfLimit = H.eachOfLimit = function (a, b, c, d) { p(b)(a, c, d); }, H.map = q(t), H.mapSeries = s(t), H.mapLimit = function (a, b, c, d) { return u(b)(a, c, d); }, H.inject = H.foldl = H.reduce = function (a, b, c, d) { H.eachOfSeries(a, function (a, d, e) { c(b, a, function (a, c) { b = c, e(a); }); }, function (a) { d(a || null, b); }); }, H.foldr = H.reduceRight = function (a, b, c, d) { var e = i(a, function (a) { return a; }).reverse(); H.reduce(e, b, c, d); }, H.select = H.filter = q(v), H.selectSeries = H.filterSeries = s(v), H.reject = q(w), H.rejectSeries = s(w), H.detect = q(x), H.detectSeries = s(x), H.any = H.some = function (a, c, d) { H.eachOf(a, function (a, e, f) { c(a, function (a) { a && (d(!0), d = b), f(); }); }, function () { d(!1); }); }, H.all = H.every = function (a, c, d) { H.eachOf(a, function (a, e, f) { c(a, function (a) { a || (d(!1), d = b), f(); }); }, function () { d(!0); }); }, H.sortBy = function (a, b, c) { function d(a, b) { var c = a.criteria, d = b.criteria; return d > c ? -1 : c > d ? 1 : 0; } H.map(a, function (a, c) { b(a, function (b, d) { b ? c(b) : c(null, { value: a, criteria: d }); }); }, function (a, b) { return a ? c(a) : void c(null, i(b.sort(d), function (a) { return a.value; })); }); }, H.auto = function (a, c) { function d(a) { m.unshift(a); } function f(a) { for (var b = 0; b < m.length; b += 1)
                if (m[b] === a)
                    return void m.splice(b, 1); } function g() { j--, h(m.slice(0), function (a) { a(); }); } c = e(c || b); var i = L(a), j = i.length; if (!j)
                return c(null); var l = {}, m = []; d(function () { j || c(null, l); }), h(i, function (b) { function e(a) { var d = n(arguments, 1); if (d.length <= 1 && (d = d[0]), a) {
                var e = {};
                h(L(l), function (a) { e[a] = l[a]; }), e[b] = d, c(a, e);
            }
            else
                l[b] = d, H.setImmediate(g); } function i() { return k(p, function (a, b) { return a && l.hasOwnProperty(b); }, !0) && !l.hasOwnProperty(b); } function j() { i() && (f(j), o[o.length - 1](e, l)); } for (var m, o = K(a[b]) ? a[b] : [a[b]], p = o.slice(0, Math.abs(o.length - 1)) || [], q = p.length; q--;) {
                if (!(m = a[p[q]]))
                    throw new Error("Has inexistant dependency");
                if (K(m) && ~m.indexOf(b))
                    throw new Error("Has cyclic dependencies");
            } i() ? o[o.length - 1](e, l) : d(j); }); }, H.retry = function (a, b, c) { function d(d, e) { function g(a, b) { return function (c) { a(function (a, d) { c(!a || b, { err: a, result: d }); }, e); }; } for (; a;)
                f.push(g(b, !(a -= 1))); H.series(f, function (a, b) { b = b[b.length - 1], (d || c)(b.err, b.result); }); } var e = 5, f = []; return "function" == typeof a && (c = b, b = a, a = e), a = parseInt(a, 10) || e, c ? d() : d; }, H.waterfall = function (a, c) { function d(a) { return function (b) { if (b)
                c.apply(null, arguments);
            else {
                var e = n(arguments, 1), f = a.next();
                f ? e.push(d(f)) : e.push(c), E(a).apply(null, e);
            } }; } if (c = e(c || b), !K(a)) {
                var f = new Error("First argument to waterfall must be an array of functions");
                return c(f);
            } return a.length ? void d(H.iterator(a))() : c(); }, H.parallel = function (a, b) { y(H.eachOf, a, b); }, H.parallelLimit = function (a, b, c) { y(p(b), a, c); }, H.series = function (a, c) { c = c || b; var d = f(a) ? [] : {}; H.eachOfSeries(a, function (a, b, c) { a(function (a) { var e = n(arguments, 1); e.length <= 1 && (e = e[0]), d[b] = e, c(a); }); }, function (a) { c(a, d); }); }, H.iterator = function (a) { function b(c) { function d() { return a.length && a[c].apply(null, arguments), d.next(); } return d.next = function () { return c < a.length - 1 ? b(c + 1) : null; }, d; } return b(0); }, H.apply = function (a) { var b = n(arguments, 1); return function () { return a.apply(null, b.concat(n(arguments))); }; }, H.concat = q(z), H.concatSeries = s(z), H.whilst = function (a, b, c) { a() ? b(function (d) { return d ? c(d) : void H.whilst(a, b, c); }) : c(null); }, H.doWhilst = function (a, b, c) { a(function (d) { if (d)
                return c(d); var e = n(arguments, 1); b.apply(null, e) ? H.doWhilst(a, b, c) : c(null); }); }, H.until = function (a, b, c) { a() ? c(null) : b(function (d) { return d ? c(d) : void H.until(a, b, c); }); }, H.doUntil = function (a, b, c) { a(function (d) { if (d)
                return c(d); var e = n(arguments, 1); b.apply(null, e) ? c(null) : H.doUntil(a, b, c); }); }, H.queue = function (a, b) { var c = A(function (b, c) { a(b[0], c); }, b, 1); return c; }, H.priorityQueue = function (a, c) { function d(a, b) { return a.priority - b.priority; } function e(a, b, c) { for (var d = -1, e = a.length - 1; e > d;) {
                var f = d + (e - d + 1 >>> 1);
                c(b, a[f]) >= 0 ? d = f : e = f - 1;
            } return d; } function f(a, c, f, g) { if (null != g && "function" != typeof g)
                throw new Error("task callback must be a function"); return a.started = !0, K(c) || (c = [c]), 0 === c.length ? H.setImmediate(function () { a.drain(); }) : void h(c, function (c) { var h = { data: c, priority: f, callback: "function" == typeof g ? g : b }; a.tasks.splice(e(a.tasks, h, d) + 1, 0, h), a.tasks.length === a.concurrency && a.saturated(), H.setImmediate(a.process); }); } var g = H.queue(a, c); return g.push = function (a, b, c) { f(g, a, b, c); }, delete g.unshift, g; }, H.cargo = function (a, b) { return A(a, 1, b); }, H.log = B("log"), H.dir = B("dir"), H.memoize = function (a, b) { function c() { var c = n(arguments), f = c.pop(), g = b.apply(null, c); g in d ? H.nextTick(function () { f.apply(null, d[g]); }) : g in e ? e[g].push(f) : (e[g] = [f], a.apply(null, c.concat([function () { d[g] = n(arguments); var a = e[g]; delete e[g]; for (var b = 0, c = a.length; c > b; b++)
                    a[b].apply(null, arguments); }]))); } var d = {}, e = {}; return b = b || function (a) { return a; }, c.memo = d, c.unmemoized = a, c; }, H.unmemoize = function (a) { return function () { return (a.unmemoized || a).apply(null, arguments); }; }, H.times = C(H.map), H.timesSeries = C(H.mapSeries), H.timesLimit = function (a, b, c, d) { return H.mapLimit(j(a), b, c, d); }, H.seq = function () { var a = arguments; return function () { var c = this, d = n(arguments), e = d.slice(-1)[0]; "function" == typeof e ? d.pop() : e = b, H.reduce(a, d, function (a, b, d) { b.apply(c, a.concat([function () { var a = arguments[0], b = n(arguments, 1); d(a, b); }])); }, function (a, b) { e.apply(c, [a].concat(b)); }); }; }, H.compose = function () { return H.seq.apply(null, Array.prototype.reverse.call(arguments)); }, H.applyEach = function () { var a = n(arguments); return D.apply(null, [H.eachOf].concat(a)); }, H.applyEachSeries = function () { var a = n(arguments); return D.apply(null, [H.eachOfSeries].concat(a)); }, H.forever = function (a, c) { function e(a) { return a ? f(a) : void g(e); } var f = d(c || b), g = E(a); e(); }, H.ensureAsync = E, "undefined" != typeof c && c.exports ? c.exports = H : "undefined" != typeof a && a.amd ? a([], function () { return H; }) : F.async = H; }(); }, {}], 2: [function (b, c, d) {
                !function (b) { if ("object" == typeof d && "undefined" != typeof c)
                    c.exports = b();
                else if ("function" == typeof a && a.amd)
                    a([], b);
                else {
                    var e;
                    e = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, e.pako = b();
                } }(function () {
                    return function a(c, d, e) { function f(h, i) { if (!d[h]) {
                        if (!c[h]) {
                            var j = "function" == typeof b && b;
                            if (!i && j)
                                return j(h, !0);
                            if (g)
                                return g(h, !0);
                            var k = new Error("Cannot find module '" + h + "'");
                            throw k.code = "MODULE_NOT_FOUND", k;
                        }
                        var l = d[h] = { exports: {} };
                        c[h][0].call(l.exports, function (a) { var b = c[h][1][a]; return f(b ? b : a); }, l, l.exports, a, c, d, e);
                    } return d[h].exports; } for (var g = "function" == typeof b && b, h = 0; h < e.length; h++)
                        f(e[h]); return f; }({ 1: [function (a, b, c) {
                                "use strict";
                                var d = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
                                c.assign = function (a) { for (var b = Array.prototype.slice.call(arguments, 1); b.length;) {
                                    var c = b.shift();
                                    if (c) {
                                        if ("object" != typeof c)
                                            throw new TypeError(c + "must be non-object");
                                        for (var d in c)
                                            c.hasOwnProperty(d) && (a[d] = c[d]);
                                    }
                                } return a; }, c.shrinkBuf = function (a, b) { return a.length === b ? a : a.subarray ? a.subarray(0, b) : (a.length = b, a); };
                                var e = { arraySet: function (a, b, c, d, e) { if (b.subarray && a.subarray)
                                        return void a.set(b.subarray(c, c + d), e); for (var f = 0; d > f; f++)
                                        a[e + f] = b[c + f]; }, flattenChunks: function (a) { var b, c, d, e, f, g; for (d = 0, b = 0, c = a.length; c > b; b++)
                                        d += a[b].length; for (g = new Uint8Array(d), e = 0, b = 0, c = a.length; c > b; b++)
                                        f = a[b], g.set(f, e), e += f.length; return g; } }, f = { arraySet: function (a, b, c, d, e) { for (var f = 0; d > f; f++)
                                        a[e + f] = b[c + f]; }, flattenChunks: function (a) { return [].concat.apply([], a); } };
                                c.setTyped = function (a) { a ? (c.Buf8 = Uint8Array, c.Buf16 = Uint16Array, c.Buf32 = Int32Array, c.assign(c, e)) : (c.Buf8 = Array, c.Buf16 = Array, c.Buf32 = Array, c.assign(c, f)); }, c.setTyped(d);
                            }, {}], 2: [function (a, b, c) {
                                "use strict";
                                function d(a, b) { if (65537 > b && (a.subarray && g || !a.subarray && f))
                                    return String.fromCharCode.apply(null, e.shrinkBuf(a, b)); for (var c = "", d = 0; b > d; d++)
                                    c += String.fromCharCode(a[d]); return c; }
                                var e = a("./common"), f = !0, g = !0;
                                try {
                                    String.fromCharCode.apply(null, [0]);
                                }
                                catch (h) {
                                    f = !1;
                                }
                                try {
                                    String.fromCharCode.apply(null, new Uint8Array(1));
                                }
                                catch (h) {
                                    g = !1;
                                }
                                for (var i = new e.Buf8(256), j = 0; 256 > j; j++)
                                    i[j] = j >= 252 ? 6 : j >= 248 ? 5 : j >= 240 ? 4 : j >= 224 ? 3 : j >= 192 ? 2 : 1;
                                i[254] = i[254] = 1, c.string2buf = function (a) { var b, c, d, f, g, h = a.length, i = 0; for (f = 0; h > f; f++)
                                    c = a.charCodeAt(f), 55296 === (64512 & c) && h > f + 1 && (d = a.charCodeAt(f + 1), 56320 === (64512 & d) && (c = 65536 + (c - 55296 << 10) + (d - 56320), f++)), i += 128 > c ? 1 : 2048 > c ? 2 : 65536 > c ? 3 : 4; for (b = new e.Buf8(i), g = 0, f = 0; i > g; f++)
                                    c = a.charCodeAt(f), 55296 === (64512 & c) && h > f + 1 && (d = a.charCodeAt(f + 1), 56320 === (64512 & d) && (c = 65536 + (c - 55296 << 10) + (d - 56320), f++)), 128 > c ? b[g++] = c : 2048 > c ? (b[g++] = 192 | c >>> 6, b[g++] = 128 | 63 & c) : 65536 > c ? (b[g++] = 224 | c >>> 12, b[g++] = 128 | c >>> 6 & 63, b[g++] = 128 | 63 & c) : (b[g++] = 240 | c >>> 18, b[g++] = 128 | c >>> 12 & 63, b[g++] = 128 | c >>> 6 & 63, b[g++] = 128 | 63 & c); return b; }, c.buf2binstring = function (a) { return d(a, a.length); }, c.binstring2buf = function (a) { for (var b = new e.Buf8(a.length), c = 0, d = b.length; d > c; c++)
                                    b[c] = a.charCodeAt(c); return b; }, c.buf2string = function (a, b) { var c, e, f, g, h = b || a.length, j = new Array(2 * h); for (e = 0, c = 0; h > c;)
                                    if (f = a[c++], 128 > f)
                                        j[e++] = f;
                                    else if (g = i[f], g > 4)
                                        j[e++] = 65533, c += g - 1;
                                    else {
                                        for (f &= 2 === g ? 31 : 3 === g ? 15 : 7; g > 1 && h > c;)
                                            f = f << 6 | 63 & a[c++], g--;
                                        g > 1 ? j[e++] = 65533 : 65536 > f ? j[e++] = f : (f -= 65536, j[e++] = 55296 | f >> 10 & 1023, j[e++] = 56320 | 1023 & f);
                                    } return d(j, e); }, c.utf8border = function (a, b) { var c; for (b = b || a.length, b > a.length && (b = a.length), c = b - 1; c >= 0 && 128 === (192 & a[c]);)
                                    c--; return 0 > c ? b : 0 === c ? b : c + i[a[c]] > b ? c : b; };
                            }, { "./common": 1 }], 3: [function (a, b, c) {
                                "use strict";
                                function d(a, b, c, d) { for (var e = 65535 & a | 0, f = a >>> 16 & 65535 | 0, g = 0; 0 !== c;) {
                                    g = c > 2e3 ? 2e3 : c, c -= g;
                                    do
                                        e = e + b[d++] | 0, f = f + e | 0;
                                    while (--g);
                                    e %= 65521, f %= 65521;
                                } return e | f << 16 | 0; }
                                b.exports = d;
                            }, {}], 4: [function (a, b, c) { b.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 }; }, {}], 5: [function (a, b, c) {
                                "use strict";
                                function d() { for (var a, b = [], c = 0; 256 > c; c++) {
                                    a = c;
                                    for (var d = 0; 8 > d; d++)
                                        a = 1 & a ? 3988292384 ^ a >>> 1 : a >>> 1;
                                    b[c] = a;
                                } return b; }
                                function e(a, b, c, d) { var e = f, g = d + c; a = -1 ^ a; for (var h = d; g > h; h++)
                                    a = a >>> 8 ^ e[255 & (a ^ b[h])]; return -1 ^ a; }
                                var f = d();
                                b.exports = e;
                            }, {}], 6: [function (a, b, c) {
                                "use strict";
                                function d() { this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1; }
                                b.exports = d;
                            }, {}], 7: [function (a, b, c) {
                                "use strict";
                                var d = 30, e = 12;
                                b.exports = function (a, b) { var c, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z, A, B, C; c = a.state, f = a.next_in, B = a.input, g = f + (a.avail_in - 5), h = a.next_out, C = a.output, i = h - (b - a.avail_out), j = h + (a.avail_out - 257), k = c.dmax, l = c.wsize, m = c.whave, n = c.wnext, o = c.window, p = c.hold, q = c.bits, r = c.lencode, s = c.distcode, t = (1 << c.lenbits) - 1, u = (1 << c.distbits) - 1; a: do {
                                    15 > q && (p += B[f++] << q, q += 8, p += B[f++] << q, q += 8), v = r[p & t];
                                    b: for (;;) {
                                        if (w = v >>> 24, p >>>= w, q -= w, w = v >>> 16 & 255, 0 === w)
                                            C[h++] = 65535 & v;
                                        else {
                                            if (!(16 & w)) {
                                                if (0 === (64 & w)) {
                                                    v = r[(65535 & v) + (p & (1 << w) - 1)];
                                                    continue b;
                                                }
                                                if (32 & w) {
                                                    c.mode = e;
                                                    break a;
                                                }
                                                a.msg = "invalid literal/length code", c.mode = d;
                                                break a;
                                            }
                                            x = 65535 & v, w &= 15, w && (w > q && (p += B[f++] << q, q += 8), x += p & (1 << w) - 1, p >>>= w, q -= w), 15 > q && (p += B[f++] << q, q += 8, p += B[f++] << q, q += 8), v = s[p & u];
                                            c: for (;;) {
                                                if (w = v >>> 24, p >>>= w, q -= w, w = v >>> 16 & 255, !(16 & w)) {
                                                    if (0 === (64 & w)) {
                                                        v = s[(65535 & v) + (p & (1 << w) - 1)];
                                                        continue c;
                                                    }
                                                    a.msg = "invalid distance code", c.mode = d;
                                                    break a;
                                                }
                                                if (y = 65535 & v, w &= 15, w > q && (p += B[f++] << q, q += 8, w > q && (p += B[f++] << q, q += 8)), y += p & (1 << w) - 1, y > k) {
                                                    a.msg = "invalid distance too far back", c.mode = d;
                                                    break a;
                                                }
                                                if (p >>>= w, q -= w, w = h - i, y > w) {
                                                    if (w = y - w, w > m && c.sane) {
                                                        a.msg = "invalid distance too far back", c.mode = d;
                                                        break a;
                                                    }
                                                    if (z = 0, A = o, 0 === n) {
                                                        if (z += l - w, x > w) {
                                                            x -= w;
                                                            do
                                                                C[h++] = o[z++];
                                                            while (--w);
                                                            z = h - y, A = C;
                                                        }
                                                    }
                                                    else if (w > n) {
                                                        if (z += l + n - w, w -= n, x > w) {
                                                            x -= w;
                                                            do
                                                                C[h++] = o[z++];
                                                            while (--w);
                                                            if (z = 0, x > n) {
                                                                w = n, x -= w;
                                                                do
                                                                    C[h++] = o[z++];
                                                                while (--w);
                                                                z = h - y, A = C;
                                                            }
                                                        }
                                                    }
                                                    else if (z += n - w, x > w) {
                                                        x -= w;
                                                        do
                                                            C[h++] = o[z++];
                                                        while (--w);
                                                        z = h - y, A = C;
                                                    }
                                                    for (; x > 2;)
                                                        C[h++] = A[z++], C[h++] = A[z++], C[h++] = A[z++], x -= 3;
                                                    x && (C[h++] = A[z++], x > 1 && (C[h++] = A[z++]));
                                                }
                                                else {
                                                    z = h - y;
                                                    do
                                                        C[h++] = C[z++], C[h++] = C[z++], C[h++] = C[z++], x -= 3;
                                                    while (x > 2);
                                                    x && (C[h++] = C[z++], x > 1 && (C[h++] = C[z++]));
                                                }
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                } while (g > f && j > h); x = q >> 3, f -= x, q -= x << 3, p &= (1 << q) - 1, a.next_in = f, a.next_out = h, a.avail_in = g > f ? 5 + (g - f) : 5 - (f - g), a.avail_out = j > h ? 257 + (j - h) : 257 - (h - j), c.hold = p, c.bits = q; };
                            }, {}], 8: [function (a, b, c) {
                                "use strict";
                                function d(a) { return (a >>> 24 & 255) + (a >>> 8 & 65280) + ((65280 & a) << 8) + ((255 & a) << 24); }
                                function e() { this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new r.Buf16(320), this.work = new r.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0; }
                                function f(a) { var b; return a && a.state ? (b = a.state, a.total_in = a.total_out = b.total = 0, a.msg = "", b.wrap && (a.adler = 1 & b.wrap), b.mode = K, b.last = 0, b.havedict = 0, b.dmax = 32768, b.head = null, b.hold = 0, b.bits = 0, b.lencode = b.lendyn = new r.Buf32(oa), b.distcode = b.distdyn = new r.Buf32(pa), b.sane = 1, b.back = -1, C) : F; }
                                function g(a) { var b; return a && a.state ? (b = a.state, b.wsize = 0, b.whave = 0, b.wnext = 0, f(a)) : F; }
                                function h(a, b) { var c, d; return a && a.state ? (d = a.state, 0 > b ? (c = 0, b = -b) : (c = (b >> 4) + 1, 48 > b && (b &= 15)), b && (8 > b || b > 15) ? F : (null !== d.window && d.wbits !== b && (d.window = null), d.wrap = c, d.wbits = b, g(a))) : F; }
                                function i(a, b) { var c, d; return a ? (d = new e, a.state = d, d.window = null, c = h(a, b), c !== C && (a.state = null), c) : F; }
                                function j(a) { return i(a, ra); }
                                function k(a) { if (sa) {
                                    var b;
                                    for (p = new r.Buf32(512), q = new r.Buf32(32), b = 0; 144 > b;)
                                        a.lens[b++] = 8;
                                    for (; 256 > b;)
                                        a.lens[b++] = 9;
                                    for (; 280 > b;)
                                        a.lens[b++] = 7;
                                    for (; 288 > b;)
                                        a.lens[b++] = 8;
                                    for (v(x, a.lens, 0, 288, p, 0, a.work, { bits: 9 }), b = 0; 32 > b;)
                                        a.lens[b++] = 5;
                                    v(y, a.lens, 0, 32, q, 0, a.work, { bits: 5 }), sa = !1;
                                } a.lencode = p, a.lenbits = 9, a.distcode = q, a.distbits = 5; }
                                function l(a, b, c, d) { var e, f = a.state; return null === f.window && (f.wsize = 1 << f.wbits, f.wnext = 0, f.whave = 0, f.window = new r.Buf8(f.wsize)), d >= f.wsize ? (r.arraySet(f.window, b, c - f.wsize, f.wsize, 0), f.wnext = 0, f.whave = f.wsize) : (e = f.wsize - f.wnext, e > d && (e = d), r.arraySet(f.window, b, c - d, e, f.wnext), d -= e, d ? (r.arraySet(f.window, b, c - d, d, 0), f.wnext = d, f.whave = f.wsize) : (f.wnext += e, f.wnext === f.wsize && (f.wnext = 0), f.whave < f.wsize && (f.whave += e))), 0; }
                                function m(a, b) { var c, e, f, g, h, i, j, m, n, o, p, q, oa, pa, qa, ra, sa, ta, ua, va, wa, xa, ya, za, Aa = 0, Ba = new r.Buf8(4), Ca = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]; if (!a || !a.state || !a.output || !a.input && 0 !== a.avail_in)
                                    return F; c = a.state, c.mode === V && (c.mode = W), h = a.next_out, f = a.output, j = a.avail_out, g = a.next_in, e = a.input, i = a.avail_in, m = c.hold, n = c.bits, o = i, p = j, xa = C; a: for (;;)
                                    switch (c.mode) {
                                        case K:
                                            if (0 === c.wrap) {
                                                c.mode = W;
                                                break;
                                            }
                                            for (; 16 > n;) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            if (2 & c.wrap && 35615 === m) {
                                                c.check = 0, Ba[0] = 255 & m, Ba[1] = m >>> 8 & 255, c.check = t(c.check, Ba, 2, 0), m = 0, n = 0, c.mode = L;
                                                break;
                                            }
                                            if (c.flags = 0, c.head && (c.head.done = !1), !(1 & c.wrap) || (((255 & m) << 8) + (m >> 8)) % 31) {
                                                a.msg = "incorrect header check", c.mode = la;
                                                break;
                                            }
                                            if ((15 & m) !== J) {
                                                a.msg = "unknown compression method", c.mode = la;
                                                break;
                                            }
                                            if (m >>>= 4, n -= 4, wa = (15 & m) + 8, 0 === c.wbits)
                                                c.wbits = wa;
                                            else if (wa > c.wbits) {
                                                a.msg = "invalid window size", c.mode = la;
                                                break;
                                            }
                                            c.dmax = 1 << wa, a.adler = c.check = 1, c.mode = 512 & m ? T : V, m = 0, n = 0;
                                            break;
                                        case L:
                                            for (; 16 > n;) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            if (c.flags = m, (255 & c.flags) !== J) {
                                                a.msg = "unknown compression method", c.mode = la;
                                                break;
                                            }
                                            if (57344 & c.flags) {
                                                a.msg = "unknown header flags set", c.mode = la;
                                                break;
                                            }
                                            c.head && (c.head.text = m >> 8 & 1), 512 & c.flags && (Ba[0] = 255 & m, Ba[1] = m >>> 8 & 255, c.check = t(c.check, Ba, 2, 0)), m = 0, n = 0, c.mode = M;
                                        case M:
                                            for (; 32 > n;) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            c.head && (c.head.time = m), 512 & c.flags && (Ba[0] = 255 & m, Ba[1] = m >>> 8 & 255, Ba[2] = m >>> 16 & 255, Ba[3] = m >>> 24 & 255, c.check = t(c.check, Ba, 4, 0)), m = 0, n = 0, c.mode = N;
                                        case N:
                                            for (; 16 > n;) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            c.head && (c.head.xflags = 255 & m, c.head.os = m >> 8), 512 & c.flags && (Ba[0] = 255 & m, Ba[1] = m >>> 8 & 255, c.check = t(c.check, Ba, 2, 0)), m = 0, n = 0, c.mode = O;
                                        case O:
                                            if (1024 & c.flags) {
                                                for (; 16 > n;) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m += e[g++] << n, n += 8;
                                                }
                                                c.length = m, c.head && (c.head.extra_len = m), 512 & c.flags && (Ba[0] = 255 & m, Ba[1] = m >>> 8 & 255, c.check = t(c.check, Ba, 2, 0)), m = 0, n = 0;
                                            }
                                            else
                                                c.head && (c.head.extra = null);
                                            c.mode = P;
                                        case P:
                                            if (1024 & c.flags && (q = c.length, q > i && (q = i), q && (c.head && (wa = c.head.extra_len - c.length, c.head.extra || (c.head.extra = new Array(c.head.extra_len)), r.arraySet(c.head.extra, e, g, q, wa)), 512 & c.flags && (c.check = t(c.check, e, q, g)), i -= q, g += q, c.length -= q), c.length))
                                                break a;
                                            c.length = 0, c.mode = Q;
                                        case Q:
                                            if (2048 & c.flags) {
                                                if (0 === i)
                                                    break a;
                                                q = 0;
                                                do
                                                    wa = e[g + q++], c.head && wa && c.length < 65536 && (c.head.name += String.fromCharCode(wa));
                                                while (wa && i > q);
                                                if (512 & c.flags && (c.check = t(c.check, e, q, g)), i -= q, g += q, wa)
                                                    break a;
                                            }
                                            else
                                                c.head && (c.head.name = null);
                                            c.length = 0, c.mode = R;
                                        case R:
                                            if (4096 & c.flags) {
                                                if (0 === i)
                                                    break a;
                                                q = 0;
                                                do
                                                    wa = e[g + q++], c.head && wa && c.length < 65536 && (c.head.comment += String.fromCharCode(wa));
                                                while (wa && i > q);
                                                if (512 & c.flags && (c.check = t(c.check, e, q, g)), i -= q, g += q, wa)
                                                    break a;
                                            }
                                            else
                                                c.head && (c.head.comment = null);
                                            c.mode = S;
                                        case S:
                                            if (512 & c.flags) {
                                                for (; 16 > n;) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m += e[g++] << n, n += 8;
                                                }
                                                if (m !== (65535 & c.check)) {
                                                    a.msg = "header crc mismatch", c.mode = la;
                                                    break;
                                                }
                                                m = 0, n = 0;
                                            }
                                            c.head && (c.head.hcrc = c.flags >> 9 & 1, c.head.done = !0), a.adler = c.check = 0, c.mode = V;
                                            break;
                                        case T:
                                            for (; 32 > n;) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            a.adler = c.check = d(m), m = 0, n = 0, c.mode = U;
                                        case U:
                                            if (0 === c.havedict)
                                                return a.next_out = h, a.avail_out = j, a.next_in = g, a.avail_in = i, c.hold = m, c.bits = n, E;
                                            a.adler = c.check = 1, c.mode = V;
                                        case V: if (b === A || b === B)
                                            break a;
                                        case W:
                                            if (c.last) {
                                                m >>>= 7 & n, n -= 7 & n, c.mode = ia;
                                                break;
                                            }
                                            for (; 3 > n;) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            switch (c.last = 1 & m, m >>>= 1, n -= 1, 3 & m) {
                                                case 0:
                                                    c.mode = X;
                                                    break;
                                                case 1:
                                                    if (k(c), c.mode = ba, b === B) {
                                                        m >>>= 2, n -= 2;
                                                        break a;
                                                    }
                                                    break;
                                                case 2:
                                                    c.mode = $;
                                                    break;
                                                case 3: a.msg = "invalid block type", c.mode = la;
                                            }
                                            m >>>= 2, n -= 2;
                                            break;
                                        case X:
                                            for (m >>>= 7 & n, n -= 7 & n; 32 > n;) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            if ((65535 & m) !== (m >>> 16 ^ 65535)) {
                                                a.msg = "invalid stored block lengths", c.mode = la;
                                                break;
                                            }
                                            if (c.length = 65535 & m, m = 0, n = 0, c.mode = Y, b === B)
                                                break a;
                                        case Y: c.mode = Z;
                                        case Z:
                                            if (q = c.length) {
                                                if (q > i && (q = i), q > j && (q = j), 0 === q)
                                                    break a;
                                                r.arraySet(f, e, g, q, h), i -= q, g += q, j -= q, h += q, c.length -= q;
                                                break;
                                            }
                                            c.mode = V;
                                            break;
                                        case $:
                                            for (; 14 > n;) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            if (c.nlen = (31 & m) + 257, m >>>= 5, n -= 5, c.ndist = (31 & m) + 1, m >>>= 5, n -= 5, c.ncode = (15 & m) + 4, m >>>= 4, n -= 4, c.nlen > 286 || c.ndist > 30) {
                                                a.msg = "too many length or distance symbols", c.mode = la;
                                                break;
                                            }
                                            c.have = 0, c.mode = _;
                                        case _:
                                            for (; c.have < c.ncode;) {
                                                for (; 3 > n;) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m += e[g++] << n, n += 8;
                                                }
                                                c.lens[Ca[c.have++]] = 7 & m, m >>>= 3, n -= 3;
                                            }
                                            for (; c.have < 19;)
                                                c.lens[Ca[c.have++]] = 0;
                                            if (c.lencode = c.lendyn, c.lenbits = 7, ya = { bits: c.lenbits }, xa = v(w, c.lens, 0, 19, c.lencode, 0, c.work, ya), c.lenbits = ya.bits, xa) {
                                                a.msg = "invalid code lengths set", c.mode = la;
                                                break;
                                            }
                                            c.have = 0, c.mode = aa;
                                        case aa:
                                            for (; c.have < c.nlen + c.ndist;) {
                                                for (; Aa = c.lencode[m & (1 << c.lenbits) - 1], qa = Aa >>> 24, ra = Aa >>> 16 & 255, sa = 65535 & Aa, !(n >= qa);) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m += e[g++] << n, n += 8;
                                                }
                                                if (16 > sa)
                                                    m >>>= qa, n -= qa, c.lens[c.have++] = sa;
                                                else {
                                                    if (16 === sa) {
                                                        for (za = qa + 2; za > n;) {
                                                            if (0 === i)
                                                                break a;
                                                            i--, m += e[g++] << n, n += 8;
                                                        }
                                                        if (m >>>= qa, n -= qa, 0 === c.have) {
                                                            a.msg = "invalid bit length repeat", c.mode = la;
                                                            break;
                                                        }
                                                        wa = c.lens[c.have - 1], q = 3 + (3 & m), m >>>= 2, n -= 2;
                                                    }
                                                    else if (17 === sa) {
                                                        for (za = qa + 3; za > n;) {
                                                            if (0 === i)
                                                                break a;
                                                            i--, m += e[g++] << n, n += 8;
                                                        }
                                                        m >>>= qa, n -= qa, wa = 0, q = 3 + (7 & m), m >>>= 3, n -= 3;
                                                    }
                                                    else {
                                                        for (za = qa + 7; za > n;) {
                                                            if (0 === i)
                                                                break a;
                                                            i--, m += e[g++] << n, n += 8;
                                                        }
                                                        m >>>= qa, n -= qa, wa = 0, q = 11 + (127 & m), m >>>= 7, n -= 7;
                                                    }
                                                    if (c.have + q > c.nlen + c.ndist) {
                                                        a.msg = "invalid bit length repeat", c.mode = la;
                                                        break;
                                                    }
                                                    for (; q--;)
                                                        c.lens[c.have++] = wa;
                                                }
                                            }
                                            if (c.mode === la)
                                                break;
                                            if (0 === c.lens[256]) {
                                                a.msg = "invalid code -- missing end-of-block", c.mode = la;
                                                break;
                                            }
                                            if (c.lenbits = 9, ya = { bits: c.lenbits }, xa = v(x, c.lens, 0, c.nlen, c.lencode, 0, c.work, ya), c.lenbits = ya.bits, xa) {
                                                a.msg = "invalid literal/lengths set", c.mode = la;
                                                break;
                                            }
                                            if (c.distbits = 6, c.distcode = c.distdyn, ya = { bits: c.distbits }, xa = v(y, c.lens, c.nlen, c.ndist, c.distcode, 0, c.work, ya), c.distbits = ya.bits, xa) {
                                                a.msg = "invalid distances set", c.mode = la;
                                                break;
                                            }
                                            if (c.mode = ba, b === B)
                                                break a;
                                        case ba: c.mode = ca;
                                        case ca:
                                            if (i >= 6 && j >= 258) {
                                                a.next_out = h, a.avail_out = j, a.next_in = g, a.avail_in = i, c.hold = m, c.bits = n, u(a, p), h = a.next_out, f = a.output, j = a.avail_out, g = a.next_in, e = a.input, i = a.avail_in, m = c.hold, n = c.bits, c.mode === V && (c.back = -1);
                                                break;
                                            }
                                            for (c.back = 0; Aa = c.lencode[m & (1 << c.lenbits) - 1], qa = Aa >>> 24, ra = Aa >>> 16 & 255, sa = 65535 & Aa, !(n >= qa);) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            if (ra && 0 === (240 & ra)) {
                                                for (ta = qa, ua = ra, va = sa; Aa = c.lencode[va + ((m & (1 << ta + ua) - 1) >> ta)], qa = Aa >>> 24, ra = Aa >>> 16 & 255, sa = 65535 & Aa, !(n >= ta + qa);) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m += e[g++] << n, n += 8;
                                                }
                                                m >>>= ta, n -= ta, c.back += ta;
                                            }
                                            if (m >>>= qa, n -= qa, c.back += qa, c.length = sa, 0 === ra) {
                                                c.mode = ha;
                                                break;
                                            }
                                            if (32 & ra) {
                                                c.back = -1, c.mode = V;
                                                break;
                                            }
                                            if (64 & ra) {
                                                a.msg = "invalid literal/length code", c.mode = la;
                                                break;
                                            }
                                            c.extra = 15 & ra, c.mode = da;
                                        case da:
                                            if (c.extra) {
                                                for (za = c.extra; za > n;) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m += e[g++] << n, n += 8;
                                                }
                                                c.length += m & (1 << c.extra) - 1, m >>>= c.extra, n -= c.extra, c.back += c.extra;
                                            }
                                            c.was = c.length, c.mode = ea;
                                        case ea:
                                            for (; Aa = c.distcode[m & (1 << c.distbits) - 1], qa = Aa >>> 24, ra = Aa >>> 16 & 255, sa = 65535 & Aa, !(n >= qa);) {
                                                if (0 === i)
                                                    break a;
                                                i--, m += e[g++] << n, n += 8;
                                            }
                                            if (0 === (240 & ra)) {
                                                for (ta = qa, ua = ra, va = sa; Aa = c.distcode[va + ((m & (1 << ta + ua) - 1) >> ta)], qa = Aa >>> 24, ra = Aa >>> 16 & 255, sa = 65535 & Aa, !(n >= ta + qa);) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m += e[g++] << n, n += 8;
                                                }
                                                m >>>= ta, n -= ta, c.back += ta;
                                            }
                                            if (m >>>= qa, n -= qa, c.back += qa, 64 & ra) {
                                                a.msg = "invalid distance code", c.mode = la;
                                                break;
                                            }
                                            c.offset = sa, c.extra = 15 & ra, c.mode = fa;
                                        case fa:
                                            if (c.extra) {
                                                for (za = c.extra; za > n;) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m += e[g++] << n, n += 8;
                                                }
                                                c.offset += m & (1 << c.extra) - 1, m >>>= c.extra, n -= c.extra, c.back += c.extra;
                                            }
                                            if (c.offset > c.dmax) {
                                                a.msg = "invalid distance too far back", c.mode = la;
                                                break;
                                            }
                                            c.mode = ga;
                                        case ga:
                                            if (0 === j)
                                                break a;
                                            if (q = p - j, c.offset > q) {
                                                if (q = c.offset - q, q > c.whave && c.sane) {
                                                    a.msg = "invalid distance too far back", c.mode = la;
                                                    break;
                                                }
                                                q > c.wnext ? (q -= c.wnext, oa = c.wsize - q) : oa = c.wnext - q, q > c.length && (q = c.length), pa = c.window;
                                            }
                                            else
                                                pa = f, oa = h - c.offset, q = c.length;
                                            q > j && (q = j), j -= q, c.length -= q;
                                            do
                                                f[h++] = pa[oa++];
                                            while (--q);
                                            0 === c.length && (c.mode = ca);
                                            break;
                                        case ha:
                                            if (0 === j)
                                                break a;
                                            f[h++] = c.length, j--, c.mode = ca;
                                            break;
                                        case ia:
                                            if (c.wrap) {
                                                for (; 32 > n;) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m |= e[g++] << n, n += 8;
                                                }
                                                if (p -= j, a.total_out += p, c.total += p, p && (a.adler = c.check = c.flags ? t(c.check, f, p, h - p) : s(c.check, f, p, h - p)), p = j, (c.flags ? m : d(m)) !== c.check) {
                                                    a.msg = "incorrect data check", c.mode = la;
                                                    break;
                                                }
                                                m = 0, n = 0;
                                            }
                                            c.mode = ja;
                                        case ja:
                                            if (c.wrap && c.flags) {
                                                for (; 32 > n;) {
                                                    if (0 === i)
                                                        break a;
                                                    i--, m += e[g++] << n, n += 8;
                                                }
                                                if (m !== (4294967295 & c.total)) {
                                                    a.msg = "incorrect length check", c.mode = la;
                                                    break;
                                                }
                                                m = 0, n = 0;
                                            }
                                            c.mode = ka;
                                        case ka:
                                            xa = D;
                                            break a;
                                        case la:
                                            xa = G;
                                            break a;
                                        case ma: return H;
                                        case na:
                                        default: return F;
                                    } return a.next_out = h, a.avail_out = j, a.next_in = g, a.avail_in = i, c.hold = m, c.bits = n, (c.wsize || p !== a.avail_out && c.mode < la && (c.mode < ia || b !== z)) && l(a, a.output, a.next_out, p - a.avail_out) ? (c.mode = ma, H) : (o -= a.avail_in, p -= a.avail_out, a.total_in += o, a.total_out += p, c.total += p, c.wrap && p && (a.adler = c.check = c.flags ? t(c.check, f, p, a.next_out - p) : s(c.check, f, p, a.next_out - p)), a.data_type = c.bits + (c.last ? 64 : 0) + (c.mode === V ? 128 : 0) + (c.mode === ba || c.mode === Y ? 256 : 0), (0 === o && 0 === p || b === z) && xa === C && (xa = I), xa); }
                                function n(a) { if (!a || !a.state)
                                    return F; var b = a.state; return b.window && (b.window = null), a.state = null, C; }
                                function o(a, b) { var c; return a && a.state ? (c = a.state, 0 === (2 & c.wrap) ? F : (c.head = b, b.done = !1, C)) : F; }
                                var p, q, r = a("../utils/common"), s = a("./adler32"), t = a("./crc32"), u = a("./inffast"), v = a("./inftrees"), w = 0, x = 1, y = 2, z = 4, A = 5, B = 6, C = 0, D = 1, E = 2, F = -2, G = -3, H = -4, I = -5, J = 8, K = 1, L = 2, M = 3, N = 4, O = 5, P = 6, Q = 7, R = 8, S = 9, T = 10, U = 11, V = 12, W = 13, X = 14, Y = 15, Z = 16, $ = 17, _ = 18, aa = 19, ba = 20, ca = 21, da = 22, ea = 23, fa = 24, ga = 25, ha = 26, ia = 27, ja = 28, ka = 29, la = 30, ma = 31, na = 32, oa = 852, pa = 592, qa = 15, ra = qa, sa = !0;
                                c.inflateReset = g, c.inflateReset2 = h, c.inflateResetKeep = f, c.inflateInit = j, c.inflateInit2 = i, c.inflate = m, c.inflateEnd = n, c.inflateGetHeader = o, c.inflateInfo = "pako inflate (from Nodeca project)";
                            }, { "../utils/common": 1, "./adler32": 3, "./crc32": 5, "./inffast": 7, "./inftrees": 9 }], 9: [function (a, b, c) {
                                "use strict";
                                var d = a("../utils/common"), e = 15, f = 852, g = 592, h = 0, i = 1, j = 2, k = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], l = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], m = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], n = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
                                b.exports = function (a, b, c, o, p, q, r, s) { var t, u, v, w, x, y, z, A, B, C = s.bits, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = null, O = 0, P = new d.Buf16(e + 1), Q = new d.Buf16(e + 1), R = null, S = 0; for (D = 0; e >= D; D++)
                                    P[D] = 0; for (E = 0; o > E; E++)
                                    P[b[c + E]]++; for (H = C, G = e; G >= 1 && 0 === P[G]; G--)
                                    ; if (H > G && (H = G), 0 === G)
                                    return p[q++] = 20971520, p[q++] = 20971520, s.bits = 1, 0; for (F = 1; G > F && 0 === P[F]; F++)
                                    ; for (F > H && (H = F), K = 1, D = 1; e >= D; D++)
                                    if (K <<= 1, K -= P[D], 0 > K)
                                        return -1; if (K > 0 && (a === h || 1 !== G))
                                    return -1; for (Q[1] = 0, D = 1; e > D; D++)
                                    Q[D + 1] = Q[D] + P[D]; for (E = 0; o > E; E++)
                                    0 !== b[c + E] && (r[Q[b[c + E]]++] = E); if (a === h ? (N = R = r, y = 19) : a === i ? (N = k, O -= 257, R = l, S -= 257, y = 256) : (N = m, R = n, y = -1), M = 0, E = 0, D = F, x = q, I = H, J = 0, v = -1, L = 1 << H, w = L - 1, a === i && L > f || a === j && L > g)
                                    return 1; for (var T = 0;;) {
                                    T++, z = D - J, r[E] < y ? (A = 0, B = r[E]) : r[E] > y ? (A = R[S + r[E]], B = N[O + r[E]]) : (A = 96, B = 0), t = 1 << D - J, u = 1 << I, F = u;
                                    do
                                        u -= t, p[x + (M >> J) + u] = z << 24 | A << 16 | B | 0;
                                    while (0 !== u);
                                    for (t = 1 << D - 1; M & t;)
                                        t >>= 1;
                                    if (0 !== t ? (M &= t - 1, M += t) : M = 0, E++, 0 === --P[D]) {
                                        if (D === G)
                                            break;
                                        D = b[c + r[E]];
                                    }
                                    if (D > H && (M & w) !== v) {
                                        for (0 === J && (J = H), x += F, I = D - J, K = 1 << I; G > I + J && (K -= P[I + J], !(0 >= K));)
                                            I++, K <<= 1;
                                        if (L += 1 << I, a === i && L > f || a === j && L > g)
                                            return 1;
                                        v = M & w, p[v] = H << 24 | I << 16 | x - q | 0;
                                    }
                                } return 0 !== M && (p[x + M] = D - J << 24 | 64 << 16 | 0), s.bits = H, 0; };
                            }, { "../utils/common": 1 }], 10: [function (a, b, c) {
                                "use strict";
                                b.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
                            }, {}], 11: [function (a, b, c) {
                                "use strict";
                                function d() {
                                    this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0,
                                        this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
                                }
                                b.exports = d;
                            }, {}], "/lib/inflate.js": [function (a, b, c) {
                                "use strict";
                                function d(a, b) { var c = new n(b); if (c.push(a, !0), c.err)
                                    throw c.msg; return c.result; }
                                function e(a, b) { return b = b || {}, b.raw = !0, d(a, b); }
                                var f = a("./zlib/inflate.js"), g = a("./utils/common"), h = a("./utils/strings"), i = a("./zlib/constants"), j = a("./zlib/messages"), k = a("./zlib/zstream"), l = a("./zlib/gzheader"), m = Object.prototype.toString, n = function (a) { this.options = g.assign({ chunkSize: 16384, windowBits: 0, to: "" }, a || {}); var b = this.options; b.raw && b.windowBits >= 0 && b.windowBits < 16 && (b.windowBits = -b.windowBits, 0 === b.windowBits && (b.windowBits = -15)), !(b.windowBits >= 0 && b.windowBits < 16) || a && a.windowBits || (b.windowBits += 32), b.windowBits > 15 && b.windowBits < 48 && 0 === (15 & b.windowBits) && (b.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new k, this.strm.avail_out = 0; var c = f.inflateInit2(this.strm, b.windowBits); if (c !== i.Z_OK)
                                    throw new Error(j[c]); this.header = new l, f.inflateGetHeader(this.strm, this.header); };
                                n.prototype.push = function (a, b) { var c, d, e, j, k, l = this.strm, n = this.options.chunkSize; if (this.ended)
                                    return !1; d = b === ~~b ? b : b === !0 ? i.Z_FINISH : i.Z_NO_FLUSH, "string" == typeof a ? l.input = h.binstring2buf(a) : "[object ArrayBuffer]" === m.call(a) ? l.input = new Uint8Array(a) : l.input = a, l.next_in = 0, l.avail_in = l.input.length; do {
                                    if (0 === l.avail_out && (l.output = new g.Buf8(n), l.next_out = 0, l.avail_out = n), c = f.inflate(l, i.Z_NO_FLUSH), c !== i.Z_STREAM_END && c !== i.Z_OK)
                                        return this.onEnd(c), this.ended = !0, !1;
                                    l.next_out && (0 === l.avail_out || c === i.Z_STREAM_END || 0 === l.avail_in && (d === i.Z_FINISH || d === i.Z_SYNC_FLUSH)) && ("string" === this.options.to ? (e = h.utf8border(l.output, l.next_out), j = l.next_out - e, k = h.buf2string(l.output, e), l.next_out = j, l.avail_out = n - j, j && g.arraySet(l.output, l.output, e, j, 0), this.onData(k)) : this.onData(g.shrinkBuf(l.output, l.next_out)));
                                } while (l.avail_in > 0 && c !== i.Z_STREAM_END); return c === i.Z_STREAM_END && (d = i.Z_FINISH), d === i.Z_FINISH ? (c = f.inflateEnd(this.strm), this.onEnd(c), this.ended = !0, c === i.Z_OK) : d === i.Z_SYNC_FLUSH ? (this.onEnd(i.Z_OK), l.avail_out = 0, !0) : !0; }, n.prototype.onData = function (a) { this.chunks.push(a); }, n.prototype.onEnd = function (a) { a === i.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = g.flattenChunks(this.chunks)), this.chunks = [], this.err = a, this.msg = this.strm.msg; }, c.Inflate = n, c.inflate = d, c.inflateRaw = e, c.ungzip = d;
                            }, { "./utils/common": 1, "./utils/strings": 2, "./zlib/constants": 4, "./zlib/gzheader": 6, "./zlib/inflate.js": 8, "./zlib/messages": 10, "./zlib/zstream": 11 }] }, {}, [])("/lib/inflate.js");
                });
            }, {}], 3: [function (a, b, c) { function d(a, b) { switch (void 0 === b && (b = a.toString()), a.name) {
                case "NotFoundError": return new o(p.ENOENT, b);
                case "QuotaExceededError": return new o(p.ENOSPC, b);
                default: return new o(p.EIO, b);
            } } function e(a, b, c) { return void 0 === b && (b = p.EIO), void 0 === c && (c = null), function (d) { d.preventDefault(), a(new o(b, c)); }; } function f(a) { var b = a.getBufferCore(); b instanceof l.BufferCoreArrayBuffer || (a = new n(this._buffer.length), this._buffer.copy(a), b = a.getBufferCore()); var c = b.getDataView(); return c.buffer; } var g = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, h = a("../core/buffer"), i = a("../core/browserfs"), j = a("../generic/key_value_filesystem"), k = a("../core/api_error"), l = a("../core/buffer_core_arraybuffer"), m = a("../core/global"), n = h.Buffer, o = k.ApiError, p = k.ErrorCode, q = m.indexedDB || m.mozIndexedDB || m.webkitIndexedDB || m.msIndexedDB, r = function () { function a(a, b) { this.tx = a, this.store = b; } return a.prototype.get = function (a, b) { try {
                var c = this.store.get(a);
                c.onerror = e(b), c.onsuccess = function (a) { var c = a.target.result; void 0 === c ? b(null, c) : b(null, new n(c)); };
            }
            catch (f) {
                b(d(f));
            } }, a; }(); c.IndexedDBROTransaction = r; var s = function (a) { function b(b, c) { a.call(this, b, c); } return g(b, a), b.prototype.put = function (a, b, c, g) { try {
                var h, i = f(b);
                h = c ? this.store.put(i, a) : this.store.add(i, a), h.onerror = e(g), h.onsuccess = function (a) { g(null, !0); };
            }
            catch (j) {
                g(d(j));
            } }, b.prototype["delete"] = function (a, b) { try {
                var c = this.store["delete"](a);
                c.onerror = e(b), c.onsuccess = function (a) { b(); };
            }
            catch (f) {
                b(d(f));
            } }, b.prototype.commit = function (a) { setTimeout(a, 0); }, b.prototype.abort = function (a) { var b; try {
                this.tx.abort();
            }
            catch (c) {
                b = d(c);
            }
            finally {
                a(b);
            } }, b; }(r); c.IndexedDBRWTransaction = s; var t = function () { function a(a, b) { var c = this; void 0 === b && (b = "browserfs"), this.storeName = b; var d = q.open(this.storeName, 1); d.onupgradeneeded = function (a) { var b = a.target.result; b.objectStoreNames.contains(c.storeName) && b.deleteObjectStore(c.storeName), b.createObjectStore(c.storeName); }, d.onsuccess = function (b) { c.db = b.target.result, a(null, c); }, d.onerror = e(a, p.EACCES); } return a.prototype.name = function () { return "IndexedDB - " + this.storeName; }, a.prototype.clear = function (a) { try {
                var b = this.db.transaction(this.storeName, "readwrite"), c = b.objectStore(this.storeName), f = c.clear();
                f.onsuccess = function (b) { setTimeout(a, 0); }, f.onerror = e(a);
            }
            catch (g) {
                a(d(g));
            } }, a.prototype.beginTransaction = function (a) { void 0 === a && (a = "readonly"); var b = this.db.transaction(this.storeName, a), c = b.objectStore(this.storeName); if ("readwrite" === a)
                return new s(b, c); if ("readonly" === a)
                return new r(b, c); throw new o(p.EINVAL, "Invalid transaction type."); }, a; }(); c.IndexedDBStore = t; var u = function (a) { function b(b, c) { var d = this; a.call(this), new t(function (a, c) { a ? b(a) : d.init(c, function (a) { b(a, d); }); }, c); } return g(b, a), b.isAvailable = function () { try {
                return "undefined" != typeof q && null !== q.open("__browserfs_test__");
            }
            catch (a) {
                return !1;
            } }, b; }(j.AsyncKeyValueFileSystem); c.IndexedDBFileSystem = u, i.registerFileSystem("IndexedDB", u); }, { "../core/api_error": 14, "../core/browserfs": 15, "../core/buffer": 16, "../core/buffer_core_arraybuffer": 19, "../core/global": 24, "../generic/key_value_filesystem": 35 }], 4: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("../core/file_system"), f = a("../generic/file_index"), g = a("../core/buffer"), h = a("../core/api_error"), i = a("../core/file_flag"), j = a("../generic/preload_file"), k = a("../core/browserfs"), l = a("../generic/xhr"), m = (g.Buffer, h.ApiError), n = h.ErrorCode, o = (i.FileFlag, i.ActionType), p = function (a) { function b(b, c) { void 0 === c && (c = ""), a.call(this), null == b && (b = "index.json"), c.length > 0 && "/" !== c.charAt(c.length - 1) && (c += "/"), this.prefix_url = c; var d = this._requestFileSync(b, "json"); if (null == d)
                throw new Error("Unable to find listing at URL: " + b); this._index = f.FileIndex.from_listing(d); } return d(b, a), b.prototype.empty = function () { this._index.fileIterator(function (a) { a.file_data = null; }); }, b.prototype.getXhrPath = function (a) { return "/" === a.charAt(0) && (a = a.slice(1)), this.prefix_url + a; }, b.prototype._requestFileSizeAsync = function (a, b) { l.getFileSizeAsync(this.getXhrPath(a), b); }, b.prototype._requestFileSizeSync = function (a) { return l.getFileSizeSync(this.getXhrPath(a)); }, b.prototype._requestFileAsync = function (a, b, c) { l.asyncDownloadFile(this.getXhrPath(a), b, c); }, b.prototype._requestFileSync = function (a, b) { return l.syncDownloadFile(this.getXhrPath(a), b); }, b.prototype.getName = function () { return "XmlHttpRequest"; }, b.isAvailable = function () { return "undefined" != typeof XMLHttpRequest && null !== XMLHttpRequest; }, b.prototype.diskSpace = function (a, b) { b(0, 0); }, b.prototype.isReadOnly = function () { return !0; }, b.prototype.supportsLinks = function () { return !1; }, b.prototype.supportsProps = function () { return !1; }, b.prototype.supportsSynch = function () { return !0; }, b.prototype.preloadFile = function (a, b) { var c = this._index.getInode(a); if (null === c)
                throw m.ENOENT(a); var d = c.getData(); d.size = b.length, d.file_data = b; }, b.prototype.stat = function (a, b, c) { var d = this._index.getInode(a); if (null === d)
                return c(m.ENOENT(a)); var e; d.isFile() ? (e = d.getData(), e.size < 0 ? this._requestFileSizeAsync(a, function (a, b) { return a ? c(a) : (e.size = b, void c(null, e.clone())); }) : c(null, e.clone())) : (e = d.getStats(), c(null, e)); }, b.prototype.statSync = function (a, b) { var c = this._index.getInode(a); if (null === c)
                throw m.ENOENT(a); var d; return c.isFile() ? (d = c.getData(), d.size < 0 && (d.size = this._requestFileSizeSync(a))) : d = c.getStats(), d; }, b.prototype.open = function (a, b, c, d) { if (b.isWriteable())
                return d(new m(n.EPERM, a)); var e = this, f = this._index.getInode(a); if (null === f)
                return d(m.ENOENT(a)); if (f.isDir())
                return d(m.EISDIR(a)); var g = f.getData(); switch (b.pathExistsAction()) {
                case o.THROW_EXCEPTION:
                case o.TRUNCATE_FILE: return d(m.EEXIST(a));
                case o.NOP:
                    if (null != g.file_data)
                        return d(null, new j.NoSyncFile(e, a, b, g.clone(), g.file_data));
                    this._requestFileAsync(a, "buffer", function (c, f) { return c ? d(c) : (g.size = f.length, g.file_data = f, d(null, new j.NoSyncFile(e, a, b, g.clone(), f))); });
                    break;
                default: return d(new m(n.EINVAL, "Invalid FileMode object."));
            } }, b.prototype.openSync = function (a, b, c) { if (b.isWriteable())
                throw new m(n.EPERM, a); var d = this._index.getInode(a); if (null === d)
                throw m.ENOENT(a); if (d.isDir())
                throw m.EISDIR(a); var e = d.getData(); switch (b.pathExistsAction()) {
                case o.THROW_EXCEPTION:
                case o.TRUNCATE_FILE: throw m.EEXIST(a);
                case o.NOP:
                    if (null != e.file_data)
                        return new j.NoSyncFile(this, a, b, e.clone(), e.file_data);
                    var f = this._requestFileSync(a, "buffer");
                    return e.size = f.length, e.file_data = f, new j.NoSyncFile(this, a, b, e.clone(), f);
                default: throw new m(n.EINVAL, "Invalid FileMode object.");
            } }, b.prototype.readdir = function (a, b) { try {
                b(null, this.readdirSync(a));
            }
            catch (c) {
                b(c);
            } }, b.prototype.readdirSync = function (a) { var b = this._index.getInode(a); if (null === b)
                throw m.ENOENT(a); if (b.isFile())
                throw m.ENOTDIR(a); return b.getListing(); }, b.prototype.readFile = function (a, b, c, d) { var e = d; this.open(a, c, 420, function (a, c) { if (a)
                return d(a); d = function (a, b) { c.close(function (c) { return null == a && (a = c), e(a, b); }); }; var f = c, h = f.getBuffer(); if (null === b)
                return h.length > 0 ? d(a, h.sliceCopy()) : d(a, new g.Buffer(0)); try {
                d(null, h.toString(b));
            }
            catch (i) {
                d(i);
            } }); }, b.prototype.readFileSync = function (a, b, c) { var d = this.openSync(a, c, 420); try {
                var e = d, f = e.getBuffer();
                return null === b ? f.length > 0 ? f.sliceCopy() : new g.Buffer(0) : f.toString(b);
            }
            finally {
                d.closeSync();
            } }, b; }(e.BaseFileSystem); c.XmlHttpRequest = p, k.registerFileSystem("XmlHttpRequest", p); }, { "../core/api_error": 14, "../core/browserfs": 15, "../core/buffer": 16, "../core/file_flag": 22, "../core/file_system": 23, "../generic/file_index": 33, "../generic/preload_file": 36, "../generic/xhr": 37 }], 5: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("../core/file_system"), f = a("../core/file_flag"), g = a("../generic/preload_file"), h = a("../core/browserfs"), i = function (a) { function b(b, c, d, e, f) { a.call(this, b, c, d, e, f); } return d(b, a), b.prototype.syncSync = function () { this.isDirty() && (this._fs._syncSync(this), this.resetDirty()); }, b.prototype.closeSync = function () { this.syncSync(); }, b; }(g.PreloadFile), j = function (a) { function b(b, c) { if (a.call(this), this._queue = [], this._queueRunning = !1, this._isInitialized = !1, this._sync = b, this._async = c, !b.supportsSynch())
                throw new Error("Expected synchronous storage."); if (c.supportsSynch())
                throw new Error("Expected asynchronous storage."); } return d(b, a), b.prototype.getName = function () { return "AsyncMirror"; }, b.isAvailable = function () { return !0; }, b.prototype._syncSync = function (a) { this._sync.writeFileSync(a.getPath(), a.getBuffer(), null, f.FileFlag.getFileFlag("w"), a.getStats().mode), this.enqueueOp({ apiMethod: "writeFile", arguments: [a.getPath(), a.getBuffer(), null, a.getFlag(), a.getStats().mode] }); }, b.prototype.initialize = function (a) { var b = this; if (this._isInitialized)
                a();
            else {
                var c = function (a, c, d) { "/" !== a && b._sync.mkdirSync(a, c), b._async.readdir(a, function (b, c) { function f(b) { b ? d(b) : g < c.length ? (e(a + "/" + c[g], f), g++) : d(); } if (b)
                    d(b);
                else {
                    var g = 0;
                    f();
                } }); }, d = function (a, c, d) { b._async.readFile(a, null, f.FileFlag.getFileFlag("r"), function (e, g) { if (e)
                    d(e);
                else
                    try {
                        b._sync.writeFileSync(a, g, null, f.FileFlag.getFileFlag("w"), c);
                    }
                    catch (h) {
                        e = h;
                    }
                    finally {
                        d(e);
                    } }); }, e = function (a, e) { b._async.stat(a, !1, function (b, f) { b ? e(b) : f.isDirectory() ? c(a, f.mode, e) : d(a, f.mode, e); }); };
                c("/", 0, function (c) { c ? a(c) : (b._isInitialized = !0, a()); });
            } }, b.prototype.isReadOnly = function () { return !1; }, b.prototype.supportsSynch = function () { return !0; }, b.prototype.supportsLinks = function () { return !1; }, b.prototype.supportsProps = function () { return this._sync.supportsProps() && this._async.supportsProps(); }, b.prototype.enqueueOp = function (a) { var b = this; if (this._queue.push(a), !this._queueRunning) {
                this._queueRunning = !0;
                var c = function (a) { if (a && console.error("WARNING: File system has desynchronized. Received following error: " + a + "\n$"), b._queue.length > 0) {
                    var d = b._queue.shift(), e = d.arguments;
                    e.push(c), b._async[d.apiMethod].apply(b._async, e);
                }
                else
                    b._queueRunning = !1; };
                c();
            } }, b.prototype.renameSync = function (a, b) { this._sync.renameSync(a, b), this.enqueueOp({ apiMethod: "rename", arguments: [a, b] }); }, b.prototype.statSync = function (a, b) { return this._sync.statSync(a, b); }, b.prototype.openSync = function (a, b, c) { var d = this._sync.openSync(a, b, c); return d.closeSync(), new i(this, a, b, this._sync.statSync(a, !1), this._sync.readFileSync(a, null, f.FileFlag.getFileFlag("r"))); }, b.prototype.unlinkSync = function (a) { this._sync.unlinkSync(a), this.enqueueOp({ apiMethod: "unlink", arguments: [a] }); }, b.prototype.rmdirSync = function (a) { this._sync.rmdirSync(a), this.enqueueOp({ apiMethod: "rmdir", arguments: [a] }); }, b.prototype.mkdirSync = function (a, b) { this._sync.mkdirSync(a, b), this.enqueueOp({ apiMethod: "mkdir", arguments: [a, b] }); }, b.prototype.readdirSync = function (a) { return this._sync.readdirSync(a); }, b.prototype.existsSync = function (a) { return this._sync.existsSync(a); }, b.prototype.chmodSync = function (a, b, c) { this._sync.chmodSync(a, b, c), this.enqueueOp({ apiMethod: "chmod", arguments: [a, b, c] }); }, b.prototype.chownSync = function (a, b, c, d) { this._sync.chownSync(a, b, c, d), this.enqueueOp({ apiMethod: "chown", arguments: [a, b, c, d] }); }, b.prototype.utimesSync = function (a, b, c) { this._sync.utimesSync(a, b, c), this.enqueueOp({ apiMethod: "utimes", arguments: [a, b, c] }); }, b; }(e.SynchronousFileSystem); h.registerFileSystem("AsyncMirrorFS", j), b.exports = j; }, { "../core/browserfs": 15, "../core/file_flag": 22, "../core/file_system": 23, "../generic/preload_file": 36 }], 6: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("../generic/preload_file"), f = a("../core/file_system"), g = a("../core/node_fs_stats"), h = a("../core/buffer"), i = a("../core/api_error"), j = a("../core/node_path"), k = a("../core/browserfs"), l = a("../core/buffer_core_arraybuffer"), m = a("async"), n = h.Buffer, o = g.Stats, p = i.ApiError, q = i.ErrorCode, r = g.FileType, s = function (a) { function b(b, c, d, e, f) { a.call(this, b, c, d, e, f); } return d(b, a), b.prototype.sync = function (a) { var b = this; if (this.isDirty()) {
                var c = this.getBuffer(), d = c.getBufferCore();
                d instanceof l.BufferCoreArrayBuffer || (c = new n(c.length), this.getBuffer().copy(c), d = c.getBufferCore());
                var e = d.getDataView(), f = new DataView(e.buffer, e.byteOffset + c.getOffset(), c.length);
                this._fs._writeFileStrict(this.getPath(), f, function (c) { c || b.resetDirty(), a(c); });
            }
            else
                a(); }, b.prototype.close = function (a) { this.sync(a); }, b; }(e.PreloadFile); c.DropboxFile = s; var t = function (a) { function b(b) { a.call(this), this.client = b; } return d(b, a), b.prototype.getName = function () { return "Dropbox"; }, b.isAvailable = function () { return "undefined" != typeof Dropbox; }, b.prototype.isReadOnly = function () { return !1; }, b.prototype.supportsSymlinks = function () { return !1; }, b.prototype.supportsProps = function () { return !1; }, b.prototype.supportsSynch = function () { return !1; }, b.prototype.empty = function (a) { var b = this; this.client.readdir("/", function (c, d, e, f) { if (c)
                a(b.convert(c));
            else {
                var g = function (a, c) { b.client.remove(a.path, function (a, d) { c(a ? b.convert(a) : a); }); }, h = function (c) { c ? a(b.convert(c)) : a(); };
                m.each(f, g, h);
            } }); }, b.prototype.rename = function (a, b, c) { this.client.move(a, b, function (d, e) { if (d) {
                var f = d.response.error.indexOf(a) > -1 ? a : b;
                c(new p(q.ENOENT, f + " doesn't exist"));
            }
            else
                c(); }); }, b.prototype.stat = function (a, b, c) { var d = this; this.client.stat(a, function (b, e) { if (!(b || null != e && e.isRemoved)) {
                var f = new o(d._statType(e), e.size);
                return c(null, f);
            } c(new p(q.ENOENT, a + " doesn't exist")); }); }, b.prototype.open = function (a, b, c, d) { var e = this; this.client.readFile(a, { arrayBuffer: !0 }, function (c, f, g, h) { if (!c) {
                var i;
                i = new n(null === f ? 0 : f);
                var j = e._makeFile(a, b, g, i);
                return d(null, j);
            } if (b.isReadable())
                d(new p(q.ENOENT, a + " doesn't exist"));
            else
                switch (c.status) {
                    case 0: return console.error("No connection");
                    case 404:
                        var k = new ArrayBuffer(0);
                        return e._writeFileStrict(a, k, function (c, f) { if (c)
                            d(c);
                        else {
                            var g = e._makeFile(a, b, f, new n(k));
                            d(null, g);
                        } });
                    default: return console.log("Unhandled error: " + c);
                } }); }, b.prototype._writeFileStrict = function (a, b, c) { var d = this, e = j.dirname(a); this.stat(e, !1, function (f, g) { f ? c(new p(q.ENOENT, "Can't create " + a + " because " + e + " doesn't exist")) : d.client.writeFile(a, b, function (a, b) { a ? c(d.convert(a)) : c(null, b); }); }); }, b.prototype._statType = function (a) { return a.isFile ? r.FILE : r.DIRECTORY; }, b.prototype._makeFile = function (a, b, c, d) { var e = this._statType(c), f = new o(e, c.size); return new s(this, a, b, f, d); }, b.prototype._remove = function (a, b, c) { var d = this; this.client.stat(a, function (e, f) { e ? b(new p(q.ENOENT, a + " doesn't exist")) : f.isFile && !c ? b(new p(q.ENOTDIR, a + " is a file.")) : !f.isFile && c ? b(new p(q.EISDIR, a + " is a directory.")) : d.client.remove(a, function (c, d) { b(c ? new p(q.EIO, "Failed to remove " + a) : null); }); }); }, b.prototype.unlink = function (a, b) { this._remove(a, b, !0); }, b.prototype.rmdir = function (a, b) { this._remove(a, b, !1); }, b.prototype.mkdir = function (a, b, c) { var d = this, e = j.dirname(a); this.client.stat(e, function (b, f) { b ? c(new p(q.ENOENT, "Can't create " + a + " because " + e + " doesn't exist")) : d.client.mkdir(a, function (b, d) { c(b ? new p(q.EEXIST, a + " already exists") : null); }); }); }, b.prototype.readdir = function (a, b) { var c = this; this.client.readdir(a, function (a, d, e, f) { return a ? b(c.convert(a)) : b(null, d); }); }, b.prototype.convert = function (a, b) { switch (void 0 === b && (b = ""), a.status) {
                case 400: return new p(q.EINVAL, b);
                case 401:
                case 403: return new p(q.EIO, b);
                case 404: return new p(q.ENOENT, b);
                case 405: return new p(q.ENOTSUP, b);
                case 0:
                case 304:
                case 406:
                case 409:
                default: return new p(q.EIO, b);
            } }, b; }(f.BaseFileSystem); c.DropboxFileSystem = t, k.registerFileSystem("Dropbox", t); }, { "../core/api_error": 14, "../core/browserfs": 15, "../core/buffer": 16, "../core/buffer_core_arraybuffer": 19, "../core/file_system": 23, "../core/node_fs_stats": 27, "../core/node_path": 28, "../generic/preload_file": 36, async: 1 }], 7: [function (a, b, c) { function d(a, b, c, d) { if ("undefined" != typeof navigator.webkitPersistentStorage)
                switch (a) {
                    case p.PERSISTENT:
                        navigator.webkitPersistentStorage.requestQuota(b, c, d);
                        break;
                    case p.TEMPORARY:
                        navigator.webkitTemporaryStorage.requestQuota(b, c, d);
                        break;
                    default: d(null);
                }
            else
                p.webkitStorageInfo.requestQuota(a, b, c, d); } function e(a) { return Array.prototype.slice.call(a || [], 0); } var f = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, g = a("../generic/preload_file"), h = a("../core/file_system"), i = a("../core/api_error"), j = a("../core/file_flag"), k = a("../core/node_fs_stats"), l = a("../core/buffer"), m = a("../core/browserfs"), n = a("../core/buffer_core_arraybuffer"), o = a("../core/node_path"), p = a("../core/global"), q = a("async"), r = l.Buffer, s = k.Stats, t = k.FileType, u = i.ApiError, v = i.ErrorCode, w = j.ActionType, x = p.webkitRequestFileSystem || p.requestFileSystem || null, y = function (a) { function b(b, c, d, e, f) { a.call(this, b, c, d, e, f); } return f(b, a), b.prototype.sync = function (a) { var b = this; if (this.isDirty()) {
                var c = { create: !1 }, d = this._fs, e = function (c) { c.createWriter(function (c) { var e = b.getBuffer(), f = e.getBufferCore(); f instanceof n.BufferCoreArrayBuffer || (e = new r(e.length), b.getBuffer().copy(e), f = e.getBufferCore()); var g = f.getDataView(), h = new DataView(g.buffer, g.byteOffset + e.getOffset(), e.length), i = new Blob([h]), j = i.size; c.onwriteend = function () { c.onwriteend = null, c.truncate(j), b.resetDirty(), a(); }, c.onerror = function (b) { a(d.convert(b)); }, c.write(i); }); }, f = function (b) { a(d.convert(b)); };
                d.fs.root.getFile(this.getPath(), c, e, f);
            }
            else
                a(); }, b.prototype.close = function (a) { this.sync(a); }, b; }(g.PreloadFile); c.HTML5FSFile = y; var z = function (a) { function b(b, c) { a.call(this), this.size = null != b ? b : 5, this.type = null != c ? c : p.PERSISTENT; var d = 1024, e = d * d; this.size *= e; } return f(b, a), b.prototype.getName = function () { return "HTML5 FileSystem"; }, b.isAvailable = function () { return null != x; }, b.prototype.isReadOnly = function () { return !1; }, b.prototype.supportsSymlinks = function () { return !1; }, b.prototype.supportsProps = function () { return !1; }, b.prototype.supportsSynch = function () { return !1; }, b.prototype.convert = function (a, b) { switch (void 0 === b && (b = ""), a.name) {
                case "QuotaExceededError": return new u(v.ENOSPC, b);
                case "NotFoundError": return new u(v.ENOENT, b);
                case "SecurityError": return new u(v.EACCES, b);
                case "InvalidModificationError": return new u(v.EPERM, b);
                case "SyntaxError":
                case "TypeMismatchError": return new u(v.EINVAL, b);
                default: return new u(v.EINVAL, b);
            } }, b.prototype.convertErrorEvent = function (a, b) { return void 0 === b && (b = ""), new u(v.ENOENT, a.message + "; " + b); }, b.prototype.allocate = function (a) { var b = this; void 0 === a && (a = function () { }); var c = function (c) { b.fs = c, a(); }, e = function (c) { a(b.convert(c)); }; this.type === p.PERSISTENT ? d(this.type, this.size, function (a) { x(b.type, a, c, e); }, e) : x(this.type, this.size, c, e); }, b.prototype.empty = function (a) { var b = this; this._readdir("/", function (c, d) { if (c)
                console.error("Failed to empty FS"), a(c);
            else {
                var e = function (b) { c ? (console.error("Failed to empty FS"), a(c)) : a(); }, f = function (a, c) { var d = function () { c(); }, e = function (d) { c(b.convert(d, a.fullPath)); }; a.isFile ? a.remove(d, e) : a.removeRecursively(d, e); };
                q.each(d, f, e);
            } }); }, b.prototype.rename = function (a, b, c) { var d = this, e = 2, f = 0, g = this.fs.root, h = function (f) { 0 === --e && c(d.convert(f, "Failed to rename " + a + " to " + b + ".")); }, i = function (e) { return 2 === ++f ? void console.error("Something was identified as both a file and a directory. This should never happen.") : a === b ? c() : void g.getDirectory(o.dirname(b), {}, function (f) { e.moveTo(f, o.basename(b), function (a) { c(); }, function (f) { e.isDirectory ? d.unlink(b, function (e) { e ? h(f) : d.rename(a, b, c); }) : h(f); }); }, h); }; g.getFile(a, {}, i, h), g.getDirectory(a, {}, i, h); }, b.prototype.stat = function (a, b, c) { var d = this, e = { create: !1 }, f = function (a) { var b = function (a) { var b = new s(t.FILE, a.size); c(null, b); }; a.file(b, h); }, g = function (a) { var b = 4096, d = new s(t.DIRECTORY, b); c(null, d); }, h = function (b) { c(d.convert(b, a)); }, i = function () { d.fs.root.getDirectory(a, e, g, h); }; this.fs.root.getFile(a, e, f, i); }, b.prototype.open = function (a, b, c, d) { var e = this, f = { create: b.pathNotExistsAction() === w.CREATE_FILE, exclusive: b.isExclusive() }, g = function (b) { d(e.convertErrorEvent(b, a)); }, h = function (b) { d(e.convert(b, a)); }, i = function (c) { var f = function (c) { var f = new FileReader; f.onloadend = function (g) { var h = e._makeFile(a, b, c, f.result); d(null, h); }, f.onerror = g, f.readAsArrayBuffer(c); }; c.file(f, h); }; this.fs.root.getFile(a, f, i, g); }, b.prototype._statType = function (a) { return a.isFile ? t.FILE : t.DIRECTORY; }, b.prototype._makeFile = function (a, b, c, d) { void 0 === d && (d = new ArrayBuffer(0)); var e = new s(t.FILE, c.size), f = new r(d); return new y(this, a, b, e, f); }, b.prototype._remove = function (a, b, c) { var d = this, e = function (c) { var e = function () { b(); }, f = function (c) { b(d.convert(c, a)); }; c.remove(e, f); }, f = function (c) { b(d.convert(c, a)); }, g = { create: !1 }; c ? this.fs.root.getFile(a, g, e, f) : this.fs.root.getDirectory(a, g, e, f); }, b.prototype.unlink = function (a, b) { this._remove(a, b, !0); }, b.prototype.rmdir = function (a, b) { this._remove(a, b, !1); }, b.prototype.mkdir = function (a, b, c) { var d = this, e = { create: !0, exclusive: !0 }, f = function (a) { c(); }, g = function (b) { c(d.convert(b, a)); }; this.fs.root.getDirectory(a, e, f, g); }, b.prototype._readdir = function (a, b) { var c = this; this.fs.root.getDirectory(a, { create: !1 }, function (d) { var f = d.createReader(), g = [], h = function (d) { b(c.convert(d, a)); }, i = function () { f.readEntries(function (a) { a.length ? (g = g.concat(e(a)), i()) : b(null, g); }, h); }; i(); }); }, b.prototype.readdir = function (a, b) { this._readdir(a, function (a, c) { if (null != a)
                return b(a); for (var d = [], e = 0; e < c.length; e++)
                d.push(c[e].name); b(null, d); }); }, b; }(h.BaseFileSystem); c.HTML5FS = z, m.registerFileSystem("HTML5FS", z); }, { "../core/api_error": 14, "../core/browserfs": 15, "../core/buffer": 16, "../core/buffer_core_arraybuffer": 19, "../core/file_flag": 22, "../core/file_system": 23, "../core/global": 24, "../core/node_fs_stats": 27, "../core/node_path": 28, "../generic/preload_file": 36, async: 1 }], 8: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("../generic/key_value_filesystem"), f = a("../core/browserfs"), g = function () { function a() { this.store = {}; } return a.prototype.name = function () { return "In-memory"; }, a.prototype.clear = function () { this.store = {}; }, a.prototype.beginTransaction = function (a) { return new e.SimpleSyncRWTransaction(this); }, a.prototype.get = function (a) { return this.store[a]; }, a.prototype.put = function (a, b, c) { return !c && this.store.hasOwnProperty(a) ? !1 : (this.store[a] = b, !0); }, a.prototype["delete"] = function (a) { delete this.store[a]; }, a; }(); c.InMemoryStore = g; var h = function (a) { function b() { a.call(this, { store: new g }); } return d(b, a), b; }(e.SyncKeyValueFileSystem); c.InMemoryFileSystem = h, f.registerFileSystem("InMemory", h); }, { "../core/browserfs": 15, "../generic/key_value_filesystem": 35 }], 9: [function (a, b, c) { var d, e = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, f = a("../core/buffer"), g = a("../core/browserfs"), h = a("../generic/key_value_filesystem"), i = a("../core/api_error"), j = a("../core/global"), k = f.Buffer, l = i.ApiError, m = i.ErrorCode, n = !1; try {
                j.localStorage.setItem("__test__", String.fromCharCode(55296)), n = j.localStorage.getItem("__test__") === String.fromCharCode(55296);
            }
            catch (o) {
                n = !1;
            } d = n ? "binary_string" : "binary_string_ie"; var p = function () { function a() { } return a.prototype.name = function () { return "LocalStorage"; }, a.prototype.clear = function () { j.localStorage.clear(); }, a.prototype.beginTransaction = function (a) { return new h.SimpleSyncRWTransaction(this); }, a.prototype.get = function (a) { try {
                var b = j.localStorage.getItem(a);
                if (null !== b)
                    return new k(b, d);
            }
            catch (c) { } return void 0; }, a.prototype.put = function (a, b, c) { try {
                return c || null === j.localStorage.getItem(a) ? (j.localStorage.setItem(a, b.toString(d)), !0) : !1;
            }
            catch (e) {
                throw new l(m.ENOSPC, "LocalStorage is full.");
            } }, a.prototype["delete"] = function (a) { try {
                j.localStorage.removeItem(a);
            }
            catch (b) {
                throw new l(m.EIO, "Unable to delete key " + a + ": " + b);
            } }, a; }(); c.LocalStorageStore = p; var q = function (a) { function b() { a.call(this, { store: new p }); } return e(b, a), b.isAvailable = function () { return "undefined" != typeof j.localStorage; }, b; }(h.SyncKeyValueFileSystem); c.LocalStorageFileSystem = q, g.registerFileSystem("LocalStorage", q); }, { "../core/api_error": 14, "../core/browserfs": 15, "../core/buffer": 16, "../core/global": 24, "../generic/key_value_filesystem": 35 }], 10: [function (a, b, c) { function d(a, b, c) { return b ? function () { for (var b = [], c = 0; c < arguments.length; c++)
                b[c - 0] = arguments[c]; var d = b[0], e = this._get_fs(d); b[0] = e.path; try {
                return e.fs[a].apply(e.fs, b);
            }
            catch (f) {
                throw this.standardizeError(f, e.path, d), f;
            } } : function () { for (var b = [], c = 0; c < arguments.length; c++)
                b[c - 0] = arguments[c]; var d = b[0], e = this._get_fs(d); if (b[0] = e.path, "function" == typeof b[b.length - 1]) {
                var f = b[b.length - 1], g = this;
                b[b.length - 1] = function () { for (var a = [], b = 0; b < arguments.length; b++)
                    a[b - 0] = arguments[b]; a.length > 0 && a[0] instanceof h.ApiError && g.standardizeError(a[0], e.path, d), f.apply(null, a); };
            } return e.fs[a].apply(e.fs, b); }; } var e = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, f = a("../core/file_system"), g = a("./in_memory"), h = a("../core/api_error"), i = a("../core/node_fs"), j = a("../core/browserfs"), k = h.ApiError, l = h.ErrorCode, m = function (a) { function b() { a.call(this), this.mntMap = {}, this.rootFs = new g.InMemoryFileSystem; } return e(b, a), b.prototype.mount = function (a, b) { if (this.mntMap[a])
                throw new k(l.EINVAL, "Mount point " + a + " is already taken."); this.rootFs.mkdirSync(a, 511), this.mntMap[a] = b; }, b.prototype.umount = function (a) { if (!this.mntMap[a])
                throw new k(l.EINVAL, "Mount point " + a + " is already unmounted."); delete this.mntMap[a], this.rootFs.rmdirSync(a); }, b.prototype._get_fs = function (a) { for (var b in this.mntMap) {
                var c = this.mntMap[b];
                if (0 === a.indexOf(b))
                    return a = a.substr(b.length > 1 ? b.length : 0), "" === a && (a = "/"), { fs: c, path: a };
            } return { fs: this.rootFs, path: a }; }, b.prototype.getName = function () { return "MountableFileSystem"; }, b.isAvailable = function () { return !0; }, b.prototype.diskSpace = function (a, b) { b(0, 0); }, b.prototype.isReadOnly = function () { return !1; }, b.prototype.supportsLinks = function () { return !1; }, b.prototype.supportsProps = function () { return !1; }, b.prototype.supportsSynch = function () { return !0; }, b.prototype.standardizeError = function (a, b, c) { var d; return -1 !== (d = a.message.indexOf(b)) && (a.message = a.message.substr(0, d) + c + a.message.substr(d + b.length)), a; }, b.prototype.rename = function (a, b, c) { var d = this._get_fs(a), e = this._get_fs(b); if (d.fs === e.fs) {
                var f = this;
                return d.fs.rename(d.path, e.path, function (g) { g && f.standardizeError(f.standardizeError(g, d.path, a), e.path, b), c(g); });
            } return i.readFile(a, function (d, e) { return d ? c(d) : void i.writeFile(b, e, function (b) { return b ? c(b) : void i.unlink(a, c); }); }); }, b.prototype.renameSync = function (a, b) { var c = this._get_fs(a), d = this._get_fs(b); if (c.fs === d.fs)
                try {
                    return c.fs.renameSync(c.path, d.path);
                }
                catch (e) {
                    throw this.standardizeError(this.standardizeError(e, c.path, a), d.path, b), e;
                } var f = i.readFileSync(a); return i.writeFileSync(b, f), i.unlinkSync(a); }, b; }(f.BaseFileSystem); c.MountableFileSystem = m; for (var n = [["readdir", "exists", "unlink", "rmdir", "readlink"], ["stat", "mkdir", "realpath", "truncate"], ["open", "readFile", "chmod", "utimes"], ["chown"], ["writeFile", "appendFile"]], o = 0; o < n.length; o++)
                for (var p = n[o], q = 0; q < p.length; q++) {
                    var r = p[q];
                    m.prototype[r] = d(r, !1, o + 1), m.prototype[r + "Sync"] = d(r + "Sync", !0, o + 1);
                } j.registerFileSystem("MountableFileSystem", m); }, { "../core/api_error": 14, "../core/browserfs": 15, "../core/file_system": 23, "../core/node_fs": 26, "./in_memory": 8 }], 11: [function (a, b, c) {
                function d(a) { return 146 | a; }
                var e = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                    b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, f = a("../core/file_system"), g = a("../core/buffer"), h = a("../core/api_error"), i = a("../core/file_flag"), j = a("../generic/preload_file"), k = a("../core/browserfs"), l = a("../core/node_path"), m = h.ApiError, n = g.Buffer, o = h.ErrorCode, p = "/.deletedFiles.log", q = function (a) { function b(b, c, d, e, f) { a.call(this, b, c, d, e, f); } return e(b, a), b.prototype.syncSync = function () { this.isDirty() && (this._fs._syncSync(this), this.resetDirty()); }, b.prototype.closeSync = function () { this.syncSync(); }, b; }(j.PreloadFile), r = function (a) {
                    function b(b, c) { if (a.call(this), this._isInitialized = !1, this._deletedFiles = {}, this._deleteLog = null, this._writable = b, this._readable = c, this._writable.isReadOnly())
                        throw new m(o.EINVAL, "Writable file system must be writable."); if (!this._writable.supportsSynch() || !this._readable.supportsSynch())
                        throw new m(o.EINVAL, "OverlayFS currently only operates on synchronous file systems."); }
                    return e(b, a), b.prototype.getOverlayedFileSystems = function () { return { readable: this._readable, writable: this._writable }; }, b.prototype.createParentDirectories = function (a) { for (var b = this, c = l.dirname(a), d = []; !this._writable.existsSync(c);)
                        d.push(c), c = l.dirname(c); d = d.reverse(), d.forEach(function (a) { b._writable.mkdirSync(a, b.statSync(a, !1).mode); }); }, b.isAvailable = function () { return !0; }, b.prototype._syncSync = function (a) { this.createParentDirectories(a.getPath()), this._writable.writeFileSync(a.getPath(), a.getBuffer(), null, i.FileFlag.getFileFlag("w"), a.getStats().mode); }, b.prototype.getName = function () { return "OverlayFS"; }, b.prototype.initialize = function (a) { var b = this; this._isInitialized ? a() : this._writable.readFile(p, "utf8", i.FileFlag.getFileFlag("r"), function (c, d) { if (c) {
                        if (c.type !== o.ENOENT)
                            return a(c);
                    }
                    else
                        d.split("\n").forEach(function (a) { b._deletedFiles[a.slice(1)] = "d" === a.slice(0, 1); }); b._writable.open(p, i.FileFlag.getFileFlag("a"), 420, function (c, d) { c ? a(c) : (b._deleteLog = d, a()); }); }); }, b.prototype.isReadOnly = function () { return !1; }, b.prototype.supportsSynch = function () { return !0; }, b.prototype.supportsLinks = function () { return !1; }, b.prototype.supportsProps = function () {
                        return this._readable.supportsProps() && this._writable.supportsProps();
                    }, b.prototype.deletePath = function (a) { this._deletedFiles[a] = !0; var b = new n("d" + a + "\n"); this._deleteLog.writeSync(b, 0, b.length, null), this._deleteLog.syncSync(); }, b.prototype.undeletePath = function (a) { if (this._deletedFiles[a]) {
                        this._deletedFiles[a] = !1;
                        var b = new n("u" + a);
                        this._deleteLog.writeSync(b, 0, b.length, null), this._deleteLog.syncSync();
                    } }, b.prototype.renameSync = function (a, b) { var c = this, d = this.statSync(a, !1); if (d.isDirectory()) {
                        if (a === b)
                            return;
                        var e = 511;
                        if (this.existsSync(b)) {
                            var f = this.statSync(b, !1), e = f.mode;
                            if (!f.isDirectory())
                                throw new m(o.ENOTDIR, "Path " + b + " is a file.");
                            if (this.readdirSync(b).length > 0)
                                throw new m(o.ENOTEMPTY, "Path " + b + " not empty.");
                        }
                        this._writable.existsSync(a) ? this._writable.renameSync(a, b) : this._writable.existsSync(b) || this._writable.mkdirSync(b, e), this._readable.existsSync(a) && this._readable.readdirSync(a).forEach(function (d) { c.renameSync(l.resolve(a, d), l.resolve(b, d)); });
                    }
                    else {
                        if (this.existsSync(b) && this.statSync(b, !1).isDirectory())
                            throw new m(o.EISDIR, "Path " + b + " is a directory.");
                        this.writeFileSync(b, this.readFileSync(a, null, i.FileFlag.getFileFlag("r")), null, i.FileFlag.getFileFlag("w"), d.mode);
                    } a !== b && this.existsSync(a) && this.unlinkSync(a); }, b.prototype.statSync = function (a, b) { try {
                        return this._writable.statSync(a, b);
                    }
                    catch (c) {
                        if (this._deletedFiles[a])
                            throw new m(o.ENOENT, "Path " + a + " does not exist.");
                        var e = this._readable.statSync(a, b).clone();
                        return e.mode = d(e.mode), e;
                    } }, b.prototype.openSync = function (a, b, c) { if (this.existsSync(a))
                        switch (b.pathExistsAction()) {
                            case i.ActionType.TRUNCATE_FILE: return this.createParentDirectories(a), this._writable.openSync(a, b, c);
                            case i.ActionType.NOP:
                                if (this._writable.existsSync(a))
                                    return this._writable.openSync(a, b, c);
                                var d = this._readable.statSync(a, !1).clone();
                                return d.mode = c, new q(this, a, b, d, this._readable.readFileSync(a, null, i.FileFlag.getFileFlag("r")));
                            default: throw new m(o.EEXIST, "Path " + a + " exists.");
                        }
                    else
                        switch (b.pathNotExistsAction()) {
                            case i.ActionType.CREATE_FILE: return this.createParentDirectories(a), this._writable.openSync(a, b, c);
                            default: throw new m(o.ENOENT, "Path " + a + " does not exist.");
                        } }, b.prototype.unlinkSync = function (a) { if (!this.existsSync(a))
                        throw new m(o.ENOENT, "Path " + a + " does not exist."); this._writable.existsSync(a) && this._writable.unlinkSync(a), this.existsSync(a) && this.deletePath(a); }, b.prototype.rmdirSync = function (a) { if (!this.existsSync(a))
                        throw new m(o.ENOENT, "Path " + a + " does not exist."); if (this._writable.existsSync(a) && this._writable.rmdirSync(a), this.existsSync(a)) {
                        if (this.readdirSync(a).length > 0)
                            throw new m(o.ENOTEMPTY, "Directory " + a + " is not empty.");
                        this.deletePath(a);
                    } }, b.prototype.mkdirSync = function (a, b) { if (this.existsSync(a))
                        throw new m(o.EEXIST, "Path " + a + " already exists."); this.createParentDirectories(a), this._writable.mkdirSync(a, b); }, b.prototype.readdirSync = function (a) { var b = this, c = this.statSync(a, !1); if (!c.isDirectory())
                        throw new m(o.ENOTDIR, "Path " + a + " is not a directory."); var d = []; try {
                        d = d.concat(this._writable.readdirSync(a));
                    }
                    catch (e) { } try {
                        d = d.concat(this._readable.readdirSync(a));
                    }
                    catch (e) { } var f = {}; return d.filter(function (c) { var d = void 0 === f[c] && b._deletedFiles[a + "/" + c] !== !0; return f[c] = !0, d; }); }, b.prototype.existsSync = function (a) { return this._writable.existsSync(a) || this._readable.existsSync(a) && this._deletedFiles[a] !== !0; }, b.prototype.chmodSync = function (a, b, c) { var d = this; this.operateOnWritable(a, function () { d._writable.chmodSync(a, b, c); }); }, b.prototype.chownSync = function (a, b, c, d) { var e = this; this.operateOnWritable(a, function () { e._writable.chownSync(a, b, c, d); }); }, b.prototype.utimesSync = function (a, b, c) { var d = this; this.operateOnWritable(a, function () { d._writable.utimesSync(a, b, c); }); }, b.prototype.operateOnWritable = function (a, b) { if (!this.existsSync(a))
                        throw new m(o.ENOENT, "Path " + a + " does not exist."); this._writable.existsSync(a) || this.copyToWritable(a), b(); }, b.prototype.copyToWritable = function (a) { var b = this.statSync(a, !1); b.isDirectory() ? this._writable.mkdirSync(a, b.mode) : this.writeFileSync(a, this._readable.readFileSync(a, null, i.FileFlag.getFileFlag("r")), null, i.FileFlag.getFileFlag("w"), this.statSync(a, !1).mode); }, b;
                }(f.SynchronousFileSystem);
                k.registerFileSystem("OverlayFS", r), b.exports = r;
            }, { "../core/api_error": 14, "../core/browserfs": 15, "../core/buffer": 16, "../core/file_flag": 22, "../core/file_system": 23, "../core/node_path": 28, "../generic/preload_file": 36 }], 12: [function (a, b, c) { function d(a) { return { type: l.ERROR, errorData: a.writeToBuffer().toArrayBuffer() }; } function e(a) { return p.ApiError.fromBuffer(new v(a.errorData)); } function f(a) { return { type: l.STATS, statsData: a.toBuffer().toArrayBuffer() }; } function g(a) { return s.Stats.fromBuffer(new v(a.statsData)); } function h(a) { return { type: l.FILEFLAG, flagStr: a.getFlagString() }; } function i(a) { return q.FileFlag.getFileFlag(a.flagStr); } function j(a) { return { type: l.BUFFER, data: a.toArrayBuffer() }; } function k(a) { return new v(a.data); } var l, m = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, n = a("../core/file_system"), o = a("../core/buffer"), p = a("../core/api_error"), q = a("../core/file_flag"), r = a("../core/file"), s = a("../core/node_fs_stats"), t = a("../generic/preload_file"), u = a("../core/browserfs"), v = o.Buffer; !function (a) { a[a.CB = 0] = "CB", a[a.FD = 1] = "FD", a[a.ERROR = 2] = "ERROR", a[a.STATS = 3] = "STATS", a[a.PROBE = 4] = "PROBE", a[a.FILEFLAG = 5] = "FILEFLAG", a[a.BUFFER = 6] = "BUFFER"; }(l || (l = {})); var w = function () { function a() { this._callbacks = {}, this._nextId = 0; } return a.prototype.toRemoteArg = function (a) { var b = this._nextId++; return this._callbacks[b] = a, { type: l.CB, id: b }; }, a.prototype.toLocalArg = function (a) { var b = this._callbacks[a]; return delete this._callbacks[a], b; }, a; }(), x = function () { function a() { this._fileDescriptors = {}, this._nextId = 0; } return a.prototype.toRemoteArg = function (a, b, c, d) { var e, f, g = this._nextId++; this._fileDescriptors[g] = a, a.stat(function (h, i) { h ? d(h) : (f = i.toBuffer().toArrayBuffer(), c.isReadable() ? a.read(new v(i.size), 0, i.size, 0, function (a, h, i) { a ? d(a) : (e = i.toArrayBuffer(), d(null, { type: l.FD, id: g, data: e, stat: f, path: b, flag: c.getFlagString() })); }) : d(null, { type: l.FD, id: g, data: new ArrayBuffer(0), stat: f, path: b, flag: c.getFlagString() })); }); }, a.prototype._applyFdChanges = function (a, b) { var c = this._fileDescriptors[a.id], d = new v(a.data), e = s.Stats.fromBuffer(new v(a.stat)), f = q.FileFlag.getFileFlag(a.flag); f.isWriteable() ? c.write(d, 0, d.length, f.isAppendable() ? c.getPos() : 0, function (a) { function g() { c.stat(function (a, d) { a ? b(a) : d.mode !== e.mode ? c.chmod(e.mode, function (a) { b(a, c); }) : b(a, c); }); } a ? b(a) : f.isAppendable() ? g() : c.truncate(d.length, function () { g(); }); }) : b(null, c); }, a.prototype.applyFdAPIRequest = function (a, b) { var c = this, d = a.args[0]; this._applyFdChanges(d, function (e, f) { e ? b(e) : f[a.method](function (e) { "close" === a.method && delete c._fileDescriptors[d.id], b(e); }); }); }, a; }(), y = function (a) { function b(b, c, d, e, f, g) { a.call(this, b, c, d, e, g), this._remoteFdId = f; } return m(b, a), b.prototype.getRemoteFdId = function () { return this._remoteFdId; }, b.prototype.toRemoteArg = function () { return { type: l.FD, id: this._remoteFdId, data: this.getBuffer().toArrayBuffer(), stat: this.getStats().toBuffer().toArrayBuffer(), path: this.getPath(), flag: this.getFlag().getFlagString() }; }, b.prototype._syncClose = function (a, b) { var c = this; this.isDirty() ? this._fs.syncClose(a, this, function (a) { a || c.resetDirty(), b(a); }) : b(); }, b.prototype.sync = function (a) { this._syncClose("sync", a); }, b.prototype.close = function (a) { this._syncClose("close", a); }, b; }(t.PreloadFile), z = function (a) { function b(b) { var c = this; a.call(this), this._callbackConverter = new w, this._isInitialized = !1, this._isReadOnly = !1, this._supportLinks = !1, this._supportProps = !1, this._outstandingRequests = {}, this._worker = b, this._worker.addEventListener("message", function (a) { if (null != a.data && "object" == typeof a.data && a.data.hasOwnProperty("browserfsMessage") && a.data.browserfsMessage) {
                var b, d = a.data, e = d.args, f = new Array(e.length);
                for (b = 0; b < f.length; b++)
                    f[b] = c._argRemote2Local(e[b]);
                c._callbackConverter.toLocalArg(d.cbId).apply(null, f);
            } }); } return m(b, a), b.isAvailable = function () { return "undefined" != typeof Worker; }, b.prototype.getName = function () { return "WorkerFS"; }, b.prototype._argRemote2Local = function (a) { if (null == a)
                return a; switch (typeof a) {
                case "object":
                    if (null == a.type || "number" != typeof a.type)
                        return a;
                    var b = a;
                    switch (b.type) {
                        case l.ERROR: return e(b);
                        case l.FD:
                            var c = b;
                            return new y(this, c.path, q.FileFlag.getFileFlag(c.flag), s.Stats.fromBuffer(new v(c.stat)), c.id, new v(c.data));
                        case l.STATS: return g(b);
                        case l.FILEFLAG: return i(b);
                        case l.BUFFER: return k(b);
                        default: return a;
                    }
                default: return a;
            } }, b.prototype._argLocal2Remote = function (a) { if (null == a)
                return a; switch (typeof a) {
                case "object": return a instanceof s.Stats ? f(a) : a instanceof p.ApiError ? d(a) : a instanceof y ? a.toRemoteArg() : a instanceof q.FileFlag ? h(a) : a instanceof v ? j(a) : a;
                case "function": return this._callbackConverter.toRemoteArg(a);
                default: return a;
            } }, b.prototype.initialize = function (a) { var b = this; if (this._isInitialized)
                a();
            else {
                var c = { browserfsMessage: !0, method: "probe", args: [this._callbackConverter.toRemoteArg(function (c) { b._isInitialized = !0, b._isReadOnly = c.isReadOnly, b._supportLinks = c.supportsLinks, b._supportProps = c.supportsProps, a(); })] };
                this._worker.postMessage(c);
            } }, b.prototype.isReadOnly = function () { return this._isReadOnly; }, b.prototype.supportsSynch = function () { return !1; }, b.prototype.supportsLinks = function () { return this._supportLinks; }, b.prototype.supportsProps = function () { return this._supportProps; }, b.prototype._rpc = function (a, b) { var c, d = { browserfsMessage: !0, method: a, args: null }, e = new Array(b.length); for (c = 0; c < b.length; c++)
                e[c] = this._argLocal2Remote(b[c]); d.args = e, this._worker.postMessage(d); }, b.prototype.rename = function (a, b, c) { this._rpc("rename", arguments); }, b.prototype.stat = function (a, b, c) { this._rpc("stat", arguments); }, b.prototype.open = function (a, b, c, d) { this._rpc("open", arguments); }, b.prototype.unlink = function (a, b) { this._rpc("unlink", arguments); }, b.prototype.rmdir = function (a, b) { this._rpc("rmdir", arguments); }, b.prototype.mkdir = function (a, b, c) { this._rpc("mkdir", arguments); }, b.prototype.readdir = function (a, b) { this._rpc("readdir", arguments); }, b.prototype.exists = function (a, b) { this._rpc("exists", arguments); }, b.prototype.realpath = function (a, b, c) { this._rpc("realpath", arguments); }, b.prototype.truncate = function (a, b, c) { this._rpc("truncate", arguments); }, b.prototype.readFile = function (a, b, c, d) { this._rpc("readFile", arguments); }, b.prototype.writeFile = function (a, b, c, d, e, f) { this._rpc("writeFile", arguments); }, b.prototype.appendFile = function (a, b, c, d, e, f) { this._rpc("appendFile", arguments); }, b.prototype.chmod = function (a, b, c, d) { this._rpc("chmod", arguments); }, b.prototype.chown = function (a, b, c, d, e) { this._rpc("chown", arguments); }, b.prototype.utimes = function (a, b, c, d) { this._rpc("utimes", arguments); }, b.prototype.link = function (a, b, c) { this._rpc("link", arguments); }, b.prototype.symlink = function (a, b, c, d) { this._rpc("symlink", arguments); }, b.prototype.readlink = function (a, b) { this._rpc("readlink", arguments); }, b.prototype.syncClose = function (a, b, c) { this._worker.postMessage({ browserfsMessage: !0, method: a, args: [b.toRemoteArg(), this._callbackConverter.toRemoteArg(c)] }); }, b.attachRemoteListener = function (a) { function b(a, b, c) { switch (typeof a) {
                case "object":
                    a instanceof s.Stats ? c(null, f(a)) : a instanceof p.ApiError ? c(null, d(a)) : a instanceof r.BaseFile ? c(null, m.toRemoteArg(a, b[0], b[1], c)) : a instanceof q.FileFlag ? c(null, h(a)) : a instanceof v ? c(null, j(a)) : c(null, a);
                    break;
                default: c(null, a);
            } } function c(c, f) { if (null == c)
                return c; switch (typeof c) {
                case "object":
                    if ("number" != typeof c.type)
                        return c;
                    var h = c;
                    switch (h.type) {
                        case l.CB:
                            var j = c.id;
                            return function () { function c(b) { i > 0 && (i = -1, g = { browserfsMessage: !0, cbId: j, args: [d(b)] }, a.postMessage(g)); } var e, g, h = new Array(arguments.length), i = arguments.length; for (e = 0; e < arguments.length; e++)
                                !function (d, e) { b(e, f, function (b, e) { h[d] = e, b ? c(b) : 0 === --i && (g = { browserfsMessage: !0, cbId: j, args: h }, a.postMessage(g)); }); }(e, arguments[e]); 0 === arguments.length && (g = { browserfsMessage: !0, cbId: j, args: h }, a.postMessage(g)); };
                        case l.ERROR: return e(h);
                        case l.STATS: return g(h);
                        case l.FILEFLAG: return i(h);
                        case l.BUFFER: return k(h);
                        default: return c;
                    }
                default: return c;
            } } var m = new x, n = u.BFSRequire("fs"); a.addEventListener("message", function (b) { if (null != b.data && "object" == typeof b.data && b.data.hasOwnProperty("browserfsMessage") && b.data.browserfsMessage) {
                var e, f = b.data, g = f.args, h = new Array(g.length);
                switch (f.method) {
                    case "close":
                    case "sync":
                        !function () { var b = g[1]; m.applyFdAPIRequest(f, function (c) { var e = { browserfsMessage: !0, cbId: b.id, args: c ? [d(c)] : [] }; a.postMessage(e); }); }();
                        break;
                    case "probe":
                        !function () { var b = n.getRootFS(), c = g[0], d = { browserfsMessage: !0, cbId: c.id, args: [{ type: l.PROBE, isReadOnly: b.isReadOnly(), supportsLinks: b.supportsLinks(), supportsProps: b.supportsProps() }] }; a.postMessage(d); }();
                        break;
                    default:
                        for (e = 0; e < g.length; e++)
                            h[e] = c(g[e], h);
                        var i = n.getRootFS();
                        i[f.method].apply(i, h);
                }
            } }); }, b; }(n.BaseFileSystem); c.WorkerFS = z, u.registerFileSystem("WorkerFS", z); }, { "../core/api_error": 14, "../core/browserfs": 15, "../core/buffer": 16, "../core/file": 21, "../core/file_flag": 22, "../core/file_system": 23, "../core/node_fs_stats": 27, "../generic/preload_file": 36 }], 13: [function (a, b, c) { function d(a, b) { var c = 31 & b, d = (b >> 5 & 15) - 1, e = (b >> 9) + 1980, f = 31 & a, g = a >> 5 & 63, h = a >> 11; return new Date(e, d, c, h, g, f); } function e(a, b, c, d) { return 0 === d ? "" : a.toString(b ? "utf8" : "extended_ascii", c, c + d); } var f = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, g = a("../core/buffer"), h = a("../core/api_error"), i = a("../generic/file_index"), j = a("../core/browserfs"), k = a("../core/node_fs_stats"), l = a("../core/file_system"), m = a("../core/file_flag"), n = a("../core/buffer_core_arraybuffer"), o = a("../generic/preload_file"), p = a("zlib-inflate").inflateRaw, q = h.ApiError, r = h.ErrorCode, s = m.ActionType; !function (a) { a[a.MSDOS = 0] = "MSDOS", a[a.AMIGA = 1] = "AMIGA", a[a.OPENVMS = 2] = "OPENVMS", a[a.UNIX = 3] = "UNIX", a[a.VM_CMS = 4] = "VM_CMS", a[a.ATARI_ST = 5] = "ATARI_ST", a[a.OS2_HPFS = 6] = "OS2_HPFS", a[a.MAC = 7] = "MAC", a[a.Z_SYSTEM = 8] = "Z_SYSTEM", a[a.CP_M = 9] = "CP_M", a[a.NTFS = 10] = "NTFS", a[a.MVS = 11] = "MVS", a[a.VSE = 12] = "VSE", a[a.ACORN_RISC = 13] = "ACORN_RISC", a[a.VFAT = 14] = "VFAT", a[a.ALT_MVS = 15] = "ALT_MVS", a[a.BEOS = 16] = "BEOS", a[a.TANDEM = 17] = "TANDEM", a[a.OS_400 = 18] = "OS_400", a[a.OSX = 19] = "OSX"; }(c.ExternalFileAttributeType || (c.ExternalFileAttributeType = {})); c.ExternalFileAttributeType; !function (a) { a[a.STORED = 0] = "STORED", a[a.SHRUNK = 1] = "SHRUNK", a[a.REDUCED_1 = 2] = "REDUCED_1", a[a.REDUCED_2 = 3] = "REDUCED_2", a[a.REDUCED_3 = 4] = "REDUCED_3", a[a.REDUCED_4 = 5] = "REDUCED_4", a[a.IMPLODE = 6] = "IMPLODE", a[a.DEFLATE = 8] = "DEFLATE", a[a.DEFLATE64 = 9] = "DEFLATE64", a[a.TERSE_OLD = 10] = "TERSE_OLD", a[a.BZIP2 = 12] = "BZIP2", a[a.LZMA = 14] = "LZMA", a[a.TERSE_NEW = 18] = "TERSE_NEW", a[a.LZ77 = 19] = "LZ77", a[a.WAVPACK = 97] = "WAVPACK", a[a.PPMD = 98] = "PPMD"; }(c.CompressionMethod || (c.CompressionMethod = {})); var t = c.CompressionMethod, u = function () { function a(a) { if (this.data = a, 67324752 !== a.readUInt32LE(0))
                throw new q(r.EINVAL, "Invalid Zip file: Local file header has invalid signature: " + this.data.readUInt32LE(0)); } return a.prototype.versionNeeded = function () { return this.data.readUInt16LE(4); }, a.prototype.flags = function () { return this.data.readUInt16LE(6); }, a.prototype.compressionMethod = function () { return this.data.readUInt16LE(8); }, a.prototype.lastModFileTime = function () { return d(this.data.readUInt16LE(10), this.data.readUInt16LE(12)); }, a.prototype.crc32 = function () { return this.data.readUInt32LE(14); }, a.prototype.fileNameLength = function () { return this.data.readUInt16LE(26); }, a.prototype.extraFieldLength = function () { return this.data.readUInt16LE(28); }, a.prototype.fileName = function () { return e(this.data, this.useUTF8(), 30, this.fileNameLength()); }, a.prototype.extraField = function () { var a = 30 + this.fileNameLength(); return this.data.slice(a, a + this.extraFieldLength()); }, a.prototype.totalSize = function () { return 30 + this.fileNameLength() + this.extraFieldLength(); }, a.prototype.useUTF8 = function () { return 2048 === (2048 & this.flags()); }, a; }(); c.FileHeader = u; var v = function () { function a(a, b, c) { this.header = a, this.record = b, this.data = c; } return a.prototype.decompress = function () { var a = this.data, b = this.header.compressionMethod(); switch (b) {
                case t.DEFLATE:
                    if (a.getBufferCore() instanceof n.BufferCoreArrayBuffer) {
                        var c = a.getBufferCore(), d = c.getDataView(), e = d.byteOffset + a.getOffset(), f = new Uint8Array(d.buffer).subarray(e, e + this.record.compressedSize()), h = p(f, { chunkSize: this.record.uncompressedSize() });
                        return new g.Buffer(new n.BufferCoreArrayBuffer(h.buffer), h.byteOffset, h.byteOffset + h.length);
                    }
                    var i = a.slice(0, this.record.compressedSize());
                    return new g.Buffer(p(i.toJSON().data, { chunkSize: this.record.uncompressedSize() }));
                case t.STORED: return a.sliceCopy(0, this.record.uncompressedSize());
                default:
                    var j = t[b];
                    throw j = j ? j : "Unknown: " + b, new q(r.EINVAL, "Invalid compression method on file '" + this.header.fileName() + "': " + j);
            } }, a; }(); c.FileData = v; var w = function () { function a(a) { this.data = a; } return a.prototype.crc32 = function () { return this.data.readUInt32LE(0); }, a.prototype.compressedSize = function () { return this.data.readUInt32LE(4); }, a.prototype.uncompressedSize = function () { return this.data.readUInt32LE(8); }, a; }(); c.DataDescriptor = w; var x = function () { function a(a) { if (this.data = a, 134630224 !== this.data.readUInt32LE(0))
                throw new q(r.EINVAL, "Invalid archive extra data record signature: " + this.data.readUInt32LE(0)); } return a.prototype.length = function () { return this.data.readUInt32LE(4); }, a.prototype.extraFieldData = function () { return this.data.slice(8, 8 + this.length()); }, a; }(); c.ArchiveExtraDataRecord = x; var y = function () { function a(a) { if (this.data = a, 84233040 !== this.data.readUInt32LE(0))
                throw new q(r.EINVAL, "Invalid digital signature signature: " + this.data.readUInt32LE(0)); } return a.prototype.size = function () { return this.data.readUInt16LE(4); }, a.prototype.signatureData = function () { return this.data.slice(6, 6 + this.size()); }, a; }(); c.DigitalSignature = y; var z = function () { function a(a, b) { if (this.zipData = a, this.data = b, 33639248 !== this.data.readUInt32LE(0))
                throw new q(r.EINVAL, "Invalid Zip file: Central directory record has invalid signature: " + this.data.readUInt32LE(0)); } return a.prototype.versionMadeBy = function () { return this.data.readUInt16LE(4); }, a.prototype.versionNeeded = function () { return this.data.readUInt16LE(6); }, a.prototype.flag = function () { return this.data.readUInt16LE(8); }, a.prototype.compressionMethod = function () { return this.data.readUInt16LE(10); }, a.prototype.lastModFileTime = function () { return d(this.data.readUInt16LE(12), this.data.readUInt16LE(14)); }, a.prototype.crc32 = function () { return this.data.readUInt32LE(16); }, a.prototype.compressedSize = function () { return this.data.readUInt32LE(20); }, a.prototype.uncompressedSize = function () { return this.data.readUInt32LE(24); }, a.prototype.fileNameLength = function () { return this.data.readUInt16LE(28); }, a.prototype.extraFieldLength = function () { return this.data.readUInt16LE(30); }, a.prototype.fileCommentLength = function () { return this.data.readUInt16LE(32); }, a.prototype.diskNumberStart = function () { return this.data.readUInt16LE(34); }, a.prototype.internalAttributes = function () { return this.data.readUInt16LE(36); }, a.prototype.externalAttributes = function () { return this.data.readUInt32LE(38); }, a.prototype.headerRelativeOffset = function () { return this.data.readUInt32LE(42); }, a.prototype.fileName = function () { var a = e(this.data, this.useUTF8(), 46, this.fileNameLength()); return a.replace(/\\/g, "/"); }, a.prototype.extraField = function () { var a = 44 + this.fileNameLength(); return this.data.slice(a, a + this.extraFieldLength()); }, a.prototype.fileComment = function () { var a = 46 + this.fileNameLength() + this.extraFieldLength(); return e(this.data, this.useUTF8(), a, this.fileCommentLength()); }, a.prototype.totalSize = function () { return 46 + this.fileNameLength() + this.extraFieldLength() + this.fileCommentLength(); }, a.prototype.isDirectory = function () { var a = this.fileName(); return (16 & this.externalAttributes() ? !0 : !1) || "/" === a.charAt(a.length - 1); }, a.prototype.isFile = function () { return !this.isDirectory(); }, a.prototype.useUTF8 = function () { return 2048 === (2048 & this.flag()); }, a.prototype.isEncrypted = function () { return 1 === (1 & this.flag()); }, a.prototype.getData = function () { var a = this.headerRelativeOffset(), b = new u(this.zipData.slice(a)), c = new v(b, this, this.zipData.slice(a + b.totalSize())); return c.decompress(); }, a.prototype.getStats = function () { return new k.Stats(k.FileType.FILE, this.uncompressedSize(), 365, new Date, this.lastModFileTime()); }, a; }(); c.CentralDirectory = z; var A = function () { function a(a) { if (this.data = a, 101010256 !== this.data.readUInt32LE(0))
                throw new q(r.EINVAL, "Invalid Zip file: End of central directory record has invalid signature: " + this.data.readUInt32LE(0)); } return a.prototype.diskNumber = function () { return this.data.readUInt16LE(4); }, a.prototype.cdDiskNumber = function () { return this.data.readUInt16LE(6); }, a.prototype.cdDiskEntryCount = function () { return this.data.readUInt16LE(8); }, a.prototype.cdTotalEntryCount = function () { return this.data.readUInt16LE(10); }, a.prototype.cdSize = function () { return this.data.readUInt32LE(12); }, a.prototype.cdOffset = function () { return this.data.readUInt32LE(16); }, a.prototype.cdZipComment = function () { return e(this.data, !0, 22, this.data.readUInt16LE(20)); }, a; }(); c.EndOfCentralDirectory = A; var B = function (a) { function b(b, c) { void 0 === c && (c = ""), a.call(this), this.data = b, this.name = c, this._index = new i.FileIndex, this.populateIndex(); } return f(b, a), b.prototype.getName = function () { return "ZipFS" + ("" !== this.name ? " " + this.name : ""); }, b.isAvailable = function () { return !0; }, b.prototype.diskSpace = function (a, b) { b(this.data.length, 0); }, b.prototype.isReadOnly = function () { return !0; }, b.prototype.supportsLinks = function () { return !1; }, b.prototype.supportsProps = function () { return !1; }, b.prototype.supportsSynch = function () { return !0; }, b.prototype.statSync = function (a, b) { var c = this._index.getInode(a); if (null === c)
                throw new q(r.ENOENT, "" + a + " not found."); var d; return d = c.isFile() ? c.getData().getStats() : c.getStats(); }, b.prototype.openSync = function (a, b, c) { if (b.isWriteable())
                throw new q(r.EPERM, a); var d = this._index.getInode(a); if (null === d)
                throw new q(r.ENOENT, "" + a + " is not in the FileIndex."); if (d.isDir())
                throw new q(r.EISDIR, "" + a + " is a directory."); var e = d.getData(), f = e.getStats(); switch (b.pathExistsAction()) {
                case s.THROW_EXCEPTION:
                case s.TRUNCATE_FILE: throw new q(r.EEXIST, "" + a + " already exists.");
                case s.NOP: return new o.NoSyncFile(this, a, b, f, e.getData());
                default: throw new q(r.EINVAL, "Invalid FileMode object.");
            } return null; }, b.prototype.readdirSync = function (a) { var b = this._index.getInode(a); if (null === b)
                throw new q(r.ENOENT, "" + a + " not found."); if (b.isFile())
                throw new q(r.ENOTDIR, "" + a + " is a file, not a directory."); return b.getListing(); }, b.prototype.readFileSync = function (a, b, c) { var d = this.openSync(a, c, 420); try {
                var e = d, f = e.getBuffer();
                return null === b ? f.length > 0 ? f.sliceCopy() : new g.Buffer(0) : f.toString(b);
            }
            finally {
                d.closeSync();
            } }, b.prototype.getEOCD = function () { for (var a = 22, b = Math.min(a + 65535, this.data.length - 1), c = a; b > c; c++)
                if (101010256 === this.data.readUInt32LE(this.data.length - c))
                    return new A(this.data.slice(this.data.length - c)); throw new q(r.EINVAL, "Invalid ZIP file: Could not locate End of Central Directory signature."); }, b.prototype.populateIndex = function () { var a = this.getEOCD(); if (a.diskNumber() !== a.cdDiskNumber())
                throw new q(r.EINVAL, "ZipFS does not support spanned zip files."); var b = a.cdOffset(); if (4294967295 === b)
                throw new q(r.EINVAL, "ZipFS does not support Zip64."); for (var c = b + a.cdSize(); c > b;) {
                var d = new z(this.data, this.data.slice(b));
                b += d.totalSize();
                var e = d.fileName();
                if ("/" === e.charAt(0))
                    throw new Error("WHY IS THIS ABSOLUTE");
                "/" === e.charAt(e.length - 1) && (e = e.substr(0, e.length - 1)), d.isDirectory() ? this._index.addPath("/" + e, new i.DirInode) : this._index.addPath("/" + e, new i.FileInode(d));
            } }, b; }(l.SynchronousFileSystem); c.ZipFS = B, j.registerFileSystem("ZipFS", B); }, { "../core/api_error": 14, "../core/browserfs": 15, "../core/buffer": 16, "../core/buffer_core_arraybuffer": 19, "../core/file_flag": 22, "../core/file_system": 23, "../core/node_fs_stats": 27, "../generic/file_index": 33, "../generic/preload_file": 36, "zlib-inflate": 2 }], 14: [function (a, b, c) { var d = a("./buffer"), e = d.Buffer; !function (a) { a[a.EPERM = 0] = "EPERM", a[a.ENOENT = 1] = "ENOENT", a[a.EIO = 2] = "EIO", a[a.EBADF = 3] = "EBADF", a[a.EACCES = 4] = "EACCES", a[a.EBUSY = 5] = "EBUSY", a[a.EEXIST = 6] = "EEXIST", a[a.ENOTDIR = 7] = "ENOTDIR", a[a.EISDIR = 8] = "EISDIR", a[a.EINVAL = 9] = "EINVAL", a[a.EFBIG = 10] = "EFBIG", a[a.ENOSPC = 11] = "ENOSPC", a[a.EROFS = 12] = "EROFS", a[a.ENOTEMPTY = 13] = "ENOTEMPTY", a[a.ENOTSUP = 14] = "ENOTSUP"; }(c.ErrorCode || (c.ErrorCode = {})); var f = c.ErrorCode, g = {}; g[f.EPERM] = "Operation not permitted.", g[f.ENOENT] = "No such file or directory.", g[f.EIO] = "Input/output error.", g[f.EBADF] = "Bad file descriptor.", g[f.EACCES] = "Permission denied.", g[f.EBUSY] = "Resource busy or locked.", g[f.EEXIST] = "File exists.", g[f.ENOTDIR] = "File is not a directory.", g[f.EISDIR] = "File is a directory.", g[f.EINVAL] = "Invalid argument.", g[f.EFBIG] = "File is too big.", g[f.ENOSPC] = "No space left on disk.", g[f.EROFS] = "Cannot modify a read-only file system.", g[f.ENOTEMPTY] = "Directory is not empty.", g[f.ENOTSUP] = "Operation is not supported."; var h = function () { function a(a, b) { this.type = a, this.code = f[a], null != b ? this.message = b : this.message = g[a]; } return a.prototype.toString = function () { return this.code + ": " + g[this.type] + " " + this.message; }, a.prototype.writeToBuffer = function (a, b) { void 0 === a && (a = new e(this.bufferSize())), void 0 === b && (b = 0), a.writeUInt8(this.type, b); var c = a.write(this.message, b + 5); return a.writeUInt32LE(c, b + 1), a; }, a.fromBuffer = function (b, c) { return void 0 === c && (c = 0), new a(b.readUInt8(c), b.toString("utf8", c + 5, c + 5 + b.readUInt32LE(c + 1))); }, a.prototype.bufferSize = function () { return 5 + e.byteLength(this.message); }, a.FileError = function (b, c) { return new a(b, c + ": " + g[b]); }, a.ENOENT = function (a) { return this.FileError(f.ENOENT, a); }, a.EEXIST = function (a) { return this.FileError(f.EEXIST, a); }, a.EISDIR = function (a) { return this.FileError(f.EISDIR, a); }, a.ENOTDIR = function (a) { return this.FileError(f.ENOTDIR, a); }, a.EPERM = function (a) { return this.FileError(f.EPERM, a); }, a; }(); c.ApiError = h; }, { "./buffer": 16 }], 15: [function (a, b, c) { function d(a) { a.Buffer = h.Buffer, a.process = k.process; var b = null != a.require ? a.require : null; a.require = function (a) { var c = f(a); return null == c ? b.apply(null, Array.prototype.slice.call(arguments, 0)) : c; }; } function e(a, b) { c.FileSystem[a] = b; } function f(a) { switch (a) {
                case "fs": return i;
                case "path": return j;
                case "buffer": return h;
                case "process": return k.process;
                default: return c.FileSystem[a];
            } } function g(a) { return i._initialize(a); } var h = a("./buffer"), i = a("./node_fs"), j = a("./node_path"), k = a("./node_process"); c.install = d, c.FileSystem = {}, c.registerFileSystem = e, c.BFSRequire = f, c.initialize = g; }, { "./buffer": 16, "./node_fs": 26, "./node_path": 28, "./node_process": 29 }], 16: [function (a, b, c) {
                var d = a("./buffer_core"), e = a("./buffer_core_array"), f = a("./buffer_core_arraybuffer"), g = a("./buffer_core_imagedata"), h = a("./string_util"), i = [f.BufferCoreArrayBuffer, g.BufferCoreImageData, e.BufferCoreArray], j = function () { var a, b; for (a = 0; a < i.length; a++)
                    if (b = i[a], b.isAvailable())
                        return b; throw new Error("This browser does not support any available BufferCore implementations."); }(), k = function () {
                    function a(b, c, e) { void 0 === c && (c = "utf8"), this.offset = 0; var g; if (!(this instanceof a))
                        return new a(b, c); if (b instanceof d.BufferCoreCommon) {
                        this.data = b;
                        var h = "number" == typeof c ? c : 0, i = "number" == typeof e ? e : this.data.getLength();
                        this.offset = h, this.length = i - h;
                    }
                    else if ("number" == typeof b) {
                        if (b !== b >>> 0)
                            throw new TypeError("Buffer size must be a uint32.");
                        this.length = b, this.data = new j(b);
                    }
                    else if ("undefined" != typeof DataView && b instanceof DataView)
                        this.data = new f.BufferCoreArrayBuffer(b), this.length = b.byteLength;
                    else if ("undefined" != typeof ArrayBuffer && "number" == typeof b.byteLength)
                        this.data = new f.BufferCoreArrayBuffer(b), this.length = b.byteLength;
                    else if (b instanceof a) {
                        var k = b;
                        this.data = new j(b.length), this.length = b.length, k.copy(this);
                    }
                    else if (Array.isArray(b) || null != b && "object" == typeof b && "number" == typeof b[0]) {
                        for (this.data = new j(b.length), g = 0; g < b.length; g++)
                            this.data.writeUInt8(g, b[g]);
                        this.length = b.length;
                    }
                    else {
                        if ("string" != typeof b)
                            throw new Error("Invalid argument to Buffer constructor: " + b);
                        this.length = a.byteLength(b, c), this.data = new j(this.length), this.write(b, 0, this.length, c);
                    } }
                    return a.prototype.getBufferCore = function () { return this.data; }, a.prototype.getOffset = function () { return this.offset; }, a.prototype.set = function (a, b) { return 0 > b ? this.writeInt8(b, a) : this.writeUInt8(b, a); }, a.prototype.get = function (a) { return this.readUInt8(a); }, a.prototype.write = function (b, c, d, e) { if (void 0 === c && (c = 0), void 0 === d && (d = this.length), void 0 === e && (e = "utf8"), "string" == typeof c ? (e = "" + c, c = 0, d = this.length) : "string" == typeof d && (e = "" + d, d = this.length), c >= this.length)
                        return 0; var f = h.FindUtil(e); return d = d + c > this.length ? this.length - c : d, c += this.offset, f.str2byte(b, 0 === c && d === this.length ? this : new a(this.data, c, d + c)); }, a.prototype.toString = function (b, c, d) { if (void 0 === b && (b = "utf8"), void 0 === c && (c = 0), void 0 === d && (d = this.length), !(d >= c))
                        throw new Error("Invalid start/end positions: " + c + " - " + d); if (c === d)
                        return ""; d > this.length && (d = this.length); var e = h.FindUtil(b); return e.byte2str(0 === c && d === this.length ? this : new a(this.data, c + this.offset, d + this.offset)); }, a.prototype.toJSON = function () { for (var a = this.length, b = new Array(a), c = 0; a > c; c++)
                        b[c] = this.readUInt8(c); return { type: "Buffer", data: b }; }, a.prototype.toArrayBuffer = function () { var b = this.getBufferCore(); if (b instanceof f.BufferCoreArrayBuffer) {
                        var c = b.getDataView(), d = c.buffer;
                        return 0 === c.byteOffset && c.byteLength === d.byteLength ? d : d.slice(c.byteOffset, c.byteLength);
                    } var d = new ArrayBuffer(this.length), e = new a(d); return this.copy(e, 0, 0, this.length), d; }, a.prototype.copy = function (a, b, c, d) { if (void 0 === b && (b = 0), void 0 === c && (c = 0), void 0 === d && (d = this.length), b = 0 > b ? 0 : b, c = 0 > c ? 0 : c, c > d)
                        throw new RangeError("sourceEnd < sourceStart"); if (d === c)
                        return 0; if (b >= a.length)
                        throw new RangeError("targetStart out of bounds"); if (c >= this.length)
                        throw new RangeError("sourceStart out of bounds"); if (d > this.length)
                        throw new RangeError("sourceEnd out of bounds"); var e, f = Math.min(d - c, a.length - b, this.length - c); for (e = 0; f - 3 > e; e += 4)
                        a.writeInt32LE(this.readInt32LE(c + e), b + e); for (e = 4294967292 & f; f > e; e++)
                        a.writeUInt8(this.readUInt8(c + e), b + e); return f; }, a.prototype.slice = function (b, c) { if (void 0 === b && (b = 0), void 0 === c && (c = this.length), 0 > b && (b += this.length, 0 > b && (b = 0)), 0 > c && (c += this.length, 0 > c && (c = 0)), c > this.length && (c = this.length), b > c && (b = c), 0 > b || 0 > c || b >= this.length || c > this.length)
                        throw new Error("Invalid slice indices."); return new a(this.data, b + this.offset, c + this.offset); }, a.prototype.sliceCopy = function (b, c) { if (void 0 === b && (b = 0), void 0 === c && (c = this.length), 0 > b && (b += this.length, 0 > b && (b = 0)), 0 > c && (c += this.length, 0 > c && (c = 0)), c > this.length && (c = this.length), b > c && (b = c), 0 > b || 0 > c || b >= this.length || c > this.length)
                        throw new Error("Invalid slice indices."); return new a(this.data.copy(b + this.offset, c + this.offset)); }, a.prototype.fill = function (a, b, c) { void 0 === b && (b = 0), void 0 === c && (c = this.length); var d = typeof a; switch (d) {
                        case "string":
                            a = 255 & a.charCodeAt(0);
                            break;
                        case "number": break;
                        default: throw new Error("Invalid argument to fill.");
                    } b += this.offset, c += this.offset, this.data.fill(a, b, c); }, a.prototype.readUInt8 = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readUInt8(a); }, a.prototype.readUInt16LE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readUInt16LE(a); }, a.prototype.readUInt16BE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readUInt16BE(a); }, a.prototype.readUInt32LE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readUInt32LE(a); }, a.prototype.readUInt32BE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readUInt32BE(a); }, a.prototype.readInt8 = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readInt8(a); }, a.prototype.readInt16LE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readInt16LE(a); }, a.prototype.readInt16BE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readInt16BE(a); }, a.prototype.readInt32LE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readInt32LE(a); }, a.prototype.readInt32BE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readInt32BE(a); }, a.prototype.readFloatLE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readFloatLE(a); }, a.prototype.readFloatBE = function (a, b) {
                        return void 0 === b && (b = !1), a += this.offset,
                            this.data.readFloatBE(a);
                    }, a.prototype.readDoubleLE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readDoubleLE(a); }, a.prototype.readDoubleBE = function (a, b) { return void 0 === b && (b = !1), a += this.offset, this.data.readDoubleBE(a); }, a.prototype.writeUInt8 = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeUInt8(b, a); }, a.prototype.writeUInt16LE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeUInt16LE(b, a); }, a.prototype.writeUInt16BE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeUInt16BE(b, a); }, a.prototype.writeUInt32LE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeUInt32LE(b, a); }, a.prototype.writeUInt32BE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeUInt32BE(b, a); }, a.prototype.writeInt8 = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeInt8(b, a); }, a.prototype.writeInt16LE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeInt16LE(b, a); }, a.prototype.writeInt16BE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeInt16BE(b, a); }, a.prototype.writeInt32LE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeInt32LE(b, a); }, a.prototype.writeInt32BE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeInt32BE(b, a); }, a.prototype.writeFloatLE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeFloatLE(b, a); }, a.prototype.writeFloatBE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeFloatBE(b, a); }, a.prototype.writeDoubleLE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeDoubleLE(b, a); }, a.prototype.writeDoubleBE = function (a, b, c) { void 0 === c && (c = !1), b += this.offset, this.data.writeDoubleBE(b, a); }, a.isEncoding = function (a) { try {
                        h.FindUtil(a);
                    }
                    catch (b) {
                        return !1;
                    } return !0; }, a.isBuffer = function (b) { return b instanceof a; }, a.byteLength = function (a, b) { void 0 === b && (b = "utf8"); var c = h.FindUtil(b); return c.byteLength(a); }, a.concat = function (b, c) { var d; if (0 === b.length || 0 === c)
                        return new a(0); if (1 === b.length)
                        return b[0]; if (null == c) {
                        c = 0;
                        for (var e = 0; e < b.length; e++)
                            d = b[e], c += d.length;
                    } for (var f = new a(c), g = 0, h = 0; h < b.length; h++)
                        d = b[h], g += d.copy(f, g); return f; }, a;
                }();
                c.Buffer = k;
            }, { "./buffer_core": 17, "./buffer_core_array": 18, "./buffer_core_arraybuffer": 19, "./buffer_core_imagedata": 20, "./string_util": 30 }], 17: [function (a, b, c) { var d = Math.pow(2, 128), e = -1 * d, f = 2139095040, g = -8388608, h = 2143289344, i = function () { function a() { } return a.prototype.getLength = function () { throw new Error("BufferCore implementations should implement getLength."); }, a.prototype.writeInt8 = function (a, b) { this.writeUInt8(a, 255 & b | (2147483648 & b) >>> 24); }, a.prototype.writeInt16LE = function (a, b) { this.writeUInt8(a, 255 & b), this.writeUInt8(a + 1, b >>> 8 & 255 | (2147483648 & b) >>> 24); }, a.prototype.writeInt16BE = function (a, b) { this.writeUInt8(a + 1, 255 & b), this.writeUInt8(a, b >>> 8 & 255 | (2147483648 & b) >>> 24); }, a.prototype.writeInt32LE = function (a, b) { this.writeUInt8(a, 255 & b), this.writeUInt8(a + 1, b >>> 8 & 255), this.writeUInt8(a + 2, b >>> 16 & 255), this.writeUInt8(a + 3, b >>> 24 & 255); }, a.prototype.writeInt32BE = function (a, b) { this.writeUInt8(a + 3, 255 & b), this.writeUInt8(a + 2, b >>> 8 & 255), this.writeUInt8(a + 1, b >>> 16 & 255), this.writeUInt8(a, b >>> 24 & 255); }, a.prototype.writeUInt8 = function (a, b) { throw new Error("BufferCore implementations should implement writeUInt8."); }, a.prototype.writeUInt16LE = function (a, b) { this.writeUInt8(a, 255 & b), this.writeUInt8(a + 1, b >> 8 & 255); }, a.prototype.writeUInt16BE = function (a, b) { this.writeUInt8(a + 1, 255 & b), this.writeUInt8(a, b >> 8 & 255); }, a.prototype.writeUInt32LE = function (a, b) { this.writeInt32LE(a, 0 | b); }, a.prototype.writeUInt32BE = function (a, b) { this.writeInt32BE(a, 0 | b); }, a.prototype.writeFloatLE = function (a, b) { this.writeInt32LE(a, this.float2intbits(b)); }, a.prototype.writeFloatBE = function (a, b) { this.writeInt32BE(a, this.float2intbits(b)); }, a.prototype.writeDoubleLE = function (a, b) { var c = this.double2longbits(b); this.writeInt32LE(a, c[0]), this.writeInt32LE(a + 4, c[1]); }, a.prototype.writeDoubleBE = function (a, b) { var c = this.double2longbits(b); this.writeInt32BE(a + 4, c[0]), this.writeInt32BE(a, c[1]); }, a.prototype.readInt8 = function (a) { var b = this.readUInt8(a); return 128 & b ? 4294967168 | b : b; }, a.prototype.readInt16LE = function (a) { var b = this.readUInt16LE(a); return 32768 & b ? 4294934528 | b : b; }, a.prototype.readInt16BE = function (a) { var b = this.readUInt16BE(a); return 32768 & b ? 4294934528 | b : b; }, a.prototype.readInt32LE = function (a) { return 0 | this.readUInt32LE(a); }, a.prototype.readInt32BE = function (a) { return 0 | this.readUInt32BE(a); }, a.prototype.readUInt8 = function (a) { throw new Error("BufferCore implementations should implement readUInt8."); }, a.prototype.readUInt16LE = function (a) { return this.readUInt8(a + 1) << 8 | this.readUInt8(a); }, a.prototype.readUInt16BE = function (a) { return this.readUInt8(a) << 8 | this.readUInt8(a + 1); }, a.prototype.readUInt32LE = function (a) { return (this.readUInt8(a + 3) << 24 | this.readUInt8(a + 2) << 16 | this.readUInt8(a + 1) << 8 | this.readUInt8(a)) >>> 0; }, a.prototype.readUInt32BE = function (a) { return (this.readUInt8(a) << 24 | this.readUInt8(a + 1) << 16 | this.readUInt8(a + 2) << 8 | this.readUInt8(a + 3)) >>> 0; }, a.prototype.readFloatLE = function (a) { return this.intbits2float(this.readInt32LE(a)); }, a.prototype.readFloatBE = function (a) { return this.intbits2float(this.readInt32BE(a)); }, a.prototype.readDoubleLE = function (a) { return this.longbits2double(this.readInt32LE(a + 4), this.readInt32LE(a)); }, a.prototype.readDoubleBE = function (a) { return this.longbits2double(this.readInt32BE(a), this.readInt32BE(a + 4)); }, a.prototype.copy = function (a, b) { throw new Error("BufferCore implementations should implement copy."); }, a.prototype.fill = function (a, b, c) { for (var d = b; c > d; d++)
                this.writeUInt8(d, a); }, a.prototype.float2intbits = function (a) { var b, c, d; return 0 === a ? 0 : a === Number.POSITIVE_INFINITY ? f : a === Number.NEGATIVE_INFINITY ? g : isNaN(a) ? h : (d = 0 > a ? 1 : 0, a = Math.abs(a), 1.1754942106924411e-38 >= a && a >= 1.401298464324817e-45 ? (b = 0, c = Math.round(a / Math.pow(2, -126) * Math.pow(2, 23)), d << 31 | b << 23 | c) : (b = Math.floor(Math.log(a) / Math.LN2), c = Math.round((a / Math.pow(2, b) - 1) * Math.pow(2, 23)), d << 31 | b + 127 << 23 | c)); }, a.prototype.double2longbits = function (a) { var b, c, d, e; return 0 === a ? [0, 0] : a === Number.POSITIVE_INFINITY ? [0, 2146435072] : a === Number.NEGATIVE_INFINITY ? [0, -1048576] : isNaN(a) ? [0, 2146959360] : (e = 0 > a ? 1 << 31 : 0, a = Math.abs(a), 2.225073858507201e-308 >= a && a >= 5e-324 ? (b = 0, d = a / Math.pow(2, -1022) * Math.pow(2, 52)) : (b = Math.floor(Math.log(a) / Math.LN2), a < Math.pow(2, b) && (b -= 1), d = (a / Math.pow(2, b) - 1) * Math.pow(2, 52), b = b + 1023 << 20), c = d * Math.pow(2, -32) | 0 | e | b, [65535 & d, c]); }, a.prototype.intbits2float = function (a) { if (a === f)
                return Number.POSITIVE_INFINITY; if (a === g)
                return Number.NEGATIVE_INFINITY; var b, c = (2147483648 & a) >>> 31, h = (2139095040 & a) >>> 23, i = 8388607 & a; return b = 0 === h ? Math.pow(-1, c) * i * Math.pow(2, -149) : Math.pow(-1, c) * (1 + i * Math.pow(2, -23)) * Math.pow(2, h - 127), (e > b || b > d) && (b = NaN), b; }, a.prototype.longbits2double = function (a, b) { var c = (2147483648 & a) >>> 31, d = (2146435072 & a) >>> 20, e = (1048575 & a) * Math.pow(2, 32) + b; return 0 === d && 0 === e ? 0 : 2047 === d ? 0 === e ? 1 === c ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY : NaN : 0 === d ? Math.pow(-1, c) * e * Math.pow(2, -1074) : Math.pow(-1, c) * (1 + e * Math.pow(2, -52)) * Math.pow(2, d - 1023); }, a; }(); c.BufferCoreCommon = i; }, {}], 18: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("./buffer_core"), f = [4294967040, 4294902015, 4278255615, 16777215], g = function (a) { function b(b) { a.call(this), this.length = b, this.buff = new Array(Math.ceil(b / 4)); for (var c = this.buff.length, d = 0; c > d; d++)
                this.buff[d] = 0; } return d(b, a), b.isAvailable = function () { return !0; }, b.prototype.getLength = function () { return this.length; }, b.prototype.writeUInt8 = function (a, b) { b &= 255; var c = a >> 2, d = 3 & a; this.buff[c] = this.buff[c] & f[d], this.buff[c] = this.buff[c] | b << (d << 3); }, b.prototype.readUInt8 = function (a) { var b = a >> 2, c = 3 & a; return this.buff[b] >> (c << 3) & 255; }, b.prototype.copy = function (a, c) { for (var d = new b(c - a), e = a; c > e; e++)
                d.writeUInt8(e - a, this.readUInt8(e)); return d; }, b; }(e.BufferCoreCommon); c.BufferCoreArray = g; }, { "./buffer_core": 17 }], 19: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("./buffer_core"), f = function (a) { function b(b) { a.call(this), "number" == typeof b ? this.buff = new DataView(new ArrayBuffer(b)) : b instanceof DataView ? this.buff = b : this.buff = new DataView(b), this.length = this.buff.byteLength; } return d(b, a), b.isAvailable = function () { return "undefined" != typeof DataView; }, b.prototype.getLength = function () { return this.length; }, b.prototype.writeInt8 = function (a, b) { this.buff.setInt8(a, b); }, b.prototype.writeInt16LE = function (a, b) { this.buff.setInt16(a, b, !0); }, b.prototype.writeInt16BE = function (a, b) { this.buff.setInt16(a, b, !1); }, b.prototype.writeInt32LE = function (a, b) { this.buff.setInt32(a, b, !0); }, b.prototype.writeInt32BE = function (a, b) { this.buff.setInt32(a, b, !1); }, b.prototype.writeUInt8 = function (a, b) { this.buff.setUint8(a, b); }, b.prototype.writeUInt16LE = function (a, b) { this.buff.setUint16(a, b, !0); }, b.prototype.writeUInt16BE = function (a, b) { this.buff.setUint16(a, b, !1); }, b.prototype.writeUInt32LE = function (a, b) { this.buff.setUint32(a, b, !0); }, b.prototype.writeUInt32BE = function (a, b) { this.buff.setUint32(a, b, !1); }, b.prototype.writeFloatLE = function (a, b) { this.buff.setFloat32(a, b, !0); }, b.prototype.writeFloatBE = function (a, b) { this.buff.setFloat32(a, b, !1); }, b.prototype.writeDoubleLE = function (a, b) { this.buff.setFloat64(a, b, !0); }, b.prototype.writeDoubleBE = function (a, b) { this.buff.setFloat64(a, b, !1); }, b.prototype.readInt8 = function (a) { return this.buff.getInt8(a); }, b.prototype.readInt16LE = function (a) { return this.buff.getInt16(a, !0); }, b.prototype.readInt16BE = function (a) { return this.buff.getInt16(a, !1); }, b.prototype.readInt32LE = function (a) { return this.buff.getInt32(a, !0); }, b.prototype.readInt32BE = function (a) { return this.buff.getInt32(a, !1); }, b.prototype.readUInt8 = function (a) { return this.buff.getUint8(a); }, b.prototype.readUInt16LE = function (a) { return this.buff.getUint16(a, !0); }, b.prototype.readUInt16BE = function (a) { return this.buff.getUint16(a, !1); }, b.prototype.readUInt32LE = function (a) { return this.buff.getUint32(a, !0); }, b.prototype.readUInt32BE = function (a) { return this.buff.getUint32(a, !1); }, b.prototype.readFloatLE = function (a) { return this.buff.getFloat32(a, !0); }, b.prototype.readFloatBE = function (a) { return this.buff.getFloat32(a, !1); }, b.prototype.readDoubleLE = function (a) { return this.buff.getFloat64(a, !0); }, b.prototype.readDoubleBE = function (a) { return this.buff.getFloat64(a, !1); }, b.prototype.copy = function (a, c) { var d, e = this.buff.buffer; if (ArrayBuffer.prototype.slice)
                d = e.slice(a, c);
            else {
                var f = c - a;
                d = new ArrayBuffer(f);
                var g = new Uint8Array(d), h = new Uint8Array(e);
                g.set(h.subarray(a, c));
            } return new b(d); }, b.prototype.fill = function (a, b, c) { a = 255 & a; var d, e = c - b, f = 4 * (e / 4 | 0), g = a << 24 | a << 16 | a << 8 | a; for (d = 0; f > d; d += 4)
                this.writeInt32LE(d + b, g); for (d = f; e > d; d++)
                this.writeUInt8(d + b, a); }, b.prototype.getDataView = function () { return this.buff; }, b; }(e.BufferCoreCommon); c.BufferCoreArrayBuffer = f; }, { "./buffer_core": 17 }], 20: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("./buffer_core"), f = function (a) { function b(c) { a.call(this), this.length = c, this.buff = b.getCanvasPixelArray(c); } return d(b, a), b.getCanvasPixelArray = function (a) { var c = b.imageDataFactory; return void 0 === c && (b.imageDataFactory = c = document.createElement("canvas").getContext("2d")), 0 === a && (a = 1), c.createImageData(Math.ceil(a / 4), 1).data; }, b.isAvailable = function () { return "undefined" != typeof CanvasPixelArray; }, b.prototype.getLength = function () { return this.length; }, b.prototype.writeUInt8 = function (a, b) { this.buff[a] = b; }, b.prototype.readUInt8 = function (a) { return this.buff[a]; }, b.prototype.copy = function (a, c) { for (var d = new b(c - a), e = a; c > e; e++)
                d.writeUInt8(e - a, this.buff[e]); return d; }, b; }(e.BufferCoreCommon); c.BufferCoreImageData = f; }, { "./buffer_core": 17 }], 21: [function (a, b, c) { var d = a("./api_error"), e = d.ApiError, f = d.ErrorCode, g = function () { function a() { } return a.prototype.sync = function (a) { a(new e(f.ENOTSUP)); }, a.prototype.syncSync = function () { throw new e(f.ENOTSUP); }, a.prototype.datasync = function (a) { this.sync(a); }, a.prototype.datasyncSync = function () { return this.syncSync(); }, a.prototype.chown = function (a, b, c) { c(new e(f.ENOTSUP)); }, a.prototype.chownSync = function (a, b) { throw new e(f.ENOTSUP); }, a.prototype.chmod = function (a, b) { b(new e(f.ENOTSUP)); }, a.prototype.chmodSync = function (a) { throw new e(f.ENOTSUP); }, a.prototype.utimes = function (a, b, c) { c(new e(f.ENOTSUP)); }, a.prototype.utimesSync = function (a, b) { throw new e(f.ENOTSUP); }, a; }(); c.BaseFile = g; }, { "./api_error": 14 }], 22: [function (a, b, c) { var d = a("./api_error"); !function (a) { a[a.NOP = 0] = "NOP", a[a.THROW_EXCEPTION = 1] = "THROW_EXCEPTION", a[a.TRUNCATE_FILE = 2] = "TRUNCATE_FILE", a[a.CREATE_FILE = 3] = "CREATE_FILE"; }(c.ActionType || (c.ActionType = {})); var e = c.ActionType, f = function () { function a(b) { if (this.flagStr = b, a.validFlagStrs.indexOf(b) < 0)
                throw new d.ApiError(d.ErrorCode.EINVAL, "Invalid flag: " + b); } return a.getFileFlag = function (b) { return a.flagCache.hasOwnProperty(b) ? a.flagCache[b] : a.flagCache[b] = new a(b); }, a.prototype.getFlagString = function () { return this.flagStr; }, a.prototype.isReadable = function () { return -1 !== this.flagStr.indexOf("r") || -1 !== this.flagStr.indexOf("+"); }, a.prototype.isWriteable = function () { return -1 !== this.flagStr.indexOf("w") || -1 !== this.flagStr.indexOf("a") || -1 !== this.flagStr.indexOf("+"); }, a.prototype.isTruncating = function () { return -1 !== this.flagStr.indexOf("w"); }, a.prototype.isAppendable = function () { return -1 !== this.flagStr.indexOf("a"); }, a.prototype.isSynchronous = function () { return -1 !== this.flagStr.indexOf("s"); }, a.prototype.isExclusive = function () { return -1 !== this.flagStr.indexOf("x"); }, a.prototype.pathExistsAction = function () { return this.isExclusive() ? e.THROW_EXCEPTION : this.isTruncating() ? e.TRUNCATE_FILE : e.NOP; }, a.prototype.pathNotExistsAction = function () { return (this.isWriteable() || this.isAppendable()) && "r+" !== this.flagStr ? e.CREATE_FILE : e.THROW_EXCEPTION; }, a.flagCache = {}, a.validFlagStrs = ["r", "r+", "rs", "rs+", "w", "wx", "w+", "wx+", "a", "ax", "a+", "ax+"], a; }(); c.FileFlag = f; }, { "./api_error": 14 }], 23: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("./api_error"), f = a("./file_flag"), g = a("./node_path"), h = a("./buffer"), i = e.ApiError, j = e.ErrorCode, k = h.Buffer, l = f.ActionType, m = function () { function a() { } return a.prototype.supportsLinks = function () { return !1; }, a.prototype.diskSpace = function (a, b) { b(0, 0); }, a.prototype.openFile = function (a, b, c) { throw new i(j.ENOTSUP); }, a.prototype.createFile = function (a, b, c, d) { throw new i(j.ENOTSUP); }, a.prototype.open = function (a, b, c, d) { var e = this, f = function (f, h) { if (f)
                switch (b.pathNotExistsAction()) {
                    case l.CREATE_FILE: return e.stat(g.dirname(a), !1, function (f, h) { f ? d(f) : h.isDirectory() ? e.createFile(a, b, c, d) : d(new i(j.ENOTDIR, g.dirname(a) + " is not a directory.")); });
                    case l.THROW_EXCEPTION: return d(new i(j.ENOENT, "" + a + " doesn't exist."));
                    default: return d(new i(j.EINVAL, "Invalid FileFlag object."));
                }
            else {
                if (h.isDirectory())
                    return d(new i(j.EISDIR, a + " is a directory."));
                switch (b.pathExistsAction()) {
                    case l.THROW_EXCEPTION: return d(new i(j.EEXIST, a + " already exists."));
                    case l.TRUNCATE_FILE: return e.openFile(a, b, function (a, b) { a ? d(a) : b.truncate(0, function () { b.sync(function () { d(null, b); }); }); });
                    case l.NOP: return e.openFile(a, b, d);
                    default: return d(new i(j.EINVAL, "Invalid FileFlag object."));
                }
            } }; this.stat(a, !1, f); }, a.prototype.rename = function (a, b, c) { c(new i(j.ENOTSUP)); }, a.prototype.renameSync = function (a, b) { throw new i(j.ENOTSUP); }, a.prototype.stat = function (a, b, c) { c(new i(j.ENOTSUP)); }, a.prototype.statSync = function (a, b) { throw new i(j.ENOTSUP); }, a.prototype.openFileSync = function (a, b) { throw new i(j.ENOTSUP); }, a.prototype.createFileSync = function (a, b, c) { throw new i(j.ENOTSUP); }, a.prototype.openSync = function (a, b, c) { var d; try {
                d = this.statSync(a, !1);
            }
            catch (e) {
                switch (b.pathNotExistsAction()) {
                    case l.CREATE_FILE:
                        var f = this.statSync(g.dirname(a), !1);
                        if (!f.isDirectory())
                            throw new i(j.ENOTDIR, g.dirname(a) + " is not a directory.");
                        return this.createFileSync(a, b, c);
                    case l.THROW_EXCEPTION: throw new i(j.ENOENT, "" + a + " doesn't exist.");
                    default: throw new i(j.EINVAL, "Invalid FileFlag object.");
                }
            } if (d.isDirectory())
                throw new i(j.EISDIR, a + " is a directory."); switch (b.pathExistsAction()) {
                case l.THROW_EXCEPTION: throw new i(j.EEXIST, a + " already exists.");
                case l.TRUNCATE_FILE: return this.unlinkSync(a), this.createFileSync(a, b, d.mode);
                case l.NOP: return this.openFileSync(a, b);
                default: throw new i(j.EINVAL, "Invalid FileFlag object.");
            } }, a.prototype.unlink = function (a, b) { b(new i(j.ENOTSUP)); }, a.prototype.unlinkSync = function (a) { throw new i(j.ENOTSUP); }, a.prototype.rmdir = function (a, b) { b(new i(j.ENOTSUP)); }, a.prototype.rmdirSync = function (a) { throw new i(j.ENOTSUP); }, a.prototype.mkdir = function (a, b, c) { c(new i(j.ENOTSUP)); }, a.prototype.mkdirSync = function (a, b) { throw new i(j.ENOTSUP); }, a.prototype.readdir = function (a, b) { b(new i(j.ENOTSUP)); }, a.prototype.readdirSync = function (a) { throw new i(j.ENOTSUP); }, a.prototype.exists = function (a, b) { this.stat(a, null, function (a) { b(null == a); }); }, a.prototype.existsSync = function (a) { try {
                return this.statSync(a, !0), !0;
            }
            catch (b) {
                return !1;
            } }, a.prototype.realpath = function (a, b, c) { if (this.supportsLinks())
                for (var d = a.split(g.sep), e = 0; e < d.length; e++) {
                    var f = d.slice(0, e + 1);
                    d[e] = g.join.apply(null, f);
                }
            else
                this.exists(a, function (b) { b ? c(null, a) : c(new i(j.ENOENT, "File " + a + " not found.")); }); }, a.prototype.realpathSync = function (a, b) { if (!this.supportsLinks()) {
                if (this.existsSync(a))
                    return a;
                throw new i(j.ENOENT, "File " + a + " not found.");
            } for (var c = a.split(g.sep), d = 0; d < c.length; d++) {
                var e = c.slice(0, d + 1);
                c[d] = g.join.apply(null, e);
            } }, a.prototype.truncate = function (a, b, c) { this.open(a, f.FileFlag.getFileFlag("r+"), 420, function (a, d) { return a ? c(a) : void d.truncate(b, function (a) { d.close(function (b) { c(a || b); }); }); }); }, a.prototype.truncateSync = function (a, b) { var c = this.openSync(a, f.FileFlag.getFileFlag("r+"), 420); try {
                c.truncateSync(b);
            }
            catch (d) {
                throw d;
            }
            finally {
                c.closeSync();
            } }, a.prototype.readFile = function (a, b, c, d) { var e = d; this.open(a, c, 420, function (a, c) { return a ? d(a) : (d = function (a, b) { c.close(function (c) { return null == a && (a = c), e(a, b); }); }, void c.stat(function (a, e) { if (null != a)
                return d(a); var f = new k(e.size); c.read(f, 0, e.size, 0, function (a) { if (null != a)
                return d(a); if (null === b)
                return d(a, f); try {
                d(null, f.toString(b));
            }
            catch (c) {
                d(c);
            } }); })); }); }, a.prototype.readFileSync = function (a, b, c) { var d = this.openSync(a, c, 420); try {
                var e = d.statSync(), f = new k(e.size);
                return d.readSync(f, 0, e.size, 0), d.closeSync(), null === b ? f : f.toString(b);
            }
            finally {
                d.closeSync();
            } }, a.prototype.writeFile = function (a, b, c, d, e, f) { var g = f; this.open(a, d, 420, function (a, d) { if (null != a)
                return f(a); f = function (a) { d.close(function (b) { g(null != a ? a : b); }); }; try {
                "string" == typeof b && (b = new k(b, c));
            }
            catch (e) {
                return f(e);
            } d.write(b, 0, b.length, 0, f); }); }, a.prototype.writeFileSync = function (a, b, c, d, e) { var f = this.openSync(a, d, e); try {
                "string" == typeof b && (b = new k(b, c)), f.writeSync(b, 0, b.length, 0);
            }
            finally {
                f.closeSync();
            } }, a.prototype.appendFile = function (a, b, c, d, e, f) { var g = f; this.open(a, d, e, function (a, d) { return null != a ? f(a) : (f = function (a) { d.close(function (b) { g(null != a ? a : b); }); }, "string" == typeof b && (b = new k(b, c)), void d.write(b, 0, b.length, null, f)); }); }, a.prototype.appendFileSync = function (a, b, c, d, e) { var f = this.openSync(a, d, e); try {
                "string" == typeof b && (b = new k(b, c)), f.writeSync(b, 0, b.length, null);
            }
            finally {
                f.closeSync();
            } }, a.prototype.chmod = function (a, b, c, d) { d(new i(j.ENOTSUP)); }, a.prototype.chmodSync = function (a, b, c) { throw new i(j.ENOTSUP); }, a.prototype.chown = function (a, b, c, d, e) { e(new i(j.ENOTSUP)); }, a.prototype.chownSync = function (a, b, c, d) { throw new i(j.ENOTSUP); }, a.prototype.utimes = function (a, b, c, d) { d(new i(j.ENOTSUP)); }, a.prototype.utimesSync = function (a, b, c) { throw new i(j.ENOTSUP); }, a.prototype.link = function (a, b, c) { c(new i(j.ENOTSUP)); }, a.prototype.linkSync = function (a, b) { throw new i(j.ENOTSUP); }, a.prototype.symlink = function (a, b, c, d) { d(new i(j.ENOTSUP)); }, a.prototype.symlinkSync = function (a, b, c) { throw new i(j.ENOTSUP); }, a.prototype.readlink = function (a, b) { b(new i(j.ENOTSUP)); }, a.prototype.readlinkSync = function (a) { throw new i(j.ENOTSUP); }, a; }(); c.BaseFileSystem = m; var n = function (a) { function b() { a.apply(this, arguments); } return d(b, a), b.prototype.supportsSynch = function () { return !0; }, b.prototype.rename = function (a, b, c) { try {
                this.renameSync(a, b), c();
            }
            catch (d) {
                c(d);
            } }, b.prototype.stat = function (a, b, c) { try {
                c(null, this.statSync(a, b));
            }
            catch (d) {
                c(d);
            } }, b.prototype.open = function (a, b, c, d) { try {
                d(null, this.openSync(a, b, c));
            }
            catch (e) {
                d(e);
            } }, b.prototype.unlink = function (a, b) { try {
                this.unlinkSync(a), b();
            }
            catch (c) {
                b(c);
            } }, b.prototype.rmdir = function (a, b) { try {
                this.rmdirSync(a), b();
            }
            catch (c) {
                b(c);
            } }, b.prototype.mkdir = function (a, b, c) { try {
                this.mkdirSync(a, b), c();
            }
            catch (d) {
                c(d);
            } }, b.prototype.readdir = function (a, b) { try {
                b(null, this.readdirSync(a));
            }
            catch (c) {
                b(c);
            } }, b.prototype.chmod = function (a, b, c, d) { try {
                this.chmodSync(a, b, c), d();
            }
            catch (e) {
                d(e);
            } }, b.prototype.chown = function (a, b, c, d, e) { try {
                this.chownSync(a, b, c, d), e();
            }
            catch (f) {
                e(f);
            } }, b.prototype.utimes = function (a, b, c, d) { try {
                this.utimesSync(a, b, c), d();
            }
            catch (e) {
                d(e);
            } }, b.prototype.link = function (a, b, c) { try {
                this.linkSync(a, b), c();
            }
            catch (d) {
                c(d);
            } }, b.prototype.symlink = function (a, b, c, d) { try {
                this.symlinkSync(a, b, c), d();
            }
            catch (e) {
                d(e);
            } }, b.prototype.readlink = function (a, b) { try {
                b(null, this.readlinkSync(a));
            }
            catch (c) {
                b(c);
            } }, b; }(m); c.SynchronousFileSystem = n; }, { "./api_error": 14, "./buffer": 16, "./file_flag": 22, "./node_path": 28 }], 24: [function (a, b, c) { var d; d = "undefined" != typeof window ? window : "undefined" != typeof self ? self : global, b.exports = d; }, {}], 25: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("./buffer"), f = a("./api_error"), g = e.Buffer, h = f.ApiError, i = f.ErrorCode, j = function () { function a(a, b, c) { this.data = a, this.encoding = b, this.cb = c, this.size = "string" != typeof a ? a.length : g.byteLength(a, null != b ? b : void 0), "string" != typeof this.data && (this.data = this.data.sliceCopy()); } return a.prototype.getData = function (a) { return null == a ? "string" == typeof this.data ? new g(this.data, null != this.encoding ? this.encoding : void 0) : this.data : "string" == typeof this.data ? a === this.encoding ? this.data : new g(this.data, null != this.encoding ? this.encoding : void 0).toString(a) : this.data.toString(a); }, a; }(), k = function () { function a() { this._listeners = {}, this.maxListeners = 10; } return a.prototype.addListener = function (a, b) { return "undefined" == typeof this._listeners[a] && (this._listeners[a] = []), this._listeners[a].push(b) > this.maxListeners && process.stdout.write("Warning: Event " + a + " has more than " + this.maxListeners + " listeners.\n"), this.emit("newListener", a, b), this; }, a.prototype.on = function (a, b) { return this.addListener(a, b); }, a.prototype.once = function (a, b) { var c = !1, d = function () { this.removeListener(a, d), c || (c = !0, b.apply(this, arguments)); }; return this.addListener(a, d); }, a.prototype._emitRemoveListener = function (a, b) { var c; if (this._listeners.removeListener && this._listeners.removeListener.length > 0)
                for (c = 0; c < b.length; c++)
                    this.emit("removeListener", a, b[c]); }, a.prototype.removeListener = function (a, b) { var c = this._listeners[a]; if ("undefined" != typeof c) {
                var d = c.indexOf(b);
                d > -1 && c.splice(d, 1);
            } return this.emit("removeListener", a, b), this; }, a.prototype.removeAllListeners = function (a) { var b, c, d; if ("undefined" != typeof a)
                b = this._listeners[a], this._listeners[a] = [], this._emitRemoveListener(a, b);
            else
                for (c = Object.keys(this._listeners), d = 0; d < c.length; d++)
                    this.removeAllListeners(c[d]); return this; }, a.prototype.setMaxListeners = function (a) { this.maxListeners = a; }, a.prototype.listeners = function (a) { return "undefined" == typeof this._listeners[a] && (this._listeners[a] = []), this._listeners[a].slice(0); }, a.prototype.emit = function (a) { for (var b = [], c = 1; c < arguments.length; c++)
                b[c - 1] = arguments[c]; var d = this._listeners[a], e = !1; if ("undefined" != typeof d) {
                var f;
                for (f = 0; f < d.length; f++)
                    e = !0, d[f].apply(this, b);
            } return e; }, a; }(); c.AbstractEventEmitter = k; var l = function (a) { function b(b, c) { a.call(this), this.writable = b, this.readable = c, this.encoding = null, this.flowing = !1, this.buffer = [], this.endEvent = null, this.ended = !1, this.drained = !0; } return d(b, a), b.prototype.addListener = function (b, c) { var d = a.prototype.addListener.call(this, b, c), e = this; return "data" !== b || this.flowing ? "readable" === b && this.buffer.length > 0 && setTimeout(function () { e.emit("readable"); }, 0) : this.resume(), d; }, b.prototype._processArgs = function (a, b, c) { return "string" == typeof b ? new j(a, b, c) : new j(a, null, b); }, b.prototype._processEvents = function () { var a = 0 === this.buffer.length; this.drained !== a && this.drained && this.emit("readable"), this.flowing && 0 !== this.buffer.length && this.emit("data", this.read()), this.drained = 0 === this.buffer.length; }, b.prototype.emitEvent = function (a, b) { this.emit(a, b.getData(this.encoding)), b.cb && b.cb(); }, b.prototype.write = function (a, b, c) { if (this.ended)
                throw new h(i.EPERM, "Cannot write to an ended stream."); var d = this._processArgs(a, b, c); return this._push(d), this.flowing; }, b.prototype.end = function (a, b, c) { if (this.ended)
                throw new h(i.EPERM, "Stream is already closed."); var d = this._processArgs(a, b, c); this.ended = !0, this.endEvent = d, this._processEvents(); }, b.prototype.read = function (a) { var b, c, d, e, f = [], h = [], i = 0, k = 0, l = "number" != typeof a; for (l && (a = 4294967295), k = 0; k < this.buffer.length && a > i; k++)
                c = this.buffer[k], f.push(c.getData()), c.cb && h.push(c.cb), i += c.size, b = c.cb; if (!l && a > i)
                return null; if (this.buffer = this.buffer.slice(f.length), e = i > a ? a : i, d = g.concat(f), i > a && (b && h.pop(), this._push(new j(d.slice(a), null, b))), h.length > 0 && setTimeout(function () { var a; for (a = 0; a < h.length; a++)
                h[a](); }, 0), this.ended && 0 === this.buffer.length && null !== this.endEvent) {
                var m = this.endEvent, n = this;
                this.endEvent = null, setTimeout(function () { n.emitEvent("end", m); }, 0);
            } return 0 === f.length ? (this.emit("_read"), null) : null === this.encoding ? d.slice(0, e) : d.toString(this.encoding, 0, e); }, b.prototype.setEncoding = function (a) { this.encoding = a; }, b.prototype.pause = function () { this.flowing = !1; }, b.prototype.resume = function () { this.flowing = !0, this._processEvents(); }, b.prototype.pipe = function (a, b) { throw new h(i.EPERM, "Unimplemented."); }, b.prototype.unpipe = function (a) { }, b.prototype.unshift = function (a) { if (this.ended)
                throw new h(i.EPERM, "Stream has ended."); this.buffer.unshift(new j(a, this.encoding)), this._processEvents(); }, b.prototype._push = function (a) { this.buffer.push(a), this._processEvents(); }, b.prototype.wrap = function (a) { throw new h(i.EPERM, "Unimplemented."); }, b; }(k); c.AbstractDuplexStream = l; }, { "./api_error": 14, "./buffer": 16 }], 26: [function (a, b, c) {
                function d(a, b) { if ("function" != typeof a)
                    throw new n(o.EINVAL, "Callback must be a function."); switch ("undefined" == typeof __numWaiting && (__numWaiting = 0), __numWaiting++, b) {
                    case 1: return function (b) { setImmediate(function () { return __numWaiting--, a(b); }); };
                    case 2: return function (b, c) { setImmediate(function () { return __numWaiting--, a(b, c); }); };
                    case 3: return function (b, c, d) { setImmediate(function () { return __numWaiting--, a(b, c, d); }); };
                    default: throw new Error("Invalid invocation of wrapCb.");
                } }
                function e(a) { if ("function" != typeof a.write)
                    throw new n(o.EBADF, "Invalid file descriptor."); }
                function f(a, b) { switch (typeof a) {
                    case "number": return a;
                    case "string":
                        var c = parseInt(a, 8);
                        if (NaN !== c)
                            return c;
                    default: return b;
                } }
                function g(a) { if (a.indexOf("\x00") >= 0)
                    throw new n(o.EINVAL, "Path must be a string without null bytes."); if ("" === a)
                    throw new n(o.EINVAL, "Path must not be empty."); return m.resolve(a); }
                function h(a, b, c, d) { switch (typeof a) {
                    case "object": return { encoding: "undefined" != typeof a.encoding ? a.encoding : b, flag: "undefined" != typeof a.flag ? a.flag : c, mode: f(a.mode, d) };
                    case "string": return { encoding: a, flag: c, mode: d };
                    default: return { encoding: b, flag: c, mode: d };
                } }
                function i() { }
                var j = a("./api_error"), k = a("./file_flag"), l = a("./buffer"), m = a("./node_path"), n = j.ApiError, o = j.ErrorCode, p = k.FileFlag, q = l.Buffer, r = function () {
                    function a() { }
                    return a._initialize = function (b) { if (!b.constructor.isAvailable())
                        throw new n(o.EINVAL, "Tried to instantiate BrowserFS with an unavailable file system."); return a.root = b; }, a._toUnixTimestamp = function (a) { if ("number" == typeof a)
                        return a; if (a instanceof Date)
                        return a.getTime() / 1e3; throw new Error("Cannot parse time: " + a); }, a.getRootFS = function () { return a.root ? a.root : null; }, a.rename = function (b, c, e) { void 0 === e && (e = i); var f = d(e, 1); try {
                        a.root.rename(g(b), g(c), f);
                    }
                    catch (h) {
                        f(h);
                    } }, a.renameSync = function (b, c) { a.root.renameSync(g(b), g(c)); }, a.exists = function (b, c) { void 0 === c && (c = i); var e = d(c, 1); try {
                        return a.root.exists(g(b), e);
                    }
                    catch (f) {
                        return e(!1);
                    } }, a.existsSync = function (b) { try {
                        return a.root.existsSync(g(b));
                    }
                    catch (c) {
                        return !1;
                    } }, a.stat = function (b, c) { void 0 === c && (c = i); var e = d(c, 2); try {
                        return a.root.stat(g(b), !1, e);
                    }
                    catch (f) {
                        return e(f, null);
                    } }, a.statSync = function (b) { return a.root.statSync(g(b), !1); }, a.lstat = function (b, c) { void 0 === c && (c = i); var e = d(c, 2); try {
                        return a.root.stat(g(b), !0, e);
                    }
                    catch (f) {
                        return e(f, null);
                    } }, a.lstatSync = function (b) { return a.root.statSync(g(b), !0); }, a.truncate = function (b, c, e) { void 0 === c && (c = 0), void 0 === e && (e = i); var f = 0; "function" == typeof c ? e = c : "number" == typeof c && (f = c); var h = d(e, 1); try {
                        if (0 > f)
                            throw new n(o.EINVAL);
                        return a.root.truncate(g(b), f, h);
                    }
                    catch (j) {
                        return h(j);
                    } }, a.truncateSync = function (b, c) { if (void 0 === c && (c = 0), 0 > c)
                        throw new n(o.EINVAL); return a.root.truncateSync(g(b), c); }, a.unlink = function (b, c) { void 0 === c && (c = i); var e = d(c, 1); try {
                        return a.root.unlink(g(b), e);
                    }
                    catch (f) {
                        return e(f);
                    } }, a.unlinkSync = function (b) { return a.root.unlinkSync(g(b)); }, a.open = function (b, c, e, h) { void 0 === h && (h = i); var j = f(e, 420); h = "function" == typeof e ? e : h; var k = d(h, 2); try {
                        return a.root.open(g(b), p.getFileFlag(c), j, k);
                    }
                    catch (l) {
                        return k(l, null);
                    } }, a.openSync = function (b, c, d) { return void 0 === d && (d = 420), a.root.openSync(g(b), p.getFileFlag(c), d); }, a.readFile = function (b, c, e) { void 0 === c && (c = {}), void 0 === e && (e = i); var f = h(c, null, "r", null); e = "function" == typeof c ? c : e; var j = d(e, 2); try {
                        var k = p.getFileFlag(f.flag);
                        return k.isReadable() ? a.root.readFile(g(b), f.encoding, k, j) : j(new n(o.EINVAL, "Flag passed to readFile must allow for reading."));
                    }
                    catch (l) {
                        return j(l, null);
                    } }, a.readFileSync = function (b, c) { void 0 === c && (c = {}); var d = h(c, null, "r", null), e = p.getFileFlag(d.flag); if (!e.isReadable())
                        throw new n(o.EINVAL, "Flag passed to readFile must allow for reading."); return a.root.readFileSync(g(b), d.encoding, e); }, a.writeFile = function (b, c, e, f) { void 0 === e && (e = {}), void 0 === f && (f = i); var j = h(e, "utf8", "w", 420); f = "function" == typeof e ? e : f; var k = d(f, 1); try {
                        var l = p.getFileFlag(j.flag);
                        return l.isWriteable() ? a.root.writeFile(g(b), c, j.encoding, l, j.mode, k) : k(new n(o.EINVAL, "Flag passed to writeFile must allow for writing."));
                    }
                    catch (m) {
                        return k(m);
                    } }, a.writeFileSync = function (b, c, d) { var e = h(d, "utf8", "w", 420), f = p.getFileFlag(e.flag); if (!f.isWriteable())
                        throw new n(o.EINVAL, "Flag passed to writeFile must allow for writing."); return a.root.writeFileSync(g(b), c, e.encoding, f, e.mode); }, a.appendFile = function (b, c, e, f) { void 0 === f && (f = i); var j = h(e, "utf8", "a", 420); f = "function" == typeof e ? e : f; var k = d(f, 1); try {
                        var l = p.getFileFlag(j.flag);
                        if (!l.isAppendable())
                            return k(new n(o.EINVAL, "Flag passed to appendFile must allow for appending."));
                        a.root.appendFile(g(b), c, j.encoding, l, j.mode, k);
                    }
                    catch (m) {
                        k(m);
                    } }, a.appendFileSync = function (b, c, d) { var e = h(d, "utf8", "a", 420), f = p.getFileFlag(e.flag); if (!f.isAppendable())
                        throw new n(o.EINVAL, "Flag passed to appendFile must allow for appending."); return a.root.appendFileSync(g(b), c, e.encoding, f, e.mode); }, a.fstat = function (a, b) { void 0 === b && (b = i); var c = d(b, 2); try {
                        e(a), a.stat(c);
                    }
                    catch (f) {
                        c(f);
                    } }, a.fstatSync = function (a) { return e(a), a.statSync(); }, a.close = function (a, b) { void 0 === b && (b = i); var c = d(b, 1); try {
                        e(a), a.close(c);
                    }
                    catch (f) {
                        c(f);
                    } }, a.closeSync = function (a) { return e(a), a.closeSync(); }, a.ftruncate = function (a, b, c) { void 0 === c && (c = i); var f = "number" == typeof b ? b : 0; c = "function" == typeof b ? b : c; var g = d(c, 1); try {
                        if (e(a), 0 > f)
                            throw new n(o.EINVAL);
                        a.truncate(f, g);
                    }
                    catch (h) {
                        g(h);
                    } }, a.ftruncateSync = function (a, b) { return void 0 === b && (b = 0), e(a), a.truncateSync(b); }, a.fsync = function (a, b) { void 0 === b && (b = i); var c = d(b, 1); try {
                        e(a), a.sync(c);
                    }
                    catch (f) {
                        c(f);
                    } }, a.fsyncSync = function (a) { return e(a), a.syncSync(); }, a.fdatasync = function (a, b) { void 0 === b && (b = i); var c = d(b, 1); try {
                        e(a), a.datasync(c);
                    }
                    catch (f) {
                        c(f);
                    } }, a.fdatasyncSync = function (a) { e(a), a.datasyncSync(); }, a.write = function (a, b, c, f, g, h) {
                        void 0 === h && (h = i);
                        var j, k, l, m = null;
                        if ("string" == typeof b) {
                            var p = "utf8";
                            switch (typeof c) {
                                case "function":
                                    h = c;
                                    break;
                                case "number":
                                    m = c,
                                        p = "string" == typeof f ? f : "utf8", h = "function" == typeof g ? g : h;
                                    break;
                                default: return (h = "function" == typeof f ? f : "function" == typeof g ? g : h)(new n(o.EINVAL, "Invalid arguments."));
                            }
                            j = new q(b, p), k = 0, l = j.length;
                        }
                        else
                            j = b, k = c, l = f, m = "number" == typeof g ? g : null, h = "function" == typeof g ? g : h;
                        var r = d(h, 3);
                        try {
                            e(a), null == m && (m = a.getPos()), a.write(j, k, l, m, r);
                        }
                        catch (s) {
                            r(s);
                        }
                    }, a.writeSync = function (a, b, c, d, f) { var g, h, i, j = 0; if ("string" == typeof b) {
                        i = "number" == typeof c ? c : null;
                        var k = "string" == typeof d ? d : "utf8";
                        j = 0, g = new q(b, k), h = g.length;
                    }
                    else
                        g = b, j = c, h = d, i = "number" == typeof f ? f : null; return e(a), null == i && (i = a.getPos()), a.writeSync(g, j, h, i); }, a.read = function (a, b, c, f, g, h) { void 0 === h && (h = i); var j, k, l, m, n; if ("number" == typeof b) {
                        l = b, j = c;
                        var o = f;
                        h = "function" == typeof g ? g : h, k = 0, m = new q(l), n = d(function (a, b, c) { return a ? h(a) : void h(a, c.toString(o), b); }, 3);
                    }
                    else
                        m = b, k = c, l = f, j = g, n = d(h, 3); try {
                        e(a), null == j && (j = a.getPos()), a.read(m, k, l, j, n);
                    }
                    catch (p) {
                        n(p);
                    } }, a.readSync = function (a, b, c, d, f) { var g, h, i, j, k = !1; if ("number" == typeof b) {
                        i = b, j = c;
                        var l = d;
                        h = 0, g = new q(i), k = !0;
                    }
                    else
                        g = b, h = c, i = d, j = f; e(a), null == j && (j = a.getPos()); var m = a.readSync(g, h, i, j); return k ? [g.toString(l), m] : m; }, a.fchown = function (a, b, c, f) { void 0 === f && (f = i); var g = d(f, 1); try {
                        e(a), a.chown(b, c, g);
                    }
                    catch (h) {
                        g(h);
                    } }, a.fchownSync = function (a, b, c) { return e(a), a.chownSync(b, c); }, a.fchmod = function (a, b, c) { void 0 === c && (c = i); var f = d(c, 1); try {
                        b = "string" == typeof b ? parseInt(b, 8) : b, e(a), a.chmod(b, f);
                    }
                    catch (g) {
                        f(g);
                    } }, a.fchmodSync = function (a, b) { return b = "string" == typeof b ? parseInt(b, 8) : b, e(a), a.chmodSync(b); }, a.futimes = function (a, b, c, f) { void 0 === f && (f = i); var g = d(f, 1); try {
                        e(a), "number" == typeof b && (b = new Date(1e3 * b)), "number" == typeof c && (c = new Date(1e3 * c)), a.utimes(b, c, g);
                    }
                    catch (h) {
                        g(h);
                    } }, a.futimesSync = function (a, b, c) { return e(a), "number" == typeof b && (b = new Date(1e3 * b)), "number" == typeof c && (c = new Date(1e3 * c)), a.utimesSync(b, c); }, a.rmdir = function (b, c) { void 0 === c && (c = i); var e = d(c, 1); try {
                        b = g(b), a.root.rmdir(b, e);
                    }
                    catch (f) {
                        e(f);
                    } }, a.rmdirSync = function (b) { return b = g(b), a.root.rmdirSync(b); }, a.mkdir = function (b, c, e) { void 0 === e && (e = i), "function" == typeof c && (e = c, c = 511); var f = d(e, 1); try {
                        b = g(b), a.root.mkdir(b, c, f);
                    }
                    catch (h) {
                        f(h);
                    } }, a.mkdirSync = function (b, c) { return void 0 === c && (c = 511), c = "string" == typeof c ? parseInt(c, 8) : c, b = g(b), a.root.mkdirSync(b, c); }, a.readdir = function (b, c) { void 0 === c && (c = i); var e = d(c, 2); try {
                        b = g(b), a.root.readdir(b, e);
                    }
                    catch (f) {
                        e(f);
                    } }, a.readdirSync = function (b) { return b = g(b), a.root.readdirSync(b); }, a.link = function (b, c, e) { void 0 === e && (e = i); var f = d(e, 1); try {
                        b = g(b), c = g(c), a.root.link(b, c, f);
                    }
                    catch (h) {
                        f(h);
                    } }, a.linkSync = function (b, c) { return b = g(b), c = g(c), a.root.linkSync(b, c); }, a.symlink = function (b, c, e, f) { void 0 === f && (f = i); var h = "string" == typeof e ? e : "file"; f = "function" == typeof e ? e : f; var j = d(f, 1); try {
                        if ("file" !== h && "dir" !== h)
                            return j(new n(o.EINVAL, "Invalid type: " + h));
                        b = g(b), c = g(c), a.root.symlink(b, c, h, j);
                    }
                    catch (k) {
                        j(k);
                    } }, a.symlinkSync = function (b, c, d) { if (null == d)
                        d = "file";
                    else if ("file" !== d && "dir" !== d)
                        throw new n(o.EINVAL, "Invalid type: " + d); return b = g(b), c = g(c), a.root.symlinkSync(b, c, d); }, a.readlink = function (b, c) { void 0 === c && (c = i); var e = d(c, 2); try {
                        b = g(b), a.root.readlink(b, e);
                    }
                    catch (f) {
                        e(f);
                    } }, a.readlinkSync = function (b) { return b = g(b), a.root.readlinkSync(b); }, a.chown = function (b, c, e, f) { void 0 === f && (f = i); var h = d(f, 1); try {
                        b = g(b), a.root.chown(b, !1, c, e, h);
                    }
                    catch (j) {
                        h(j);
                    } }, a.chownSync = function (b, c, d) { b = g(b), a.root.chownSync(b, !1, c, d); }, a.lchown = function (b, c, e, f) { void 0 === f && (f = i); var h = d(f, 1); try {
                        b = g(b), a.root.chown(b, !0, c, e, h);
                    }
                    catch (j) {
                        h(j);
                    } }, a.lchownSync = function (b, c, d) { return b = g(b), a.root.chownSync(b, !0, c, d); }, a.chmod = function (b, c, e) { void 0 === e && (e = i); var f = d(e, 1); try {
                        c = "string" == typeof c ? parseInt(c, 8) : c, b = g(b), a.root.chmod(b, !1, c, f);
                    }
                    catch (h) {
                        f(h);
                    } }, a.chmodSync = function (b, c) { return c = "string" == typeof c ? parseInt(c, 8) : c, b = g(b), a.root.chmodSync(b, !1, c); }, a.lchmod = function (b, c, e) { void 0 === e && (e = i); var f = d(e, 1); try {
                        c = "string" == typeof c ? parseInt(c, 8) : c, b = g(b), a.root.chmod(b, !0, c, f);
                    }
                    catch (h) {
                        f(h);
                    } }, a.lchmodSync = function (b, c) { return b = g(b), c = "string" == typeof c ? parseInt(c, 8) : c, a.root.chmodSync(b, !0, c); }, a.utimes = function (b, c, e, f) { void 0 === f && (f = i); var h = d(f, 1); try {
                        b = g(b), "number" == typeof c && (c = new Date(1e3 * c)), "number" == typeof e && (e = new Date(1e3 * e)), a.root.utimes(b, c, e, h);
                    }
                    catch (j) {
                        h(j);
                    } }, a.utimesSync = function (b, c, d) { return b = g(b), "number" == typeof c && (c = new Date(1e3 * c)), "number" == typeof d && (d = new Date(1e3 * d)), a.root.utimesSync(b, c, d); }, a.realpath = function (b, c, e) { void 0 === e && (e = i); var f = "object" == typeof c ? c : {}; e = "function" == typeof c ? c : i; var h = d(e, 2); try {
                        b = g(b), a.root.realpath(b, f, h);
                    }
                    catch (j) {
                        h(j);
                    } }, a.realpathSync = function (b, c) { return void 0 === c && (c = {}), b = g(b), a.root.realpathSync(b, c); }, a.root = null, a;
                }();
                b.exports = r;
            }, { "./api_error": 14, "./buffer": 16, "./file_flag": 22, "./node_path": 28 }], 27: [function (a, b, c) { var d = a("./buffer"), e = d.Buffer; !function (a) { a[a.FILE = 32768] = "FILE", a[a.DIRECTORY = 16384] = "DIRECTORY", a[a.SYMLINK = 40960] = "SYMLINK"; }(c.FileType || (c.FileType = {})); var f = c.FileType, g = function () { function a(a, b, c, d, e, g) { if (void 0 === d && (d = new Date), void 0 === e && (e = new Date), void 0 === g && (g = new Date), this.size = b, this.mode = c, this.atime = d, this.mtime = e, this.ctime = g, this.dev = 0, this.ino = 0, this.rdev = 0, this.nlink = 1, this.blksize = 4096, this.uid = 0, this.gid = 0, null == this.mode)
                switch (a) {
                    case f.FILE:
                        this.mode = 420;
                        break;
                    case f.DIRECTORY:
                    default: this.mode = 511;
                } this.blocks = Math.ceil(b / 512), this.mode < 4096 && (this.mode |= a); } return a.prototype.toBuffer = function () { var a = new e(32); return a.writeUInt32LE(this.size, 0), a.writeUInt32LE(this.mode, 4), a.writeDoubleLE(this.atime.getTime(), 8), a.writeDoubleLE(this.mtime.getTime(), 16), a.writeDoubleLE(this.ctime.getTime(), 24), a; }, a.fromBuffer = function (b) { var c = b.readUInt32LE(0), d = b.readUInt32LE(4), e = b.readDoubleLE(8), f = b.readDoubleLE(16), g = b.readDoubleLE(24); return new a(61440 & d, c, 4095 & d, new Date(e), new Date(f), new Date(g)); }, a.prototype.clone = function () { return new a(61440 & this.mode, this.size, 4095 & this.mode, this.atime, this.mtime, this.ctime); }, a.prototype.isFile = function () { return (61440 & this.mode) === f.FILE; }, a.prototype.isDirectory = function () { return (61440 & this.mode) === f.DIRECTORY; }, a.prototype.isSymbolicLink = function () { return (61440 & this.mode) === f.SYMLINK; }, a.prototype.chmod = function (a) { this.mode = 61440 & this.mode | a; }, a.prototype.isSocket = function () { return !1; }, a.prototype.isBlockDevice = function () { return !1; }, a.prototype.isCharacterDevice = function () { return !1; }, a.prototype.isFIFO = function () { return !1; }, a; }(); c.Stats = g; }, { "./buffer": 16 }], 28: [function (a, b, c) { var d = a("./node_process"), e = d.process, f = function () { function a() { } return a.normalize = function (b) { "" === b && (b = "."); var c = b.charAt(0) === a.sep; b = a._removeDuplicateSeps(b); for (var d = b.split(a.sep), e = [], f = 0; f < d.length; f++) {
                var g = d[f];
                "." !== g && (".." === g && (c || !c && e.length > 0 && ".." !== e[0]) ? e.pop() : e.push(g));
            } if (!c && e.length < 2)
                switch (e.length) {
                    case 1:
                        "" === e[0] && e.unshift(".");
                        break;
                    default: e.push(".");
                } return b = e.join(a.sep), c && b.charAt(0) !== a.sep && (b = a.sep + b), b; }, a.join = function () { for (var b = [], c = 0; c < arguments.length; c++)
                b[c - 0] = arguments[c]; for (var d = [], e = 0; e < b.length; e++) {
                var f = b[e];
                if ("string" != typeof f)
                    throw new TypeError("Invalid argument type to path.join: " + typeof f);
                "" !== f && d.push(f);
            } return a.normalize(d.join(a.sep)); }, a.resolve = function () { for (var b = [], c = 0; c < arguments.length; c++)
                b[c - 0] = arguments[c]; for (var d = [], f = 0; f < b.length; f++) {
                var g = b[f];
                if ("string" != typeof g)
                    throw new TypeError("Invalid argument type to path.join: " + typeof g);
                "" !== g && (g.charAt(0) === a.sep && (d = []), d.push(g));
            } var h = a.normalize(d.join(a.sep)); if (h.length > 1 && h.charAt(h.length - 1) === a.sep)
                return h.substr(0, h.length - 1); if (h.charAt(0) !== a.sep) {
                "." !== h.charAt(0) || 1 !== h.length && h.charAt(1) !== a.sep || (h = 1 === h.length ? "" : h.substr(2));
                var i = e.cwd();
                h = "" !== h ? this.normalize(i + ("/" !== i ? a.sep : "") + h) : i;
            } return h; }, a.relative = function (b, c) { var d; b = a.resolve(b), c = a.resolve(c); var e = b.split(a.sep), f = c.split(a.sep); f.shift(), e.shift(); var g = 0, h = []; for (d = 0; d < e.length; d++) {
                var i = e[d];
                if (i !== f[d]) {
                    g = e.length - d;
                    break;
                }
            } h = f.slice(d), 1 === e.length && "" === e[0] && (g = 0), g > e.length && (g = e.length); var j = ""; for (d = 0; g > d; d++)
                j += "../"; return j += h.join(a.sep), j.length > 1 && j.charAt(j.length - 1) === a.sep && (j = j.substr(0, j.length - 1)), j; }, a.dirname = function (b) { b = a._removeDuplicateSeps(b); var c = b.charAt(0) === a.sep, d = b.split(a.sep); return "" === d.pop() && d.length > 0 && d.pop(), d.length > 1 || 1 === d.length && !c ? d.join(a.sep) : c ? a.sep : "."; }, a.basename = function (b, c) { if (void 0 === c && (c = ""), "" === b)
                return b; b = a.normalize(b); var d = b.split(a.sep), e = d[d.length - 1]; if ("" === e && d.length > 1)
                return d[d.length - 2]; if (c.length > 0) {
                var f = e.substr(e.length - c.length);
                if (f === c)
                    return e.substr(0, e.length - c.length);
            } return e; }, a.extname = function (b) { b = a.normalize(b); var c = b.split(a.sep); if (b = c.pop(), "" === b && c.length > 0 && (b = c.pop()), ".." === b)
                return ""; var d = b.lastIndexOf("."); return -1 === d || 0 === d ? "" : b.substr(d); }, a.isAbsolute = function (b) { return b.length > 0 && b.charAt(0) === a.sep; }, a._makeLong = function (a) { return a; }, a._removeDuplicateSeps = function (a) { return a = a.replace(this._replaceRegex, this.sep); }, a.sep = "/", a._replaceRegex = new RegExp("//+", "g"), a.delimiter = ":", a; }(); b.exports = f; }, { "./node_process": 29 }], 29: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("./node_eventemitter"), f = null, g = function (a) { function b() { a.call(this, !0, !0), this.isRaw = !1, this.columns = 80, this.rows = 120, this.isTTY = !0; } return d(b, a), b.prototype.setReadMode = function (a) { this.isRaw !== a && (this.isRaw = a, this.emit("modeChange")); }, b.prototype.changeColumns = function (a) { a !== this.columns && (this.columns = a, this.emit("resize")); }, b.prototype.changeRows = function (a) { a !== this.rows && (this.rows = a, this.emit("resize")); }, b.isatty = function (a) { return a instanceof b; }, b; }(e.AbstractDuplexStream); c.TTY = g; var h = function () { function b() { this.startTime = Date.now(), this._cwd = "/", this.platform = "browser", this.argv = [], this.stdout = new g, this.stderr = new g, this.stdin = new g; } return b.prototype.chdir = function (b) { null === f && (f = a("./node_path")), this._cwd = f.resolve(b); }, b.prototype.cwd = function () { return this._cwd; }, b.prototype.uptime = function () { return (Date.now() - this.startTime) / 1e3 | 0; }, b; }(); c.Process = h, c.process = new h; }, { "./node_eventemitter": 25, "./node_path": 28 }], 30: [function (a, b, c) { function d(a) { switch (a = function () { switch (typeof a) {
                case "object": return "" + a;
                case "string": return a;
                default: throw new Error("Invalid encoding argument specified");
            } }(), a = a.toLowerCase()) {
                case "utf8":
                case "utf-8": return e;
                case "ascii": return f;
                case "binary": return h;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le": return j;
                case "hex": return k;
                case "base64": return i;
                case "binary_string": return l;
                case "binary_string_ie": return m;
                case "extended_ascii": return g;
                default: throw new Error("Unknown encoding: " + a);
            } } c.FindUtil = d; var e = function () { function a() { } return a.str2byte = function (a, b) { for (var c = b.length, d = 0, e = 0, f = c, g = 0; d < a.length && f > e;) {
                var h = a.charCodeAt(d++), i = a.charCodeAt(d);
                if (h >= 55296 && 56319 >= h && i >= 56320 && 57343 >= i) {
                    if (e + 3 >= f)
                        break;
                    g++;
                    var j = (1023 & h | 1024) << 10 | 1023 & i;
                    b.writeUInt8(j >> 18 | 240, e++), b.writeUInt8(j >> 12 & 63 | 128, e++), b.writeUInt8(j >> 6 & 63 | 128, e++), b.writeUInt8(63 & j | 128, e++), d++;
                }
                else if (128 > h)
                    b.writeUInt8(h, e++), g++;
                else if (2048 > h) {
                    if (e + 1 >= f)
                        break;
                    g++, b.writeUInt8(h >> 6 | 192, e++), b.writeUInt8(63 & h | 128, e++);
                }
                else if (65536 > h) {
                    if (e + 2 >= f)
                        break;
                    g++, b.writeUInt8(h >> 12 | 224, e++), b.writeUInt8(h >> 6 & 63 | 128, e++), b.writeUInt8(63 & h | 128, e++);
                }
            } return e; }, a.byte2str = function (a) { for (var b = [], c = 0; c < a.length;) {
                var d = a.readUInt8(c++);
                if (128 > d)
                    b.push(String.fromCharCode(d));
                else {
                    if (192 > d)
                        throw new Error("Found incomplete part of character in string.");
                    if (224 > d)
                        b.push(String.fromCharCode((31 & d) << 6 | 63 & a.readUInt8(c++)));
                    else if (240 > d)
                        b.push(String.fromCharCode((15 & d) << 12 | (63 & a.readUInt8(c++)) << 6 | 63 & a.readUInt8(c++)));
                    else {
                        if (!(248 > d))
                            throw new Error("Unable to represent UTF-8 string as UTF-16 JavaScript string.");
                        var e = a.readUInt8(c + 2);
                        b.push(String.fromCharCode(1023 & ((7 & d) << 8 | (63 & a.readUInt8(c++)) << 2 | (63 & a.readUInt8(c++)) >> 4) | 55296)), b.push(String.fromCharCode((15 & e) << 6 | 63 & a.readUInt8(c++) | 56320));
                    }
                }
            } return b.join(""); }, a.byteLength = function (a) { var b = encodeURIComponent(a).match(/%[89ABab]/g); return a.length + (b ? b.length : 0); }, a; }(); c.UTF8 = e; var f = function () { function a() { } return a.str2byte = function (a, b) { for (var c = a.length > b.length ? b.length : a.length, d = 0; c > d; d++)
                b.writeUInt8(a.charCodeAt(d) % 256, d); return c; }, a.byte2str = function (a) { for (var b = new Array(a.length), c = 0; c < a.length; c++)
                b[c] = String.fromCharCode(127 & a.readUInt8(c)); return b.join(""); }, a.byteLength = function (a) { return a.length; }, a; }(); c.ASCII = f; var g = function () { function a() { } return a.str2byte = function (b, c) { for (var d = b.length > c.length ? c.length : b.length, e = 0; d > e; e++) {
                var f = b.charCodeAt(e);
                if (f > 127) {
                    var g = a.extendedChars.indexOf(b.charAt(e));
                    g > -1 && (f = g + 128);
                }
                c.writeUInt8(f, e);
            } return d; }, a.byte2str = function (b) { for (var c = new Array(b.length), d = 0; d < b.length; d++) {
                var e = b.readUInt8(d);
                e > 127 ? c[d] = a.extendedChars[e - 128] : c[d] = String.fromCharCode(e);
            } return c.join(""); }, a.byteLength = function (a) { return a.length; }, a.extendedChars = ["Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å", "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "ø", "£", "Ø", "×", "ƒ", "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "®", "¬", "½", "¼", "¡", "«", "»", "_", "_", "_", "¦", "¦", "Á", "Â", "À", "©", "¦", "¦", "+", "+", "¢", "¥", "+", "+", "-", "-", "+", "-", "+", "ã", "Ã", "+", "+", "-", "-", "¦", "-", "+", "¤", "ð", "Ð", "Ê", "Ë", "È", "i", "Í", "Î", "Ï", "+", "+", "_", "_", "¦", "Ì", "_", "Ó", "ß", "Ô", "Ò", "õ", "Õ", "µ", "þ", "Þ", "Ú", "Û", "Ù", "ý", "Ý", "¯", "´", "­", "±", "_", "¾", "¶", "§", "÷", "¸", "°", "¨", "·", "¹", "³", "²", "_", " "], a; }(); c.ExtendedASCII = g; var h = function () { function a() { } return a.str2byte = function (a, b) { for (var c = a.length > b.length ? b.length : a.length, d = 0; c > d; d++)
                b.writeUInt8(255 & a.charCodeAt(d), d); return c; }, a.byte2str = function (a) { for (var b = new Array(a.length), c = 0; c < a.length; c++)
                b[c] = String.fromCharCode(255 & a.readUInt8(c)); return b.join(""); }, a.byteLength = function (a) { return a.length; }, a; }(); c.BINARY = h; var i = function () { function a() { } return a.byte2str = function (b) { for (var c = "", d = 0; d < b.length;) {
                var e = b.readUInt8(d++), f = d < b.length ? b.readUInt8(d++) : NaN, g = d < b.length ? b.readUInt8(d++) : NaN, h = e >> 2, i = (3 & e) << 4 | f >> 4, j = (15 & f) << 2 | g >> 6, k = 63 & g;
                isNaN(f) ? j = k = 64 : isNaN(g) && (k = 64), c = c + a.num2b64[h] + a.num2b64[i] + a.num2b64[j] + a.num2b64[k];
            } return c; }, a.str2byte = function (b, c) { var d = c.length, e = "", f = 0; b = b.replace(/[^A-Za-z0-9\+\/\=\-\_]/g, ""); for (var g = 0; f < b.length;) {
                var h = a.b642num[b.charAt(f++)], i = a.b642num[b.charAt(f++)], j = a.b642num[b.charAt(f++)], k = a.b642num[b.charAt(f++)], l = h << 2 | i >> 4, m = (15 & i) << 4 | j >> 2, n = (3 & j) << 6 | k;
                if (c.writeUInt8(l, g++), g === d)
                    break;
                if (64 !== j && (e += c.writeUInt8(m, g++)), g === d)
                    break;
                if (64 !== k && (e += c.writeUInt8(n, g++)), g === d)
                    break;
            } return g; }, a.byteLength = function (a) { return Math.floor(6 * a.replace(/[^A-Za-z0-9\+\/\-\_]/g, "").length / 8); }, a.b64chars = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/", "="], a.num2b64 = function () { for (var b = new Array(a.b64chars.length), c = 0; c < a.b64chars.length; c++) {
                var d = a.b64chars[c];
                b[c] = d;
            } return b; }(), a.b642num = function () { for (var b = {}, c = 0; c < a.b64chars.length; c++) {
                var d = a.b64chars[c];
                b[d] = c;
            } return b["-"] = 62, b._ = 63, b; }(), a; }(); c.BASE64 = i; var j = function () { function a() { } return a.str2byte = function (a, b) { var c = a.length; 2 * c > b.length && (c = b.length % 2 === 1 ? (b.length - 1) / 2 : b.length / 2); for (var d = 0; c > d; d++)
                b.writeUInt16LE(a.charCodeAt(d), 2 * d); return 2 * c; }, a.byte2str = function (a) { if (a.length % 2 !== 0)
                throw new Error("Invalid UCS2 byte array."); for (var b = new Array(a.length / 2), c = 0; c < a.length; c += 2)
                b[c / 2] = String.fromCharCode(a.readUInt8(c) | a.readUInt8(c + 1) << 8); return b.join(""); }, a.byteLength = function (a) { return 2 * a.length; }, a; }(); c.UCS2 = j; var k = function () { function a() { } return a.str2byte = function (a, b) { if (a.length % 2 === 1)
                throw new Error("Invalid hex string"); var c = a.length >> 1; c > b.length && (c = b.length); for (var d = 0; c > d; d++) {
                var e = this.hex2num[a.charAt(d << 1)], f = this.hex2num[a.charAt((d << 1) + 1)];
                b.writeUInt8(e << 4 | f, d);
            } return c; }, a.byte2str = function (a) { for (var b = a.length, c = new Array(b << 1), d = 0, e = 0; b > e; e++) {
                var f = 15 & a.readUInt8(e), g = a.readUInt8(e) >> 4;
                c[d++] = this.num2hex[g], c[d++] = this.num2hex[f];
            } return c.join(""); }, a.byteLength = function (a) { return a.length >> 1; }, a.HEXCHARS = "0123456789abcdef", a.num2hex = function () { for (var b = new Array(a.HEXCHARS.length), c = 0; c < a.HEXCHARS.length; c++) {
                var d = a.HEXCHARS[c];
                b[c] = d;
            } return b; }(), a.hex2num = function () { var b, c, d = {}; for (b = 0; b < a.HEXCHARS.length; b++)
                c = a.HEXCHARS[b], d[c] = b; var e = "ABCDEF"; for (b = 0; b < e.length; b++)
                c = e[b], d[c] = b + 10; return d; }(), a; }(); c.HEX = k; var l = function () { function a() { } return a.str2byte = function (b, c) { if (0 === b.length)
                return 0; var d = a.byteLength(b); d > c.length && (d = c.length); var e = 0, f = 0, g = f + d, h = b.charCodeAt(e++); 0 !== h && (c.writeUInt8(255 & h, 0), f = 1); for (var i = f; g > i; i += 2) {
                var j = b.charCodeAt(e++);
                g - i === 1 && c.writeUInt8(j >> 8, i), g - i >= 2 && c.writeUInt16BE(j, i);
            } return d; }, a.byte2str = function (a) { var b = a.length; if (0 === b)
                return ""; for (var c = new Array((b >> 1) + 1), d = 0, e = 0; e < c.length; e++)
                0 === e ? b % 2 === 1 ? c[e] = String.fromCharCode(256 | a.readUInt8(d++)) : c[e] = String.fromCharCode(0) : c[e] = String.fromCharCode(a.readUInt8(d++) << 8 | a.readUInt8(d++)); return c.join(""); }, a.byteLength = function (a) { if (0 === a.length)
                return 0; var b = a.charCodeAt(0), c = a.length - 1 << 1; return 0 !== b && c++, c; }, a; }(); c.BINSTR = l; var m = function () { function a() { } return a.str2byte = function (a, b) { for (var c = a.length > b.length ? b.length : a.length, d = 0; c > d; d++)
                b.writeUInt8(a.charCodeAt(d) - 32, d); return c; }, a.byte2str = function (a) { for (var b = new Array(a.length), c = 0; c < a.length; c++)
                b[c] = String.fromCharCode(a.readUInt8(c) + 32); return b.join(""); }, a.byteLength = function (a) { return a.length; }, a; }(); c.BINSTRIE = m; }, {}], 31: [function (a, b, c) { c.isIE = "undefined" != typeof navigator && (null != /(msie) ([\w.]+)/.exec(navigator.userAgent.toLowerCase()) || -1 !== navigator.userAgent.indexOf("Trident")), c.isWebWorker = "undefined" == typeof window; }, {}], 32: [function (a, b, c) { var d = a("../core/browserfs"), e = a("../core/node_fs"), f = a("../core/buffer"), g = a("../core/buffer_core_arraybuffer"), h = f.Buffer, i = g.BufferCoreArrayBuffer, j = function () { function a(a) { this.fs = a, this.FS = a.getFS(), this.PATH = a.getPATH(), this.ERRNO_CODES = a.getERRNO_CODES(); } return a.prototype.open = function (a) { var b = this.fs.realPath(a.node), c = this.FS; try {
                c.isFile(a.node.mode) && (a.nfd = e.openSync(b, this.fs.flagsToPermissionString(a.flags)));
            }
            catch (d) {
                if (!d.code)
                    throw d;
                throw new c.ErrnoError(this.ERRNO_CODES[d.code]);
            } }, a.prototype.close = function (a) { var b = this.FS; try {
                b.isFile(a.node.mode) && a.nfd && e.closeSync(a.nfd);
            }
            catch (c) {
                if (!c.code)
                    throw c;
                throw new b.ErrnoError(this.ERRNO_CODES[c.code]);
            } }, a.prototype.read = function (a, b, c, d, f) { var g, j = new i(b.buffer), k = new h(j, b.byteOffset + c, b.byteOffset + c + d); try {
                g = e.readSync(a.nfd, k, 0, d, f);
            }
            catch (l) {
                throw new this.FS.ErrnoError(this.ERRNO_CODES[l.code]);
            } return g; }, a.prototype.write = function (a, b, c, d, f) { var g, j = new i(b.buffer), k = new h(j, b.byteOffset + c, b.byteOffset + c + d); try {
                g = e.writeSync(a.nfd, k, 0, d, f);
            }
            catch (l) {
                throw new this.FS.ErrnoError(this.ERRNO_CODES[l.code]);
            } return g; }, a.prototype.llseek = function (a, b, c) { var d = b; if (1 === c)
                d += a.position;
            else if (2 === c && this.FS.isFile(a.node.mode))
                try {
                    var f = e.fstatSync(a.nfd);
                    d += f.size;
                }
                catch (g) {
                    throw new this.FS.ErrnoError(this.ERRNO_CODES[g.code]);
                } if (0 > d)
                throw new this.FS.ErrnoError(this.ERRNO_CODES.EINVAL); return a.position = d, d; }, a; }(), k = function () { function a(a) { this.fs = a, this.FS = a.getFS(), this.PATH = a.getPATH(), this.ERRNO_CODES = a.getERRNO_CODES(); } return a.prototype.getattr = function (a) { var b, c = this.fs.realPath(a); try {
                b = e.lstatSync(c);
            }
            catch (d) {
                if (!d.code)
                    throw d;
                throw new this.FS.ErrnoError(this.ERRNO_CODES[d.code]);
            } return { dev: b.dev, ino: b.ino, mode: b.mode, nlink: b.nlink, uid: b.uid, gid: b.gid, rdev: b.rdev, size: b.size, atime: b.atime, mtime: b.mtime, ctime: b.ctime, blksize: b.blksize, blocks: b.blocks }; }, a.prototype.setattr = function (a, b) { var c = this.fs.realPath(a); try {
                if (void 0 !== b.mode && (e.chmodSync(c, b.mode), a.mode = b.mode), void 0 !== b.timestamp) {
                    var d = new Date(b.timestamp);
                    e.utimesSync(c, d, d);
                }
            }
            catch (f) {
                if (!f.code)
                    throw f;
                if ("ENOTSUP" !== f.code)
                    throw new this.FS.ErrnoError(this.ERRNO_CODES[f.code]);
            } if (void 0 !== b.size)
                try {
                    e.truncateSync(c, b.size);
                }
                catch (f) {
                    if (!f.code)
                        throw f;
                    throw new this.FS.ErrnoError(this.ERRNO_CODES[f.code]);
                } }, a.prototype.lookup = function (a, b) { var c = this.PATH.join2(this.fs.realPath(a), b), d = this.fs.getMode(c); return this.fs.createNode(a, b, d); }, a.prototype.mknod = function (a, b, c, d) { var f = this.fs.createNode(a, b, c, d), g = this.fs.realPath(f); try {
                this.FS.isDir(f.mode) ? e.mkdirSync(g, f.mode) : e.writeFileSync(g, "", { mode: f.mode });
            }
            catch (h) {
                if (!h.code)
                    throw h;
                throw new this.FS.ErrnoError(this.ERRNO_CODES[h.code]);
            } return f; }, a.prototype.rename = function (a, b, c) { var d = this.fs.realPath(a), f = this.PATH.join2(this.fs.realPath(b), c); try {
                e.renameSync(d, f);
            }
            catch (g) {
                if (!g.code)
                    throw g;
                throw new this.FS.ErrnoError(this.ERRNO_CODES[g.code]);
            } }, a.prototype.unlink = function (a, b) { var c = this.PATH.join2(this.fs.realPath(a), b); try {
                e.unlinkSync(c);
            }
            catch (d) {
                if (!d.code)
                    throw d;
                throw new this.FS.ErrnoError(this.ERRNO_CODES[d.code]);
            } }, a.prototype.rmdir = function (a, b) { var c = this.PATH.join2(this.fs.realPath(a), b); try {
                e.rmdirSync(c);
            }
            catch (d) {
                if (!d.code)
                    throw d;
                throw new this.FS.ErrnoError(this.ERRNO_CODES[d.code]);
            } }, a.prototype.readdir = function (a) { var b = this.fs.realPath(a); try {
                return e.readdirSync(b);
            }
            catch (c) {
                if (!c.code)
                    throw c;
                throw new this.FS.ErrnoError(this.ERRNO_CODES[c.code]);
            } }, a.prototype.symlink = function (a, b, c) { var d = this.PATH.join2(this.fs.realPath(a), b); try {
                e.symlinkSync(c, d);
            }
            catch (f) {
                if (!f.code)
                    throw f;
                throw new this.FS.ErrnoError(this.ERRNO_CODES[f.code]);
            } }, a.prototype.readlink = function (a) { var b = this.fs.realPath(a); try {
                return e.readlinkSync(b);
            }
            catch (c) {
                if (!c.code)
                    throw c;
                throw new this.FS.ErrnoError(this.ERRNO_CODES[c.code]);
            } }, a; }(), l = function () { function a(a, b, c) { if (void 0 === a && (a = self.FS), void 0 === b && (b = self.PATH), void 0 === c && (c = self.ERRNO_CODES), this.flagsToPermissionStringMap = { 0: "r", 1: "r+", 2: "r+", 64: "r", 65: "r+", 66: "r+", 129: "rx+", 193: "rx+", 514: "w+", 577: "w", 578: "w+", 705: "wx", 706: "wx+", 1024: "a", 1025: "a", 1026: "a+", 1089: "a", 1090: "a+", 1153: "ax", 1154: "ax+", 1217: "ax", 1218: "ax+", 4096: "rs", 4098: "rs+" }, "undefined" == typeof d)
                throw new Error("BrowserFS is not loaded. Please load it before this library."); this.FS = a, this.PATH = b, this.ERRNO_CODES = c, this.node_ops = new k(this), this.stream_ops = new j(this); } return a.prototype.mount = function (a) { return this.createNode(null, "/", this.getMode(a.opts.root), 0); }, a.prototype.createNode = function (a, b, c, d) { var e = this.FS; if (!e.isDir(c) && !e.isFile(c) && !e.isLink(c))
                throw new e.ErrnoError(this.ERRNO_CODES.EINVAL); var f = e.createNode(a, b, c); return f.node_ops = this.node_ops, f.stream_ops = this.stream_ops, f; }, a.prototype.getMode = function (a) { var b; try {
                b = e.lstatSync(a);
            }
            catch (c) {
                if (!c.code)
                    throw c;
                throw new this.FS.ErrnoError(this.ERRNO_CODES[c.code]);
            } return b.mode; }, a.prototype.realPath = function (a) { for (var b = []; a.parent !== a;)
                b.push(a.name), a = a.parent; return b.push(a.mount.opts.root), b.reverse(), this.PATH.join.apply(null, b); }, a.prototype.flagsToPermissionString = function (a) { var b = "string" == typeof a ? parseInt(a, 10) : a; return b &= 8191, b in this.flagsToPermissionStringMap ? this.flagsToPermissionStringMap[b] : a; }, a.prototype.getFS = function () { return this.FS; }, a.prototype.getPATH = function () { return this.PATH; }, a.prototype.getERRNO_CODES = function () { return this.ERRNO_CODES; }, a; }(); c.BFSEmscriptenFS = l, d.EmscriptenFS = l; }, { "../core/browserfs": 15, "../core/buffer": 16, "../core/buffer_core_arraybuffer": 19, "../core/node_fs": 26 }], 33: [function (a, b, c) { var d = a("../core/node_fs_stats"), e = a("../core/node_path"), f = d.Stats, g = function () { function a() { this._index = {}, this.addPath("/", new i); } return a.prototype._split_path = function (a) { var b = e.dirname(a), c = a.substr(b.length + ("/" === b ? 0 : 1)); return [b, c]; }, a.prototype.fileIterator = function (a) { for (var b in this._index)
                for (var c = this._index[b], d = c.getListing(), e = 0; e < d.length; e++) {
                    var f = c.getItem(d[e]);
                    f.isFile() && a(f.getData());
                } }, a.prototype.addPath = function (a, b) { if (null == b)
                throw new Error("Inode must be specified"); if ("/" !== a[0])
                throw new Error("Path must be absolute, got: " + a); if (this._index.hasOwnProperty(a))
                return this._index[a] === b; var c = this._split_path(a), d = c[0], e = c[1], f = this._index[d]; return (void 0 !== f || "/" === a || (f = new i, this.addPath(d, f))) && ("/" === a || f.addItem(e, b)) ? (b.isFile() || (this._index[a] = b), !0) : !1; }, a.prototype.removePath = function (a) { var b = this._split_path(a), c = b[0], d = b[1], e = this._index[c]; if (void 0 === e)
                return null; var f = e.remItem(d); if (null === f)
                return null; if (!f.isFile()) {
                for (var g = f, h = g.getListing(), i = 0; i < h.length; i++)
                    this.removePath(a + "/" + h[i]);
                "/" !== a && delete this._index[a];
            } return f; }, a.prototype.ls = function (a) { var b = this._index[a]; return void 0 === b ? null : b.getListing(); }, a.prototype.getInode = function (a) { var b = this._split_path(a), c = b[0], d = b[1], e = this._index[c]; return void 0 === e ? null : c === a ? e : e.getItem(d); }, a.from_listing = function (b) { var c = new a, e = new i; c._index["/"] = e; for (var g = [["", b, e]]; g.length > 0;) {
                var j, k = g.pop(), l = k[0], m = k[1], n = k[2];
                for (var o in m) {
                    var p = m[o], q = "" + l + "/" + o;
                    null != p ? (c._index[q] = j = new i, g.push([q, p, j])) : j = new h(new f(d.FileType.FILE, -1, 365)), null != n && (n._ls[o] = j);
                }
            } return c; }, a; }(); c.FileIndex = g; var h = function () { function a(a) { this.data = a; } return a.prototype.isFile = function () { return !0; }, a.prototype.isDir = function () { return !1; }, a.prototype.getData = function () { return this.data; }, a.prototype.setData = function (a) { this.data = a; }, a; }(); c.FileInode = h; var i = function () { function a() { this._ls = {}; } return a.prototype.isFile = function () { return !1; }, a.prototype.isDir = function () { return !0; }, a.prototype.getStats = function () { return new f(d.FileType.DIRECTORY, 4096, 365); }, a.prototype.getListing = function () { return Object.keys(this._ls); }, a.prototype.getItem = function (a) { var b; return null != (b = this._ls[a]) ? b : null; }, a.prototype.addItem = function (a, b) { return a in this._ls ? !1 : (this._ls[a] = b, !0); }, a.prototype.remItem = function (a) { var b = this._ls[a]; return void 0 === b ? null : (delete this._ls[a], b); }, a; }(); c.DirInode = i; }, { "../core/node_fs_stats": 27, "../core/node_path": 28 }], 34: [function (a, b, c) { var d = a("../core/node_fs_stats"), e = a("../core/buffer"), f = function () { function a(a, b, c, d, e, f) { this.id = a, this.size = b, this.mode = c, this.atime = d, this.mtime = e, this.ctime = f; } return a.prototype.toStats = function () { return new d.Stats((61440 & this.mode) === d.FileType.DIRECTORY ? d.FileType.DIRECTORY : d.FileType.FILE, this.size, this.mode, new Date(this.atime), new Date(this.mtime), new Date(this.ctime)); }, a.prototype.getSize = function () { return 30 + this.id.length; }, a.prototype.toBuffer = function (a) { return void 0 === a && (a = new e.Buffer(this.getSize())), a.writeUInt32LE(this.size, 0), a.writeUInt16LE(this.mode, 4), a.writeDoubleLE(this.atime, 6), a.writeDoubleLE(this.mtime, 14), a.writeDoubleLE(this.ctime, 22), a.write(this.id, 30, this.id.length, "ascii"), a; }, a.prototype.update = function (a) { var b = !1; this.size !== a.size && (this.size = a.size, b = !0), this.mode !== a.mode && (this.mode = a.mode, b = !0); var c = a.atime.getTime(); this.atime !== c && (this.atime = c, b = !0); var d = a.mtime.getTime(); this.mtime !== d && (this.mtime = d, b = !0); var e = a.ctime.getTime(); return this.ctime !== e && (this.ctime = e, b = !0), b; }, a.fromBuffer = function (b) { if (void 0 === b)
                throw new Error("NO"); return new a(b.toString("ascii", 30), b.readUInt32LE(0), b.readUInt16LE(4), b.readDoubleLE(6), b.readDoubleLE(14), b.readDoubleLE(22)); }, a.prototype.isFile = function () { return (61440 & this.mode) === d.FileType.FILE; }, a.prototype.isDirectory = function () { return (61440 & this.mode) === d.FileType.DIRECTORY; }, a; }(); b.exports = f; }, { "../core/buffer": 16, "../core/node_fs_stats": 27 }], 35: [function (a, b, c) {
                function d() { return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (a) { var b = 16 * Math.random() | 0, c = "x" == a ? b : 3 & b | 8; return c.toString(16); }); }
                function e(a, b) { return a ? (b(a), !1) : !0; }
                function f(a, b, c) { return a ? (b.abort(function () { c(a); }), !1) : !0; }
                var g = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                    b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, h = a("../core/file_system"), i = a("../core/api_error"), j = a("../core/node_fs_stats"), k = a("../core/node_path"), l = a("../generic/inode"), m = a("../core/buffer"), n = a("../generic/preload_file"), o = "/", p = i.ApiError, q = m.Buffer, r = function () { function a(a) { this.store = a, this.originalData = {}, this.modifiedKeys = []; } return a.prototype.stashOldValue = function (a, b) { this.originalData.hasOwnProperty(a) || (this.originalData[a] = b); }, a.prototype.markModified = function (a) { -1 === this.modifiedKeys.indexOf(a) && (this.modifiedKeys.push(a), this.originalData.hasOwnProperty(a) || (this.originalData[a] = this.store.get(a))); }, a.prototype.get = function (a) { var b = this.store.get(a); return this.stashOldValue(a, b), b; }, a.prototype.put = function (a, b, c) { return this.markModified(a), this.store.put(a, b, c); }, a.prototype["delete"] = function (a) { this.markModified(a), this.store["delete"](a); }, a.prototype.commit = function () { }, a.prototype.abort = function () { var a, b, c; for (a = 0; a < this.modifiedKeys.length; a++)
                    b = this.modifiedKeys[a], c = this.originalData[b], null === c ? this.store["delete"](b) : this.store.put(b, c, !0); }, a; }();
                c.SimpleSyncRWTransaction = r;
                var s = function (a) { function b(b, c, d, e, f) { a.call(this, b, c, d, e, f); } return g(b, a), b.prototype.syncSync = function () { this.isDirty() && (this._fs._syncSync(this.getPath(), this.getBuffer(), this.getStats()), this.resetDirty()); }, b.prototype.closeSync = function () { this.syncSync(); }, b; }(n.PreloadFile);
                c.SyncKeyValueFile = s;
                var t = function (a) {
                    function b(b) { a.call(this), this.store = b.store, this.makeRootDirectory(); }
                    return g(b, a), b.isAvailable = function () { return !0; }, b.prototype.getName = function () { return this.store.name(); }, b.prototype.isReadOnly = function () { return !1; }, b.prototype.supportsSymlinks = function () { return !1; }, b.prototype.supportsProps = function () { return !1; }, b.prototype.supportsSynch = function () { return !0; }, b.prototype.makeRootDirectory = function () { var a = this.store.beginTransaction("readwrite"); if (void 0 === a.get(o)) {
                        var b = (new Date).getTime(), c = new l(d(), 4096, 511 | j.FileType.DIRECTORY, b, b, b);
                        a.put(c.id, new q("{}"), !1), a.put(o, c.toBuffer(), !1), a.commit();
                    } }, b.prototype._findINode = function (a, b, c) { var d = this, e = function (e) { var f = d.getDirListing(a, b, e); if (f[c])
                        return f[c]; throw p.ENOENT(k.resolve(b, c)); }; return "/" === b ? "" === c ? o : e(this.getINode(a, b, o)) : e(this.getINode(a, b + k.sep + c, this._findINode(a, k.dirname(b), k.basename(b)))); }, b.prototype.findINode = function (a, b) { return this.getINode(a, b, this._findINode(a, k.dirname(b), k.basename(b))); }, b.prototype.getINode = function (a, b, c) { var d = a.get(c); if (void 0 === d)
                        throw p.ENOENT(b); return l.fromBuffer(d); }, b.prototype.getDirListing = function (a, b, c) { if (!c.isDirectory())
                        throw p.ENOTDIR(b); var d = a.get(c.id); if (void 0 === d)
                        throw p.ENOENT(b); return JSON.parse(d.toString()); }, b.prototype.addNewNode = function (a, b) { for (var c, e = 0; 5 > e;)
                        try {
                            return c = d(), a.put(c, b, !1), c;
                        }
                        catch (f) { } throw new p(i.ErrorCode.EIO, "Unable to commit data to key-value store."); }, b.prototype.commitNewFile = function (a, b, c, d, e) { var f = k.dirname(b), g = k.basename(b), h = this.findINode(a, f), i = this.getDirListing(a, f, h), j = (new Date).getTime(); if ("/" === b)
                        throw p.EEXIST(b); if (i[g])
                        throw p.EEXIST(b); try {
                        var m = this.addNewNode(a, e), n = new l(m, e.length, d | c, j, j, j), o = this.addNewNode(a, n.toBuffer());
                        i[g] = o, a.put(h.id, new q(JSON.stringify(i)), !0);
                    }
                    catch (r) {
                        throw a.abort(), r;
                    } return a.commit(), n; }, b.prototype.empty = function () { this.store.clear(), this.makeRootDirectory(); }, b.prototype.renameSync = function (a, b) { var c = this.store.beginTransaction("readwrite"), d = k.dirname(a), e = k.basename(a), f = k.dirname(b), g = k.basename(b), h = this.findINode(c, d), j = this.getDirListing(c, d, h); if (!j[e])
                        throw p.ENOENT(a); var l = j[e]; if (delete j[e], 0 === (f + "/").indexOf(a + "/"))
                        throw new p(i.ErrorCode.EBUSY, d); var m, n; if (f === d ? (m = h, n = j) : (m = this.findINode(c, f), n = this.getDirListing(c, f, m)), n[g]) {
                        var o = this.getINode(c, b, n[g]);
                        if (!o.isFile())
                            throw p.EPERM(b);
                        try {
                            c["delete"](o.id), c["delete"](n[g]);
                        }
                        catch (r) {
                            throw c.abort(), r;
                        }
                    } n[g] = l; try {
                        c.put(h.id, new q(JSON.stringify(j)), !0), c.put(m.id, new q(JSON.stringify(n)), !0);
                    }
                    catch (r) {
                        throw c.abort(), r;
                    } c.commit(); }, b.prototype.statSync = function (a, b) { return this.findINode(this.store.beginTransaction("readonly"), a).toStats(); }, b.prototype.createFileSync = function (a, b, c) { var d = this.store.beginTransaction("readwrite"), e = new q(0), f = this.commitNewFile(d, a, j.FileType.FILE, c, e); return new s(this, a, b, f.toStats(), e); }, b.prototype.openFileSync = function (a, b) {
                        var c = this.store.beginTransaction("readonly"), d = this.findINode(c, a), e = c.get(d.id);
                        if (void 0 === e)
                            throw p.ENOENT(a);
                        return new s(this, a, b, d.toStats(), e);
                    }, b.prototype.removeEntry = function (a, b) { var c = this.store.beginTransaction("readwrite"), d = k.dirname(a), e = this.findINode(c, d), f = this.getDirListing(c, d, e), g = k.basename(a); if (!f[g])
                        throw p.ENOENT(a); var h = f[g]; delete f[g]; var i = this.getINode(c, a, h); if (!b && i.isDirectory())
                        throw p.EISDIR(a); if (b && !i.isDirectory())
                        throw p.ENOTDIR(a); try {
                        c["delete"](i.id), c["delete"](h), c.put(e.id, new q(JSON.stringify(f)), !0);
                    }
                    catch (j) {
                        throw c.abort(), j;
                    } c.commit(); }, b.prototype.unlinkSync = function (a) { this.removeEntry(a, !1); }, b.prototype.rmdirSync = function (a) { this.removeEntry(a, !0); }, b.prototype.mkdirSync = function (a, b) { var c = this.store.beginTransaction("readwrite"), d = new q("{}"); this.commitNewFile(c, a, j.FileType.DIRECTORY, b, d); }, b.prototype.readdirSync = function (a) { var b = this.store.beginTransaction("readonly"); return Object.keys(this.getDirListing(b, a, this.findINode(b, a))); }, b.prototype._syncSync = function (a, b, c) { var d = this.store.beginTransaction("readwrite"), e = this._findINode(d, k.dirname(a), k.basename(a)), f = this.getINode(d, a, e), g = f.update(c); try {
                        d.put(f.id, b, !0), g && d.put(e, f.toBuffer(), !0);
                    }
                    catch (h) {
                        throw d.abort(), h;
                    } d.commit(); }, b;
                }(h.SynchronousFileSystem);
                c.SyncKeyValueFileSystem = t;
                var u = function (a) { function b(b, c, d, e, f) { a.call(this, b, c, d, e, f); } return g(b, a), b.prototype.sync = function (a) { var b = this; this.isDirty() ? this._fs._sync(this.getPath(), this.getBuffer(), this.getStats(), function (c) { c || b.resetDirty(), a(c); }) : a(); }, b.prototype.close = function (a) { this.sync(a); }, b; }(n.PreloadFile);
                c.AsyncKeyValueFile = u;
                var v = function (a) { function b() { a.apply(this, arguments); } return g(b, a), b.prototype.init = function (a, b) { this.store = a, this.makeRootDirectory(b); }, b.isAvailable = function () { return !0; }, b.prototype.getName = function () { return this.store.name(); }, b.prototype.isReadOnly = function () { return !1; }, b.prototype.supportsSymlinks = function () { return !1; }, b.prototype.supportsProps = function () { return !1; }, b.prototype.supportsSynch = function () { return !1; }, b.prototype.makeRootDirectory = function (a) { var b = this.store.beginTransaction("readwrite"); b.get(o, function (c, e) { if (c || void 0 === e) {
                    var g = (new Date).getTime(), h = new l(d(), 4096, 511 | j.FileType.DIRECTORY, g, g, g);
                    b.put(h.id, new q("{}"), !1, function (c) { f(c, b, a) && b.put(o, h.toBuffer(), !1, function (c) { c ? b.abort(function () { a(c); }) : b.commit(a); }); });
                }
                else
                    b.commit(a); }); }, b.prototype._findINode = function (a, b, c, d) { var f = this, g = function (a, e, f) { a ? d(a) : f[c] ? d(null, f[c]) : d(p.ENOENT(k.resolve(b, c))); }; "/" === b ? "" === c ? d(null, o) : this.getINode(a, b, o, function (c, h) { e(c, d) && f.getDirListing(a, b, h, function (a, b) { g(a, h, b); }); }) : this.findINodeAndDirListing(a, b, g); }, b.prototype.findINode = function (a, b, c) { var d = this; this._findINode(a, k.dirname(b), k.basename(b), function (f, g) { e(f, c) && d.getINode(a, b, g, c); }); }, b.prototype.getINode = function (a, b, c, d) { a.get(c, function (a, c) { e(a, d) && (void 0 === c ? d(p.ENOENT(b)) : d(null, l.fromBuffer(c))); }); }, b.prototype.getDirListing = function (a, b, c, d) { c.isDirectory() ? a.get(c.id, function (a, c) { if (e(a, d))
                    try {
                        d(null, JSON.parse(c.toString()));
                    }
                    catch (a) {
                        d(p.ENOENT(b));
                    } }) : d(p.ENOTDIR(b)); }, b.prototype.findINodeAndDirListing = function (a, b, c) { var d = this; this.findINode(a, b, function (f, g) { e(f, c) && d.getDirListing(a, b, g, function (a, b) { e(a, c) && c(null, g, b); }); }); }, b.prototype.addNewNode = function (a, b, c) { var e, f = 0, g = function () { 5 === ++f ? c(new p(i.ErrorCode.EIO, "Unable to commit data to key-value store.")) : (e = d(), a.put(e, b, !1, function (a, b) { a || !b ? g() : c(null, e); })); }; g(); }, b.prototype.commitNewFile = function (a, b, c, d, e, g) { var h = this, i = k.dirname(b), j = k.basename(b), m = (new Date).getTime(); return "/" === b ? g(p.EEXIST(b)) : void this.findINodeAndDirListing(a, i, function (i, k, n) { f(i, a, g) && (n[j] ? a.abort(function () { g(p.EEXIST(b)); }) : h.addNewNode(a, e, function (b, i) { if (f(b, a, g)) {
                    var o = new l(i, e.length, d | c, m, m, m);
                    h.addNewNode(a, o.toBuffer(), function (b, c) { f(b, a, g) && (n[j] = c, a.put(k.id, new q(JSON.stringify(n)), !0, function (b) { f(b, a, g) && a.commit(function (b) { f(b, a, g) && g(null, o); }); })); });
                } })); }); }, b.prototype.empty = function (a) { var b = this; this.store.clear(function (c) { e(c, a) && b.makeRootDirectory(a); }); }, b.prototype.rename = function (a, b, c) { var d = this, e = this.store.beginTransaction("readwrite"), g = k.dirname(a), h = k.basename(a), j = k.dirname(b), l = k.basename(b), m = {}, n = {}, o = !1; if (0 === (j + "/").indexOf(a + "/"))
                    return c(new p(i.ErrorCode.EBUSY, g)); var r = function () { if (!o && n.hasOwnProperty(g) && n.hasOwnProperty(j)) {
                    var i = n[g], k = m[g], r = n[j], s = m[j];
                    if (i[h]) {
                        var t = i[h];
                        delete i[h];
                        var u = function () { r[l] = t, e.put(k.id, new q(JSON.stringify(i)), !0, function (a) { f(a, e, c) && (g === j ? e.commit(c) : e.put(s.id, new q(JSON.stringify(r)), !0, function (a) { f(a, e, c) && e.commit(c); })); }); };
                        r[l] ? d.getINode(e, b, r[l], function (a, d) { f(a, e, c) && (d.isFile() ? e["delete"](d.id, function (a) { f(a, e, c) && e["delete"](r[l], function (a) { f(a, e, c) && u(); }); }) : e.abort(function (a) { c(p.EPERM(b)); })); }) : u();
                    }
                    else
                        c(p.ENOENT(a));
                } }, s = function (a) { d.findINodeAndDirListing(e, a, function (b, d, f) { b ? o || (o = !0, e.abort(function () { c(b); })) : (m[a] = d, n[a] = f, r()); }); }; s(g), g !== j && s(j); }, b.prototype.stat = function (a, b, c) { var d = this.store.beginTransaction("readonly"); this.findINode(d, a, function (a, b) { e(a, c) && c(null, b.toStats()); }); }, b.prototype.createFile = function (a, b, c, d) { var f = this, g = this.store.beginTransaction("readwrite"), h = new q(0); this.commitNewFile(g, a, j.FileType.FILE, c, h, function (c, g) { e(c, d) && d(null, new u(f, a, b, g.toStats(), h)); }); }, b.prototype.openFile = function (a, b, c) { var d = this, f = this.store.beginTransaction("readonly"); this.findINode(f, a, function (g, h) { e(g, c) && f.get(h.id, function (f, g) { e(f, c) && (void 0 === g ? c(p.ENOENT(a)) : c(null, new u(d, a, b, h.toStats(), g))); }); }); }, b.prototype.removeEntry = function (a, b, c) { var d = this, e = this.store.beginTransaction("readwrite"), g = k.dirname(a), h = k.basename(a); this.findINodeAndDirListing(e, g, function (g, i, j) { if (f(g, e, c))
                    if (j[h]) {
                        var k = j[h];
                        delete j[h], d.getINode(e, a, k, function (d, g) { f(d, e, c) && (!b && g.isDirectory() ? e.abort(function () { c(p.EISDIR(a)); }) : b && !g.isDirectory() ? e.abort(function () { c(p.ENOTDIR(a)); }) : e["delete"](g.id, function (a) { f(a, e, c) && e["delete"](k, function (a) { f(a, e, c) && e.put(i.id, new q(JSON.stringify(j)), !0, function (a) { f(a, e, c) && e.commit(c); }); }); })); });
                    }
                    else
                        e.abort(function () { c(p.ENOENT(a)); }); }); }, b.prototype.unlink = function (a, b) { this.removeEntry(a, !1, b); }, b.prototype.rmdir = function (a, b) { this.removeEntry(a, !0, b); }, b.prototype.mkdir = function (a, b, c) { var d = this.store.beginTransaction("readwrite"), e = new q("{}"); this.commitNewFile(d, a, j.FileType.DIRECTORY, b, e, c); }, b.prototype.readdir = function (a, b) { var c = this, d = this.store.beginTransaction("readonly"); this.findINode(d, a, function (f, g) { e(f, b) && c.getDirListing(d, a, g, function (a, c) { e(a, b) && b(null, Object.keys(c)); }); }); }, b.prototype._sync = function (a, b, c, d) { var e = this, g = this.store.beginTransaction("readwrite"); this._findINode(g, k.dirname(a), k.basename(a), function (h, i) { f(h, g, d) && e.getINode(g, a, i, function (a, e) { if (f(a, g, d)) {
                    var h = e.update(c);
                    g.put(e.id, b, !0, function (a) { f(a, g, d) && (h ? g.put(i, e.toBuffer(), !0, function (a) { f(a, g, d) && g.commit(d); }) : g.commit(d)); });
                } }); }); }, b; }(h.BaseFileSystem);
                c.AsyncKeyValueFileSystem = v;
            }, { "../core/api_error": 14, "../core/buffer": 16, "../core/file_system": 23, "../core/node_fs_stats": 27, "../core/node_path": 28, "../generic/inode": 34, "../generic/preload_file": 36 }], 36: [function (a, b, c) { var d = this.__extends || function (a, b) { function c() { this.constructor = a; } for (var d in b)
                b.hasOwnProperty(d) && (a[d] = b[d]); c.prototype = b.prototype, a.prototype = new c; }, e = a("../core/file"), f = a("../core/buffer"), g = a("../core/api_error"), h = a("../core/node_fs"), i = g.ApiError, j = g.ErrorCode, k = f.Buffer, l = function (a) { function b(b, c, d, e, f) { if (a.call(this), this._pos = 0, this._dirty = !1, this._fs = b, this._path = c, this._flag = d, this._stat = e, null != f ? this._buffer = f : this._buffer = new k(0), this._stat.size !== this._buffer.length && this._flag.isReadable())
                throw new Error("Invalid buffer: Buffer is " + this._buffer.length + " long, yet Stats object specifies that file is " + this._stat.size + " long."); } return d(b, a), b.prototype.isDirty = function () { return this._dirty; }, b.prototype.resetDirty = function () { this._dirty = !1; }, b.prototype.getBuffer = function () { return this._buffer; }, b.prototype.getStats = function () { return this._stat; }, b.prototype.getFlag = function () { return this._flag; }, b.prototype.getPath = function () { return this._path; }, b.prototype.getPos = function () { return this._flag.isAppendable() ? this._stat.size : this._pos; }, b.prototype.advancePos = function (a) { return this._pos += a; }, b.prototype.setPos = function (a) { return this._pos = a; }, b.prototype.sync = function (a) { try {
                this.syncSync(), a();
            }
            catch (b) {
                a(b);
            } }, b.prototype.syncSync = function () { throw new i(j.ENOTSUP); }, b.prototype.close = function (a) { try {
                this.closeSync(), a();
            }
            catch (b) {
                a(b);
            } }, b.prototype.closeSync = function () { throw new i(j.ENOTSUP); }, b.prototype.stat = function (a) { try {
                a(null, this._stat.clone());
            }
            catch (b) {
                a(b);
            } }, b.prototype.statSync = function () { return this._stat.clone(); }, b.prototype.truncate = function (a, b) { try {
                this.truncateSync(a), this._flag.isSynchronous() && !h.getRootFS().supportsSynch() && this.sync(b), b();
            }
            catch (c) {
                return b(c);
            } }, b.prototype.truncateSync = function (a) { if (this._dirty = !0, !this._flag.isWriteable())
                throw new i(j.EPERM, "File not opened with a writeable mode."); if (this._stat.mtime = new Date, a > this._buffer.length) {
                var b = new k(a - this._buffer.length);
                return b.fill(0), this.writeSync(b, 0, b.length, this._buffer.length), void (this._flag.isSynchronous() && h.getRootFS().supportsSynch() && this.syncSync());
            } this._stat.size = a; var c = new k(a); this._buffer.copy(c, 0, 0, a), this._buffer = c, this._flag.isSynchronous() && h.getRootFS().supportsSynch() && this.syncSync(); }, b.prototype.write = function (a, b, c, d, e) { try {
                e(null, this.writeSync(a, b, c, d), a);
            }
            catch (f) {
                e(f);
            } }, b.prototype.writeSync = function (a, b, c, d) { if (this._dirty = !0, null == d && (d = this.getPos()), !this._flag.isWriteable())
                throw new i(j.EPERM, "File not opened with a writeable mode."); var e = d + c; if (e > this._stat.size && (this._stat.size = e, e > this._buffer.length)) {
                var f = new k(e);
                this._buffer.copy(f), this._buffer = f;
            } var g = a.copy(this._buffer, d, b, b + c); return this._stat.mtime = new Date, this._flag.isSynchronous() ? (this.syncSync(), g) : (this.setPos(d + g), g); }, b.prototype.read = function (a, b, c, d, e) { try {
                e(null, this.readSync(a, b, c, d), a);
            }
            catch (f) {
                e(f);
            } }, b.prototype.readSync = function (a, b, c, d) { if (!this._flag.isReadable())
                throw new i(j.EPERM, "File not opened with a readable mode."); null == d && (d = this.getPos()); var e = d + c; e > this._stat.size && (c = this._stat.size - d); var f = this._buffer.copy(a, b, d, d + c); return this._stat.atime = new Date, this._pos = d + c, f; }, b.prototype.chmod = function (a, b) { try {
                this.chmodSync(a), b();
            }
            catch (c) {
                b(c);
            } }, b.prototype.chmodSync = function (a) { if (!this._fs.supportsProps())
                throw new i(j.ENOTSUP); this._dirty = !0, this._stat.chmod(a), this.syncSync(); }, b; }(e.BaseFile); c.PreloadFile = l; var m = function (a) { function b(b, c, d, e, f) { a.call(this, b, c, d, e, f); } return d(b, a), b.prototype.sync = function (a) { a(); }, b.prototype.syncSync = function () { }, b.prototype.close = function (a) { a(); }, b.prototype.closeSync = function () { }, b; }(l); c.NoSyncFile = m; }, { "../core/api_error": 14, "../core/buffer": 16, "../core/file": 21, "../core/node_fs": 26 }], 37: [function (a, b, c) { function d(a) { for (var b = IEBinaryToArray_ByteStr(a), c = IEBinaryToArray_ByteStr_Last(a), d = b.replace(/[\s\S]/g, function (a) { var b = a.charCodeAt(0); return String.fromCharCode(255 & b, b >> 8); }) + c, e = new Array(d.length), f = 0; f < d.length; f++)
                e[f] = d.charCodeAt(f); return e; } function e(a, b, c, e) { switch (c) {
                case "buffer":
                case "json": break;
                default: return e(new q(r.EINVAL, "Invalid download type: " + c));
            } var f = new XMLHttpRequest; f.open("GET", b, a), f.setRequestHeader("Accept-Charset", "x-user-defined"), f.onreadystatechange = function (a) { var b; if (4 === f.readyState) {
                if (200 !== f.status)
                    return e(new q(f.status, "XHR error."));
                switch (c) {
                    case "buffer": return b = d(f.responseBody), e(null, new s(b));
                    case "json": return e(null, JSON.parse(f.responseText));
                }
            } }, f.send(); } function f(a, b, c) { e(!0, a, b, c); } function g(a, b) { var c; return e(!1, a, b, function (a, b) { if (a)
                throw a; c = b; }), c; } function h(a, b, c) { var d = new XMLHttpRequest; d.open("GET", a, !0); var e = !0; switch (b) {
                case "buffer":
                    d.responseType = "arraybuffer";
                    break;
                case "json":
                    try {
                        d.responseType = "json", e = "json" === d.responseType;
                    }
                    catch (f) {
                        e = !1;
                    }
                    break;
                default: return c(new q(r.EINVAL, "Invalid download type: " + b));
            } d.onreadystatechange = function (a) { if (4 === d.readyState) {
                if (200 !== d.status)
                    return c(new q(d.status, "XHR error."));
                switch (b) {
                    case "buffer": return c(null, new s(d.response ? d.response : 0));
                    case "json": return e ? c(null, d.response) : c(null, JSON.parse(d.responseText));
                }
            } }, d.send(); } function i(a, b) { var c = new XMLHttpRequest; c.open("GET", a, !1); var d = null, e = null; if (c.overrideMimeType("text/plain; charset=x-user-defined"), c.onreadystatechange = function (a) { if (4 === c.readyState) {
                if (200 !== c.status)
                    return void (e = new q(c.status, "XHR error."));
                switch (b) {
                    case "buffer":
                        var f = c.responseText;
                        d = new s(f.length);
                        for (var g = 0; g < f.length; g++)
                            d.writeUInt8(f.charCodeAt(g), g);
                        return;
                    case "json": return void (d = JSON.parse(c.responseText));
                }
            } }, c.send(), e)
                throw e; return d; } function j(a, b) { var c = new XMLHttpRequest; switch (c.open("GET", a, !1), b) {
                case "buffer":
                    c.responseType = "arraybuffer";
                    break;
                case "json": break;
                default: throw new q(r.EINVAL, "Invalid download type: " + b);
            } var d, e; if (c.onreadystatechange = function (a) { if (4 === c.readyState)
                if (200 === c.status)
                    switch (b) {
                        case "buffer":
                            d = new s(c.response);
                            break;
                        case "json": d = JSON.parse(c.response);
                    }
                else
                    e = new q(c.status, "XHR error."); }, c.send(), e)
                throw e; return d; } function k(a, b, c) { var d = new XMLHttpRequest; d.open("HEAD", b, a), d.onreadystatechange = function (a) { if (4 === d.readyState) {
                if (200 != d.status)
                    return c(new q(d.status, "XHR HEAD error."));
                try {
                    return c(null, parseInt(d.getResponseHeader("Content-Length"), 10));
                }
                catch (a) {
                    return c(new q(r.EIO, "XHR HEAD error: Could not read content-length."));
                }
            } }, d.send(); } function l(a) { var b; return k(!1, a, function (a, c) { if (a)
                throw a; b = c; }), b; } function m(a, b) { k(!0, a, b); } var n = a("../core/util"), o = a("../core/buffer"), p = a("../core/api_error"), q = p.ApiError, r = p.ErrorCode, s = o.Buffer; c.asyncDownloadFile = n.isIE && "undefined" == typeof Blob ? f : h, c.syncDownloadFile = n.isIE && "undefined" == typeof Blob ? g : n.isIE && "undefined" != typeof Blob ? j : i, c.getFileSizeSync = l, c.getFileSizeAsync = m; }, { "../core/api_error": 14, "../core/buffer": 16, "../core/util": 31 }], 38: [function (a, b, c) { var d = a("./core/global"); if (Date.now || (Date.now = function () { return (new Date).getTime(); }), Array.isArray || (Array.isArray = function (a) { return "[object Array]" === Object.prototype.toString.call(a); }), Object.keys || (Object.keys = function () {
                "use strict";
                var a = Object.prototype.hasOwnProperty, b = !{ toString: null }.propertyIsEnumerable("toString"), c = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"], d = c.length;
                return function (e) { if ("object" != typeof e && ("function" != typeof e || null === e))
                    throw new TypeError("Object.keys called on non-object"); var f, g, h = []; for (f in e)
                    a.call(e, f) && h.push(f); if (b)
                    for (g = 0; d > g; g++)
                        a.call(e, c[g]) && h.push(c[g]); return h; };
            }()), "b" !== "ab".substr(-1) && (String.prototype.substr = function (a) { return function (b, c) { return 0 > b && (b = this.length + b), a.call(this, b, c); }; }(String.prototype.substr)), Array.prototype.forEach || (Array.prototype.forEach = function (a, b) { for (var c = 0; c < this.length; ++c)
                c in this && a.call(b, this[c], c, this); }), "undefined" == typeof setImmediate) {
                var e = d, f = [], g = "zero-timeout-message", h = function () { if ("undefined" != typeof e.importScripts || !e.postMessage)
                    return !1; var a = !0, b = e.onmessage; return e.onmessage = function () { a = !1; }, e.postMessage("", "*"), e.onmessage = b, a; };
                if (h()) {
                    e.setImmediate = function (a) { f.push(a), e.postMessage(g, "*"); };
                    var i = function (a) { if (a.source === self && a.data === g && (a.stopPropagation ? a.stopPropagation() : a.cancelBubble = !0, f.length > 0)) {
                        var b = f.shift();
                        return b();
                    } };
                    e.addEventListener ? e.addEventListener("message", i, !0) : e.attachEvent("onmessage", i);
                }
                else if (e.MessageChannel) {
                    var j = new e.MessageChannel;
                    j.port1.onmessage = function (a) { return f.length > 0 ? f.shift()() : void 0; }, e.setImmediate = function (a) { f.push(a), j.port2.postMessage(""); };
                }
                else
                    e.setImmediate = function (a) { return setTimeout(a, 0); };
            } Array.prototype.indexOf || (Array.prototype.indexOf = function (a, b) { if (void 0 === b && (b = 0), !this)
                throw new TypeError; var c = this.length; if (0 === c || d >= c)
                return -1; var d = b; 0 > d && (d = c + d); for (var e = d; c > e; e++)
                if (this[e] === a)
                    return e; return -1; }), Array.prototype.forEach || (Array.prototype.forEach = function (a, b) { var c, d; for (c = 0, d = this.length; d > c; ++c)
                c in this && a.call(b, this[c], c, this); }), Array.prototype.map || (Array.prototype.map = function (a, b) { var c, d, e; if (null == this)
                throw new TypeError(" this is null or not defined"); var f = Object(this), g = f.length >>> 0; if ("function" != typeof a)
                throw new TypeError(a + " is not a function"); for (b && (c = b), d = new Array(g), e = 0; g > e;) {
                var h, i;
                e in f && (h = f[e], i = a.call(c, h, e, f), d[e] = i), e++;
            } return d; }), "undefined" != typeof document && void 0 === window.chrome && document.write("<!-- IEBinaryToArray_ByteStr -->\r\n<script type='text/vbscript'>\r\nFunction IEBinaryToArray_ByteStr(Binary)\r\n IEBinaryToArray_ByteStr = CStr(Binary)\r\nEnd Function\r\nFunction IEBinaryToArray_ByteStr_Last(Binary)\r\n Dim lastIndex\r\n lastIndex = LenB(Binary)\r\n if lastIndex mod 2 Then\r\n IEBinaryToArray_ByteStr_Last = Chr( AscB( MidB( Binary, lastIndex, 1 ) ) )\r\n Else\r\n IEBinaryToArray_ByteStr_Last = \"\"\r\n End If\r\nEnd Function\r\n</script>\r\n"), a("./generic/emscripten_fs"), a("./backend/IndexedDB"), a("./backend/XmlHttpRequest"), a("./backend/async_mirror"), a("./backend/dropbox"), a("./backend/html5fs"), a("./backend/in_memory"), a("./backend/localStorage"), a("./backend/mountable_file_system"), a("./backend/overlay"), a("./backend/workerfs"), a("./backend/zipfs"), b.exports = a("./core/browserfs"); }, { "./backend/IndexedDB": 3, "./backend/XmlHttpRequest": 4, "./backend/async_mirror": 5, "./backend/dropbox": 6, "./backend/html5fs": 7, "./backend/in_memory": 8, "./backend/localStorage": 9, "./backend/mountable_file_system": 10, "./backend/overlay": 11, "./backend/workerfs": 12, "./backend/zipfs": 13, "./core/browserfs": 15, "./core/global": 24, "./generic/emscripten_fs": 32 }] }, {}, [38])(38);
});
var Module = null;
(function (Promise) {
    function IALoader(canvas, game, callbacks, scale) {
        if (typeof game !== 'string') {
            game = game.toString();
        }
        if (!callbacks || typeof callbacks !== 'object') {
            callbacks = { before_emulator: updateLogo,
                before_run: callbacks };
        }
        else {
            if (typeof callbacks.before_emulator === 'function') {
                var func = callbacks.before_emulator;
                callbacks.before_emulator = function () {
                    updateLogo();
                    func();
                };
            }
            else {
                callbacks.before_emulator = updateLogo;
            }
        }
        function img(src) {
            var img = new Image();
            img.src = src;
            return img;
        }
        if (/archive\.org$/.test(document.location.hostname)) {
            var images = { ia: img("/images/ialogo.png"),
                mame: img("/images/mame.png"),
                mess: img("/images/mame.png"),
                dosbox: img("/images/dosbox.png")
            };
        }
        else {
            images = { ia: img("other_logos/ia-logo-150x150.png"),
                mame: img("other_logos/mame.png"),
                mess: img("other_logos/mame.png"),
                dosbox: img("other_logos/dosbox.png")
            };
        }
        function updateLogo() {
            if (emulator_logo) {
                emulator.setSplashImage(emulator_logo);
            }
        }
        var SAMPLE_RATE = (function () {
            var audio_ctx = window.AudioContext || window.webkitAudioContext || false;
            if (!audio_ctx) {
                return false;
            }
            var sample = new audio_ctx;
            return sample.sampleRate.toString();
        }());
        var metadata, module, modulecfg, config_args, emulator_logo, emulator = new Emulator(canvas).setScale(scale)
            .setSplashImage(images.ia)
            .setLoad(loadFiles)
            .setCallbacks(callbacks);
        var cfgr;
        function loadFiles(fetch_file, splash) {
            splash.setTitle("Downloading game metadata...");
            return new Promise(function (resolve, reject) {
                var loading = fetch_file('Game Metadata', get_meta_url(game), 'document');
                loading.then(function (data) {
                    metadata = data;
                    splash.setTitle("Downloading emulator metadata...");
                    module = metadata.getElementsByTagName("emulator")
                        .item(0)
                        .textContent;
                    return fetch_file('Emulator Metadata', get_emulator_config_url(module), 'text', true);
                }, function () {
                    splash.setTitle("Failed to download IA item metadata!");
                    splash.failed_loading = true;
                    reject(1);
                })
                    .then(function (data) {
                    if (splash.failed_loading) {
                        return;
                    }
                    modulecfg = JSON.parse(data);
                    var mame = modulecfg &&
                        'arcade' in modulecfg &&
                        parseInt(modulecfg['arcade'], 10);
                    var get_files;
                    if (module && module.indexOf("dosbox") === 0) {
                        emulator_logo = images.dosbox;
                        cfgr = DosBoxLoader;
                        get_files = get_dosbox_files;
                    }
                    else if (module) {
                        if (mame) {
                            emulator_logo = images.mame;
                            cfgr = JSMAMELoader;
                            get_files = get_mame_files;
                        }
                        else {
                            emulator_logo = images.mess;
                            cfgr = JSMESSLoader;
                            get_files = get_mess_files;
                        }
                    }
                    else {
                        throw new Error("Unknown module type " + module + "; cannot configure the emulator.");
                    }
                    var nr = modulecfg['native_resolution'];
                    config_args = [cfgr.emulatorJS(get_js_url(modulecfg.js_filename)),
                        cfgr.locateAdditionalEmulatorJS(locateAdditionalJS),
                        cfgr.fileSystemKey(game),
                        cfgr.nativeResolution(nr[0], nr[1]),
                        cfgr.aspectRatio(nr[0] / nr[1]),
                        cfgr.sampleRate(SAMPLE_RATE),
                        cfgr.muted(!(typeof $ !== 'undefined' && $.cookie && $.cookie('unmute')))];
                    if (module && module.indexOf("dosbox") === 0) {
                        config_args.push(cfgr.startExe(metadata.getElementsByTagName("emulator_start")
                            .item(0)
                            .textContent));
                    }
                    else if (module) {
                        config_args.push(cfgr.driver(modulecfg.driver), cfgr.extraArgs(modulecfg.extra_args));
                        if (modulecfg.peripherals && modulecfg.peripherals[0]) {
                            config_args.push(cfgr.peripheral(modulecfg.peripherals[0], get_game_name(game)));
                        }
                    }
                    splash.setTitle("Downloading game data...");
                    return Promise.all(get_files(cfgr, metadata, modulecfg));
                }, function () {
                    if (splash.failed_loading) {
                        return;
                    }
                    splash.setTitle("Failed to download emulator metadata!");
                    splash.failed_loading = true;
                    reject(2);
                })
                    .then(function (game_files) {
                    if (splash.failed_loading) {
                        return;
                    }
                    resolve(cfgr.apply(null, extend(config_args, game_files)));
                }, function () {
                    if (splash.failed_loading) {
                        return;
                    }
                    splash.setTitle("Failed to configure emulator!");
                    splash.failed_loading = true;
                    reject(3);
                });
            });
        }
        function locateAdditionalJS(filename) {
            if ("file_locations" in modulecfg && filename in modulecfg.file_locations) {
                return get_js_url(modulecfg.file_locations[filename]);
            }
            throw new Error("Don't know how to find file: " + filename);
        }
        function get_dosbox_files(cfgr, emulator, modulecfg) {
            var urls = [], files = [];
            var len = metadata.documentElement.childNodes.length, i;
            for (i = 0; i < len; i++) {
                var node = metadata.documentElement.childNodes[i];
                var m = node.nodeName.match(/^dosbox_drive_[a-zA-Z]$/);
                if (m) {
                    urls.push(node);
                }
            }
            var len = urls.length;
            for (i = 0; i < len; i++) {
                var node = urls[i], drive = node.nodeName.split('_')[2], title = 'Game File (' + (i + 1) + ' of ' + (game ? len + 1 : len) + ')', url = get_zip_url(node.textContent);
                files.push(cfgr.mountZip(drive, cfgr.fetchFile(title, url)));
            }
            if (game) {
                var drive = 'c', title = 'Game File (' + (i + 1) + ' of ' + (game ? len + 1 : len) + ')', url = get_zip_url(game);
                files.push(cfgr.mountZip(drive, cfgr.fetchFile(title, url)));
            }
            return files;
        }
        function get_mess_files(cfgr, metadata, modulecfg) {
            var files = [], bios_files = modulecfg['bios_filenames'];
            bios_files.forEach(function (fname, i) {
                if (fname) {
                    var title = "Bios File (" + (i + 1) + " of " + bios_files.length + ")";
                    files.push(cfgr.mountFile('/' + fname, cfgr.fetchFile(title, get_bios_url(fname))));
                }
            });
            files.push(cfgr.mountFile('/' + get_game_name(game), cfgr.fetchFile("Game File", get_zip_url(game))));
            files.push(cfgr.mountFile('/' + modulecfg['driver'] + '.cfg', cfgr.fetchOptionalFile("CFG File", get_other_emulator_config_url(module))));
            return files;
        }
        function get_mame_files(cfgr, metadata, modulecfg) {
            var files = [], bios_files = modulecfg['bios_filenames'];
            bios_files.forEach(function (fname, i) {
                if (fname) {
                    var title = "Bios File (" + (i + 1) + " of " + bios_files.length + ")";
                    files.push(cfgr.mountFile('/' + fname, cfgr.fetchFile(title, get_bios_url(fname))));
                }
            });
            files.push(cfgr.mountFile('/' + get_game_name(game), cfgr.fetchFile("Game File", get_zip_url(game))));
            files.push(cfgr.mountFile('/' + modulecfg['driver'] + '.cfg', cfgr.fetchOptionalFile("CFG File", get_other_emulator_config_url(module))));
            return files;
        }
        var get_item_name = function (game_path) {
            return game_path.split('/').shift();
        };
        var get_game_name = function (game_path) {
            return game_path.split('/').pop();
        };
        var get_emulator_config_url = function (module) {
            return '//cors.archive.org/cors/emularity_engine_v1/' + module + '.json';
        };
        var get_other_emulator_config_url = function (module) {
            return '//cors.archive.org/cors/emularity_config_v1/' + module + '.cfg';
        };
        var get_meta_url = function (game_path) {
            var path = game_path.split('/');
            return "//cors.archive.org/cors/" + path[0] + "/" + path[0] + "_meta.xml";
        };
        var get_zip_url = function (game_path) {
            return "//cors.archive.org/cors/" + game_path;
        };
        var get_js_url = function (js_filename) {
            return "//cors.archive.org/cors/emularity_engine_v1/" + js_filename;
        };
        var get_bios_url = function (bios_filename) {
            return "//cors.archive.org/cors/emularity_bios_v1/" + bios_filename;
        };
        function mountat(drive) {
            return function (data) {
                return { drive: drive,
                    mountpoint: "/" + drive,
                    data: data
                };
            };
        }
        return emulator;
    }
    function BaseLoader() {
        return Array.prototype.reduce.call(arguments, extend);
    }
    BaseLoader.canvas = function (id) {
        var elem = id instanceof Element ? id : document.getElementById(id);
        return { canvas: elem };
    };
    BaseLoader.emulatorJS = function (url) {
        return { emulatorJS: url };
    };
    BaseLoader.locateAdditionalEmulatorJS = function (func) {
        return { locateAdditionalJS: func };
    };
    BaseLoader.fileSystemKey = function (key) {
        return { fileSystemKey: key };
    };
    BaseLoader.nativeResolution = function (width, height) {
        if (typeof width !== 'number' || typeof height !== 'number')
            throw new Error("Width and height must be numbers");
        return { nativeResolution: { width: Math.floor(width), height: Math.floor(height) } };
    };
    BaseLoader.aspectRatio = function (ratio) {
        if (typeof ratio !== 'number')
            throw new Error("Aspect ratio must be a number");
        return { aspectRatio: ratio };
    };
    BaseLoader.sampleRate = function (rate) {
        return { sample_rate: rate };
    };
    BaseLoader.muted = function (muted) {
        return { muted: muted };
    };
    BaseLoader.mountZip = function (drive, file) {
        return { files: [{ drive: drive,
                    mountpoint: "/" + drive,
                    file: file
                }] };
    };
    BaseLoader.mountFile = function (filename, file) {
        return { files: [{ mountpoint: filename,
                    file: file
                }] };
    };
    BaseLoader.fetchFile = function (title, url) {
        return { title: title, url: url };
    };
    BaseLoader.fetchOptionalFile = function (title, url) {
        return { title: title, url: url, optional: true };
    };
    BaseLoader.localFile = function (title, data) {
        return { title: title, data: data };
    };
    function DosBoxLoader() {
        var config = Array.prototype.reduce.call(arguments, extend);
        config.emulator_arguments = build_dosbox_arguments(config.emulatorStart, config.files);
        return config;
    }
    DosBoxLoader.__proto__ = BaseLoader;
    DosBoxLoader.startExe = function (path) {
        return { emulatorStart: path };
    };
    function JSMESSLoader() {
        var config = Array.prototype.reduce.call(arguments, extend);
        config.emulator_arguments = build_mess_arguments(config.muted, config.mess_driver, config.nativeResolution, config.sample_rate, config.peripheral, config.extra_mess_args);
        config.needs_jsmess_webaudio = true;
        return config;
    }
    JSMESSLoader.__proto__ = BaseLoader;
    JSMESSLoader.driver = function (driver) {
        return { mess_driver: driver };
    };
    JSMESSLoader.peripheral = function (peripheral, game) {
        return { peripheral: [peripheral, game] };
    };
    JSMESSLoader.extraArgs = function (args) {
        return { extra_mess_args: args };
    };
    function JSMAMELoader() {
        var config = Array.prototype.reduce.call(arguments, extend);
        config.emulator_arguments = build_mame_arguments(config.muted, config.mess_driver, config.nativeResolution, config.sample_rate, config.extra_mess_args);
        config.needs_jsmess_webaudio = true;
        return config;
    }
    JSMAMELoader.__proto__ = BaseLoader;
    JSMAMELoader.driver = function (driver) {
        return { mess_driver: driver };
    };
    JSMAMELoader.extraArgs = function (args) {
        return { extra_mess_args: args };
    };
    var build_mess_arguments = function (muted, driver, native_resolution, sample_rate, peripheral, extra_args) {
        var args = [driver,
            '-verbose',
            '-rompath', 'emulator',
            '-window',
            '-nokeepaspect'];
        if (native_resolution && "width" in native_resolution && "height" in native_resolution) {
            args.push('-resolution', [native_resolution.width, native_resolution.height].join('x'));
        }
        if (muted) {
            args.push('-sound', 'none');
        }
        else if (sample_rate) {
            args.push('-samplerate', sample_rate);
        }
        if (peripheral && peripheral[0]) {
            args.push('-' + peripheral[0], '/emulator/' + (peripheral[1].replace(/\//g, '_')));
        }
        if (extra_args) {
            args = args.concat(extra_args);
        }
        return args;
    };
    var build_mame_arguments = function (muted, driver, native_resolution, sample_rate, extra_args) {
        var args = [driver,
            '-verbose',
            '-rompath', 'emulator',
            '-window',
            '-nokeepaspect'];
        if (native_resolution && "width" in native_resolution && "height" in native_resolution) {
            args.push('-resolution', [native_resolution.width, native_resolution.height].join('x'));
        }
        if (muted) {
            args.push('-sound', 'none');
        }
        else if (sample_rate) {
            args.push('-samplerate', sample_rate);
        }
        if (extra_args) {
            args = args.concat(extra_args);
        }
        return args;
    };
    var build_dosbox_arguments = function (emulator_start, files) {
        var args = ['-conf', '/emulator/dosbox.conf'];
        var len = files.length;
        for (var i = 0; i < len; i++) {
            if ('mountpoint' in files[i]) {
                args.push('-c', 'mount ' + files[i].drive + ' /emulator' + files[i].mountpoint);
            }
        }
        var path = emulator_start.split(/\\|\//);
        args.push('-c', /^[a-zA-Z]:$/.test(path[0]) ? path.shift() : 'c:');
        var prog = path.pop();
        if (path && path.length)
            args.push('-c', 'cd ' + path.join('/'));
        args.push('-c', prog);
        return args;
    };
    function Emulator(canvas, callbacks, loadFiles) {
        if (typeof callbacks !== 'object') {
            callbacks = { before_emulator: null,
                before_run: callbacks };
        }
        var js_url;
        var requests = [];
        var drawloadingtimer;
        var has_started = false;
        var loading = false;
        var defaultSplashColors = { foreground: '#333333',
            background: 'transparent',
            failure: '#990000' };
        var splash = { loading_text: "",
            spinning: true,
            finished_loading: false,
            colors: defaultSplashColors,
            table: null,
            splashimg: new Image() };
        var SDL_PauseAudio;
        this.mute = function (state) {
            try {
                if (!SDL_PauseAudio)
                    SDL_PauseAudio = Module.cwrap('SDL_PauseAudio', '', ['number']);
                SDL_PauseAudio(state);
            }
            catch (x) {
                console.log("Unable to change audio state:", x);
            }
            return this;
        };
        window.addEventListener("gamepadconnected", function (e) {
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
        });
        window.addEventListener("gamepaddisconnected", function (e) {
            console.log("Gamepad disconnected from index %d: %s", e.gamepad.index, e.gamepad.id);
        });
        var css_resolution, scale, aspectRatio;
        if (!canvas.hasAttribute("width")) {
            var style = getComputedStyle(canvas);
            canvas.width = parseInt(style.width, 10);
            canvas.height = parseInt(style.height, 10);
        }
        this.setScale = function (_scale) {
            scale = _scale;
            return this;
        };
        this.setSplashImage = function (_splashimg) {
            if (_splashimg) {
                if (_splashimg instanceof Image) {
                    if (splash.splashimg.parentNode) {
                        splash.splashimg.src = _splashimg.src;
                    }
                    else {
                        splash.splashimg = _splashimg;
                    }
                }
                else {
                    splash.splashimg.src = _splashimg;
                }
            }
            return this;
        };
        this.setCSSResolution = function (_resolution) {
            css_resolution = _resolution;
            return this;
        };
        this.setAspectRatio = function (_aspectRatio) {
            aspectRatio = _aspectRatio;
            return this;
        };
        this.setCallbacks = function (_callbacks) {
            if (typeof _callbacks !== 'object') {
                callbacks = { before_emulator: null,
                    before_run: _callbacks };
            }
            else {
                callbacks = _callbacks;
            }
            return this;
        };
        this.setSplashColors = function (colors) {
            splash.colors = colors;
            return this;
        };
        this.setLoad = function (loadFunc) {
            loadFiles = loadFunc;
            return this;
        };
        var start = function (options) {
            if (has_started)
                return false;
            has_started = true;
            if (typeof options !== 'object') {
                options = { waitAfterDownloading: true };
            }
            var k, c, game_data;
            setupSplash(canvas, splash);
            drawsplash();
            var loading;
            if (typeof loadFiles === 'function') {
                loading = loadFiles(fetch_file, splash);
            }
            else {
                loading = Promise.resolve(loadFiles);
            }
            loading.then(function (_game_data) {
                return new Promise(function (resolve, reject) {
                    var deltaFS = new BrowserFS.FileSystem.InMemory();
                    if (BrowserFS.FileSystem.IndexedDB.isAvailable()) {
                        var AsyncMirrorFS = BrowserFS.FileSystem.AsyncMirrorFS, IndexedDB = BrowserFS.FileSystem.IndexedDB;
                        deltaFS = new AsyncMirrorFS(deltaFS, new IndexedDB(function (e, fs) {
                            if (e) {
                                finish();
                            }
                            else {
                                deltaFS.initialize(function (e) {
                                    if (e) {
                                        reject(e);
                                    }
                                    else {
                                        finish();
                                    }
                                });
                            }
                        }, "fileSystemKey" in _game_data ? _game_data.fileSystemKey
                            : "emularity"));
                    }
                    else {
                        finish();
                    }
                    function finish() {
                        game_data = _game_data;
                        game_data.fs = new BrowserFS.FileSystem.OverlayFS(deltaFS, new BrowserFS.FileSystem.MountableFileSystem());
                        var Buffer = BrowserFS.BFSRequire('buffer').Buffer;
                        function fetch(file) {
                            if ('data' in file && file.data !== null && typeof file.data !== 'undefined') {
                                return Promise.resolve(file.data);
                            }
                            return fetch_file(file.title, file.url, 'arraybuffer', file.optional);
                        }
                        function mountat(drive) {
                            return function (data) {
                                if (data !== null) {
                                    drive = drive.toLowerCase();
                                    var mountpoint = '/' + drive;
                                    game_data.fs.getOverlayedFileSystems().readable.mount(mountpoint, BFSOpenZip(new Buffer(data)));
                                }
                            };
                        }
                        function saveat(filename) {
                            return function (data) {
                                if (data !== null) {
                                    game_data.fs.writeFileSync('/' + filename, new Buffer(data), null, flag_w, 0x1a4);
                                }
                            };
                        }
                        Promise.all(game_data.files
                            .map(function (f) {
                            if (f && f.file) {
                                if (f.drive) {
                                    return fetch(f.file).then(mountat(f.drive));
                                }
                                else if (f.mountpoint) {
                                    return fetch(f.file).then(saveat(f.mountpoint));
                                }
                            }
                            return null;
                        }))
                            .then(resolve, reject);
                    }
                });
            })
                .then(function (game_files) {
                if (!game_data || splash.failed_loading) {
                    return;
                }
                if (options.waitAfterDownloading) {
                    return new Promise(function (resolve, reject) {
                        splash.setTitle("Click to play");
                        splash.spinning = false;
                        window.addEventListener('keypress', k = keyevent(resolve));
                        canvas.addEventListener('click', c = resolve);
                        splash.splashElt.addEventListener('click', c);
                    });
                }
                return Promise.resolve();
            }, function () {
                if (splash.failed_loading) {
                    return;
                }
                splash.setTitle("Failed to download game data!");
                splash.failed_loading = true;
            })
                .then(function () {
                if (!game_data || splash.failed_loading) {
                    return;
                }
                splash.spinning = true;
                window.removeEventListener('keypress', k);
                canvas.removeEventListener('click', c);
                splash.splashElt.removeEventListener('click', c);
                blockSomeKeys();
                setupFullScreen();
                disableRightClickContextMenu(canvas);
                if (game_data.needs_jsmess_webaudio)
                    setup_jsmess_webaudio();
                canvas.requestPointerLock = getpointerlockenabler();
                moveConfigToRoot(game_data.fs);
                Module = init_module(game_data.emulator_arguments, game_data.fs, game_data.locateAdditionalJS, game_data.nativeResolution, game_data.aspectRatio);
                if (callbacks && callbacks.before_emulator) {
                    try {
                        callbacks.before_emulator();
                    }
                    catch (x) {
                        console.log(x);
                    }
                }
                if (game_data.emulatorJS) {
                    splash.setTitle("Launching Game");
                    attach_script(game_data.emulatorJS);
                }
                else {
                    splash.setTitle("Non-system disk or disk error");
                }
            }, function () {
                if (splash.failed_loading) {
                    return;
                }
                splash.setTitle("Invalid media, track 0 bad or unusable");
                splash.failed_loading = true;
            });
            return this;
        };
        this.start = start;
        var init_module = function (args, fs, locateAdditionalJS, nativeResolution, aspectRatio) {
            return { arguments: args,
                screenIsReadOnly: true,
                print: function (text) { console.log(text); },
                canvas: canvas,
                noInitialRun: false,
                locateFile: locateAdditionalJS,
                preInit: function () {
                    splash.setTitle("Loading game file(s) into file system");
                    BrowserFS.initialize(fs);
                    var BFS = new BrowserFS.EmscriptenFS();
                    FS.mkdir('/emulator');
                    FS.mount(BFS, { root: '/' }, '/emulator');
                    splash.finished_loading = true;
                    splash.hide();
                    setTimeout(function () {
                        resizeCanvas(canvas, scale = scale || scale, css_resolution = nativeResolution || css_resolution, aspectRatio = aspectRatio || aspectRatio);
                    });
                    if (callbacks && callbacks.before_run) {
                        window.setTimeout(function () { callbacks.before_run(); }, 0);
                    }
                }
            };
        };
        var formatSize = function (event) {
            if (event.lengthComputable)
                return "(" + (event.total ? (event.loaded / event.total * 100).toFixed(0)
                    : "100") +
                    "%; " + formatBytes(event.loaded) +
                    " of " + formatBytes(event.total) + ")";
            return "(" + formatBytes(event.loaded) + ")";
        };
        var formatBytes = function (bytes, base10) {
            if (bytes === 0)
                return "0 B";
            var unit = base10 ? 1000 : 1024, units = base10 ? ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
                : ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"], exp = parseInt((Math.log(bytes) / Math.log(unit))), size = bytes / Math.pow(unit, exp);
            return size.toFixed(1) + ' ' + units[exp];
        };
        var fetch_file = function (title, url, rt, optional) {
            var row = addRow(splash.table);
            var titleCell = row[0], statusCell = row[1];
            titleCell.textContent = title;
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = rt || 'arraybuffer';
                xhr.onprogress = function (e) {
                    titleCell.textContent = title + " " + formatSize(e);
                };
                xhr.onload = function (e) {
                    if (xhr.status === 200) {
                        success();
                        resolve(xhr.response);
                    }
                    else if (optional) {
                        success();
                        resolve(null);
                    }
                    else {
                        failure();
                        reject();
                    }
                };
                xhr.onerror = function (e) {
                    if (optional) {
                        success();
                        resolve(null);
                    }
                    else {
                        failure();
                        reject();
                    }
                };
                function success() {
                    statusCell.textContent = "✔";
                    titleCell.textContent = title;
                    titleCell.style.fontWeight = 'bold';
                    titleCell.parentNode.style.backgroundColor = splash.getColor('transparent');
                    titleCell.parentNode.style.color = splash.getColor('transparent');
                }
                function failure() {
                    statusCell.textContent = "✘";
                    titleCell.textContent = title;
                    titleCell.style.fontWeight = 'bold';
                    titleCell.parentNode.style.backgroundColor = splash.getColor('failure');
                    titleCell.parentNode.style.color = splash.getColor('background');
                }
                xhr.send();
            });
        };
        function keyevent(resolve) {
            return function (e) {
                if (e.which == 32) {
                    e.preventDefault();
                    resolve();
                }
            };
        }
        ;
        var resizeCanvas = function (canvas, scale, resolution, aspectRatio) {
            if (scale && resolution) {
                canvas.style.imageRendering = '-moz-crisp-edges';
                canvas.style.imageRendering = '-o-crisp-edges';
                canvas.style.imageRendering = '-webkit-optimize-contrast';
                canvas.style.imageRendering = 'optimize-contrast';
                canvas.style.imageRendering = 'crisp-edges';
                canvas.style.imageRendering = 'pixelated';
                canvas.style.imageRendering = 'optimizeSpeed';
                canvas.style.width = resolution.width * scale + 'px';
                canvas.style.height = resolution.height * scale + 'px';
                canvas.width = resolution.width;
                canvas.height = resolution.height;
            }
        };
        var clearCanvas = function () {
            var context = canvas.getContext('2d');
            context.fillStyle = splash.getColor('background');
            context.fillRect(0, 0, canvas.width, canvas.height);
            console.log("canvas cleared");
        };
        function setupSplash(canvas, splash) {
            splash.splashElt = document.getElementById("emularity-splash-screen");
            if (!splash.splashElt) {
                splash.splashElt = document.createElement('div');
                splash.splashElt.setAttribute('id', "emularity-splash-screen");
                splash.splashElt.style.position = 'absolute';
                splash.splashElt.style.top = canvas.offsetTop + 'px';
                splash.splashElt.style.left = canvas.offsetLeft + 'px';
                splash.splashElt.style.width = canvas.offsetWidth + 'px';
                splash.splashElt.style.color = splash.getColor('foreground');
                splash.splashElt.style.backgroundColor = splash.getColor('background');
                canvas.parentElement.appendChild(splash.splashElt);
            }
            splash.splashimg.setAttribute('id', "emularity-splash-image");
            splash.splashimg.style.display = 'block';
            splash.splashimg.style.marginLeft = 'auto';
            splash.splashimg.style.marginRight = 'auto';
            splash.splashElt.appendChild(splash.splashimg);
            splash.titleElt = document.createElement('span');
            splash.titleElt.setAttribute('id', "emularity-splash-title");
            splash.titleElt.style.display = 'block';
            splash.titleElt.style.width = '100%';
            splash.titleElt.style.marginTop = "1em";
            splash.titleElt.style.marginBottom = "1em";
            splash.titleElt.style.textAlign = 'center';
            splash.titleElt.style.font = "24px sans-serif";
            splash.titleElt.textContent = " ";
            splash.splashElt.appendChild(splash.titleElt);
            var table = document.getElementById("dosbox-progress-indicator");
            if (!table) {
                table = document.createElement('table');
                table.setAttribute('id', "dosbox-progress-indicator");
                table.style.width = "50%";
                table.style.color = splash.getColor('foreground');
                table.style.backgroundColor = splash.getColor('background');
                table.style.marginLeft = 'auto';
                table.style.marginRight = 'auto';
                table.style.borderCollapse = 'separate';
                table.style.borderSpacing = "2px";
                splash.splashElt.appendChild(table);
            }
            splash.table = table;
        }
        splash.setTitle = function (title) {
            splash.titleElt.textContent = title;
        };
        splash.hide = function () {
            splash.splashElt.style.display = 'none';
        };
        splash.getColor = function (name) {
            return name in splash.colors ? splash.colors[name]
                : defaultSplashColors[name];
        };
        var addRow = function (table) {
            var row = table.insertRow(-1);
            row.style.textAlign = 'center';
            var cell = row.insertCell(-1);
            cell.style.position = 'relative';
            var titleCell = document.createElement('span');
            titleCell.textContent = '—';
            titleCell.style.verticalAlign = 'center';
            titleCell.style.minHeight = "24px";
            cell.appendChild(titleCell);
            var statusCell = document.createElement('span');
            statusCell.style.position = 'absolute';
            statusCell.style.left = "0";
            statusCell.style.paddingLeft = "0.5em";
            cell.appendChild(statusCell);
            return [titleCell, statusCell];
        };
        var drawsplash = function () {
            canvas.setAttribute('moz-opaque', '');
            if (!splash.splashimg.src) {
                splash.splashimg.src = "logo/emularity_color_small.png";
            }
        };
        function attach_script(js_url) {
            if (js_url) {
                var head = document.getElementsByTagName('head')[0];
                var newScript = document.createElement('script');
                newScript.type = 'text/javascript';
                newScript.src = js_url;
                head.appendChild(newScript);
            }
        }
        function getpointerlockenabler() {
            return canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
        }
        function getfullscreenenabler() {
            return canvas.webkitRequestFullScreen || canvas.mozRequestFullScreen || canvas.requestFullScreen;
        }
        this.isfullscreensupported = function () {
            return !!(getfullscreenenabler());
        };
        function setupFullScreen() {
            var self = this;
            var fullScreenChangeHandler = function () {
                if (!(document.mozFullScreenElement || document.fullScreenElement)) {
                    resizeCanvas(canvas, scale, css_resolution, aspectRatio);
                }
            };
            if ('onfullscreenchange' in document) {
                document.addEventListener('fullscreenchange', fullScreenChangeHandler);
            }
            else if ('onmozfullscreenchange' in document) {
                document.addEventListener('mozfullscreenchange', fullScreenChangeHandler);
            }
            else if ('onwebkitfullscreenchange' in document) {
                document.addEventListener('webkitfullscreenchange', fullScreenChangeHandler);
            }
        }
        ;
        this.requestFullScreen = function () {
            Module.requestFullScreen(1, 0);
        };
        function blockSomeKeys() {
            function keypress(e) {
                if (e.which >= 33 && e.which <= 40) {
                    e.preventDefault();
                    return false;
                }
                return true;
            }
            window.onkeydown = keypress;
        }
        function disableRightClickContextMenu(element) {
            element.addEventListener('contextmenu', function (e) {
                if (e.button == 2) {
                    e.preventDefault();
                }
            });
        }
    }
    ;
    function BFSOpenZip(loadedData) {
        return new BrowserFS.FileSystem.ZipFS(loadedData);
    }
    ;
    var flag_r = { isReadable: function () { return true; },
        isWriteable: function () { return false; },
        isTruncating: function () { return false; },
        isAppendable: function () { return false; },
        isSynchronous: function () { return false; },
        isExclusive: function () { return false; },
        pathExistsAction: function () { return 0; },
        pathNotExistsAction: function () { return 1; }
    };
    var flag_w = { isReadable: function () { return false; },
        isWriteable: function () { return true; },
        isTruncating: function () { return false; },
        isAppendable: function () { return false; },
        isSynchronous: function () { return false; },
        isExclusive: function () { return false; },
        pathExistsAction: function () { return 0; },
        pathNotExistsAction: function () { return 3; }
    };
    function moveConfigToRoot(fs) {
        var dosboxConfPath = null;
        function searchDirectory(dirPath) {
            fs.readdirSync(dirPath).forEach(function (item) {
                if (dosboxConfPath) {
                    return;
                }
                if (item === '.' || item === '..') {
                    return;
                }
                var itemPath = dirPath + (dirPath[dirPath.length - 1] !== '/' ? "/" : "") + item, itemStat = fs.statSync(itemPath);
                if (itemStat.isDirectory(itemStat.mode)) {
                    searchDirectory(itemPath);
                }
                else if (item === 'dosbox.conf') {
                    dosboxConfPath = itemPath;
                }
            });
        }
        searchDirectory('/');
        if (dosboxConfPath !== null) {
            fs.writeFileSync('/dosbox.conf', fs.readFileSync(dosboxConfPath, null, flag_r), null, flag_w, 0x1a4);
        }
    }
    ;
    function extend(a, b) {
        if (a === null)
            return b;
        if (b === null)
            return a;
        var ta = typeof a, tb = typeof b;
        if (ta !== tb) {
            if (ta === 'undefined')
                return b;
            if (tb === 'undefined')
                return a;
            throw new Error("Cannot extend an " + ta + " with an " + tb);
        }
        if (Array.isArray(a))
            return a.concat(b);
        if (ta === 'object') {
            Object.keys(b).forEach(function (k) {
                a[k] = extend(a[k], b[k]);
            });
            return a;
        }
        return b;
    }
    function setup_jsmess_webaudio() {
        var jsmess_web_audio = (function () {
            var context = null;
            var gain_node = null;
            var eventNode = null;
            var sampleScale = 32766;
            var inputBuffer = new Float32Array(44100);
            var bufferSize = 44100;
            var start = 0;
            var rear = 0;
            var watchDogDateLast = null;
            var watchDogTimerEvent = null;
            function lazy_init() {
                if (context) {
                    return;
                }
                if (typeof AudioContext != "undefined") {
                    context = new AudioContext();
                }
                else if (typeof webkitAudioContext != "undefined") {
                    context = new webkitAudioContext();
                }
                else {
                    return;
                }
                gain_node = context.createGain();
                gain_node.gain.value = 1.0;
                gain_node.connect(context.destination);
                init_event();
            }
            ;
            function init_event() {
                if (typeof context.createScriptProcessor == "function") {
                    eventNode = context.createScriptProcessor(4096, 0, 2);
                }
                else {
                    eventNode = context.createJavaScriptNode(4096, 0, 2);
                }
                eventNode.onaudioprocess = tick;
                eventNode.connect(gain_node);
                initializeWatchDogForFirefoxBug();
            }
            ;
            function initializeWatchDogForFirefoxBug() {
                watchDogDateLast = (new Date()).getTime();
                if (watchDogTimerEvent === null) {
                    watchDogTimerEvent = setInterval(function () {
                        var timeDiff = (new Date()).getTime() - watchDogDateLast;
                        if (timeDiff > 500) {
                            disconnect_old_event();
                            init_event();
                        }
                    }, 500);
                }
            }
            ;
            function disconnect_old_event() {
                eventNode.disconnect();
                eventNode.onaudioprocess = null;
                eventNode = null;
            }
            ;
            function set_mastervolume(attenuation_in_decibels) {
                lazy_init();
                if (!context)
                    return;
                var gain_web_audio = 1.0 + (+attenuation_in_decibels / +32);
                if (gain_web_audio < +0)
                    gain_web_audio = +0;
                else if (gain_web_audio > +1)
                    gain_web_audio = +1;
                gain_node.gain.value = gain_web_audio;
            }
            ;
            function update_audio_stream(pBuffer, samples_this_frame) {
                lazy_init();
                if (!context)
                    return;
                for (var i = 0, l = samples_this_frame | 0; i < l; i++) {
                    var offset = ((pBuffer / 2) | 0) +
                        ((i * 2) | 0);
                    var left_sample = HEAP16[offset];
                    var right_sample = HEAP16[(offset + 1) | 0];
                    var left_sample_float = left_sample / sampleScale;
                    var right_sample_float = right_sample / sampleScale;
                    inputBuffer[rear++] = left_sample_float;
                    inputBuffer[rear++] = right_sample_float;
                    if (rear == bufferSize) {
                        rear = 0;
                    }
                    if (start == rear) {
                        start += 2;
                        if (start == bufferSize) {
                            start = 0;
                        }
                    }
                }
            }
            ;
            function tick(event) {
                for (var bufferCount = 0, buffers = []; bufferCount < 2; ++bufferCount) {
                    buffers[bufferCount] = event.outputBuffer.getChannelData(bufferCount);
                }
                for (var index = 0; index < 4096 && start != rear; ++index) {
                    buffers[0][index] = inputBuffer[start++];
                    buffers[1][index] = inputBuffer[start++];
                    if (start == bufferSize) {
                        start = 0;
                    }
                }
                while (index < 4096) {
                    buffers[0][index] = 0;
                    buffers[1][index++] = 0;
                }
                watchDogDateLast = (new Date()).getTime();
            }
            function get_context() {
                return context;
            }
            ;
            function sample_count() {
                if (!context) {
                    return -1;
                }
                var count = rear - start;
                if (start > rear) {
                    count += bufferSize;
                }
                return count;
            }
            return {
                set_mastervolume: set_mastervolume,
                update_audio_stream: update_audio_stream,
                get_context: get_context,
                sample_count: sample_count
            };
        })();
        window.jsmess_set_mastervolume = jsmess_web_audio.set_mastervolume;
        window.jsmess_update_audio_stream = jsmess_web_audio.update_audio_stream;
        window.jsmess_sample_count = jsmess_web_audio.sample_count;
        window.jsmess_web_audio = jsmess_web_audio;
    }
    window.IALoader = IALoader;
    window.DosBoxLoader = DosBoxLoader;
    window.JSMESSLoader = JSMESSLoader;
    window.JSMAMELoader = JSMAMELoader;
    window.Emulator = Emulator;
})(typeof Promise === 'undefined' ? ES6Promise.Promise : Promise);
var JSMESS = JSMESS || {};
JSMESS.ready = function (f) { f(); };
var RetroJolt = (function () {
    function RetroJolt(options) {
        var defaults = {
            scale: 1,
            target: '#emulator-target',
            loadingImg: '',
        };
        var config = __assign({}, defaults, options);
        var romFile = RetroJolt.getFilenameFromUrl(config.rom);
        var args = [];
        window.indexedDB.deleteDatabase('emularity');
        args.push(JSMESSLoader.driver(config.driver));
        args.push(JSMESSLoader.nativeResolution(config.resolution[0], config.resolution[1]));
        args.push(JSMESSLoader.emulatorJS(config.js));
        if (config.bios) {
            for (var i = 0; i < config.bios.length; ++i) {
                var biosFile = RetroJolt.getFilenameFromUrl(config.bios[i]);
                args.push(JSMESSLoader.mountFile(biosFile, JSMESSLoader.fetchFile('Bios File (' + (i + 1) + ')', config.bios[i])));
            }
        }
        args.push(JSMESSLoader.mountFile(romFile, JSMESSLoader.fetchFile('Game File', config.rom)));
        args.push(JSMESSLoader.mountFile('default.cfg', JSMESSLoader.fetchFile('Input Config', config.cfg)));
        if (config.peripherals && config.peripherals.length > 0) {
            for (var _i = 0, _a = config.peripherals; _i < _a.length; _i++) {
                var peripheral = _a[_i];
                args.push(JSMESSLoader.peripheral(peripheral, romFile));
            }
        }
        if (!config.args || !config.args.length) {
            config.args = [];
        }
        config.args.push('-ctrlrpath');
        config.args.push('emulator');
        config.args.push('-ctrlr');
        config.args.push('default');
        args.push(JSMESSLoader.extraArgs(config.args));
        this.emulator = new Emulator(document.querySelector(config.target), null, JSMESSLoader.apply(null, args))
            .setScale(config.scale)
            .setSplashImage(config.loadingImg)
            .start();
    }
    RetroJolt.getFilenameFromUrl = function (url) {
        return url.split('/').pop().split('?')[0].split('#')[0];
    };
    return RetroJolt;
}());
