global.XMLHttpRequest = require('xhr2');
global.WebSocket = require('ws');

var DHClient = require('./devicehive/devicehive.client.js');
var config = require('./config');
var cql = require('node-cassandra-cql');
var _ = require('lodash');

var app = ({
    
    readConfig: function() {
        var requiredParams = ['serviceUrl', 'serviceUrl', 'deviceId', 'cassandraHost',
            'keyspace', 'notificationTable'];

        _.each(requiredParams, function (param, i) {
            if (!config[param]) {
                throw new Error(param + ' param is required!');            
            }
        });
        
        this.serviceUrl = config.serviceUrl;
        app.accessKey = config.accessKey;
        app.deviceId = config.deviceId;
        app.cassandraHost = config.cassandraHost;
        app.keyspace = config.keyspace;
        app.notificationTable = config.notificationTable;
    },
    
    start: function () {
        this.readConfig();

        app.dhClient = new DHClient(app.serviceUrl, app.accessKey);

        app.initDh();

        app.initCassandra();
        
        console.log('-- App started...');
    },

    stop: function() {
        shutdownCassandraClient();
    },
    
    initDh: function () {
        app.dhClient.getDevice(app.deviceId,
            function (err, device) {
                if (err) {
                    console.log('-- Could not connect to DeviceHive. Will retry in 5 secs...');
                
                    setTimeout(function () {
                        app.initDh();
                    }, 5 * 1000);
                    return;
                }
            
                app.logDeviceInfo(device);
                app.subscribeNotifications(device);
            });
    },
    
    initCassandra: function () {
        app.client = new cql.Client({
            hosts: app.cassandraHost,
            keyspace: app.keyspace
        });

        app.client.connect(function () {
            console.log('Cassandra client connected.');
        });

    },

    shutdownCassandraClient: function() {
        app.client.shutdown(function () {
            console.log('Cassandra client disconnected.');
        });
    },

    subscribeNotifications: function (device) {
        app.dhClient.channelStateChanged(function (data) {
            app.logChannelState(data.newState);
        });

        app.dhClient.openChannel(function (err, channel) {
            if (err) {
                return app.logError(err);
            }
            
            app.handleLostWsConnection(app.dhClient.channel, channel);

            var subscription = app.dhClient.subscribe(null, { deviceIds: device.id});
            subscription.message(function () {
                app.handleNotification.apply(app, arguments);
            });
        }, 'websocket'/*'longpolling'*/);
    },
    
    handleLostWsConnection: function (channel, name) {
        
        if (name !== 'websocket') {
            return;
        }

        channel._wsApi._transport._native.onclose = function () {
            console.log('-- Websockets connection lost. Try to restore...');
            app.initDh();
        };
    },
    
    handleNotification: function (deviceId, notification) {
        notification.deviceId = deviceId;
        console.log(JSON.stringify(notification));

        app.saveToCassandra(notification.parameters);
    },

    saveToCassandra: function (data) {
        var template = "INSERT INTO <%= keyspace %>.<%= table %>(time, tag, name, value)  VALUES ('<%= time %>', '<%= tag %>', '<%= name %>', <%= value %>);";
        
        _.merge(data, {keyspace: app.keyspace, table: app.notificationTable}); // add keyspace and table to the data object
        
        var query = _.template(template, data);

        app.client.execute(query, function (err, result) {
            if (err) {
                return app.logError(err);
            }
        });
    },

    
    logChannelState: function (state) {
        var stateName = 'n/a';
        if (state === DHClient.channelStates.connected)
            stateName = 'Connected';
        else if (state === DHClient.channelStates.connecting)
            stateName = 'Connecting';
        else if (state === DHClient.channelStates.disconnected)
            stateName = 'Disconnected';
        console.log('-- Channel state: ' + stateName);
    },
    
    logDeviceInfo: function (device) {
        console.log('-- Device: ' + device.name);
        console.log('-- Status: ' + device.status);
    },

    logError: function (e) { 
        console.log('-- Error: ' + JSON.stringify(e));
    }
});

app.start();

app.saveToCassandra(
    {
        time: new Date().getUTCDate(),
        tag: "test Tag",
        name: "test Name",
        value: 12345
    }
);
