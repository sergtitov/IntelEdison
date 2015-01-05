var board = require('./intel-edison/intel-edison');
var utils = require('./intel-edison/utils');

var state = 0;

while(true){
	board.digitalWrite(2, state);
	util.sleep(1000);
	state = ~state;
}
