
// command line under control

var log = require('npmlog');
log.addLevel('watch', 2001, { }, '    ');
log.addLevel('success', 2002, { fg: 'white', bg: 'green' }, 'succ');
log.addLevel('confirm', 2004, { fg: 'white', bg: 'blue' }, ' ok ');
log.addLevel('cmd', 2003, { fg: 'white', bg: 'grey' }, '<CMD');
log.addLevel('answer', 2003, { fg: 'white', bg: 'grey' }, '<ANS');

var util = require('util');
var pkg = require('./package.json');
var _ = require('underscore');
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
    var cmds = that.cmds;

    if(!this.isRunning && this.cmds.length){

      this.isRunning = true;

      var _next = function(context){

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

        if(context){

          var execType = cmd.t;

          if(execType.match(/(stream|tail)/)){
            transport.stream(cmdStr, function(error, stderr, stdout,stdin){
              context.executeRules(error, stdout, stderr, stdin);
              if(stdout && execType=='stream')
                stdout.on('close', function() {
                  var orFn = context.getOrFn();
                  if(context.hasFailed() && orFn ){
                    if(context.canRedo()){
                      return _next( context );
                    }else {
                      var isDead = orFn(context.getFailureMessages());
                      if(isDead instanceof Error ){
                        return then( isDead );
                      }
                    }
                  }
                  _next();
                });
              if(!stdout || execType=='tail') _next();
            });

          }else if(execType=='string'){
            transport.exec(cmdStr, function(error, stdout, stderr){
              context.executeRules(error, stdout, stderr);
              var orFn = context.getOrFn();
              if(context.hasFailed() && orFn ){
                if(context.canRedo()){
                  return _next( context );
                }else {
                  var isDead = orFn(context.getFailureMessages());
                  if(isDead instanceof Error ){
                    return then( isDead );
                  }
                }
              }
              _next();
            });

          }else if(execType=='wait'){
            cmd.fn(function(){
              _next();
            })
          }

        }
      };
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
    return function(reason){
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
      log.cmd(pkg.name, cmdStr);
      ssh.exec(conn, cmdStr, function(err, stdout, stderr){
        then(err, stdout, stderr, conn);
      });
    }catch(e){
      then(e);
    }
  };
  ClucSsh.prototype.createContext = function(){
    return new (this.OutputHelper)(this.server);
  };
  ClucSsh.prototype.run = function(clucLine,server,then){
    var that = this;
    try{
      ssh.getConnReady( server, function(err, conn){
        if(err) throw err;
        that.conn = conn;
        that.server = server;
        clucLine.run(that, function(){
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
var ClucChildProcess = (function(){
  var ClucChildProcess = function(OutputHelper){
    this.cmds = [];
    this.OutputHelper = OutputHelper || Cluc.output.process;
  };
  ClucChildProcess.prototype.stream = function(cmdStr,then){
    try{
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
      var c = child_process.exec(cmdStr, function(error, stdout, stderr){
        then(error, stdout, stderr, c);
      })
    }catch(e){
      then(e);
    }
  };
  ClucChildProcess.prototype.createContext = function(){
    return new (this.OutputHelper)();
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
    this.rules = [];
    this.failedRules = [];
  };

  ClucContext.prototype.pushRule = function(Rule, search, userMsg ){
    var rule = new Rule();
    rule.init(search, userMsg);
    this.rules.push(rule);
    return rule;
  };
  ClucContext.prototype.must = function(search, error){
    return this.pushRule(ClucMust, search, error);
  };
  ClucContext.prototype.success = function(search, success ){
    return this.pushRule(ClucSuccess, search, success);
  };
  ClucContext.prototype.confirm = function(search, confirm ){
    return this.pushRule(ClucConfirm, search, confirm);
  };
  ClucContext.prototype.mustnot = function(search, error ){
    return this.pushRule(ClucMustNot, search, error);
  };
  ClucContext.prototype.warn = function(search, warn ){
    return this.pushRule(ClucWarn, search, warn);
  };

  ClucContext.prototype.watch = function(search, confirm ){
    return this.pushRule(ClucWatch, search, confirm);
  };
  ClucContext.prototype.answer = function(q, a){
    return this.pushRule(ClucAnswer, q, a);
  };
  ClucContext.prototype.display = function(){
    return this.pushRule(ClucDisplay, /.*/g);
  };
  ClucContext.prototype.redo = function(max){
    if(!this.hasRunOnce){
      this.canDo = max;
    }
    return this;
  };



  ClucContext.prototype.executeRules = function(error, stdout, stderr, stdin){
    this.stdin = stdin;
    var rules = this.rules;
    var failedRules = this.failedRules;

    rules.forEach(function(rule){
      rule.stdin = stdin;
    });
    if(_.isString(stdout)){
      rules.forEach(function(rule){
        rule.testData(stdout);
        rule.testData(stderr);
      });
      rules.forEach(function(rule){
        rule.close();
        if(rule.hasFailed()&&rule.canRedo()) failedRules.push(rule);
      });
    } else if(stdout){
      stdout.on('data' , function(d){
        rules.forEach(function(rule){
          rule.testData((''+d));
        });
      });
      stderr.on('data' , function(d){
        rules.forEach(function(rule){
          rule.testData((''+d));
        });
      });

      stdout.on('close' , function(){
        rules.forEach(function(rule){
          rule.close();
          if(rule.hasFailed()) failedRules.push(rule);
        });
      });

      this.cmd.fn.call(this, error, stdout, stderr);
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

  ClucContext.prototype.getFailureMessages = function(){
    var failures = [];
    this.failedRules.forEach(function(rule){
      failures.push(rule.forgeErrorMessage());
    });
    return failures;
  };

  ClucContext.prototype.getOrFn = function(){
    var orFn = null;
    this.failedRules.forEach(function(rule){
      if(!orFn && rule.orFn) orFn = rule.orFn;
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
    this.search = search;
    this.userDefinedMessage = userDefinedMessage;
  };

  ClucRule.prototype.forgeErrorMessage = function(){
    if(_.isString(this.userDefinedMessage) ){
      if(this.search instanceof RegExp ){
        var m = [].concat(this.matched);
        m.shift();
        return _s.vsprintf(this.userDefinedMessage, m);
      }
      return this.userDefinedMessage;
    }
    if(_.isString(this.search) ){
      return this.matched;
    }
    if(this.search instanceof RegExp ){
      return this.matched[1] || this.search;
    }
  };

  ClucRule.prototype.testData = function(data){
    this.capturedData = data;
    this.matched = (''+data).match(this.search);
    if(!this.hasMatchedOnce && !!this.matched === true){
      this.hasMatchedOnce = true;
      if(this.onceMatch){
        this.onceMatch();
      }
    }
    if(this.onMatch){
      this.onMatch(!!this.matched);
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
  ClucMustNot.prototype.onMatch = function(matched){
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
  ClucWatch.prototype.onMatch = function(matched){
    if(matched){
      log.watch('   ', this.forgeErrorMessage() );
    }
  };
  return ClucWatch;
})();

var ClucAnswer = (function(){
  var ClucAnswer = function(){};
  util.inherits(ClucAnswer, ClucRule);
  ClucAnswer.prototype.onMatch = function(matched){
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
  ClucDisplay.prototype.onMatch = function(){
    var data = this.capturedData===null?'no data':this.capturedData;
    log.watch('   ', data);
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
  answer:ClucAnswer,
  display:ClucDisplay
};

module.exports = Cluc;