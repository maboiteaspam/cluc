
var log = require('./log.js');
var byline = require('byline');
var fs = require('fs');
var inquirer = require('inquirer');
var editor = require('editor');
var path = require('path');
var temp = require('temp').track();

var ClucActions = {

  /**
   *
   * @param cmdStr
   * @param contextFn
   * @returns {Function}
   */
  stream: function(cmdStr, contextFn){
    return function(line, transport, cmdStr, then){
      var recordStream = line.recordStream;
      var context = transport.createContext();
      context.fn = contextFn;
      cmdStr = line.processTemplate(cmdStr);
      context.init(cmdStr, line.savedValues);
      log.cmd('', cmdStr);
      recordStream.write('\n$> '+cmdStr+'\n');
      transport.stream(cmdStr, function streamCmdFn(error, stderr, stdout, stdin){

        context.executeRules(error, stdout, stderr, stdin);

        stdout.on('close', function() {
          process.nextTick(function(){
            //controlCommandClose(context, then);
            then();
          });
        });

        byline(stdout).on('data', function(d) {
          recordStream.write(d+'\n');
        });
        byline(stderr).on('data', function(d) {
          recordStream.write(d+'\n');
        });
      });
    }
  },
  tail: function(cmdStr, contextFn){
    return function(line, transport, cmdStr, then){
      var recordStream = line.recordStream;
      var context = transport.createContext();
      context.fn = contextFn;
      cmdStr = line.processTemplate(cmdStr);
      context.init(cmdStr, line.savedValues);
      log.cmd('', cmdStr);
      recordStream.write('\n$> '+cmdStr+'\n');
      transport.stream(cmdStr, function streamCmdFn(error, stderr, stdout, stdin){

        context.executeRules(error, stdout, stderr, stdin);

        then();

        byline(stdout).on('data', function(d) {
          recordStream.write(d+'\n');
        });
        byline(stderr).on('data', function(d) {
          recordStream.write(d+'\n');
        });

      });
    }
  },
  exec: function(cmdStr, contextFn){
    return function(line, transport, then){
      var recordStream = line.recordStream;
      var context = transport.createContext();
      context.fn = contextFn;
      cmdStr = line.processTemplate(cmdStr);
      context.init(cmdStr, line.savedValues);
      log.cmd('', cmdStr);
      recordStream.write('\n$> '+cmdStr+'\n');
      transport.exec(cmdStr, function execCmdFn(error, stdout, stderr){
        recordStream.write(stdout);
        recordStream.write(stderr);
        context.executeRules(error, stdout, stderr);
        //controlCommandClose(context, then);
        then();
      });
    }
  },
  then: function(contextFn){
    return function(line, transport, cmdStr, then){
      var Cluc = require('./cluc.js');
      var newLine = new Cluc();
      newLine.savedValues = line.savedValues;
      var context = transport.createContext();
      contextFn.apply(context, [function thenFn(userNewLine){
        line.savedValues = _.extend(line.savedValues, context.savedValues);
        var l = userNewLine || newLine;
        line.prepend(l);
        then();
      }, newLine, context]);
    };
  },
  fsMethod: function(methodName){
    var args = Array.prototype.slice.call(arguments);
    args.shift(); // remove methodName
    return function(line, transport, cmdStr, then){
      var context = transport.createContext();
      var contextFn;
      if(_.isFunction(_.last(args))){
        contextFn = args.pop(); // remove contextFn
      }
      args = line.processTemplate(args);
      args.push(function fsMethodFn(err){
        var args = Array.prototype.slice.call(arguments);
        if(contextFn) contextFn.apply(context, args);
        line.savedValues = _.extend(line.savedValues, context.savedValues);
        then();
      }); // add new callback fn
      transport[methodName].apply(transport, args);

    };
  },
  readFile: function(path, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('readFile');
    return ClucActions.fsMethod.apply(null, args);
  },
  readFileSudo: function(path, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('readFileSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  streamReadFile: function(path, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('streamReadFile');
    return ClucActions.fsMethod.apply(null, args);
  },
  streamReadFileSudo: function(path, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('streamReadFileSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  getFile: function(remoteFile, localPath, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('getFile');
    return ClucActions.fsMethod.apply(null, args);
  },
  ensureFileContains: function(remoteFile, content, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('ensureFileContains');
    return ClucActions.fsMethod.apply(null, args);
  },
  ensureFileContainsSudo: function(remoteFile, content, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('ensureFileContainsSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  prependFile: function(remoteFile, content, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('prependFile');
    return ClucActions.fsMethod.apply(null, args);
  },
  prependFileSudo: function(remoteFile, content, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('prependFileSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  putFile: function(localFile, remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('putFile');
    return ClucActions.fsMethod.apply(null, args);
  },
  putFileSudo: function(localFile, remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('putFileSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  writeFile: function(remoteFile, content, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('writeFile');
    return ClucActions.fsMethod.apply(null, args);
  },
  writeFileSudo: function(remoteFile, content, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('writeFileSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  fileExists: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('fileExists');
    return ClucActions.fsMethod.apply(null, args);
  },
  fileExistsSudo: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('fileExistsSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  rmdir: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('rmdir');
    return ClucActions.fsMethod.apply(null, args);
  },
  rmdirSudo: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('rmdirSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  mktemp: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('mktemp');
    return ClucActions.fsMethod.apply(null, args);
  },
  mkdir: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('mkdir');
    return ClucActions.fsMethod.apply(null, args);
  },
  mkdirSudo: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('mkdirSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  ensureEmptyDir: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('ensureEmptyDir');
    return ClucActions.fsMethod.apply(null, args);
  },
  ensureEmptyDirSudo: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('ensureEmptyDir');
    return ClucActions.fsMethod.apply(null, args);
  },
  ensureOwnership: function(remoteFile, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('ensureEmptyDir');
    return ClucActions.fsMethod.apply(null, args);
  },
  putDir: function(localPath, remotePath, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('putDir');
    return ClucActions.fsMethod.apply(null, args);
  },
  putDirSudo: function(localPath, remotePath, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('putDir');
    return ClucActions.fsMethod.apply(null, args);
  },
  getDir: function(remotePath, localPath, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('getDir');
    return ClucActions.fsMethod.apply(null, args);
  },
  generateTemplate: function(localTemplateFile, remoteFile, extraData, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('generateTemplate');
    return ClucActions.fsMethod.apply(null, args);
  },
  generateTemplateSudo: function(localTemplateFile, remoteFile, extraData, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('generateTemplateSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  generateTemplateDir: function(localTemplateFile, remoteFile, extraData, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('generateTemplateDir');
    return ClucActions.fsMethod.apply(null, args);
  },
  generateTemplateDirSudo: function(localTemplateFile, remoteFile, extraData, contextFn){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('generateTemplateDirSudo');
    return ClucActions.fsMethod.apply(null, args);
  },
  title: function(){
    var args = Array.prototype.slice.call(arguments);
    return ClucActions.then(function(then, line){
      var args = line.processTemplate(args);
      log.title.apply(log, args);
      then();
    });
  },
  subtitle: function(){
    var args = Array.prototype.slice.call(arguments);
    return ClucActions.then(function(then, line){
      var args = line.processTemplate(args);
      log.subtitle.apply(log, args);
      then();
    });
  },
  info: function(){
    var args = Array.prototype.slice.call(arguments);
    return ClucActions.then(function(then, line){
      var args = line.processTemplate(args);
      log.info.apply(log, args);
      then();
    });
  },
  skipped: function(){
    var args = Array.prototype.slice.call(arguments);
    return ClucActions.then(function(then, line){
      var args = line.processTemplate(args);
      log.skipped.apply(log, args);
      then();
    });
  },
  ask: function(options, contextFn){
    return ClucActions.then(function(then, line, context){
      options.choices = line.processTemplate(options.choices);
      options.message = line.processTemplate(options.message);
      inquirer.prompt(options, function InquirerPrompt(){
        var args = Array.prototype.slice.call(arguments);
        args.push(then);
        if(contextFn) contextFn.apply(context, args);
      } );

    });
  },
  choose: function(message, choices, contextFn){
    return ClucActions.ask({
      name:'chosen',
      type:'list',
      choices:choices,
      message:message
    }, contextFn);
  },
  textedit: function(msg, file, contextFn){
    return ClucActions.then(function(then, line, context){
      if(_.isFunction(file)){
        contextFn=file;
        file=temp.path({suffix: '.textedit'});
      }

      msg = line.processTemplate(msg);
      file = line.processTemplate(file);
      log.subtitle(msg+' '+file);

      editor(file, {}, function(code, sig){
        fs.exists(file, function(ex){
          if(ex){
            fs.readFile(file, function(err, data) {
              if (err) throw err;
              contextFn.apply(context, [data, code, sig]);
              then();
            });
          } else {
            contextFn.apply(context, ['', code, sig]);
            then();
          }
        })
      });


    });
  }
};

module.exports = ClucActions;
