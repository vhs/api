
var Datapoint = {
  // Get a datapoint
  get: function(redis, space, name, cb) {
    cb(null, {value:"nope", name:"coffee", last_updated: 0});
  },

  // Set a datapoint
  set: function(redis, space, name, value, cb) {
    cb(null);
  },

  // get the last 100 data points
  history: function(redis, space, name, cb) {
    cb(null, []);
  }
}

module.exports = Datapoint;