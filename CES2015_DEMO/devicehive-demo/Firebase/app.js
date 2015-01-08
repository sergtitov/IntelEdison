global.XMLHttpRequest = require('xhr2');
global.WebSocket = require('ws');

var config = require('./config');
var Firebase = require("firebase");
var DHClient = require('./devicehive/devicehive.client.js');

// connect to DeviceHive
var dhClient = new DHClient(config.serviceUrl, config.accessKey);

var lamp = null;
dhClient.getDevice(config.deviceId, 
    function (err, device) {
        if (err) {
            console.log('Could not connect to DeviceHive.');
        }

        lamp = device;
        console.log(lamp);

		dhClient.openChannel(function (err, channel) {
		    if (err) {
		        return app.logError(err);
		    }

			// connect to Firebase and subscribe to notifications
			var ref = new Firebase("https://alljoin.firebaseio.com/lamp/state");

			ref.on("value", function(state) {
			  var value = state.val();
			  console.log(value);
			  
			  dhClient.sendCommand(lamp.id, "AllJoyn/SetProperties", 
			  	{
			  		"bus":config.bus,
			  		"port":42,
			  		"object":"/org/allseen/LSF/Lamp",
			  		"interface":"org.allseen.LSF.LampState",
			  		"properties": {"OnOff":value}
			  	});
			});

		}, 'websocket'/*'longpolling'*/);
    });