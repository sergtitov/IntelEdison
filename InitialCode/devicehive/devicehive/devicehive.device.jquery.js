(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.DHJQuery = factory();
  }
}(this, function() {
var utils = (function () {
    'use strict';

    var utils = {
        isArray: Array.isArray || function (obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },

        isString: function (obj) {
            return Object.prototype.toString.call(obj) === '[object String]';
        },

        inArray: function (val, arr, ind) {
            if (arr) {
                if (Array.prototype.indexOf) {
                    return arr.indexOf(val, ind);
                } else {
                    var len = arr.length,
                        i = +ind || 0;

                    if (!len || (i >= len)) {
                        return -1;
                    }

                    i = i < 0 ? Math.max(0, len + i) : i;

                    for (; i < len; i++) {
                        if (i in arr && arr[i] === val) {
                            return i;
                        }
                    }
                }
                return -1;
            }
        },

        forEach: function (obj, callback) {
            var i;
            if (this.isArray(obj)) {
                var len = obj.length;
                for (i = 0; i < len; i++) {
                    if (callback.call(obj[i], i, obj[i]) === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        if (callback.call(obj[i], i, obj[i]) === false) {
                            break;
                        }
                    }
                }
            }
            return obj;
        },

        // used for kinoma because it doesn't support Array.prototype.slice.call(arguments)
        toArray: function (args) {
            if (!args) {
                return null;
            }

            var mass = [];
            for (var i = 0, l = args.length; i < l; i++) {
                mass.push(args[i]);
            }
            return mass;
        },

        parseDate: function (date) {
            return new Date(date.substring(0, 4), parseInt(date.substring(5, 7), 10) - 1, date.substring(8, 10),
                date.substring(11, 13), date.substring(14, 16), date.substring(17, 19), date.substring(20, 23));
        },

        formatDate: function (date) {
            if (utils.isString(date))
                return date; // already formatted string - do not modify

            if (Object.prototype.toString.call(date) !== '[object Date]')
                throw new Error('Invalid object type');

            var pad = function (value, length) {
                value = String(value);
                length = length || 2;
                while (value.length < length)
                    value = "0" + value;
                return value;
            };

            return date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate()) + "T" +
                pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":" + pad(date.getUTCSeconds()) + "." + pad(date.getUTCMilliseconds(), 3);
        },

        encodeBase64: function (data) {
            var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc = "", tmp_arr = [];
            if (!data) {
                return data;
            }
            do { // pack three octets into four hexets
                o1 = data.charCodeAt(i++);
                o2 = data.charCodeAt(i++);
                o3 = data.charCodeAt(i++);
                bits = o1 << 16 | o2 << 8 | o3;
                h1 = bits >> 18 & 0x3f;
                h2 = bits >> 12 & 0x3f;
                h3 = bits >> 6 & 0x3f;
                h4 = bits & 0x3f;

                // use hexets to index into b64, and append result to encoded string
                tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
            } while (i < data.length);
            enc = tmp_arr.join('');
            var r = data.length % 3;
            return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
        },

        noop: function () {
        },

        createCallback: function (cb) {
            return cb && Object.prototype.toString.call(cb) === '[object Function]' ? cb : this.noop;
        },

        isGuid: function (val) {
            return val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
        },

        serializeQuery: function (obj) {
            var str = '',
                key,
                val;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (str != '') {
                        str += '&';
                    }
                    val = obj[key];
                    val = val == null ? '' : val;
                    str += encodeURIComponent(key) + '=' + encodeURIComponent(val);
                }
            }
            return str;
        },

        makeUrl: function (params) {
            var method = params.method,
                url = params.url,
                data = params.data;

            if (method === 'GET') {
                if (data) {
                    data = utils.serializeQuery(data);
                    data && (url += (url.indexOf('?') != -1 ? '&' : '?') + data);
                }
            }
            return url;
        },

        serverErrorMessage: function (http) {
            var errMsg = 'DeviceHive server error';
            if (http.responseText) {
                try {
                    errMsg += ' - ' + JSON.parse(http.responseText).message;
                }
                catch (e) {
                    errMsg += ' - ' + http.responseText;
                }
            }
            return {error: errMsg};
        },

        errorMessage: function (msg) {
            return {error: 'DeviceHive error: ' + msg};
        },

        setTimeout: function (cb, delay) {
            return setTimeout(cb, delay);
        },

        clearTimeout: function (timeoutID) {
            clearTimeout(timeoutID);
        }
    };

    return utils;
}());
var Events = (function () {
    'use strict';

    var Events = function () {
    };

    Events.prototype = {
        bind: function (name, callback, context) {
            this._handlers || (this._handlers = {});
            var events = this._handlers[name] || (this._handlers[name] = []);
            events.push({callback: callback, context: context || this});
            return this;
        },

        unbind: function (name, callback) {
            if (!name && !callback) {
                this._handlers = null;
                return this;
            }

            var events = this._handlers[name];
            if (!events) {
                return this;
            }

            if (!callback) {
                delete this._handlers[name];
                return this;
            }

            var remaining = [];

            utils.forEach(events, function (ind, ev) {
                if (callback && callback !== ev.callback) {
                    remaining.push(ev);
                }
            });

            if (remaining.length) {
                this._handlers[name] = remaining;
            } else {
                delete this._handlers[name];
            }

            return this;
        },

        trigger: function (name) {
            if (!this._handlers) {
                return this;
            }

            var args = utils.toArray(arguments).slice(1),
                events = this._handlers[name];

            events && this._triggerEvents(events, args);
            return this;
        },

        _triggerEvents: function (events, args) {
            utils.forEach(events, function (ind, ev) {
                ev.callback.apply(ev.context, args);
            });
        }

    };

    return Events;
}());
var http = (function () {
    'use strict';

    var getXhr = utils.noop();

    if (typeof XMLHttpRequest !== 'undefined') {
        getXhr = function () {
            return new XMLHttpRequest();
        };
    } else {
        getXhr = function () {
            try {
                return new ActiveXObject('Microsoft.XMLHTTP');
            } catch (e) {
                return null;
            }
        };
    }

    if (!getXhr()) {
        throw new Error('DeviceHive: XMLHttpRequest is not available');
    }

    return {
        send: function (params, cb) {
            params.method = params.method || 'GET';
            cb = utils.createCallback(cb);

            var xhr = getXhr(),
                headers = params.headers,
                url = utils.makeUrl(params),
                method = params.method;

            xhr.open(method, url, true);

            if (method == 'POST' || method == 'PUT') {
                xhr.setRequestHeader('Content-Type', 'application/json');
                params.data = JSON.stringify(params.data);
            }

            xhr.onreadystatechange = function () {
                var isSuccess, err;

                if (xhr.readyState === 4) {

                    isSuccess = xhr.status && xhr.status >= 200 && xhr.status < 300 || xhr.status === 304;
                    if (!isSuccess) {
                        err = utils.serverErrorMessage(xhr);
                    }

                    var result = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                    return cb(err, result);
                }
            };

            if (headers) {
                for (var key in headers) {
                    if (headers[key] !== void 0) {
                        xhr.setRequestHeader(key, headers[key]);
                    }
                }
            }

            xhr.send(params.data || void 0);

            return {
                abort: function () {
                    xhr.abort();
                }
            }
        }
    }
}());
var restApi = (function () {
    'use strict';

    var authTypes = {
        USER: 1,
        KEY: 2,
        DEVICE: 4
    };

    var isFlagSet = function (variable, flag) {
        return (variable & flag) == flag;
    };

    var applyAuth = function (request, params) {
        var authType = params.authTypes;
        var auth = params.auth;
        request.headers = params.headers || {};

        if (!authType)
            return;

        if (!auth) {
            // library bug
            throw new Error('Authentication parameters must be specified for this endpoint. Endpoint auth code: ' + authType)
        }

        if (isFlagSet(authType, authTypes.KEY) && auth.accessKey) {
            // Set bearer token authorization
            request.headers['Authorization'] = 'Bearer ' + auth.accessKey;
        } else if (isFlagSet(authType, authTypes.DEVICE)
            && utils.isGuid(auth.deviceId)
            && utils.isGuid(auth.deviceKey)) {

            // Set Device authorization
            request.headers['Auth-DeviceID'] = auth.deviceId;
            request.headers['Auth-DeviceKey'] = auth.deviceKey;
        } else if (isFlagSet(authType, authTypes.USER)) {

            // Set User authorization
            request.headers['Authorization'] = 'Basic ' + utils.encodeBase64(auth.login + ':' + auth.password);
        } else {
            // library bug, therefore crash is necessary
            throw new Error('Invalid authentication parameters. Endpoint auth code: ' + authType);
        }
    };

    var send = function (params, cb) {
        var req = {
            method: params.method,
            url: params.base + params.relative,
            data: params.data
        };
        applyAuth(req, params, cb);
        return http.send(req, cb);
    };

    return {

        /* API INFO */

        info: function (serviceUrl, cb) {
            return send({
                base: serviceUrl,
                relative: '/info',
                method: 'GET'
            }, cb);
        },

        /* ACCESS KEYS */

        getAccessKeys: function (serviceUrl, auth, userId, cb) {
            return send({
                base: serviceUrl,
                relative: '/user/' + userId + '/accesskey',
                method: 'GET',
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        getAccessKey: function (serviceUrl, auth, userId, keyId, cb) {
            return send({
                base: serviceUrl,
                relative: '/user/' + userId + '/accesskey/' + userId,
                method: 'GET',
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        insertAccessKey: function (serviceUrl, auth, userId, key, cb) {
            return send({
                base: serviceUrl,
                relative: '/user/' + userId + '/accesskey',
                data: key,
                method: 'POST',
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        updateAccessKey: function (serviceUrl, auth, userId, keyId, key, cb) {
            return send({
                base: serviceUrl,
                relative: '/user/' + userId + '/accesskey/' + keyId,
                data: key,
                method: 'PUT',
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        deleteAccessKey: function (serviceUrl, auth, userId, keyId, cb) {
            return send({
                base: serviceUrl,
                relative: '/user/' + userId + '/accesskey/' + keyId,
                method: 'DELETE',
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        /* DEVICE */

        getDevices: function (serviceUrl, auth, filter, cb) {
            return send({
                base: serviceUrl,
                relative: '/device',
                method: 'GET',
                data: filter,
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        getDevice: function (serviceUrl, auth, deviceId, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId,
                method: 'GET',
                authTypes: authTypes.USER | authTypes.KEY | authTypes.DEVICE,
                auth: auth
            }, cb);
        },

        getEquipmentState: function (serviceUrl, auth, deviceId, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/equipment',
                method: 'GET',
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        registerDevice: function (serviceUrl, auth, deviceId, device, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId,
                method: 'PUT',
                data: device,
                authTypes: authTypes.USER | authTypes.KEY | authTypes.DEVICE,
                auth: auth
            }, cb);
        },

        /* DEVICE CLASS */

        getDeviceClass: function (serviceUrl, auth, deviceClassId, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/class/' + deviceClassId,
                method: 'GET',
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        /* COMMAND */

        getCommands: function (serviceUrl, auth, deviceId, filter, cb) {
            if (filter && filter.start) {
                filter.start = utils.formatDate(filter.start);
            }
            if (filter && filter.end) {
                filter.end = utils.formatDate(filter.end);
            }

            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/command',
                method: 'GET',
                data: filter,
                authTypes: authTypes.USER | authTypes.KEY | authTypes.DEVICE,
                auth: auth
            }, cb);
        },

        getCommand: function (serviceUrl, auth, deviceId, cmdId, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/command/' + cmdId,
                method: 'GET',
                authTypes: authTypes.USER | authTypes.KEY | authTypes.DEVICE,
                auth: auth
            }, cb);
        },

        insertCommand: function (serviceUrl, auth, deviceId, cmd, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/command',
                method: 'POST',
                data: cmd,
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        updateCommand: function (serviceUrl, auth, deviceId, cmdId, cmd, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/command/' + cmdId,
                method: 'PUT',
                data: cmd,
                authTypes: authTypes.USER | authTypes.KEY | authTypes.DEVICE,
                auth: auth
            }, cb);
        },

        pollCommands: function (serviceUrl, auth, deviceId, params, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/command/poll',
                method: 'GET',
                data: params,
                authTypes: authTypes.USER | authTypes.KEY | authTypes.DEVICE,
                auth: auth
            }, cb);
        },

        pollManyCommands: function (serviceUrl, auth, params, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/command/poll',
                method: 'GET',
                data: params,
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        waitCommandResult: function (serviceUrl, auth, deviceId, cmdId, params, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/command/' + cmdId + '/poll',
                method: 'GET',
                data: params,
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        /* NOTIFICATION */

        getNotifications: function (serviceUrl, auth, deviceId, filter, cb) {
            if (filter && filter.start) {
                filter.start = utils.formatDate(filter.start);
            }
            if (filter && filter.end) {
                filter.end = utils.formatDate(filter.end);
            }

            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/notification',
                method: 'GET',
                data: filter,
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        getNotification: function (serviceUrl, auth, deviceId, notificationId, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/notification/' + notificationId,
                method: 'GET',
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        insertNotification: function (serviceUrl, auth, deviceId, notification, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/notification',
                method: 'POST',
                data: notification,
                authTypes: authTypes.USER | authTypes.KEY | authTypes.DEVICE,
                auth: auth
            }, cb);
        },

        pollNotifications: function (serviceUrl, auth, deviceId, params, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/' + deviceId + '/notification/poll',
                method: 'GET',
                data: params,
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        pollManyNotifications: function (serviceUrl, auth, params, cb) {
            return send({
                base: serviceUrl,
                relative: '/device/notification/poll',
                method: 'GET',
                data: params,
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        /* NETWORK */

        getNetworks: function (serviceUrl, auth, filter, cb) {
            return send({
                base: serviceUrl,
                relative: '/network',
                method: 'GET',
                data: filter,
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        getNetwork: function (serviceUrl, auth, networkId, cb) {
            return send({
                base: serviceUrl,
                relative: '/network/' + networkId,
                method: 'GET',
                authTypes: authTypes.USER | authTypes.KEY,
                auth: auth
            }, cb);
        },

        insertNetwork: function (serviceUrl, auth, network, cb) {
            return send({
                base: serviceUrl,
                relative: '/network',
                method: 'POST',
                data: network,
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        updateNetwork: function (serviceUrl, auth, networkId, network, cb) {
            return send({
                base: serviceUrl,
                relative: '/network/' + networkId,
                method: 'PUT',
                data: network,
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        deleteNetwork: function (serviceUrl, auth, networkId, cb) {
            return send({
                base: serviceUrl,
                relative: '/network/' + networkId,
                method: 'DELETE',
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        /* OAUTH CLIENT */

        /* OAUTH GRANT */

        /* USER */

        getCurrentUser: function (serviceUrl, auth, cb) {
            return send({
                base: serviceUrl,
                relative: '/user/current',
                method: 'GET',
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        },

        updateCurrentUser: function (serviceUrl, auth, user, cb) {
            return send({
                base: serviceUrl,
                relative: '/user/current',
                method: 'PUT',
                data: user,
                authTypes: authTypes.USER,
                auth: auth
            }, cb);
        }
    };
}());
var DeviceHive = (function () {
    'use strict';

    var changeChannelState = function (self, newState, oldState) {
        oldState = oldState || self.channelState;
        if (oldState === self.channelState) {
            self.channelState = newState;
            self._events = self._events || new Events();
            self._events.trigger('onChannelStateChanged',
                { oldState: oldState, newState: newState });
            return true;
        }
        return false;
    };

    // DeviceHive channel states
    var channelStates = {
        disconnected: 0, // channel is not connected
        connecting: 1,   // channel is being connected
        connected: 2     // channel is connected
    };

    DeviceHive = {
        channelStates: channelStates,

        channelState: channelStates.disconnected,

        // opens a communication channel to the server
        // supported channels: webSockets, longPolling
        // callback (cb) must be a function with the following arguments:
        //    - errors: an error object if any errors occurred
        //    - channel: a name of the opened channel
        openChannel: function (cb, channels) {
            cb = utils.createCallback(cb);

            if (!changeChannelState(this, this.channelStates.connecting, this.channelStates.disconnected)) {
                cb(null);
                return;
            }

            var self = this;

            function manageInfo(info) {
                self.serverInfo = info;

                if (!channels) {
                    channels = [];
                    utils.forEach(self._channels, function (t) {
                        channels.push(t);
                    });
                }
                else if (!utils.isArray(channels)) {
                    channels = [channels];
                }

                var emptyChannel = true;

                (function checkChannel(channels) {
                    utils.forEach(channels, function (ind) { // enumerate all channels in order
                        var channel = this;
                        if (self._channels[channel]) {
                            self._channel = new self._channels[channel](self);
                            self._channel.open(function (err) {
                                if (err) {
                                    var channelsToCheck = channels.slice(++ind);
                                    if (!channelsToCheck.length)
                                        return cb(utils.errorMessage('Cannot open any of the specified channels'));
                                    checkChannel(channelsToCheck);
                                } else {
                                    changeChannelState(self, self.channelStates.connected);
                                    cb(null, channel);
                                }
                            });

                            return emptyChannel = false;
                        }
                    });
                })(channels);

                emptyChannel && cb(utils.errorMessage('None of the specified channels are supported'));
            }

            if (this.serverInfo) {
                manageInfo(this.serverInfo);
            } else {
                restApi.info(this.serviceUrl, function (err, res) {
                    if (!err) {
                        manageInfo(res);
                    } else {
                        changeChannelState(self, self.channelStates.disconnected);
                        cb(err, res);
                    }
                });
            }
        },

        // closes the communications channel to the server
        // callback (cb) must be a function which will be executed when channel is closed
        closeChannel: function (cb) {
            cb = utils.createCallback(cb);

            if (this.channelState === this.channelStates.disconnected)
                return cb(null);

            var self = this;
            if (this._channel) {
                this._channel.close(function (err, res) {
                    if (err) {
                        return cb(err, res);
                    }

                    self._channel = null;
                    changeChannelState(self, self.channelStates.disconnected);
                    return cb(null);
                });
            }
        },

        // adds a callback that will be invoked when the communication channel state is changed
        // callback (cb) must be a function with the following arguments:
        //    - channelState: channel state object with the following fields:
        //        - oldState: previous channel state
        //        - newState: current channel state
        channelStateChanged: function (cb) {
            cb = utils.createCallback(cb);

            var self = this;
            this._events = this._events || new Events();
            this._events.bind('onChannelStateChanged', function (data) {
                cb.call(self, data);
            });
            return this;
        },

        _ensureConnectedState: function () {
            if (this.channelState === this.channelStates.disconnected) {
                throw new Error('DeviceHive: Channel is not opened, call the .openChannel() method first');
            }
            if (this.channelState === this.channelStates.connecting) {
                throw new Error('DeviceHive: Channel has not been initialized, use .openChannel().done() to run logic after the channel is initialized');
            }
        }
    };

    return DeviceHive;
}());
var LongPolling = (function () {
    'use strict';

    var poll = function (self, timestamp) {
        var params = { timestamp: timestamp };

        var continuePollingCb = function (err, res) {
            if (!err) {
                var lastTimestamp = null;
                if (res) {
                    utils.forEach(res, function () {
                        var newTimestamp = self._poller.resolveTimestamp(this);
                        if (!lastTimestamp || newTimestamp > lastTimestamp) {
                            lastTimestamp = newTimestamp;
                        }

                        self._poller.onData(this);
                    });
                }

                poll(self, lastTimestamp || timestamp);
            } else {
                if (self._polling) {
                    utils.setTimeout(function () {
                        poll(self, timestamp);
                    }, 1000);
                }
            }
        };

        self.pollRequest = self._polling && self._poller.executePoll(params, continuePollingCb);
    };

    var LongPolling = function (serviceUrl, poller) {
        this.serviceUrl = serviceUrl;
        this._poller = poller
    };

    LongPolling.prototype = {
        startPolling: function (cb) {
            cb = utils.createCallback(cb);

            this.stopPolling();

            var self = this;
            return restApi.info(this.serviceUrl, function (err, res) {
                if (err)
                    return cb(err);

                self._polling = true;

                poll(self, res.serverTimestamp);
                return cb(null);
            });
        },

        stopPolling: function () {
            this._polling = false;
            this.pollRequest && this.pollRequest.abort();
        }
    };

    return LongPolling;
}());
var WebSocketTransport = (function () {
    'use strict';

    var WebSocketTransport = utils.noop;

    WebSocketTransport.requestTimeout = 10000;

    WebSocketTransport.prototype = {
        _handler: utils.noop,

        open: function (url, cb) {
            cb = utils.createCallback(cb);

            if (!WebSocket) {
                return cb(utils.errorMessage('WebSockets are not supported'));
            }

            var self = this;
            var opened = false;

            this._native = new WebSocket(url);

            this._native.onopen = function (e) {
                opened = true;
                cb(null, e);
            };

            this._native.onmessage = function (e) {
                var response = JSON.parse(e.data);

                if (self._requests && response.requestId) {
                    var request = self._requests[response.requestId];
                    if (request) {
                        utils.clearTimeout(request.timeout);
                        if (response.status && response.status == 'success') {
                            request.cb(null, response);
                        }
                        else {
                            request.cb({error: response.error});
                        }
                        delete self._requests[response.requestId];
                    }
                }
                else {
                    self._handler(response);
                }
            };

            this._native.onclose = function (e) {
                if (!opened) {
                    var err = utils.errorMessage('WebSocket connection has failed to open');
                    err.data = e;
                    return cb(err);
                }
            };
        },

        close: function (cb) {
            cb = utils.createCallback(cb);

            this._native.onclose = function (e) {
                return cb(null, e);
            };

            this._native.close();
        },

        message: function (cb) {
            this._handler = cb;
        },

        send: function (action, data, cb) {
            cb = utils.createCallback(cb);

            var self = this,
                request = {};

            this._requestId = this._requestId || 0;
            request.id = ++this._requestId;
            //callback for request
            request.cb = cb;
            request.timeout = utils.setTimeout(function () {
                request.cb(utils.errorMessage('Operation timeout'));
                delete self._requests[request.id];
            }, WebSocketTransport.requestTimeout);

            this._requests = this._requests || {};
            this._requests[request.id] = request;

            data = data || {};
            data.requestId = request.id;
            data.action = action;
            this._native.send(JSON.stringify(data));

            return request;
        }
    };

    return WebSocketTransport;
}());
var WebSocketClientApi = (function () {
    'use strict';

    var WebSocketClientApi = function (events) {
        this._transport = new WebSocketTransport();
        this._transport.message(function (response) {
            if (response.action == 'command/insert' && response.command && response.command.id) {
                events.trigger('onCommandInsert', response.deviceGuid, response.command);
            }

            if (response.action == 'command/update') {
                events.trigger('onCommandUpdate', response.command);
            }

            if (response.action == 'notification/insert' && response.deviceGuid && response.notification) {
                events.trigger('onNotification', response.deviceGuid, response.notification);
            }
        });
    };

    WebSocketClientApi.prototype = {
        open: function (baseUrl, cb) {
            this._transport.open(baseUrl + '/client', cb);
        },
        close: function (cb) {
            this._transport.close(cb);
        },

        getInfo: function (cb) {
            this._transport.send('server/info', null, cb);
        },

        authenticate: function (username, password, key, cb) {
            this._transport.send('authenticate', {
                login: username,
                password: password,
                accessKey: key
            }, cb);
        },

        sendCommand: function (params, cb) {
            this._transport.send('command/insert', params, cb);
        },
        updateCommand: function (params, cb) {
            this._transport.send('command/update', params, cb);
        },
        commandSubscribe: function (params, cb) {
            this._transport.send('command/subscribe', params, cb);
        },
        commandUnSubscribe: function (params, cb) {
            this._transport.send('command/unsubscribe', params, cb);
        },

        sendNotification: function (params, cb) {
            this._transport.send('notification/insert', params, cb);
        },
        notificationSubscribe: function (params, cb) {
            this._transport.send('notification/subscribe', params, cb);
        },
        notificationUnSubscribe: function (params, cb) {
            this._transport.send('notification/unsubscribe', params, cb);
        }
    };

    return WebSocketClientApi;
}());
var WebSocketDeviceApi = (function () {
    'use strict';

    var WebSocketDeviceApi = function (events) {
        this._transport = new WebSocketTransport();
        this._transport.message(function (response) {
            if (response.action == 'command/insert' && response.command && response.command.id) {
                events.trigger('onCommandInsert', response.deviceGuid, response.command);
            }
        });
    };

    WebSocketDeviceApi.prototype = {
        open: function (baseUrl, cb) {
            return this._transport.open(baseUrl + '/device', cb);
        },
        close: function (cb) {
            return this._transport.close(cb);
        },

        getInfo: function (cb) {
            this._transport.send('server/info', null, cb);
        },

        authenticate: function (deviceId, deviceKey, cb) {
            this._transport.send('authenticate', {
                deviceId: deviceId,
                deviceKey: deviceKey
            }, cb);
        },

        updateCommand: function (params, cb) {
            this._transport.send('command/update', params, cb);
        },
        commandSubscribe: function (params, cb) {
            this._transport.send('command/subscribe', params, cb);
        },
        commandUnSubscribe: function (params, cb) {
            this._transport.send('command/unsubscribe', params, cb);
        },

        sendNotification: function (params, cb) {
            this._transport.send('notification/insert', params, cb);
        }
    };

    return WebSocketDeviceApi;
}());
var LongPollingDeviceChannel = (function () {
    'use strict';

    LongPollingDeviceChannel = function (hive) {
        this._hive = hive;

        this._handler = utils.noop;
        this._events = new Events();
        this.deviceIds = [];

        var self = this;
        this._lp = new LongPolling(this._hive.serviceUrl, {
            executePoll: function (params, continuePollingCb) {
                return self._hive._executeApi(restApi.pollCommands, [params, continuePollingCb]);
            },
            resolveTimestamp: function (data) {
                return data.timestamp;
            },
            onData: function (command) {
                self._events.trigger('onCommandInsert', self._hive.deviceId, command);
            }
        });
    };

    LongPollingDeviceChannel.prototype = {
        open: function (cb) {
            cb = utils.createCallback(cb);
            return cb(null);
        },

        close: function (cb) {
            cb = utils.createCallback(cb);
            this._lp.stopPolling();
            return cb(null);
        },

        subscribe: function (cb) {
            cb = utils.createCallback(cb);
            return this._lp.startPolling(cb);
        },

        unsubscribe: function (cb) {
            cb = utils.createCallback(cb);
            this._lp.stopPolling();
            return cb(null);
        },

        sendNotification: function (params, cb) {
            cb = utils.createCallback(cb);
            return this._hive._executeApi(restApi.insertNotification, [params.notification, cb]);
        },

        updateCommand: function (cmd, cb) {
            cb = utils.createCallback(cb);
            return this._hive._executeApi(restApi.updateCommand, [cmd.commandId, cmd.command, cb]);
        }
    };

    return LongPollingDeviceChannel;
}());
var WebSocketDeviceChannel = (function () {
    'use strict';

    var WebSocketDeviceChannel = function (hive) {
        this._hive = hive;
        this._events = new Events();
    };

    WebSocketDeviceChannel.prototype = {
        open: function (cb) {
            cb = utils.createCallback(cb);

            var webSocketUrl = this._hive.serverInfo.webSocketServerUrl;

            if (!webSocketUrl) {
                cb(utils.errorMessage('Open channel failed. Cannot get web socket server url'));
                return;
            }

            var self = this;

            function onOpen(err) {
                if (err)
                    return cb(err);

                if (self._hive.auth.accessKey) {
                    self._wsApi.authenticate(null, null, self._hive.auth.accessKey, cb);
                } else {
                    self._wsApi.authenticate(self._hive.auth.deviceId, self._hive.auth.deviceKey, cb);
                }
            }

            this._wsApi = self._hive.auth.accessKey
                ? new WebSocketClientApi(self._events)
                : new WebSocketDeviceApi(self._events);

            this._wsApi.open(webSocketUrl, onOpen);
        },

        close: function (cb) {
            cb = utils.createCallback(cb);
            this._wsApi.close(cb);
        },

        subscribe: function (cb) {
            cb = utils.createCallback(cb);
            var self = this;
            this._wsApi.commandSubscribe({ deviceGuids: [this._hive.deviceId]}, function (err, res) {
                if (!err) {
                    self._sub = res.subscriptionId;
                }

                return cb(err);
            });
        },

        unsubscribe: function (cb) {
            cb = utils.createCallback(cb);
            this._wsApi.commandUnSubscribe({ subscriptionId: this._sub }, function (err, res) {
                if (!err) {
                    self._sub = null;
                }

                return cb(err);
            });
        },

        sendNotification: function (params, cb) {
            cb = utils.createCallback(cb);
            this._wsApi.sendNotification(params, cb);
        },

        updateCommand: function (cmd, cb) {
            cb = utils.createCallback(cb);
            this._wsApi.updateCommand(cmd, cb);
        }
    };

    return WebSocketDeviceChannel;
}());
var DHDevice = (function () {
    'use strict';

    // DHDevice object constructor
    // specify device key or access key as an authentication/authorization parameters
    // authentication with device key is deprecated and will be removed in future
    var DHDevice = function (serviceUrl, deviceId, deviceKeyOrAccessKey) {
        this.serviceUrl = serviceUrl;
        this.deviceId = deviceId;

        // save auth information
        this.auth = {};
        if (utils.isGuid(deviceKeyOrAccessKey)) {
            this.auth.deviceId = deviceId;
            this.auth.deviceKey = deviceKeyOrAccessKey;
        } else {
            this.auth.accessKey = deviceKeyOrAccessKey;
        }
    };

    DHDevice.prototype = DeviceHive;
    DHDevice.constructor = DHDevice;

    // gets information about the current device
    // callback (cb) must be a function with the following arguments:
    //    - errors: an error object if any errors occurred
    //    - device: current device information
    DHDevice.prototype.getDevice = function (cb) {
        cb = utils.createCallback(cb);

        return this._executeApi(restApi.getDevice, [cb]);
    };

    // registers a device in the DeviceHive network with the current device id
    // device key will be implicitly added if specified as an authentication parameter
    // callback (cb) must be a function with the following arguments:
    //    - errors: an error object if any errors occurred
    DHDevice.prototype.registerDevice = function (device, cb) {
        cb = utils.createCallback(cb);

        device.key = this.auth.deviceKey;
        return this._executeApi(restApi.registerDevice, [device, cb]);
    };

    // updates a device in the DeviceHive network
    // callback (cb) must be a function with the following arguments:
    //    - errors: an error object if any errors occurred
    DHDevice.prototype.updateDevice = function (device, cb) {
        cb = utils.createCallback(cb);

        return this._executeApi(restApi.registerDevice, [device, cb]);
    };

    // opens a communication channel to the server
    // check DeviceHive.prototype.openChannel for more information
    var openChannelBase = DHDevice.prototype.openChannel;
    DHDevice.prototype.openChannel = function (cb, channels) {
        cb = utils.createCallback(cb);

        var self = this;
        openChannelBase.call(this, function (err, res) {
            if (err)
                return cb(err, res);

            self._channel._events.bind('onCommandInsert', function (deviceId, cmd) {
                cmd.update = function (params, onUpdated) {
                    if (!params || !params.status) {
                        return onUpdated(utils.errorMessage('Command status must be specified'));
                    }

                    var updateParams = {};
                    updateParams.commandId = cmd.id;
                    updateParams.command = params || {};
                    updateParams.deviceGuid = self.deviceId;

                    return self._channel.updateCommand(updateParams, onUpdated);
                };

                self._events.trigger('onCommand', cmd);
            });

            return cb(err, res);
        }, channels);
    };

    // subscribes to device commands
    // callback (cb) must be a function with the following arguments:
    //    - errors: an error object if any errors occurred
    DHDevice.prototype.subscribe = function (cb) {
        cb = utils.createCallback(cb);

        this._ensureConnectedState();
        return this._channel.subscribe(cb);
    };

    // unsubscribes from device commands
    // callback (cb) must be a function with the following arguments:
    //    - errors: an error object if any errors occurred
    DHDevice.prototype.unsubscribe = function (cb) {
        cb = utils.createCallback(cb);

        this._ensureConnectedState();
        return this._channel.unsubscribe(cb);
    };

    // sends new notification to the client
    // callback (cb) must be a function with the following arguments:
    //    - errors: an error object if any errors occurred
    DHDevice.prototype.sendNotification = function (notification, params, cb) {
        cb = utils.createCallback(cb);

        this._ensureConnectedState();
        return this._channel.sendNotification({
            notification: {notification: notification, parameters: params},
            deviceGuid: this.deviceId
        }, cb);
    };

    // adds a callback that will be invoked when a command from client is received
    // callback (cb) must be a function with the following arguments:
    //    - command: received command
    DHDevice.prototype.command = function (cb) {
        cb = utils.createCallback(cb);

        var self = this;
        this._events.bind('onCommand', function (command) {
            cb.call(self, command);
        });
        return this;
    };

    DHDevice.prototype._executeApi = function (endpoint, args) {
        var endpointParams = [this.serviceUrl, this.auth, this.deviceId].concat(args);
        return endpoint.apply(null, endpointParams);
    };

    DHDevice.prototype._channels = {};
    DHDevice.prototype._channels.websocket = WebSocketDeviceChannel;
    DHDevice.prototype._channels.longpolling = LongPollingDeviceChannel;

    return DHDevice;
}());
var jqUtils = (function ($) {
    'use strict';

    var wrapWithDeferred = function (func, ind) {
        return function () {
            var def = $.Deferred(),
                args = Array.prototype.slice.call(arguments);

            ind = (typeof ind !== 'undefined') ? ind : args.length;
            args.splice(ind, 0, function (err, res) {
                if (err) {
                    def.reject(err);
                } else {
                    def.resolve(res);
                }
            });

            return $.extend({}, func.apply(this, args), def.promise());
        }
    };

    return {
        wrapWithDeferredLast: function (func) {
            return wrapWithDeferred(func);
        },

        wrapWithDeferredFirst: function (func) {
            return wrapWithDeferred(func, 0);
        }
    };
}(jQuery));
var DHJQuery = (function ($) {
    'use strict';

    var JqDHDevice = function (serviceUrl, deviceId, deviceKeyOrAccessKey) {
        DHDevice.call(this, serviceUrl, deviceId, deviceKeyOrAccessKey);
    };

    var oldCommandFunc = DHDevice.prototype.command;

    $.extend(JqDHDevice.prototype, DHDevice.prototype, {
        getDevice: jqUtils.wrapWithDeferredLast(DHDevice.prototype.getDevice),
        registerDevice: jqUtils.wrapWithDeferredLast(DHDevice.prototype.registerDevice),
        updateDevice: jqUtils.wrapWithDeferredLast(DHDevice.prototype.updateDevice),
        subscribe: jqUtils.wrapWithDeferredLast(DHDevice.prototype.subscribe),
        unsubscribe: jqUtils.wrapWithDeferredLast(DHDevice.prototype.unsubscribe),
        sendNotification: jqUtils.wrapWithDeferredLast(DHDevice.prototype.sendNotification),
        command: function (cb) {
            var newCb = function (command) {
                var oldUpdate = command.update;

                command.update = jqUtils.wrapWithDeferredLast(oldUpdate);

                cb(command);
            };

            return oldCommandFunc.call(this, newCb);
        },
        openChannel: jqUtils.wrapWithDeferredFirst(DHDevice.prototype.openChannel),
        closeChannel: jqUtils.wrapWithDeferredLast(DHDevice.prototype.closeChannel)
    });

    return $.dhDevice = function (serviceUrl, deviceId, deviceKeyOrAccessKey) {
        return new JqDHDevice(serviceUrl, deviceId, deviceKeyOrAccessKey);
    };

}(jQuery));
return DHJQuery;
}));
