

var log = require('npmlog');
log.addLevel('watch', 2001, { }, '    ');
log.addLevel('success', 2002, { fg: 'white', bg: 'green' }, 'succ');
log.addLevel('confirm', 2004, { fg: 'white', bg: 'blue' }, ' ok ');
log.addLevel('cmd', 2003, { fg: 'white', bg: 'grey' }, '<CMD');
log.addLevel('answer', 2003, { fg: 'white', bg: 'grey' }, '<ANS');
log.addLevel('title', 2003, { fg: 'yellow' }, '/!\\ ');

var inquirer = require('inquirer');
var named = require('named-regexp').named;
var async = require('async');
var byline = require('byline');
var through = require('through');
var _ = require('underscore');
var _s = require('underscore.string');
var ClucContext = require('./cluc-childprocess-context.js');

var Cluc = (function(){
  /**
   * Provide command line
   * queuing, execution and response
   *
   * @class
   */
  var Cluc = function(){
    this.cmds = [];
    this.recordStream = through();
  };
  /**
   *
   * @param cmd
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.stream = function(cmd,fn){
    var unit = {cmd:cmd, fn:fn, t:'stream',s:null};
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param cmd
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.tail = function(cmd,fn){
    var unit = {cmd:cmd, fn:fn, t:'tail',s:null};
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param cmd
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.exec = function(cmd,fn){
    var unit = {cmd:cmd, fn:fn, t:'string',s:null};
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @type {Function}
   */
  Cluc.prototype.wait = Cluc.prototype.then =function(fn){
    var unit = {fn:fn, t:'wait'};
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param fromPath
   * @param toPath
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.copy = function(fromPath, toPath, fn){
    var unit = {cmd:'copy %s to %s', fn:fn, t:'copy', fp:fromPath, tp:toPath};
    unit.cmd = _s.sprintf(unit.cmd,unit.fp,unit.tp);
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param fromPath
   * @param toPath
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.download = function(fromPath, toPath, fn){
    var unit = {cmd:'download %s to %s', fn:fn, t:'download', fp:fromPath, tp:toPath};
    unit.cmd = _s.sprintf(unit.cmd,unit.fp,unit.tp);
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param path
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.emptyDir = function(path, fn){
    var unit = {cmd:'emptyDir %s', fn:fn, t:'emptyDir', p:path};
    unit.cmd = _s.sprintf(unit.cmd,path);
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param path
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.mkdir = function(path, fn){
    var unit = {cmd:'mkdir %s', fn:fn, t:'mkdir', p:path};
    unit.cmd = _s.sprintf(unit.cmd,path);
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param path
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.rmdir = function(path, fn){
    var unit = {cmd:'rmdir %s', fn:fn, t:'rmdir', p:path};
    unit.cmd = _s.sprintf(unit.cmd,path);
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param localPath
   * @param remotePath
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.putDir = function(localPath, remotePath, fn){
    var unit = {cmd:'putDir %s %s', fn:fn, t:'putDir', lp:localPath, rp:remotePath};
    unit.cmd = _s.sprintf(unit.cmd, localPath, remotePath);
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param path
   * @param content
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.writeFile = function(path, content, fn){
    var unit = {cmd:'writeFile %s', fn:fn, t:'writeFile', p:path, c:content};
    unit.cmd = _s.sprintf(unit.cmd,path);
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @returns {Cluc}
   */
  Cluc.prototype.title = function(){
    var args = Array.prototype.slice.call(arguments);
    var unit = { t:'title', d:args };
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param options
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.ask = function(options, fn){
    var unit = {fn: fn, t:'ask', d:options };
    this.cmds.push(unit);
    return this;
  };
  /**
   *
   * @param message
   * @param choices
   * @param then
   * @returns {*}
   */
  Cluc.prototype.choose = function(message, choices, then){
    return this.ask({
      name:'chosen',
      type:'list',
      choices:choices,
      message:message
    }, function(answers, next){
      then(answers.chosen);
      if(next) next();
    });
  };
  /**
   *
   * @param other
   * @returns {Cluc}
   */
  Cluc.prototype.concat = function(other){
    if(other instanceof Cluc ){
      this.cmds = this.cmds.concat(other.cmds);
    }else if( other instanceof Array ){
      this.cmds = this.cmds.concat(other);
    }
    return this;
  };
  /**
   *
   * @param transport
   * @param then
   * @returns {boolean}
   */
  Cluc.prototype.executeComands = function(transport, then){
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
            if (err) then(err);
            else _next();
          });
        };

        if(context){

          var execType = cmd.t;

          // this else if seems not so terrible,
          // good thing is,
          // it let us use named function to contextualize errors
          if(execType.match(/(stream|tail)/)){
            transport.stream(cmdStr, function streamCmdFn(error, stderr, stdout, stdin){

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
            transport.exec(cmdStr, function execCmdFn(error, stdout, stderr){
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
              if(cmd.fn) cmd.fn(err);
              _next();
            });

          }else if(execType=='putDir'){
            transport.putDir(cmd.lp, cmd.rp, function copyFn(err){
              if(cmd.fn) cmd.fn(err);
              _next();
            });

          }else if(execType=='emptyDir'){
            transport.emptyDir(cmd.p, function emptyDirFn(err){
              if(cmd.fn) cmd.fn(err);
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
  /**
   *
   * @param transport
   * @param then
   * @returns {Cluc}
   */
  Cluc.prototype.run = function(transport, then){
    var that = this;
    process.nextTick(function(){
      transport.open(function(err){
        if(err) throw err;
        that.executeComands(transport, function(err){
          transport.close(function(){
            if(then) then(err);
          });
        });
      });
    })
    return this;
  };
  /**
   *
   * @param err
   * @returns {Function}
   */
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
  /**
   *
   * @param message
   * @param def
   * @returns {Function}
   */
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
  /**
   *
   * @param message
   * @param def
   * @returns {Function}
   */
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
  /**
   *
   * @param writeStream
   * @returns {Cluc}
   */
  Cluc.prototype.record = function(writeStream){
    this.recordStream = writeStream;
    return this;
  };
  return Cluc;
})();

module.exports = Cluc;