
// command line under control

var log = require('npmlog');
log.addLevel('watch', 2001, { }, '    ');
log.addLevel('success', 2002, { fg: 'white', bg: 'green' }, 'succ');
log.addLevel('cmd', 2003, { fg: 'white', bg: 'grey' }, '####');

var util = require('util');
var pkg = require('./package.json');
var _s = require('underscore.string');
var symbols = require('symbolsjs');


var Cluc = (function(){
  var Cluc = function(OutputHelper){
    this.cmds = [];
    this.isRunning = false;
    this.OutputHelper = OutputHelper || Cluc.output.process;
  };
  Cluc.prototype.stream = function(cmd,fn){
    if(this.isRunning) this.cmds.unshift({cmd:cmd, fn:fn, t:'stream',s:null});
    else this.cmds.push({cmd:cmd, fn:fn, t:'stream',s:null});
    return this;
  };
  Cluc.prototype.tail = function(cmd,fn){
    if(this.isRunning) this.cmds.unshift({cmd:cmd, fn:fn, t:'tail',s:null});
    else this.cmds.push({cmd:cmd, fn:fn, t:'tail',s:null});
    return this;
  };
  Cluc.prototype.exec = function(cmd,fn){
    if(this.isRunning) this.cmds.unshift({cmd:cmd, fn:fn, t:'string',s:null});
    else this.cmds.push({cmd:cmd, fn:fn, t:'string',s:null});
    return this;
  };
  Cluc.prototype.wait = function(fn){
    if(this.isRunning) this.cmds.unshift({fn:fn, t:'wait'});
    else this.cmds.push({fn:fn, t:'wait'});
    return this;
  };
  Cluc.prototype.concat = function(other){
    if(other instanceof Cluc ){
      this.cmds = this.cmds.concat(other.cmds);
    }else if( other instanceof Array ){
      this.cmds = this.cmds.concat(other);
    }
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
          if(cmd.t.match(/(stream|tail)/)){
            transport.stream(cmd.cmd, function(error, stderr, stdout,stdin){
              if(stdout && cmd.t=='stream') stdout.on('close', _next);
              if(cmd.fn) cmd.fn.call(helper,error, stdout, stderr);
              helper.init(cmd, error, stdout, stderr,stdin);
              if(!stdout || cmd.t=='tail') _next();
            });
          }else if(cmd.t=='string'){
            transport.exec(cmd.cmd, function(error, stdout, stderr){
              if(cmd.fn) cmd.fn.call(helper, error, stdout, stderr);
              helper.init(cmd, error, stdout, stderr);
              _next();
            });
          }else if(cmd.t=='wait'){
            cmd.fn(_next)
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
      log.cmd(pkg.name, cmdStr);
      ssh.run( conn, cmdStr, function(err, stream, stderr){
        stream.setMaxListeners(50);
        stderr.setMaxListeners(50);
        then(err, stream, stderr, stream, conn);
      });
    }catch(e){
      then(e);
    }
  };
  ClucSsh.prototype.exec = function(cmdStr,then){
    var conn = this.conn;
    try{
      log.cmd(pkg.name, cmdStr);
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
          process.nextTick(function(){

            conn.end();
            that.conn = null;
            if(then) then(err);
          })
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
      c.stdout.setMaxListeners(50);
      c.stderr.setMaxListeners(50);
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
  ClucOutputHelper.prototype.init = function(cmd, error, stdout, stderr, stdin){
    this.cmd = cmd  || null;
    this.error = error || null;
    this.stdout = stdout || null;
    this.stderr = stderr || null;
    this.stdin = stdin || null;
    this.rules = [];
  };

  ClucOutputHelper.testStream = function(stream, search, then){
    if(stream) {
      var found = false;
      stream.on('data', function(d){
        d=d+'';
        var m = d.match(search);
        found = !!m;
        if(search instanceof RegExp && m && m.length ){
          for(var i=1;i<m.length;i++){
            then( found, m[i] );
          }
        }else{
          then( found, search );
        }
      });
      stream.on('close', function(){
        then( found, search );
      })
    }
  };

  ClucOutputHelper.testStreamOrString = function(streamOrStr, search, then){
    if( streamOrStr && streamOrStr.indexOf ){
      var m = streamOrStr.match(search);
      var found = !!m;
      if(search instanceof RegExp && m && m[1] ){
        search = m[1];
      }
      then( found, search )
    } else if(streamOrStr) {
      ClucOutputHelper.testStream(streamOrStr, search, then);
    }
  };

  ClucOutputHelper.prototype.MatchStreamThen = function(search, then ){
    [this.stdout,this.stderr].forEach(function(s){
      ClucOutputHelper.testStream(s, search, then);
    });
  };

  ClucOutputHelper.prototype.must = function(search, error ){
    this.rules.push({t:'must',s:search,e:error});
  };
  ClucOutputHelper.prototype.success = function(search, success ){
    this.rules.push({t:'success',s:search,e:success});
  };
  ClucOutputHelper.prototype.confirm = function(search, confirm ){
    this.rules.push({t:'confirm',s:search,e:confirm});
  };
  ClucOutputHelper.prototype.mustnot = function(search, error ){
    this.rules.push({t:'mustnot',s:search,e:error});
  };
  ClucOutputHelper.prototype.warn = function(search, warn ){
    this.rules.push({t:'warn',s:search,e:warn});
  };

  ClucOutputHelper.prototype.watch = function(search, confirm ){
    this.MatchStreamThen(search, function(found, msg){
      if(found) log.watch(pkg.name, confirm || msg || search);
    });
  };
  ClucOutputHelper.prototype.answer = function(q, a ){
    var that = this;
    this.MatchStreamThen(q, function(found){
      if(found){
        that.stdin.write(a);
        that.stdin.write('\n');
      }
    });
  };
  ClucOutputHelper.prototype.display = function(){
    if( this.stdout && this.stdout.indexOf ){
      log.info(pkg.name, this.stdout);
      log.info(pkg.name, this.stderr);
    } else if(this.stdout) {
      this.stdout.on('data', function(d){
        log.info(pkg.name, d+'');
      });
      this.stderr.on('data', function(d){
        log.info(pkg.name, d+'');
      });
    } else {
      log.info(pkg.name, 'no data');
    }
  };

  return ClucOutputHelper;
})();

var ClucSshOutputHelper = (function(){
  var ClucSshOutputHelper = function(){};

  util.inherits(ClucSshOutputHelper, ClucOutputHelper);

  ClucSshOutputHelper.prototype.init = function(cmd, error, stdout, stderr, server){
    this.cmd = cmd || null;
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