'use strict';

var utils = function utils() {  
};

utils.prototype.sleep = function (ms) 
{
    var start = Date.now();
    while(Date.now() < start + ms) {
      var i = 0;
    }
};

module.exports = new utils();
