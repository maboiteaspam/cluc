
// command line under control

var log = require('npmlog');
log.addLevel('watch', 2001, { }, '    ');
log.addLevel('success', 2002, { fg: 'white', bg: 'green' }, 'succ');
log.addLevel('confirm', 2004, { fg: 'white', bg: 'blue' }, ' ok ');
log.addLevel('cmd', 2003, { fg: 'white', bg: 'grey' }, '<CMD');
log.addLevel('answer', 2003, { fg: 'white', bg: 'grey' }, '<ANS');

var util = require('util');
var _ = require('underscore');
var _s = require('underscore.string');
var symbols = require('symbolsjs');
var Spinner = require('cli-spinner').Spinner;
var ProgressBar = require('progress');
var through = require('through');
var byline = require('byline');
var named = require('named-regexp').named;

var Cluc = (function(){
  var Cluc = function(OutputHelper){
    this.cmds = [];
    this.isRunning = false;
    this.OutputHelper = OutputHelper || Cluc.output.process;
    this.recordStream = through();
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
  Cluc.prototype.copy = function(fromPath, toPath, fn){
    var unit = {cmd:'copy %s to %s', fn:fn, t:'copy', fp:fromPath, tp:toPath};
    unit.cmd = _s.sprintf(unit.cmd,unit.fp,unit.tp);
    if(this.isRunning) this.cmds.unshift(unit);
    else this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.download = function(fromPath, toPath, fn){
    var unit = {cmd:'download %s to %s', fn:fn, t:'download', fp:fromPath, tp:toPath};
    unit.cmd = _s.sprintf(unit.cmd,unit.fp,unit.tp);
    if(this.isRunning) this.cmds.unshift(unit);
    else this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.emptyDir = function(path, fn){
    var unit = {cmd:'emptyDir %s', fn:fn, t:'emptyDir', p:path};
    unit.cmd = _s.sprintf(unit.cmd,path);
    if(this.isRunning) this.cmds.unshift(unit);
    else this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.mkdir = function(path, fn){
    var unit = {cmd:'mkdir %s', fn:fn, t:'mkdir', p:path};
    unit.cmd = _s.sprintf(unit.cmd,path);
    if(this.isRunning) this.cmds.unshift(unit);
    else this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.rmdir = function(path, fn){
    var unit = {cmd:'rmdir %s', fn:fn, t:'rmdir', p:path};
    unit.cmd = _s.sprintf(unit.cmd,path);
    if(this.isRunning) this.cmds.unshift(unit);
    else this.cmds.push(unit);
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
    var cmds = that.cmds;
    var recordStream = that.recordStream;

    var then_ = then;
    then = function(){
      recordStream.end();
      then_.apply(null,arguments);
    };

    if(!this.isRunning && this.cmds.length){

      this.isRunning = true;

      function _next(context){

        var cmd = null;
        if(!(context instanceof ClucContext)){
          if(!cmds.length){
            that.isRunning = false;
            return then();
          }
          cmd = cmds.shift();
          context = transport.createContext();
        }else{
          cmd = context.cmd;
        }

        context.init(cmd);
        var cmdStr = cmd.cmd;

        log.cmd('', cmdStr);
        recordStream.write('\n$> '+cmdStr+'\n');

        if(context){

          var execType = cmd.t;

          if(execType.match(/(stream|tail)/)){
            transport.stream(cmdStr, function(error, stderr, stdout, stdin){

              context.executeRules(error, stdout, stderr, stdin);

              if(stdout && execType=='stream')
                stdout.on('close', function() {
                  process.nextTick(function(){
                    if(context.hasFailed() ){
                      var orFn = context.getOrRules();
                      if(context.canRedo() ){
                        return _next( context );
                      }else if(orFn.length) {
                        var isDead = [];
                        orFn.forEach(function(rule){
                          var err = rule.orFn( rule.forgeErrorMessage() );
                          if(err){
                            isDead.push(err)
                          }
                        });
                        if(isDead.length){
                          return then(isDead.pop());
                        }
                      }
                    }
                    _next();
                  });
                });

              if(!stdout || execType=='tail') _next();

              byline(stdout).on('data', function(d) {
                recordStream.write(d+'\n');
              });
              byline(stderr).on('data', function(d) {
                recordStream.write(d+'\n');
              });

            });

          }else if(execType=='string'){
            transport.exec(cmdStr, function(error, stdout, stderr){
              recordStream.write(stdout);
              recordStream.write(stderr);
              context.executeRules(error, stdout, stderr);
              if(context.hasFailed() ){
                var orFn = context.getOrRules();
                if(context.canRedo()){
                  return _next( context );
                }else if(orFn.length) {
                  var isDead = [];
                  orFn.forEach(function(rule){
                    var err = rule.orFn( rule.forgeErrorMessage() );
                    if(err){
                      isDead.push(err)
                    }
                  });
                  if(isDead.length){
                    return then(isDead.pop());
                  }
                }
              }
              _next();
            });

          }else if(execType=='wait'){
            cmd.fn(function waitFn(){
              _next();
            })

          }else if(execType=='copy'){
            transport.copy(cmd.fp,cmd.tp, function copyFn(err){
              cmd.fn(err);
              _next();
            });

          }else if(execType=='emptyDir'){
            transport.emptyDir(cmd.p, function emptyDirFn(err){
              cmd.fn(err);
              _next();
            });

          }else if(execType=='download'){
            transport.download(cmd.fp,cmd.tp, function downloadFn(err){
              cmd.fn(err);
              _next();
            });

          }else if(execType=='mkdir'){
            transport.mkdir(cmd.p, function mkdirFn(err){
              cmd.fn(err);
              _next();
            });

          }else if(execType=='rmdir'){
            transport.rmdir(cmd.p, function rmdirFn(err){
              cmd.fn(err);
              _next();
            });
          }

        }
      }
      _next();

      return true;

    }else if(!cmds.length){
      then();
    }

    return false;
  };
  Cluc.prototype.die = function(){
    var err = new Error();
    var s = err.stack.split('\n');
    s.shift();
    s.shift();
    var line = s.shift();
    line = _s.trim(line).replace(/.+\(([^):]+):([0-9]+):([0-9]+)\)/, "$1, line $2 col $3");
    return function died(reason){
      var errorMsg = '\nend of process, reason is :';
      errorMsg += '\n' + (_.isArray(reason) ? reason.join('\n') : reason );
      errorMsg += '\n' + 'at '+line;
      errorMsg += '\n';
      log.error('', errorMsg);
      var err = new Error(errorMsg);
      err.message = errorMsg;
      return err;
    }
  };
  Cluc.prototype.record = function(writeStream){
    this.recordStream = writeStream;
    return this;
  };
  return Cluc;
})();

var SSH2Utils = require('ssh2-utils');
var ssh = new SSH2Utils();
var ClucSsh = (function(){
  var ClucSsh = function(OutputHelper){
    this.cmds = [];
    this.conn = null;
    this.server = null;
    this.OutputHelper = OutputHelper || Cluc.output.process;
  };
  ClucSsh.prototype.createContext = function(){
    return new (this.OutputHelper)(this.server);
  };
  ClucSsh.prototype.stream = function(cmdStr,then){
    var conn = this.conn;
    ssh.run( conn, cmdStr, function sshStream(err, stream, stderr){
      then(err, stream, stderr, stream, conn);
    });
  };
  ClucSsh.prototype.exec = function(cmdStr,then){
    var conn = this.conn;
    ssh.exec(conn, cmdStr, function sshExecute(err, stdout, stderr){
      then(err, stdout, stderr, conn);
    });
  };
  ClucSsh.prototype.copy = function(fromPath,toPath,then){
    var conn = this.conn;
    ssh.putDir(conn, fromPath,toPath, then);
  };
  ClucSsh.prototype.emptyDir = function(path, then){
    var conn = this.conn;
    ssh.emptyDir(conn, path, then);
  };
  ClucSsh.prototype.download = function(fromPath, toPath, then){
    var conn = this.conn;
    ssh.getDir(conn, fromPath, toPath, then);
  };
  ClucSsh.prototype.mkdir = function(path,then){
    var conn = this.conn;
    ssh.mkdir(conn, path, then);
  };
  ClucSsh.prototype.rmdir = function(path,then){
    var conn = this.conn;
    ssh.rmdir(conn, path, then);
  };

  ClucSsh.prototype.run = function(clucLine,server,then){
    var that = this;
    try{
      ssh.getConnReady( server, function(err, conn){
        if(err) throw err;
        that.conn = conn;
        that.server = server;
        clucLine.run(that, function(err){
          process.nextTick(function(){
            conn.end();
            that.conn = null;
            that.server = null;
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
var fs = require('fs-extra');
var glob = require("glob");
var async = require("async");
var ClucChildProcess = (function(){
  var ClucChildProcess = function(OutputHelper){
    this.cmds = [];
    this.OutputHelper = OutputHelper || Cluc.output.process;
  };
  ClucChildProcess.prototype.createContext = function(){
    return new (this.OutputHelper)();
  };
  ClucChildProcess.prototype.stream = function(cmdStr,then){
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
  };
  ClucChildProcess.prototype.exec = function(cmdStr,then){
    var c = child_process.exec(cmdStr, function(error, stdout, stderr){
      then(error, stdout, stderr, c);
    })
  };
  ClucChildProcess.prototype.copy = function(fromPath,toPath,then){
    fs.copy(fromPath,toPath,then);
  };
  ClucChildProcess.prototype.download = function(fromPath,toPath,then){
    fs.copy(toPath,fromPath,then);
  };
  ClucChildProcess.prototype.emptyDir = function(path,then){
    fs.emptyDir(path,then);
  };
  ClucChildProcess.prototype.mkdir = function(path,then){
    fs.ensureDir(path,then);
  };
  ClucChildProcess.prototype.rmdir = function(path,then){
    fs.remove(path,then);
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

var ClucContext = (function(){
  var ClucContext = function(){
    this.init();
  };
  ClucContext.prototype.init = function(cmd){
    if(!this.hasRunOnce){
      this.canDo = 1;
      this.hasRunOnce = false;
    }
    this.cmd = cmd  || null;
    this.stdin = null;
    this.rules = [];
    this.failedRules = [];
  };

  ClucContext.prototype.pushRule = function(Rule, initArgs ){
    var rule = new Rule();
    rule.init.apply(rule, initArgs);
    this.rules.push(rule);
    return rule;
  };
  ClucContext.prototype.must = function(search, error){
    return this.pushRule(ClucMust, arguments);
  };
  ClucContext.prototype.success = function(search, success ){
    return this.pushRule(ClucSuccess, arguments);
  };
  ClucContext.prototype.confirm = function(search, confirm ){
    return this.pushRule(ClucConfirm, arguments);
  };
  ClucContext.prototype.mustnot = function(search, error ){
    return this.pushRule(ClucMustNot, arguments);
  };
  ClucContext.prototype.warn = function(search, warn ){
    return this.pushRule(ClucWarn, arguments);
  };

  ClucContext.prototype.watch = function(search, confirm ){
    return this.pushRule(ClucWatch, arguments);
  };
  ClucContext.prototype.spin = function(search ){
    return this.pushRule(ClucSpin, arguments);
  };
  ClucContext.prototype.progress = function(search ){
    return this.pushRule(ClucProgress, arguments);
  };
  ClucContext.prototype.answer = function(q, a){
    return this.pushRule(ClucAnswer, arguments);
  };
  ClucContext.prototype.display = function(){
    return this.pushRule(ClucDisplay, [/.*/g]);
  };
  ClucContext.prototype.redo = function(max){
    if(!this.hasRunOnce){
      this.canDo = max;
    }
    return this;
  };



  ClucContext.prototype.executeRules = function(error, stdout, stderr, stdin){
    var rules = this.rules;
    var failedRules = this.failedRules;

    rules.forEach(function(rule){
      rule.stdin = stdin;
    });
    if(_.isString(stdout)){

      try{
        this.cmd.fn.call(this, error, stdout, stderr);
      }catch(ex){
        throw ex; // shall it be voided?
      }

      rules.forEach(function(rule){

        rule.testData(stdout);
        rule.testData(stderr);
      });
      rules.forEach(function(rule){

        rule.close();
        if(rule.hasFailed()) failedRules.push(rule);
      });
    } else if(stdout){
      byline(stdout).on('data' , function(d){
        rules.forEach(function(rule){
          rule.testData((''+d));
        });
      });
      byline(stderr).on('data' , function(d){
        rules.forEach(function(rule){
          rule.testData((''+d));
        });
      });

      stdout.on('close' , function(){
        process.nextTick(function(){
          rules.forEach(function(rule){
            rule.close();
            if(rule.hasFailed()) failedRules.push(rule);
            rule.stdin = null;
          });
        })
      });

      try{
        this.cmd.fn.call(this, error, stdout, stderr);
      }catch(ex){
        throw ex; // shall it be voided?
      }

    }else{
      log.warn('something is wrong stdout is null')
    }
    this.hasRunOnce = true;
    this.canDo--;

    return this.hasFailed();
  };

  ClucContext.prototype.canRedo = function(){
    return this.canDo>0;
  };

  ClucContext.prototype.hasFailed = function(){
    return this.failedRules.length>0;
  };

  ClucContext.prototype.getOrRules = function(){
    var orFn = [];
    this.failedRules.forEach(function(rule){
      if(rule.orFn){
        orFn.push(rule);
      }
    });
    return orFn;
  };

  return ClucContext;
})();

var ClucSSHContext = (function(){
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

Cluc.output = {
  ssh:ClucSSHContext,
  process:ClucContext
};

var ClucRule = (function(){
  var ClucRule = function(){};

  ClucRule.prototype.init = function(search, userDefinedMessage){
    this.failed = false;
    this.orFn = null;
    this.matched = null;
    this.capturedData = null;
    this.hasMatchedOnce = false;
    this.search = search instanceof RegExp ? named(search) : search;
    this.userDefinedMessage = userDefinedMessage;
  };

  ClucRule.prototype.forgeErrorMessage = function(){
    if(_.isString(this.userDefinedMessage) ){
      if(this.search instanceof RegExp ){
        var captures = this.matched ? this.matched.captures : {};
        if(Object.keys(captures).length){
          var userMsg = this.userDefinedMessage;
          Object.keys(captures).forEach(function(name){
            var value = captures[name].pop();
            userMsg = userMsg.replace(new RegExp(name,'g'), value);
          });
          return userMsg;
        }else{
          var printArgs = [].concat(this.matched);
          printArgs.shift();
          return _s.vsprintf(this.userDefinedMessage, printArgs);
        }
      }
      return this.userDefinedMessage;
    }
    if(_.isString(this.search) ){
      return this.matched;
    }
    if(this.search instanceof RegExp && this.matched){
      return this.matched[1] ||
        _s.trim(this.matched.input);
    }
    return this.search;
  };

  ClucRule.prototype.testData = function(data){
    this.capturedData = ''+data;
    if(this.search instanceof RegExp ){
      this.matched = this.search.exec(this.capturedData);
    }else{
      this.matched = (this.capturedData).match(this.search);
    }
    if(!this.hasMatchedOnce && !!this.matched === true){
      this.hasMatchedOnce = true;
      if(this.onceMatch){
        this.onceMatch();
      }
    }
    if(this.onData){
      this.onData(!!this.matched);
    }
  };

  ClucRule.prototype.close = function(){
    if(this.capturedData===null){
      this.matched = false;
    }
    if(this.onClose){
      this.onClose(!!this.matched);
    }
  };

  ClucRule.prototype.hasFailed = function(){
    return this.failed;
  };

  ClucRule.prototype.or = function(fn){
    this.orFn = fn;
  };

  return ClucRule;
})();

var ClucMust = (function(){
  var ClucMust = function(){};
  util.inherits(ClucMust, ClucRule);
  ClucMust.prototype.onClose = function(matched){
    if(!matched){
      this.failed = true;
      log.warn(' '+symbols.err+' ', '\n'+' '+(this.forgeErrorMessage() )+'\n' );
    }
  };
  return ClucMust;
})();

var ClucSuccess = (function(){
  var ClucSuccess = function(){};
  util.inherits(ClucSuccess, ClucRule);
  ClucSuccess.prototype.onceMatch = function(){
    this.failed = true;
    log.success(' '+symbols.ok+' ', '\n'+(this.forgeErrorMessage() )+'\n' );
  };
  ClucSuccess.prototype.hasFailed = function(){
    return !this.failed;
  };
  return ClucSuccess;
})();

var ClucMustNot = (function(){
  var ClucMustNot = function(){};
  util.inherits(ClucMustNot, ClucRule);
  ClucMustNot.prototype.onData = function(matched){
    if(matched){
      this.failed = true;
      log.error(' '+symbols.err+' ', '\n'+(this.forgeErrorMessage() )+'\n' );
    }
  };
  return ClucMustNot;
})();

var ClucConfirm = (function(){
  var ClucConfirm = function(){};
  util.inherits(ClucConfirm, ClucRule);
  ClucConfirm.prototype.onceMatch = function(){
    this.failed = true;
    log.confirm('   ', this.forgeErrorMessage());
  };
  ClucConfirm.prototype.hasFailed = function(){
    return !this.failed;
  };
  return ClucConfirm;
})();

var ClucWarn = (function(){
  var ClucWarn = function(){};
  util.inherits(ClucWarn, ClucRule);
  ClucWarn.prototype.onceMatch = function(){
    this.failed = true;
    log.warn('   ', this.forgeErrorMessage());
  };
  return ClucWarn;
})();

var ClucWatch = (function(){
  var ClucWatch = function(){};
  util.inherits(ClucWatch, ClucRule);
  ClucWatch.prototype.onData = function(matched){
    if(matched){
      log.watch('   ', this.forgeErrorMessage() );
    }
  };
  return ClucWatch;
})();

var ClucSpin = (function(){
  var ClucSpin = function(){};
  util.inherits(ClucSpin, ClucRule);
  ClucSpin.prototype.onData = function(matched){
    if(matched){
      if(!this.spinner){
        this.spinner = new Spinner(this.userDefinedMessage || '%s');
        this.spinner.setSpinnerString('|/-\\');
        this.spinner.start();
      }
    }
    if(!matched){
      if(this.spinner){
        this.spinner.stop(true);
      }
    }
  };
  ClucSpin.prototype.onClose = function(){
    if(this.spinner){
      this.spinner.stop(true);
    }
  };
  return ClucSpin;
})();

var ClucProgress = (function(){
  var ClucProgress = function(){};
  util.inherits(ClucProgress, ClucRule);
  ClucProgress.prototype.onData = function(matched){
    if(matched){
      var captures = this.matched.captures ||  {};
      if(Object.keys(captures).length){
        var current = (captures.current || []).pop() || 0;
        var title = (captures.title || []).pop() || '';
        var total = (captures.total || []).pop() || 100;
        if(!this.bar){
          this.bar = new ProgressBar(':title [:bar] :percent :etas ', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            title: title,
            total: total
          });
        }
        this.bar.update( current/total,{
          title:title
        });
      }
    }
  };
  return ClucProgress;
})();

var ClucAnswer = (function(){
  var ClucAnswer = function(){};
  util.inherits(ClucAnswer, ClucRule);
  ClucAnswer.prototype.onData = function(matched){
    if(matched){
      log.answer('    ', this.forgeErrorMessage());
      this.stdin.write(this.userDefinedMessage);
      this.stdin.write('\n');
    }
  };
  return ClucAnswer;
})();

var ClucDisplay = (function(){
  var ClucDisplay = function(){};
  util.inherits(ClucDisplay, ClucRule);
  ClucDisplay.prototype.onData = function(){
    var data = this.capturedData===null?'no data\n':this.capturedData;
    log.watch('   ', data );
  };
  ClucDisplay.prototype.onClose = function(){
    if(!this.search){
      var data = this.capturedData===null?'no data':this.capturedData;
      log.watch('   ', data );
    }
  };
  return ClucDisplay;
})();

Cluc.rule = {
  must:ClucMust,
  success:ClucSuccess,
  confirm:ClucConfirm,
  mustnot:ClucMustNot,
  warn:ClucWarn,
  watch:ClucWatch,
  spin:ClucSpin,
  progress:ClucProgress,
  answer:ClucAnswer,
  display:ClucDisplay
};

module.exports = Cluc;