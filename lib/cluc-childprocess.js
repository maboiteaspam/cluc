

var _ = require('underscore');
var pkg = require('../package.json');
var debug = require('debug')(pkg.name);
var path = require('path');
var through = require('through');
var child_process = require('child_process');
var glob = require('glob');
var fs = require('fs-extra');
var temp = require('temp').track();


var scanLocalDirectory = function(localPath, then){
  // scan local directories
  var options = {
    cwd: localPath
  };
  glob( '**/', options, function (er, dirs) {
    // scan local files
    options.nodir = true;
    glob( '**', options, function (er, files) {
      then(dirs, files);
    });
  });
};

var ClucChildProcess = (function(){
  /**
   * Executes commands on the local system
   *
   * @class ClucChildProcess
   */
  var ClucChildProcess = function(OutputHelper){
    this.shell = null;
    this.cmds = [];
    this.OutputHelper = OutputHelper || require('./cluc-childprocess-context.js');
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
    var that = this;
    var testEnd = function(stream){
      var listener = function(d){
        debug(d+'');
        var isEnd = (''+d).match(t);
        if (isEnd){
          d = (''+d).replace(t,'');
        }
        if(!(''+d).match(/\n$/))d+='\n';
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
    this.shell.stdin.write(''+cmdStr+''+'; echo -n "\n'+t+'";');
    that.shell.stdin.write('\n');
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
      if(that.shell){
        debug('finish');
        that.shell.stdout.removeListener('data', saveStdout);
        that.shell.stderr.removeListener('data', saveStderr);
        procesStream.emit('close');
        procesStream.removeAllListeners('close');
        then(null, stdout, stderr, procesStream);
      }
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
    this.shell.stdin.write(''+cmdStr+''+'; echo -n "\n'+t+'";');
    that.shell.stdin.write('\n');
  };

  ClucChildProcess.prototype.readFile = function(path, then){
    fs.readFile(path, function(err, data){
      if(then) then(err, ''+data);
    });
  };
  ClucChildProcess.prototype.readFileSudo = function(path, then){
    fs.readFile(path, function(err, data){
      if(then) then(err, ''+data);
    });
  };
  ClucChildProcess.prototype.streamReadFile = function(path, then){
    fs.createReadStream(path,then);
  };
  ClucChildProcess.prototype.streamReadFileSudo = function(path, then){
    fs.createReadStream(path,then);
  };
  ClucChildProcess.prototype.getFile = function(fromPath, toPath, then){
    fs.copy(fromPath, toPath,then);
  };
  ClucChildProcess.prototype.ensureFileContains = function(path, content, then){
    var stream = fs.createReadStream(path);
    var found = false;
    stream.on('data',function(d){
      if(!found) found = !!(''+d).match(content);
    });
    var writeFile = function(err){
      if(!found){
        fs.appendFile(path, content, function () {
          then(err, found);
        });
      }else{
        then(err, found);
      }
    };
    stream.on('error', writeFile);
    stream.on('close', writeFile);
  };
  ClucChildProcess.prototype.ensureFileContainsSudo = function(path, content, then){
    var stream = fs.createReadStream(path);
    var found = false;
    stream.on('data',function(d){
      if(found) found=!!(''+d).match(content)
    });
    stream.on('error',function(err){
      fs.appendFile(path, content, function () {
        then(err, found);
      });
    });
    stream.on('close',function(err){
      fs.appendFile(path, content, function () {
        then(err, found);
      });
    });
  };
  ClucChildProcess.prototype.putFile = function(path, toPath, then){
    fs.copy(path, toPath, then);
  };
  ClucChildProcess.prototype.putFileSudo = function(path, toPath, then){
    fs.copy(path, toPath, then);
  };
  ClucChildProcess.prototype.generateTemplate = function(localPath, remotePath, data, then){
    var tplContent = fs.readFileSync(localPath, 'utf8');
    tplContent = _.template(tplContent)(data);
    // we do double pass to be able to inject variable within variable
    tplContent = _.template(tplContent)(data);
    fs.writeFile(remotePath, tplContent, then);
  };
  ClucChildProcess.prototype.generateTemplateSudo = function(localPath, remotePath, data, then){
    var tplContent = fs.readFileSync(localPath, 'utf8');
    tplContent = _.template(tplContent)(data);
    // we do double pass to be able to inject variable within variable
    tplContent = _.template(tplContent)(data);
    fs.writeFile(remotePath, tplContent, then);
  };
  ClucChildProcess.prototype.generateTemplateDir = function(localPath, remotePath, data, then){
    fs.copy(localPath, remotePath, function(){
      scanLocalDirectory(remotePath, function(dirs, files){
        // push files to remote
        files.forEach(function(f){
          var file = path.join(remotePath, f).replace(/[\\]/g,'/'); // windows needs this
          var tplContent = fs.readFileSync(file, 'utf8');
          var compiled = null;
          try{
            compiled = _.template(tplContent);
            tplContent = compiled(data);
            // we do double pass to be able to inject variable within variable
            compiled = _.template(tplContent);
            tplContent = compiled(data);
            fs.writeFileSync(file, tplContent);
          }catch(ex){
            if(compiled)console.log(compiled.source);
            console.log(ex);
          }
        });
        then();
      });
    });
  };
  ClucChildProcess.prototype.generateTemplateDirSudo = function(localPath, remotePath, data, then){
    fs.copy(localPath, remotePath, function(){
      scanLocalDirectory(remotePath, function(dirs, files){
        // push files to remote
        files.forEach(function(f){
          var file = path.join(remotePath, f).replace(/[\\]/g,'/'); // windows needs this
          var tplContent = fs.readFileSync(file, 'utf8');
          var compiled = null;
          try{
            compiled = _.template(tplContent);
            tplContent = compiled(data);
            // we do double pass to be able to inject variable within variable
            compiled = _.template(tplContent);
            tplContent = compiled(data);
            fs.writeFileSync(file, tplContent);
          }catch(ex){
            if(compiled)console.log(compiled.source);
            console.log(ex);
          }
        });
        then();
      });
    });
  };
  ClucChildProcess.prototype.writeFile = function(path, content, then){
    fs.writeFile(path, content, then);
  };
  ClucChildProcess.prototype.writeFileSudo = function(path, content, then){
    fs.writeFile(path, content, then);
  };
  ClucChildProcess.prototype.fileExists = function(path, then){
    fs.fileExists(path, then);
  };
  ClucChildProcess.prototype.fileExistsSudo = function(path, then){
    fs.fileExists(path, then);
  };
  ClucChildProcess.prototype.rmdir = function(path, then){
    fs.remove(path, then);
  };
  ClucChildProcess.prototype.rmdirSudo = function(path, then){
    fs.remove(path, then);
  };
  ClucChildProcess.prototype.mktemp = function(suffix, then){
    temp.mkdir({suffix: suffix||'mktemp'}, function(err, dirPath) {
      if(then) then(err, dirPath);
    });
  };
  ClucChildProcess.prototype.mkdir = function(path, then){
    fs.mkdirs(path, then);
  };
  ClucChildProcess.prototype.mkdirSudo = function(path, then){
    fs.mkdirs(path, then);
  };
  ClucChildProcess.prototype.ensureEmptyDir = function(path, then){
    fs.emptyDir(path, then);
  };
  ClucChildProcess.prototype.ensureEmptyDirSudo = function(path, then){
    fs.emptyDir(path, then);
  };
  ClucChildProcess.prototype.ensureOwnership = function(path, then){
  };
  ClucChildProcess.prototype.putDir = function(path, toPath, then){
    fs.copy(path, toPath, then);
  };
  ClucChildProcess.prototype.putDirSudo = function(path, toPath, then){
    fs.copy(path, toPath, then);
  };
  ClucChildProcess.prototype.getDir = function(path, toPath, then){
    fs.copy(path, toPath, then);
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
    if(then) then();
  };
  return ClucChildProcess;
})();

module.exports = ClucChildProcess;
