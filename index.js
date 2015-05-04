
// command line under control

var log = require('npmlog');
log.addLevel('watch', 2001, { }, '    ');
log.addLevel('success', 2002, { fg: 'white', bg: 'green' }, 'succ');
log.addLevel('confirm', 2004, { fg: 'white', bg: 'blue' }, ' ok ');
log.addLevel('cmd', 2003, { fg: 'white', bg: 'grey' }, '<CMD');
log.addLevel('answer', 2003, { fg: 'white', bg: 'grey' }, '<ANS');
log.addLevel('title', 2003, { fg: 'yellow' }, '/!\\ ');

var pkg = require('./package.json');
var debug = require('debug')(pkg.name);
var util = require('util');
var _ = require('underscore');
var _s = require('underscore.string');
var symbols = require('symbolsjs');
var Spinner = require('cli-spinner').Spinner;
var ProgressBar = require('progress');
var through = require('through');
var byline = require('byline');
var inquirer = require('inquirer');
var async = require('async');
var named = require('named-regexp').named;

var Cluc = (function(){
  var Cluc = function(OutputHelper){
    this.cmds = [];
    this.OutputHelper = OutputHelper || Cluc.output.process;
    this.recordStream = through();
  };
  Cluc.prototype.stream = function(cmd,fn){
    var unit = {cmd:cmd, fn:fn, t:'stream',s:null};
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.tail = function(cmd,fn){
    var unit = {cmd:cmd, fn:fn, t:'tail',s:null};
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.exec = function(cmd,fn){
    var unit = {cmd:cmd, fn:fn, t:'string',s:null};
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.wait = function(fn){
    var unit = {fn:fn, t:'wait'};
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.copy = function(fromPath, toPath, fn){
    var unit = {cmd:'copy %s to %s', fn:fn, t:'copy', fp:fromPath, tp:toPath};
    unit.cmd = _s.sprintf(unit.cmd,unit.fp,unit.tp);
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.download = function(fromPath, toPath, fn){
    var unit = {cmd:'download %s to %s', fn:fn, t:'download', fp:fromPath, tp:toPath};
    unit.cmd = _s.sprintf(unit.cmd,unit.fp,unit.tp);
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.emptyDir = function(path, fn){
    var unit = {cmd:'emptyDir %s', fn:fn, t:'emptyDir', p:path};
    unit.cmd = _s.sprintf(unit.cmd,path);
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.mkdir = function(path, fn){
    var unit = {cmd:'mkdir %s', fn:fn, t:'mkdir', p:path};
    unit.cmd = _s.sprintf(unit.cmd,path);
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.rmdir = function(path, fn){
    var unit = {cmd:'rmdir %s', fn:fn, t:'rmdir', p:path};
    unit.cmd = _s.sprintf(unit.cmd,path);
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.writeFile = function(path, content, fn){
    var unit = {cmd:'writeFile %s', fn:fn, t:'writeFile', p:path, c:content};
    unit.cmd = _s.sprintf(unit.cmd,path);
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.title = function(){
    var args = Array.prototype.slice.call(arguments);
    var unit = { t:'title', d:args };
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.ask = function(options, fn){
    var unit = {fn: fn, t:'ask', d:options };
    this.cmds.push(unit);
    return this;
  };
  Cluc.prototype.choose = function(message, choices, then){
    return this.ask({
      name:'chosen',
      type:'list',
      choices:choices,
      message:message
    }, function(answers, next){
      then(answers.chosen);
      process.nextTick(next);
    });
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

    if(this.cmds.length){


      function _next(context){

        var cmd = null;
        if(!(context instanceof ClucContext)){
          if(!cmds.length){
            return then();
          }
          cmd = cmds.shift();
          context = transport.createContext();
        }else{
          cmd = context.cmd;
        }

        context.init(cmd);

        if(cmd.cmd){
          var cmdStr = cmd.cmd;

          log.cmd('', cmdStr);
          recordStream.write('\n$> '+cmdStr+'\n');
        }

        var runFailure = function(context){
          var orFn = context.getOrRules();
          var isDead = [];
          orFn.forEach(function(rule){
            isDead.push(function(_done){
              rule.orFn( rule.forgeErrorMessage(), _done);
            });
          });
          return async.parallel(isDead, function(err){
            then(err);
          });
        };

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
                        return runFailure(context);
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
                if(context.canRedo() ){
                  return _next( context );
                }else if(orFn.length) {
                  return runFailure(context);
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
              if(cmd.fn) cmd.fn(err);
              _next();
            });

          }else if(execType=='mkdir'){
            transport.mkdir(cmd.p, function mkdirFn(err){
              if(cmd.fn) cmd.fn(err);
              _next();
            });

          }else if(execType=='rmdir'){
            transport.rmdir(cmd.p, function rmdirFn(err){
              if(cmd.fn) cmd.fn(err);
              _next();
            });

          }else if(execType=='writeFile'){
            transport.writeFile(cmd.p, cmd.c, function writeFileFn(err){
              if(cmd.fn) cmd.fn(err);
              _next();
            });

          }else if(execType=='title'){
            log.title.apply(null, cmd.d);
            _next();

          }else if(execType=='ask'){
            inquirer.prompt(cmd.d, function(){
              var args = Array.prototype.slice.call(arguments);
              args.push(_next);
              if(cmd.fn) cmd.fn.apply(null, args);
            } );
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
  Cluc.prototype.die = function(err){
    if(!err){
      err = new Error();
    }
    var s = err.stack.split('\n');
    s.shift();
    s.shift();
    var line = s.shift();
    line = _s.trim(line).replace(/.+\(([^):]+):([0-9]+):([0-9]+)\)/, "$1, line $2 col $3");
    return function died(reason, then){
      var errorMsg = '\nend of process, reason is :';
      errorMsg += '\n' + (_.isArray(reason) ? reason.join('\n') : reason );
      errorMsg += '\n' + 'at '+line;
      errorMsg += '\n';
      log.error('', errorMsg);
      err.message = errorMsg;
      then(err);
    }
  };
  Cluc.prototype.confirmToProceed = function(message, def){
    var that = this;
    message = (message||'%s, do you prefer to proceed ?');
    def = def===undefined?false:!!def;
    var err = new Error();
    return function confirmToProceed(reason, then){
      inquirer.prompt({
        name:'confirmed',
        type:'confirm',
        default: def,
        message:message.replace('%s', reason)
      }, function(answer){
        if(answer.confirmed===true){
          return then();
        }
        that.die(err)(reason, then);
      });
    }
  };
  Cluc.prototype.confirmToStop = function(message, def){
    var that = this;
    message = (message||'%s, do you prefer to stop ?');
    def = def===undefined?true:!!def;
    var err = new Error();
    return function confirmToStop(reason, then){
      inquirer.prompt({
        name:'confirmed',
        type:'confirm',
        default: def,
        message:message.replace('%s', reason)
      }, function(answer){
        if(answer.confirmed===false){
          return then();
        }
        that.die(err)(reason, then);
      });
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
    this.shell = null;
    this.server = null;
    this.OutputHelper = OutputHelper || Cluc.output.process;
  };
  ClucSsh.prototype.createContext = function(){
    return new (this.OutputHelper)(this.server);
  };
  ClucSsh.prototype.stream = function(cmdStr,then){
    var shell = this.shell;
    ssh.run( shell, cmdStr, function sshStream(err, stream, stderr){
      then(err, stream, stderr, stream, shell);
    });
  };
  ClucSsh.prototype.exec = function(cmdStr,then){
    var shell = this.shell;
    ssh.exec(shell, cmdStr, function sshExecute(err, stdout, stderr){
      then(err, stdout, stderr, shell);
    });
  };
  ClucSsh.prototype.copy = function(fromPath,toPath,then){
    ssh.putDir(this.shell, fromPath,toPath, then);
  };
  ClucSsh.prototype.emptyDir = function(path, then){
    ssh.emptyDir(this.shell, path, then);
  };
  ClucSsh.prototype.download = function(fromPath, toPath, then){
    ssh.getDir(this.shell, fromPath, toPath, then);
  };
  ClucSsh.prototype.mkdir = function(path,then){
    ssh.mkdir(this.shell, path, then);
  };
  ClucSsh.prototype.rmdir = function(path,then){
    ssh.rmdir(this.shell, path, then);
  };
  ClucSsh.prototype.writeFile = function(path, content, then){
    ssh.writeFile(this.shell, path, content, then);
  };

  ClucSsh.prototype.run = function(clucLine, server, then){
    var that = this;
    that.open(server, function(err){
      if(err) throw err;
      clucLine.run(that, function(err){
        process.nextTick(function(){
          that.close(function(){
            if(then) then(err);
          });
        });
      });
    });
  };
  ClucSsh.prototype.open = function(server, then){
    var that = this;
    if(!this.shell){
      try{
        ssh.getConnReady( server, function(err, shell){
          if(err) throw err;

          that.shell = shell;
          that.server = server;

          that.shell.on('close' , function(){
            debug('shell closed');
          });
          if(then) then(null, that.shell);
        });
      }catch(e){
        then(e);
      }
    }else{
      if(then) then(null, that.shell);
    }
  };
  ClucSsh.prototype.close = function(then){
    var that = this;
    if(that.shell){
      setTimeout(function(){
        that.shell.end();
        that.shell = null;
        that.server = null;
        if(then) then();
      }, 2000);
    }else{
      if(then) then();
    }
  };
  return ClucSsh;
})();

var child_process = require('child_process');
var fs = require('fs-extra');
var glob = require("glob");
var ClucChildProcess = (function(){
  var ClucChildProcess = function(OutputHelper){
    this.shell = null;
    this.cmds = [];
    this.OutputHelper = OutputHelper || Cluc.output.process;
  };
  ClucChildProcess.prototype.createContext = function(){
    return new (this.OutputHelper)();
  };
  ClucChildProcess.prototype.stream = function(cmdStr, then){
    var stdoutStream = through();
    var stderrStream = through();
    var procesStream = through();
    then(null, stderrStream,
      stdoutStream, this.shell.stdin, procesStream);

    var t = '__cluc__'+(new Date()).getTime();
    debug(cmdStr);
    debug(t);
    var that = this;
    var testEnd = function(stream){
      var listener = function(d){
        debug(d+'');
        var isEnd = (''+d).match(t);
        if (isEnd){
          d = (''+d).replace(t,'');
        }
        stream.write(d);
        if (isEnd){

          that.shell.stdout.removeListener('data', listener);
          that.shell.stderr.removeListener('data', listener);

          procesStream.emit('close');
          stdoutStream.emit('close');
          stderrStream.emit('close');

          procesStream.removeAllListeners('close');
          stdoutStream.removeAllListeners('close');
          stderrStream.removeAllListeners('close');

          stdoutStream.removeAllListeners('data');
          stderrStream.removeAllListeners('data');

        }
      };
      return listener;
    };
    this.shell.stdout.on('data', testEnd(stdoutStream));
    this.shell.stderr.on('data', testEnd(stderrStream));
    this.shell.stdin.write(cmdStr);
    this.shell.stdin.write('\n');
    this.shell.stdin.write('echo "'+t+'"');
    this.shell.stdin.write('\n');
  };
  ClucChildProcess.prototype.exec = function(cmdStr, then){
    var procesStream = through();
    var t = '__cluc__'+(new Date()).getTime();
    debug(cmdStr);
    debug(t);
    var that = this;
    var stdout = '';
    var stderr = '';
    var finish = function(){
      debug('finish')
      then(null, stdout, stderr, procesStream);
      that.shell.stdout.removeListener('data', saveStdout);
      that.shell.stderr.removeListener('data', saveStderr);
      procesStream.emit('close');
      procesStream.removeAllListeners('close');
    };
    var saveStdout = function(d){
      debug(''+d);
      var isEnd = (''+d).match(t);
      if (isEnd){
        d = (''+d).replace(t,'');
      }
      stdout += d;
      if (isEnd){
        finish();
      }
    };
    var saveStderr = function(d){
      debug(''+d);
      var isEnd = (''+d).match(t);
      if (isEnd){
        d = (''+d).replace(t,'');
      }
      stderr += d;
      if (isEnd){
        finish();
      }
    };
    this.shell.stdout.on('data', saveStdout);
    this.shell.stderr.on('data', saveStderr);
    this.shell.stdin.write(cmdStr);
    this.shell.stdin.write('\n');
    this.shell.stdin.write('echo "'+t+'"');
    this.shell.stdin.write('\n');
  };
  ClucChildProcess.prototype.copy = function(fromPath, toPath, then){
    fs.copy(fromPath,toPath,then);
  };
  ClucChildProcess.prototype.download = function(fromPath, toPath, then){
    fs.copy(toPath,fromPath,then);
  };
  ClucChildProcess.prototype.emptyDir = function(path, then){
    fs.emptyDir(path,then);
  };
  ClucChildProcess.prototype.mkdir = function(path, then){
    fs.ensureDir(path,then);
  };
  ClucChildProcess.prototype.rmdir = function(path, then){
    fs.remove(path,then);
  };
  ClucChildProcess.prototype.writeFile = function(path, content, then){
    fs.writeFile(path, content, then);
  };
  ClucChildProcess.prototype.run = function(clucLine, then){
    var that = this;
    that.open(function(err){
      if(err) throw err;
      clucLine.run(that, function(err){
        process.nextTick(function(){
          that.close(function(){
            if(then) then(err);
          });
        });
      });
    });
  };
  ClucChildProcess.prototype.open = function(then){
    if(!this.shell){
      if (/^win/.test(process.platform) ) {
        this.shell = child_process.spawn('cmd', []);
      } else{
        this.shell = child_process.spawn('bash', []);
      }
      this.shell.stdout.setMaxListeners(50);
      this.shell.stderr.setMaxListeners(50);
      this.shell.stdout.on('close' , function(){
        debug('stdout closed');
      });
      this.shell.stderr.on('close' , function(){
        debug('stderr closed');
      });
      this.shell.on('close' , function(){
        debug('shell closed');
      });
    }
    if(then) then(null, this.shell);
  };
  ClucChildProcess.prototype.close = function(then){
    if(this.shell){
      this.shell.kill('SIGINT');
      this.shell = null;
    }
    if(then)then();
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
  ClucContext.prototype.spinUntil = function(search ){
    return this.pushRule(ClucSpinUntil, arguments);
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
  ClucContext.prototype.dieOnError = function(){
    return this.pushRule(ClucDieOnError, [/.*/g]);
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

      var matched = false;
      rules.forEach(function(rule){
        matched = rule.testData(stdout, 'stdout', matched) || matched;
        matched = rule.testData(stderr, 'stderr', matched) || matched;
      });

      rules.forEach(function(rule){
        rule.close();
        if(rule.hasFailed()) failedRules.push(rule);
      });

    } else if(stdout){

      byline(stdout).on('data' , function(d){
        var matched = false;
        rules.forEach(function(rule){
          matched = rule.testData((''+d), 'stdout', matched) || matched;
        });
      });
      byline(stderr).on('data' , function(d){
        rules.forEach(function(rule){
          matched = rule.testData((''+d), 'stderr', matched) || matched;
        });
      });

      stdout.on('close' , function(){
        process.nextTick(function(){
          var matched = false;
          rules.forEach(function(rule){
            rule.close(matched);
            matched = rule.matched || matched;
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
            userMsg = userMsg.replace(new RegExp(name,'g'), (value||'-'));
          });
          return userMsg;
        }else{
          var printArgs = [].concat(this.matched);
          printArgs.shift();
          printArgs = printArgs.map(function(v){
            return v || '-';
          });
          return _s.vsprintf(this.userDefinedMessage, printArgs);
        }
      }
      return this.userDefinedMessage;
    }
    if(_.isString(this.search) && !this.matched ){
      return this.search;
    }
    if(this.search instanceof RegExp && this.matched){
      return this.matched[1] ||
        _s.trim(this.matched.input);
    }
    return this.search;
  };

  ClucRule.prototype.testData = function(data, stdpipe, alreadyMatched){
    this.capturedData = ''+data;
    if(this.search instanceof RegExp ){
      this.matched = this.search.exec(this.capturedData);
    }else{
      this.matched = (this.capturedData).match(this.search);
    }
    if(!this.hasMatchedOnce && !!this.matched === true){
      this.hasMatchedOnce = true;
      if(this.onceMatch){
        this.onceMatch(stdpipe, alreadyMatched);
      }
    }
    if(this.onData){
      this.onData(!!this.matched, stdpipe, alreadyMatched);
    }
    return this.matched;
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
    log.success(' '+symbols.ok+' ', ''+(this.forgeErrorMessage() )+'' );
    console.log('');
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
    console.log('');
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
      }
      this.spinner.stop();
      this.spinner.start();
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

var ClucSpinUntil = (function(){
  var ClucSpinUntil = function(){
    this.spinner = new Spinner(this.userDefinedMessage || '%s');
    this.spinner.setSpinnerString('|/-\\');
    this.spinner.start();
  };
  util.inherits(ClucSpinUntil, ClucRule);
  ClucSpinUntil.prototype.onData = function(matched){
    if(matched){
      if(this.spinner){
        this.spinner.stop(true);
      }
    }
  };
  ClucSpinUntil.prototype.onClose = function(){
    if(this.spinner){
      this.spinner.stop(true);
    }
  };
  return ClucSpinUntil;
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
  ClucDisplay.prototype.onData = function(matched, stdpipe, alreadyMatched){
    if(!alreadyMatched){
      var data = this.capturedData===null?'no data\n':this.capturedData;
      log.watch('   ', data );
    }
  };
  ClucDisplay.prototype.onClose = function(){
    if(!this.search){
      var data = this.capturedData===null?'no data':this.capturedData;
      log.watch('   ', data );
    }
  };
  return ClucDisplay;
})();

var ClucDieOnError = (function(){
  var ClucDieOnError = function(){};
  util.inherits(ClucDieOnError, ClucRule);
  ClucDieOnError.prototype.onData = function(matched, stdpipe){
    if(this.capturedData && stdpipe==='stderr'){
      log.error('   ', this.capturedData );
      if(!this.failed) this.failed = '';
      this.failed+=this.capturedData;
    }
  };
  ClucDieOnError.prototype.onClose = function(){
    if(this.failed){
      throw this.failed;
    }
  };
  return ClucDieOnError;
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