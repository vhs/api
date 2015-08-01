var async = require('async');
var _ = require('underscore');

var spaceRegex = /[^A-Za-z0-9_\-]*/
var nameRegex = /[^A-Za-z0-9_\-]*/
var valueRegex = /[^A-Za-z0-9_\-]*/

var Datapoint = {

  // validator for space name
  _validSpace: function(space) {
    return space.match(spaceRegex) !== null;
  },

  // validator for datapoint name
  _validName: function(name) {
    return name.match(nameRegex) !== null;
  },

  // validator for datapoint value
  _validValue: function(value) {
    return value.match(valueRegex) !== null;
  },

  // keyname for space datas, where all our datapoint names are stored
  _datasKey: function(space) {
    return space + "-datas";
  },

  // keyname for a datapoint
  _dataKey: function(space, name) {
    return space + "-data-" + name;
  },

  // keyname for a datapoint history
  _dataHistoryKey: function(space, name) {
    return space + "-datahistory-" + name;
  },

  // validate just the space name
  _validateSpace: function(space) {
    if (Datapoint._validSpace(space) === false) {
      return new Error("Invalid Space Name");
    }
    return true;
  },

  // validate the space and datapoint name
  _validateSpaceName: function(space, name) {
    if (Datapoint._validName(name) === false) {
      return new Error("Invalid datapoint name");
    }
    return Datapoint._validateSpace(space);
  },

  // validate the space and datapoint name, value pair
  _validateSpaceNameValue: function(space, name, value) {
    if (Datapoint._validValue(value) === false) {
      return new Error("Invalid datapoint value");
    }
    return Datapoint._validateSpaceName(space, name);
  },

  // all datapoints under the space
  all: function(redis, space, cb) {
    var flow = [];
    var context = {};

    // validate
    flow.push(function(flowCb) {
      var validated = Datapoint._validateSpace(space);
      if (validated !== true) {
        flowCb(validated);
      } else {
        flowCb();  
      }
    });

    flow.push(function(flowCb) {
      redis.smembers(Datapoint._datasKey(space), function(err, members) {
        if (err) return flowCb(err);
        context.members = [];
        async.each(
          members,
          function(member, eachCb) {
            Datapoint.get(redis, space, member, function(err, value) {
              if (err) return eachCb(err);
              context.members.push(value);
              eachCb();
            });
          },
          flowCb
        );
      });
    });

    async.series(flow, function(err) {
      if (err) return cb(err);
      cb(null, context.members)
    });
  },

  // does the space have the datapoint?
  has: function(redis, space, name, cb) {
    redis.smembers(space + "datas", function(err, members) {
      if (err) return cb(err);
      if (_.indexOf(members, name) !== -1) {
        cb(null, true);
      }
      cb(null, false);
    });
  },

  // Get a datapoint
  // cb(null, {value:"nope", name:"coffee", last_updated: 0});
  get: function(redis, space, name, cb) {
    var flow = [];
    var context = {};

    flow.push(function(flowCb) {
      redis.get(Datapoint._dataKey(space, name), function(err, _value) {
        if (err) return flowCb(err);
        var value = JSON.parse(_value);
        context.value = value;
        flowCb();
      });
    });

    async.series(flow, function(err) {
      if (err) return cb(err);
      cb(null, Datapoint.extendDataPoint(space, context.value));
    });
  },

  // Set a datapoint
  set: function(redis, space, name, value, cb) {
    var flow = [];
    var context = {};

    // check if we have this key
    flow.push(function(flowCb) {
      Datapoint.has(redis, space, name, function(err, hasName) {
        if (err) return flowCb(err);
        context.hasName = hasName;
        flowCb();
      });
    });

    // get current value, abort early if we attempting to set to same value
    flow.push(function(flowCb) {
      Datapoint.get(redis, space, name, function(err, currentValue) {
        if (err) return flowCb(err);
        if (currentValue === null) {
          currentValue = {
            name: name,
            value: null,
            last_updated: 0
          };
        }
        if (currentValue.value == value) return flowCb(new Error("Same value, nothing to do."));
        context.currentValue = currentValue;
        flowCb();
      });
    });

    // update 
    flow.push(function(flowCb) {
      context.currentValue.value = value;
      context.currentValue.last_updated = parseInt(new Date().getTime()/1000, 10);
      context._value = JSON.stringify(context.currentValue);
      
      redis.set(Datapoint._dataKey(space, name), context._value, function(err) {
        if (err) return flowCb(err);
        flowCb();
      });
    });

    // push history
    flow.push(function(flowCb) {
      redis.lpush(Datapoint._dataHistoryKey(space, name), context._value, flowCb);
    });

    // push to members if not 
    flow.push(function(flowCb) {
      if (context.hasName === false) {
        redis.sadd(Datapoint._datasKey(space), name, flowCb);
      } else {
        async.setImmediate(function () {
          callback();
        });
      }
    })

    async.series(flow, function(err) {
      if (err) return cb(err);
      cb(null, Datapoint.extendDataPoint(space, context.currentValue));
    });
  },

  // get the last 100 data points
  history: function(redis, space, name, offset, limit, cb) {
    var flow = [];
    var context = {};
    flow.push(function(flowCb) {
      console.log([space, name, offset, limit, cb]);
      redis.lrange(Datapoint._dataHistoryKey(space, name), offset, offset + limit - 1, function(err, history) {
        if (err) return flowCb(err);
        context.history = history;
        flowCb();
      });
    });
    
    async.series(flow, function(err) {
      if (err) return cb(err);
      cb(null, context.history);
    });
  },

  extendDataPoint: function(space, datapoint) {
    datapoint.space = space;
    datapoint.datetime = new Date(datapoint.last_updated*1000).toISOString();
    datapoint.uri = "/s/" + space + "/data/" + datapoint.name;
    return datapoint;
  }
}

module.exports = Datapoint;