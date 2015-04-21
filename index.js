
// command line under control

var log = require('npmlog');


var Cluc = (function(){
  var Cluc = function(){
    this.cmds = [];
    this.isRunning = false;
  };
  Cluc.prototype.stream = function(cmd,fn){
    this.cmds.push({cmd:cmd, fn:fn, t:'stream'});
    return this;
  };
  Cluc.prototype.exec = function(cmd,fn){
    this.cmds.push({cmd:cmd, fn:fn, t:'string'});
    return this;
  };
  Cluc.prototype.run = function(transport){
    if(!this.isRunning && this.cmds.length){

      this.isRunning = true;

      var helper = new ClucOutputHelper();

      var cmds = this.cmds;
      var _next = function(){
        var cmd = cmds.shift();
        helper.clean();
        if(cmd){
          if(cmd.t=='stream'){
            transport.stream(cmd.cmd, function(error, stderr, stdout){
              stdout.on('close', _next);
              helper.stdout = stdout;
              helper.stderr = stderr;
              cmd.fn.call(helper,error, stderr, stdout);
            });
          }else{
            transport.exec(cmd.cmd, function(error, stdout, stderr){
              helper.stdout = stdout;
              helper.stderr = stderr;
              cmd.fn.call(helper,error, stdout, stderr);
              _next();
            });
          }
        }
      };
      _next();
      return true;
    }
    return false;
  };
  return Cluc;
})();

var SSH2Utils = require('ssh2-utils');
var ssh = new SSH2Utils();
var ClucSsh = (function(){
  var ClucSsh = function(conn){
    this.cmds = [];
    this.conn = conn;
  };
  ClucSsh.prototype.stream = function(cmdStr,then){
    var conn = this.conn;
    try{
      ssh.run( conn, cmdStr, function(err, stream, stderr){
        then(err, stream, stderr, stream, conn);
      });
    }catch(e){
      then(e);
    }
  };
  ClucSsh.prototype.exec = function(cmdStr,then){
    var conn = this.conn;
    try{
      ssh.exec( conn, cmdStr, function(err, stdout, stderr){
        then(err, stdout, stderr, conn);
      });
    }catch(e){
      then(e);
    }
  };
  ClucSsh.getConnReady = function(server,then){
    try{
      ssh.getConnReady( server, then);
    }catch(e){
      then(e);
    }
  };
  return ClucSsh;
})();

var child_process = require('child_process');
var ClucChildProcess = (function(){
  var ClucChildProcess = function(){
    this.cmds = [];
  };
  ClucChildProcess.prototype.stream = function(cmdStr,then){
    try{
      cmdStr = cmdStr.split(' ');
      var prgm = cmdStr.shift();
      var c = child_process.spawn(prgm, cmdStr);
      then(null, c.stderr,  c.stdout, c.stdin, c);
    }catch(e){
      then(e);
    }
  };
  ClucChildProcess.prototype.exec = function(cmdStr,then){
    try{
      var c = child_process.exec(cmdStr, function(error, stdout, stderr){
        then(error, stdout, stderr, c);
      })
    }catch(e){
      then(e);
    }
  };
  return ClucChildProcess;
})();

Cluc.transports = {
  ssh:ClucSsh,
  process:ClucChildProcess
};

var ClucOutputHelper = (function(){
  var ClucOutputHelper = function(){
    this.clean();
  };
  ClucOutputHelper.prototype.clean = function(){
    this.stdout = null;
    this.stderr = null;
  };

  var testStreamOrString = function(streamOrStr, message, then){
    if( streamOrStr.indexOf ){
      then( (!!streamOrStr.match(message)) )
    } else {
      var found = false;
      streamOrStr.on('data', function(d){
        if(!found  ){
          found = !!(''+d).match(message);
        }
      });
      streamOrStr.on('close', function(){
        then( found )
      })
    }
  };

  ClucOutputHelper.prototype.must = function(search, error ){
    testStreamOrString(this.stdout, search, function(found){
      if(!found){
        log.error(error);
        throw error;
      }
    });
    testStreamOrString(this.stderr, search, function(found){
      if(!found){
        log.error(error);
        throw error;
      }
    });
  };
  ClucOutputHelper.prototype.confirm = function(search, confirm ){
    testStreamOrString(this.stdout, search, function(found){
      if(!found){
        log.info(confirm);
      }
    });
    testStreamOrString(this.stderr, search, function(found){
      if(!found){
        log.info(confirm);
      }
    });
  };
  ClucOutputHelper.prototype.mustnot = function(search, warn ){
    testStreamOrString(this.stdout, search, function(found){
      if(found){
        log.error(warn);
        throw warn;
      }
    });
    testStreamOrString(this.stderr, search, function(found){
      if(found){
        log.error(warn);
        throw warn;
      }
    });
  };
  ClucOutputHelper.prototype.warn = function(search, warn ){
    testStreamOrString(this.stdout, search, function(found){
      if(!found){
        log.warn(warn);
      }
    });
    testStreamOrString(this.stderr, search, function(found){
      if(!found){
        log.warn(warn);
      }
    });
  };

  return ClucOutputHelper;
})();

module.exports = Cluc;