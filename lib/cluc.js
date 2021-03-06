

var log = require('npmlog');
log.addLevel('watch', 2001, { }, '    ');
log.addLevel('success', 2002, { fg: 'white', bg: 'green' }, 'succ');
log.addLevel('confirm', 2004, { fg: 'white', bg: 'blue' }, ' ok ');
log.addLevel('cmd', 2003, { fg: 'white', bg: 'grey' }, '<CMD');
log.addLevel('skip', 2003, { fg: 'grey' }, 'skip -');
log.addLevel('answer', 2003, { fg: 'white', bg: 'grey' }, '<ANS');
log.addLevel('title', 2003, { fg: 'yellow' }, '| ==');
log.addLevel('subtitle', 2003, { fg: 'yellow' }, '| --');

var debug = require('debug');
var fs = require('fs');
var inquirer = require('inquirer');
var editor = require('editor');
var path = require('path');
var temp = require('temp').track();
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
   * @class Cluc
   */
  var Cluc = function(){
    this.cmds = [];
    this.savedValues = {};
    this.recordStream = through();
  };

  Cluc.prototype.pushCmd = function(unit){
    if(!this.skipNext){
      this.cmds.push(unit);
    }
    return this;
  };

  //region User Actions
  // describe the flow of the script

  /**
   *
   * @param cmd
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.stream = function(cmd,fn){
    var unit = {cmd:cmd, fn:fn, t:'stream',s:null};
    this.pushCmd(unit);
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
    this.pushCmd(unit);
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
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @type {Function}
   */
  Cluc.prototype.wait = Cluc.prototype.then =function(fn){
    var unit = {fn:fn, t:'wait'};
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param path
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.readFile = function(path, fn){
    var unit = {cmd:'readFile %s', t:'fsMethod', n:'readFile', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, path);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param path
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.readFileSudo = function(path, fn){
    var unit = {cmd:'readFileSudo %s', t:'fsMethod', n:'readFileSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, path);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param path
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.streamReadFile = function(path, fn){
    var unit = {cmd:'streamReadFile %s', t:'fsMethod', n:'streamReadFile', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, path);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param path
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.streamReadFileSudo = function(path, fn){
    var unit = {cmd:'streamReadFileSudo %s', t:'fsMethod', n:'streamReadFileSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, path);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param localPath
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.getFile = function(remoteFile, localPath, fn){
    var unit = {cmd:'getFile %s %s', t:'fsMethod', n:'getFile', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile, localPath);
    this.pushCmd(unit);
    return this;
  };
  /**
   * Append to file if content is not found within current file.
   *
   * @param remoteFile
   * @param content
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.ensureFileContains = function(remoteFile, content, fn){
    var unit = {cmd:'ensureFileContains %s', t:'fsMethod', n:'ensureFileContains', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   * Append to file if content is not found within current file.
   *
   * @param remoteFile
   * @param content
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.ensureFileContainsSudo = function(remoteFile, content, fn){
    var unit = {cmd:'ensureFileContainsSudo %s', t:'fsMethod', n:'ensureFileContainsSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   * Prepend to file.
   *
   * @param remoteFile
   * @param content
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.prependFile = function(remoteFile, content, fn){
    var unit = {cmd:'prependFile %s', t:'fsMethod', n:'prependFile', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   * Prepend to file.
   *
   * @param remoteFile
   * @param content
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.prependFileSudo = function(remoteFile, content, fn){
    var unit = {cmd:'prependFileSudo %s', t:'fsMethod', n:'prependFileSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param localFile
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.putFile = function(localFile, remoteFile, fn){
    var unit = {cmd:'putFile %s %s', t:'fsMethod', n:'putFile', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, localFile, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param localFile
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.putFileSudo = function(localFile, remoteFile, fn){
    var unit = {cmd:'putFileSudo %s %s', t:'fsMethod', n:'putFileSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, localFile, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param content
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.writeFile = function(remoteFile, content, fn){
    var unit = {cmd:'writeFile %s', t:'fsMethod', n:'writeFile', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param content
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.writeFileSudo = function(remoteFile, content, fn){
    var unit = {cmd:'writeFileSudo %s', t:'fsMethod', n:'writeFileSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.fileExists = function(remoteFile, fn){
    var unit = {cmd:'fileExists %s', t:'fsMethod', n:'fileExists', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.fileExistsSudo = function(remoteFile, fn){
    var unit = {cmd:'fileExistsSudo %s', t:'fsMethod', n:'fileExistsSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.rmdir = function(remoteFile, fn){
    var unit = {cmd:'rmdir %s', t:'fsMethod', n:'rmdir', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.rmdirSudo = function(remoteFile, fn){
    var unit = {cmd:'rmdirSudo %s', t:'fsMethod', n:'rmdirSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.mktemp = function(remoteFile, fn){
    var unit = {cmd:'mktemp %s', t:'fsMethod', n:'mktemp', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.mkdir = function(remoteFile, fn){
    var unit = {cmd:'mkdir %s', t:'fsMethod', n:'mkdir', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.mkdirSudo = function(remoteFile, fn){
    var unit = {cmd:'mkdirSudo %s', t:'fsMethod', n:'mkdirSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.ensureEmptyDir = function(remoteFile, fn){
    var unit = {cmd:'ensureEmptyDir %s', t:'fsMethod', n:'ensureEmptyDir', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.ensureEmptyDirSudo = function(remoteFile, fn){
    var unit = {cmd:'ensureEmptyDirSudo %s', t:'fsMethod', n:'ensureEmptyDirSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remoteFile
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.ensureOwnership = function(remoteFile, fn){
    var unit = {cmd:'ensureOwnership %s', t:'fsMethod', n:'ensureOwnership', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
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
    var unit = {cmd:'putDir %s %s', t:'fsMethod', n:'putDir', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, localPath, remotePath);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param localPath
   * @param remotePath
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.putDirSudo = function(localPath, remotePath, fn){
    var unit = {cmd:'putDirSudo %s %s', t:'fsMethod', n:'putDirSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, localPath, remotePath);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param remotePath
   * @param localPath
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.getDir = function(remotePath, localPath, fn){
    var unit = {cmd:'getDir %s %s', t:'fsMethod', n:'getDir', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remotePath, localPath);
    this.pushCmd(unit);
    return this;
  };

  /**
   *
   * @param localTemplateFile
   * @param remoteFile
   * @param extraData Extra data value object.
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.generateTemplate = function(localTemplateFile, remoteFile, extraData, fn){
    var unit = {cmd:'generateTemplate %s', t:'fsMethod', n:'generateTemplate', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param localTemplateFile
   * @param remoteFile
   * @param extraData Extra data value object.
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.generateTemplateSudo = function(localTemplateFile, remoteFile, extraData, fn){
    var unit = {cmd:'generateTemplateSudo %s', t:'fsMethod', n:'generateTemplateSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remoteFile);
    this.pushCmd(unit);
    return this;
  };

  /**
   *
   * @param localTemplatePath
   * @param remotePath
   * @param extraData Extra data value object.
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.generateTemplateDir = function(localTemplatePath, remotePath, extraData, fn){
    var unit = {cmd:'generateTemplateDir %s', t:'fsMethod', n:'generateTemplateDir', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remotePath);
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param localTemplatePath
   * @param remotePath
   * @param extraData Extra data value object.
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.generateTemplateDirSudo = function(localTemplatePath, remotePath, extraData, fn){
    var unit = {cmd:'generateTemplateDirSudo %s', t:'fsMethod', n:'generateTemplateDirSudo', args:arguments};
    unit.cmd = _s.sprintf(unit.cmd, remotePath);
    this.pushCmd(unit);
    return this;
  };

  /**
   *
   * @returns {Cluc}
   */
  Cluc.prototype.title = function(){
    var args = Array.prototype.slice.call(arguments);
    var unit = { n:'title', t:'log', d:args };
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @returns {Cluc}
   */
  Cluc.prototype.subtitle = function(){
    var args = Array.prototype.slice.call(arguments);
    var unit = { n:'subtitle', t:'log', d:args };
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @returns {Cluc}
   */
  Cluc.prototype.info = function(){
    var args = Array.prototype.slice.call(arguments);
    var unit = { n:'info', t:'log', d:args };
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @returns {Cluc}
   */
  Cluc.prototype.skipped = function(){
    var args = Array.prototype.slice.call(arguments);
    var unit = { n:'skip', t:'log', d:args };
    this.pushCmd(unit);
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
    this.pushCmd(unit);
    return this;
  };
  /**
   *
   * @param msg
   * @param file optional
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.textedit = function(msg, file, fn){
    if(_.isFunction(file)){
      fn=file;
      file=temp.path({suffix: '.textedit'});
    }
    var unit = {fn: fn, t:'textedit', d:msg, f:file };
    this.pushCmd(unit);
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
      then.apply(this, [answers.chosen]);
      if(next) next();
    });
  };
  //endregion

  /**
   * @param thisIsTrue bool
   * @param fn callback
   * @returns {Cluc}
   */
  Cluc.prototype.when = function(thisIsTrue, fn){
    var that = this;
    if(!!thisIsTrue && fn ){
      fn(that);
    }
    return this;
  };

  /**
   *
   * @param object
   * @param fn
   * @returns {Cluc}
   */
  Cluc.prototype.each = function(object, fn){
    var that = this;
    if(object.splice){
      object.forEach(function(v, key){
        v = !_.isString(v)?v:
          that.processTemplate(v+'', that.savedValues);
        key = !_.isString(key)?key:
          that.processTemplate(key+'', that.savedValues);
        fn(v, key, that);
      });
    }else{
      Object.keys(object).forEach(function(key){
        var v = object[key];
        v = !_.isString(v)?v:
          that.processTemplate(v+'', that.savedValues);
        key = !_.isString(key)?key:
          that.processTemplate(key+'', that.savedValues);
        fn(key, v, that);
      });
    }
    return this;
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
   * @param other
   * @returns {Cluc}
   */
  Cluc.prototype.prepend = function(other){
    var cmds = this.cmds;
    if(other instanceof Cluc ){
      other.cmds.reverse();
      other.cmds.forEach(function(cmd){
        cmds.unshift(cmd);
      });
    }else if( other instanceof Array ){
      other.reverse();
      other.forEach(function(cmd){
        cmds.unshift(cmd);
      });
    }
    return this;
  };
  /**
   *
   * @param otherLine
   * @returns {Cluc}
   */
  Cluc.prototype.appendTo = function(otherLine){
    return otherLine.concat(this);
  };
  /**
   *
   * @param otherLine
   * @returns {Cluc}
   */
  Cluc.prototype.prependTo = function(otherLine){
    return otherLine.prepend(this);
  };

  /**
   *
   * @param transport
   * @param then
   * @returns {boolean}
   */
  Cluc.prototype.executeComands = function(transport, then){
    var that = this;
    var recordStream = that.recordStream;

    var then_ = then;
    then = function(){
      recordStream.end();
      then_.apply(null, arguments);
    };

    if(this.cmds.length){


      function _next(context){

        var cmds = that.cmds;

        if(!cmds.length){
          return then();
        }

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

        context.init(cmd, that.savedValues);

        if(cmd.cmd){
          // make cmd string a template
          var cmdStr = that.processTemplate(cmd.cmd, that.savedValues);
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

        var controlCommandClose = function(context, then){
          that.savedValues = _.extend(that.savedValues, context.savedValues);
          if(context.hasFailed() ){
            var orFn = context.getOrRules();
            if(context.canRedo() ){
              return _next( context );
            }else if(orFn.length) {
              return runFailure(context);
            }
          }
          if(then) then();
        };

        if(context){

          var execType = cmd.t;

          // this else if seems not so terrible,
          // good thing is,
          // it let us use named function to contextualize errors
          if(execType.match(/(stream|tail)/)){
            transport.stream(cmdStr, function streamCmdFn(error, stderr, stdout, stdin){

              context.executeRules(error, stdout, stderr, stdin);

              if(stdout && execType=='stream'){
                stdout.on('close', function() {
                  process.nextTick(function(){
                    controlCommandClose(context, _next);
                  });
                });
              }

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
              controlCommandClose(context, _next);
            });

          }else if(execType=='wait'){
            var newLine = new Cluc();
            newLine.savedValues = that.savedValues;
            cmd.fn.apply(context, [function waitFn(userNewLine){
              that.savedValues = _.extend(that.savedValues, context.savedValues);
              var l = userNewLine || newLine;
              that.prepend(l);
              _next();
            }, newLine]);

          }else if(execType==="fsMethod"){
            var args = Array.prototype.slice.call(cmd.args);
            if(cmd.n.match(/^generateTemplate/)){
              Object.keys(args[2]).forEach(function(index){
                var arg = args[2][index];
                if(_.isString(arg) ){
                  args[2][index] = that.processTemplate(arg, that.savedValues);
                }
              });
              args[2] = _.extend({}, that.savedValues, args[2]);
            }
            if(_.isFunction(_.last(args))){
              cmd.fn = args.pop();
            }
            args.forEach(function(arg, index){
              if(_.isString(arg) ){
                args[index] = that.processTemplate(arg, that.savedValues);
              }
            });
            args.push(function fsMethodFn(err){
              var args = Array.prototype.slice.call(arguments);
              if(cmd.fn) cmd.fn.apply(context, args);
              that.savedValues = _.extend(that.savedValues, context.savedValues);
              _next();
            });
            transport[cmd.n].apply(transport, args);

          }else if(execType=='log'){
            var n = cmd.n;
            var str = that.processTemplate(cmd.d, that.savedValues);
            log[n].apply(context, str);
            that.savedValues = _.extend(that.savedValues, context.savedValues);
            _next();

          }else if(execType=='ask'){
            cmd.d.choices = that.processTemplate(cmd.d.choices, that.savedValues);
            cmd.d.message = that.processTemplate(cmd.d.message, that.savedValues);
            inquirer.prompt(cmd.d, function InquirerPrompt(){
              var args = Array.prototype.slice.call(arguments);
              args.push(function(){
                that.savedValues = _.extend(that.savedValues, context.savedValues);
                _next();
              });
              if(cmd.fn) cmd.fn.apply(context, args);
            } );

          }else if(execType=='textedit'){
            cmd.d = that.processTemplate(cmd.d, that.savedValues);
            cmd.f = that.processTemplate(cmd.f, that.savedValues);
            log.subtitle(cmd.d+' '+cmd.f);

            var inputPath = cmd.f;
            editor(inputPath, {}, function(code, sig){
              if(fs.existsSync(inputPath)){
                fs.readFile(inputPath, function(err, data) {
                  if (err) throw err;
                  cmd.fn.apply(context, [data]);
                  that.savedValues = _.extend(that.savedValues, context.savedValues);
                  _next();
                });
              } else {
                cmd.fn.apply(context, ['']);
                that.savedValues = _.extend(that.savedValues, context.savedValues);
                _next();
              }
            });


          }else{
            console.error('========');
            console.error('Error unknown "%s" kind of task', execType);
            console.error('========');
          }

        }
      }
      _next();

      return true;

    }else if(!this.cmds.length){
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
    });
    return this;
  };

  //region Helper to control script flow
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
  //endregion

  Cluc.prototype.processTemplate = function(str, values){
    var helpers = {
      quote: function(key){
        return '"'+(values[key]+'').replace(/"/g, '\\"').replace(/`/g, '\\`')+'"';
      },
      dquote: function(value){
        return '"'+(values[key]+'').replace(/"/g, '\\"').replace(/`/g, '\\`')+'"';
      },
      squote: function(value){
        return ''+(values[key]+'').replace(/'/g, "\\'").replace(/`/g, '\\`')+'';
      }
    };
    if(_.isArray(str) ){
      return _.map(str, function(c) {
        return _.template(c)(_.extend(helpers, values));
      });
    }
    return _.template(str)(_.extend(helpers, values));
  };

  return Cluc;

})();

module.exports = Cluc;
