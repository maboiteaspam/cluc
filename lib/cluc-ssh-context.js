
var util = require('util');
var ClucContext = require('./cluc-childprocess-context.js');

var ClucSSHContext = (function(){
  /**
   * @class
   */
  var ClucSSHContext = function(server){
    this.server = server || null;
  };

  util.inherits(ClucSSHContext, ClucContext);

  ClucSSHContext.prototype.is = function(search ){
    return this.server &&
      (
      (!!this.server.hostname.match(search))
      || (!!this.server.name && this.server.name.match(search))
      || (!!this.server.user && this.server.user.match(search))
      || (!!this.server.userName && this.server.userName.match(search))
      || (!!this.server.username.match(search))
      )
      ;
  };

  return ClucSSHContext;
})();

module.exports = ClucSSHContext;
