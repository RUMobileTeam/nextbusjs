var vows       = require('vows'),
    assert     = require('assert'),
    nextbus    = require('../lib/index').client,
    jsv        = require('JSV').JSV.createEnvironment(),
    readfile   = require('fs').readFile,
    async      = require('async'),
    _          = require('underscore'),
    rutgers    = nextbus(),
    invalidnb  = nextbus(),
    dtconn     = nextbus();

var suite = vows.describe('nextbus js general');

var isNumStrArray = function (ar) {
   assert.isArray(ar);
   ar.forEach(function (val) {
      assert.match(val, /[0-9]*/);
   });
};

var isValidPredictions = function (err, data) {
   var item;
   //console.log(JSON.stringify(data, false, 2));
   if (err) {
      throw err;
   }
   if (data) {
      assert.isArray(data);
      for (item in data.predictions) {
         if (data.hasOwnProperty(item)) {
            if (data[item] && data[item].minutes) {
               isNumStrArray(data[item].seconds);
               isNumStrArray(data[item].minutes);
            }
            else {
               isNumStrArray(data[item]);
            }
         }
      }
   } else {
      assert.isNull(data);
   }
};

var isValidVehicleLocations = function (err, data) {
   if (err) {
      throw err;
   }

   // data should be {routeTag: [{id: 4192, direction: 'f_outbound', lat:, lon:, since:, predictable:, heading:, speed:}]}
   
 //  console.dir(data);

   assert.isObject(data);
   _(data).each(function (vehicles, route) {
      _(vehicles).forEach(function (vehicle) {
         assert.match(vehicle.id, /[0-9]*/);
         assert.match(vehicle.direction, /[\w]*/);
         assert.match(vehicle.lat, /-?[0-9]*\.[0-9]*/);
         assert.match(vehicle.lon, /-?[0-9]*\.[0-9]*/);
         assert.match(vehicle.since, /[0-9]*/);
         assert.isBoolean(vehicle.predictable);
         assert.match(vehicle.heading, /[0-9]*/);
         assert.match(vehicle.speed, /-?[0-9]*\.[0-9]*/);
      });
   });
};

suite.addBatch({
   'nextbusjs with no agency cache ' : {
      topic    : function () { invalidnb.routePredict('bus', null, this.callback); },
      'routePredict: correct error handling' : function (err, data) {
         assert.isNotNull(err);
      }
   },

   'downtown connection' : {
      topic    : function () { dtconn.cacheAgency('da', this.callback); },
      'doesnt break' : function (topic) {
         assert.isObject(topic);
      },

      'routePredict dtconn' : {
         topic    : function () {
            dtconn.routePredict('dtconn', 'bpc', this.callback);
         },
         'valid return' : isValidPredictions
      }
   },

   'rutgers' : {
      topic    : function () { rutgers.cacheAgency('rutgers', this.callback); },
      'doesnt break' : function (topic) {
         assert.isObject(topic);
      },

      'routePredict' : {
         'a'    : {
            topic    : function () { rutgers.routePredict('a', null, this.callback); },
            'valid return value' : isValidPredictions
         },

         'b'    : {
            topic    : function () { rutgers.routePredict('b', null, this.callback); },
            'valid return value' : isValidPredictions
         },

         'rexl'    : {
            topic    : function () { rutgers.routePredict('rexl', null, this.callback); },
            'valid return value' : isValidPredictions
         },

         'wknd1'    : {
            topic    : function () { rutgers.routePredict('wknd1', null, this.callback); },
            'valid return value' : isValidPredictions
         },

         'wknd2, both mins & seconds'    : {
            topic: function () { rutgers.routePredict('wknd2', null, this.callback, 'both'); },
            'valid return value': isValidPredictions
         }, 

         'a, both mins & seconds'    : {
            topic: function () { rutgers.routePredict('a', null, this.callback, 'both'); },
            'valid return value': isValidPredictions
         }
      },

      'stopPredict' : {/*
         'invalid stop'    : {
            topic    : function () { 
               rutgers.stopPredict('asdfasdf', null, this.callback);

            },
            'correct error conditioning' : function (err, topic) {
               assert.isObject(err);
            }
         },*/

         'hillw'   : {
            topic    : function () { 
               rutgers.stopPredict('hillw', null, this.callback);
            },
            'valid return value' : isValidPredictions
         },

         'libofsciw' : {
            topic    : function () { 
               rutgers.stopPredict('libofsciw', null, this.callback);
            },
            'valid return value' : isValidPredictions
         },

         'Hill Center' : {
            topic    : function () {
               rutgers.stopPredict('Hill Center', null, this.callback);
            },
            'valid return value' : isValidPredictions
         },
         
         'Rutgers Student Center' : {
            topic    : function () {
               rutgers.stopPredict('Rutgers Student Center', null, this.callback);
            },
            'valid return value' : isValidPredictions
         },

         'Livingston Plaza, both mins & seconds' : {
            topic    : function () {
               rutgers.stopPredict('Livingston Plaza', null, this.callback, 'both');
            },
            'valid return value' : isValidPredictions
         }
      },

      'nearest' : {
         'to silvers' : {
            topic    : function () {
               return rutgers.closestStops(40.518905,-74.455379);
            },
            'valid return' : function (topic) {
               //console.dir(topic);
               assert.isTrue('Werblin Back Entrance' in topic);
            }
         },

         'to au bon pain' : {
            topic    : function () {
               return rutgers.closestStops(40.5026240, -74.4516850);
            }, 
            'valid return' : function (topic) {
               assert.isTrue('Rutgers Student Center' in topic);
            }
         }
      },

      'vehicleLocations' : {
         topic: function () {
            rutgers.vehicleLocations(null, this.callback, true);
         },

         'valid return': isValidVehicleLocations
      }
   }
});

suite.export(module);

