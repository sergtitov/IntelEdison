var lcd = require('./intel-edison/lcd');
var board = require('./intel-edison/intel-edison');
var utils = require('./intel-edison/utils');

var DeviceHive = require('./devicehive/devicehive.device.js')
var device = new DeviceHive('http://ecloud.dataart.com/ecapi9', '98fc96fb-f8a2-4c66-af11-1a5efde41fb6', '7uwateyMWi3lljR93nCMumlgEGFCIglsw7tMv2egmJ0=')

function getTemperature(val)
{
	var B=3975;
	var t = val;
    var resistance=(1023-t)*10000/t; //get the resistance of the sensor;
    var temperature=1/(Math.log(resistance/10000)/B+1/298.15)-273.15;//convert to temperature via datasheet ;

    return temperature;
}

lcd.begin(16, 2);
lcd.clear();
lcd.print("Hi Dima!");

device.openChannel(
	function(err, name)
	{ 
		if(err) return;
		
		console.log(name);
			
		device.subscribe(function(err)
			{
				if(err) return; 

				device.command(function(cmd)
				{
					console.log(cmd);

					if (cmd.command == "setText")
					{
						lcd.clear();
						lcd.print(cmd.parameters["text"]);
					}

					if (cmd.command == "setRelay")
					{
						board.digitalWrite(2, cmd.parameters["state"]);
					}
				});
			});

			board.analogRead(0, 3, function(err, data)
			{
				var t = getTemperature(data);
				console.log("Temperature is: %d", t);
				device.sendNotification('Temp', { value : t }, function(err, res) 
				{ 
					console.log(res) 
				});
			});

			board.analogRead(1, 3, function(err, data)
			{
				device.sendNotification('Analog', { value : data }, function(err, res) 
				{ 
					console.log(res) 
				});
			});

			board.digitalRead(3, function(err, data)
			{
				device.sendNotification('Button', { value : data }, function(err, res) 
				{ 
					console.log(res) 
				});				
			});

	}, 'longpolling');