
// command line under control

var log = require('npmlog');
var util = require('util');
var pkg = require('./package.json');
var _s = require('underscore.string');


var Cluc = (function(){
  var Cluc = function(OutputHelper){
    this.cmds = [];
    this.isRunning = false;
    this.OutputHelper = OutputHelper || Cluc.output.process;
  };
  Cluc.prototype.stream = function(cmd,fn){
    if(this.isRunning) this.cmds.unshift({cmd:cmd, fn:fn, t:'stream'});
    else this.cmds.push({cmd:cmd, fn:fn, t:'stream'});
    return this;
  };
  Cluc.prototype.exec = function(cmd,fn){
    if(this.isRunning) this.cmds.unshift({cmd:cmd, fn:fn, t:'string'});
    else this.cmds.push({cmd:cmd, fn:fn, t:'string'});
    return this;
  };
  Cluc.prototype.run = function(transport, then){
    var that = this;

    if(!this.isRunning && this.cmds.length){

      this.isRunning = true;

      var helper = this.OutputHelper;
      if(this.OutputHelper.constructor){
        helper = new (this.OutputHelper)();
      }

      var cmds = that.cmds;
      var _next = function(){
        var cmd = cmds.shift();
        if(cmd){
          if(cmd.t=='stream'){
            transport.stream(cmd.cmd, function(error, stderr, stdout,stdin){
              if(stdout) stdout.on('close', _next);
              helper.init(error, stdout, stderr,stdin);
              if(cmd.fn) cmd.fn.call(helper,error, stdout, stderr);
              if(!stdout) _next();
            });
          }else{
            transport.exec(cmd.cmd, function(error, stdout, stderr){
              helper.init(error, stdout, stderr);
              if(cmd.fn) cmd.fn.call(helper, error, stdout, stderr);
              _next();
            });
          }
        }else if(!cmds.length){
          that.isRunning = false;
          then();
        }
      };
      _next();
      return true;
    }else if(!this.cmds.length){
      then();
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
      log.info(pkg.name, cmdStr);
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
      log.info(pkg.name, cmdStr);
      ssh.exec( conn, cmdStr, function(err, stdout, stderr){
        then(err, stdout, stderr, conn);
      });
    }catch(e){
      then(e);
    }
  };
  ClucSsh.prototype.run = function(clucLine,server,then){
    var that = this;
    try{
      ssh.getConnReady( server, function(err, conn){
        if(err) throw err;
        that.conn = conn;
        clucLine.run(that, function(){
          conn.end();
          that.conn = null;
          if(then) then(err);
        });
      });
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
      log.info(pkg.name, cmdStr);
      // - command line parser. Could not find how to re use node parser.
      cmdStr = cmdStr.match(/^([^ ]+)(.+)/);
      var prgm = cmdStr[1];
      cmdStr = _s.trim(cmdStr[2]);
      var args = [];
      var isquote=false;
      cmdStr.split(" ").forEach(function (part){
        if(part.match(/^['"]/)){
          args.push(part);
          isquote = true;
        }else if(part.match(/['"]$/) && !part.match(/\\['"]$/) ){
          args[args.length-1] += ''+part+' ';
          isquote = false;
        }else{

          if(isquote){
            args[args.length-1] += ''+part+' ';
          } else{
            args.push(part);
          }
        }
      });
      args.forEach(function(arg,i){
        var m = arg.match(/^\s*["'](.+)["']\s*$/);
        if( m ){
          args[i] = m[1]
        }
      });
      args[args.length-1] = _s.trim(args[args.length-1]);
      // - command line parser. Could not find how to re use node parser.

      var c = child_process.spawn(prgm, args);
      then(null, c.stderr,  c.stdout, c.stdin, c);
    }catch(e){
      then(e);
    }
  };
  ClucChildProcess.prototype.exec = function(cmdStr,then){
    try{
      log.info(pkg.name, cmdStr);
      var c = child_process.exec(cmdStr, function(error, stdout, stderr){
        then(error, stdout, stderr, c);
      })
    }catch(e){
      then(e);
    }
  };
  ClucChildProcess.prototype.run = function(clucLine,then){
    clucLine.run(this, then);
  };
  return ClucChildProcess;
})();

Cluc.transports = {
  ssh:ClucSsh,
  process:ClucChildProcess
};

var ClucOutputHelper = (function(){
  var ClucOutputHelper = function(){
    this.init();
  };
  ClucOutputHelper.prototype.init = function(error, stdout, stderr, stdin){
    this.error = error || null;
    this.stdout = stdout || null;
    this.stderr = stderr || null;
    this.stdin = stdin || null;

    //- logs
    if(this.stdout){
      if( this.stdout.indexOf ){
        log.silly(this.stdout)
      }else{
        this.stdout.on('data', function(d){
          log.silly(''+d);
        });
      }
    }
    if(this.stderr){
      if( this.stderr.indexOf ){
        log.silly(this.stderr)
      }else{
        this.stderr.on('data', function(d){
          log.silly(''+d);
        });
      }
    }
    //- logs
  };

  ClucOutputHelper.testStreamOrString = function(streamOrStr, message, then){
    if( streamOrStr && streamOrStr.indexOf ){
      then( (!!streamOrStr.match(message)) )
    } else if(streamOrStr) {
      var found = false;
      var msg = '';
      streamOrStr.on('data', function(d){
        d=d+'';
        if(!found  ){
          found = !!d.match(message);
          if(found)msg+=(d.match(message)[1] || d);
        }
      });
      streamOrStr.on('close', function(){
        then( found, msg )
      })
    }
  };

  ClucOutputHelper.prototype.must = function(search, error ){
    [this.stdout,this.stderr].forEach(function(s){
      ClucOutputHelper.testStreamOrString(s, search, function(found, msg){
        if(!found){
          log.error(pkg.name, error || msg || search);
          throw error;
        }
      });
    });
  };
  ClucOutputHelper.prototype.confirm = function(search, confirm ){
    [this.stdout,this.stderr].forEach(function(s){
      ClucOutputHelper.testStreamOrString(s, search, function(found, msg){
        if(found){
          log.info(pkg.name, confirm || msg || search);
        }
      });
    });
  };
  ClucOutputHelper.prototype.mustnot = function(search, warn ){
    [this.stdout,this.stderr].forEach(function(s){
      ClucOutputHelper.testStreamOrString(s, search, function(found, msg){
        if(found){
          log.error(pkg.name, warn || msg || search);
          throw warn;
        }
      });
    });
  };
  ClucOutputHelper.prototype.warn = function(search, warn ){
    [this.stdout,this.stderr].forEach(function(s){
      ClucOutputHelper.testStreamOrString(s, search, function(found, msg){
        if(found){
          log.warn(pkg.name, warn || msg || search);
        }
      });
    });
  };
  ClucOutputHelper.prototype.answer = function(q, a ){
    var that = this;
    this.stdout.on('data', function(d){
      d=d+'';
      if(d.match(q)){
        that.stdin.write(a);
        that.stdin.write('\n');
      }
    });
    this.stderr.on('data', function(d){
      d=d+'';
      if(d.match(q)){
        that.stdin.write(a);
        that.stdin.write('\n');
      }
    });
  };

  return ClucOutputHelper;
})();

var ClucSshOutputHelper = (function(){
  var ClucSshOutputHelper = function(){};

  util.inherits(ClucSshOutputHelper, ClucOutputHelper);


  ClucSshOutputHelper.prototype.clean = function(){
    this.stdout = null;
    this.stderr = null;
    this.server = null;
  };
  ClucSshOutputHelper.prototype.init = function(error, stdout, stderr, server){
    this.error = error || null;
    this.stdout = stdout || null;
    this.stderr = stderr || null;
    this.server = server || null;
  };

  ClucSshOutputHelper.prototype.is = function(search ){
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

  return ClucSshOutputHelper;
})();

Cluc.output = {
  ssh:ClucSshOutputHelper,
  process:ClucOutputHelper
};

module.exports = Cluc;