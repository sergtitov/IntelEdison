var Cylon = require('cylon');

Cylon.robot({
  connection: { name: 'edison', adaptor: 'intel-iot' },
  device: {name: 'lcd', driver: 'lcd' },

  work: function(my) {
    my.lcd.on('start', function() { my.lcd.print("Hello!"); });
  }
}).start();
