var lcd = require('./lcd');
var board = require('./intel-edison');
var utils = require('./utils');

function getTemperature(val)
{
	var B=3975;
	var t = val;
    var resistance=(1023-t)*10000/t; //get the resistance of the sensor;
    var temperature=1/(Math.log(resistance/10000)/B+1/298.15)-273.15;//convert to temperature via datasheet ;

    return temperature;
}

lcd.begin(16, 2);
lcd.print("Temperature:");

board.analogRead(0, 3, function(err, data)
{
	var t = getTemperature(data);
	console.log("Temperature is: %d", t);
	lcd.setCursor(0, 1);
	lcd.print(t.toString());
});

// for(var i = 0; i < 255; i++)
// {
// 	lcd.setCursor(0, 1);
// 	lcd.print(getTemperature().toString());
// 	utils.sleep(1000);
// }