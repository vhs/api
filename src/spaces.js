
// a stub, at some point providing validation of multiple name spaces
var Spaces = {

  // fetch all spaces
  all: function(redis, cb) {
    cb(null, [{name: 'vhs'}]);
  }
};

module.exports = Spaces;
