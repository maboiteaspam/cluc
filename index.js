
// command line under control

var log = require('npmlog');
log.addLevel('watch', 2001, { }, '    ');
log.addLevel('success', 2002, { fg: 'white', bg: 'green' }, 'succ');
log.addLevel('confirm', 2004, { fg: 'white', bg: 'blue' }, ' ok ');
log.addLevel('cmd', 2003, { fg: 'white', bg: 'grey' }, '<CMD');

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

    if(!this.isRunning && this.cmds.length){

      this.isRunning = true;

      var cmds = that.cmds;

      var _next = function(){
        var cmd = cmds.shift();
        if(cmd){

          log.cmd('',cmd.cmd);

          if(cmd.t.match(/(stream|tail)/)){
            transport.stream(cmd.cmd, function(error, stderr, stdout,stdin){
              if(stdout && cmd.t=='stream') stdout.on('close', _next);
              var helper = transport.getOutputHelper(cmd, error);
              if(cmd.fn) cmd.fn.call(helper,error, stdout, stderr);
              helper.executeRules(stdout, stderr, stdin);
              if(!stdout || cmd.t=='tail') _next();
            });
          }else if(cmd.t=='string'){
            transport.exec(cmd.cmd, function(error, stdout, stderr){
              var helper = transport.getOutputHelper(cmd, error);
              if(cmd.fn) cmd.fn.call(helper, error, stdout, stderr);
              helper.executeRules(stdout, stderr);
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
  ClucSsh.prototype.getOutputHelper = function(cmd, error){
    var helper = this.OutputHelper;
    if(this.OutputHelper.constructor){
      helper = new (this.OutputHelper)();
    }
    helper.init(cmd, error, this.server);
    return helper;
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
  ClucChildProcess.prototype.getOutputHelper = function(cmd, error){
    var helper = this.OutputHelper;
    if(this.OutputHelper.constructor){
      helper = new (this.OutputHelper)();
    }
    helper.init(cmd, error);
    return helper;
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
  ClucOutputHelper.prototype.init = function(cmd, error){
    this.cmd = cmd  || null;
    this.error = error || null;
    this.rules = [];
  };

  ClucOutputHelper.prototype.pushRule = function(Rule, search, userMsg ){
    var rule = new Rule();
    rule.init(search, userMsg);
    this.rules.push(rule);
    return rule;
  };
  ClucOutputHelper.prototype.must = function(search, error){
    return this.pushRule(ClucMust, search, error);
  };
  ClucOutputHelper.prototype.success = function(search, success ){
    return this.pushRule(ClucSuccess, search, success);
  };
  ClucOutputHelper.prototype.confirm = function(search, confirm ){
    return this.pushRule(ClucConfirm, search, confirm);
  };
  ClucOutputHelper.prototype.mustnot = function(search, error ){
    return this.pushRule(ClucMustNot, search, error);
  };
  ClucOutputHelper.prototype.warn = function(search, warn ){
    return this.pushRule(ClucWarn, search, warn);
  };

  ClucOutputHelper.prototype.watch = function(search, confirm ){
    return this.pushRule(ClucWatch, search, confirm);
  };
  ClucOutputHelper.prototype.answer = function(q, a){
    return this.pushRule(ClucAnswer, q, a);
    /*

     var that = this;
     this.MatchStreamThen(q, function(found){
     if(found){
     that.stdin.write(a);
     that.stdin.write('\n');
     }
     });
     */
  };
  ClucOutputHelper.prototype.display = function(){
    return this.pushRule(ClucDisplay, /.*/g);
  };



  ClucOutputHelper.prototype.executeRules = function(stdout, stderr, stdin){
    this.stdin = stdin;
    var rules = this.rules;

    if(_.isString(stdout)){
      rules.forEach(function(rule){
        rule.testData(stdout);
        rule.testData(stderr);
      });
      rules.forEach(function(rule){
        rule.close();
        rule.close();
      });
    } else{
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
        });
      });
    }
  };



  return ClucOutputHelper;
})();

var ClucSshOutputHelper = (function(){
  var ClucSshOutputHelper = function(){};

  util.inherits(ClucSshOutputHelper, ClucOutputHelper);

  ClucSshOutputHelper.prototype.init = function(cmd, error, server){
    this.cmd = cmd || null;
    this.error = error || null;
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

var ClucRule = (function(){
  var ClucRule = function(){};

  ClucRule.prototype.init = function(search, userDefinedMessage){
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

  return ClucRule;
})();

var ClucMust = (function(){
  var ClucMust = function(){};
  util.inherits(ClucMust, ClucRule);
  ClucMust.prototype.onClose = function(matched){
    if(!matched){
      log.warn(' '+symbols.err+' ', '\n'+' '+(this.forgeErrorMessage() )+'\n' );
    }
  };
  return ClucMust;
})();

var ClucSuccess = (function(){
  var ClucSuccess = function(){};
  util.inherits(ClucSuccess, ClucRule);
  ClucSuccess.prototype.onceMatch = function(){
    log.success(' '+symbols.ok+' ', '\n'+(this.forgeErrorMessage() )+'\n' );
  };
  return ClucSuccess;
})();

var ClucMustNot = (function(){
  var ClucMustNot = function(){};
  util.inherits(ClucMustNot, ClucRule);
  ClucMustNot.prototype.onMatch = function(matched){
    if(matched){
      log.error(' '+symbols.err+' ', '\n'+(this.forgeErrorMessage() )+'\n' );
    }
  };
  ClucMustNot.prototype.or = function(fn){
    this.orFn = fn;
  };
  ClucMustNot.prototype.onClose = function(){
    if(this.orFn && this.matched){
      this.orFn();
    }
  };
  return ClucMustNot;
})();

var ClucConfirm = (function(){
  var ClucConfirm = function(){};
  util.inherits(ClucConfirm, ClucRule);
  ClucConfirm.prototype.onceMatch = function(){
    log.confirm('   ', this.forgeErrorMessage());
  };
  return ClucConfirm;
})();

var ClucWarn = (function(){
  var ClucWarn = function(){};
  util.inherits(ClucWarn, ClucRule);
  ClucWarn.prototype.onceMatch = function(){
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