

var pkg = require('../package.json');
var debug = require('debug')(pkg.name);
var through = require('through');
var child_process = require('child_process');
var fs = require('fs-extra');

var ClucChildProcess = (function(){
  /**
   * Executes commands on the local system
   *
   * @class
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
    this.shell.stdin.write(cmdStr);
    this.shell.stdin.write('\n');
    this.shell.stdin.write('echo "'+t+'"');
    this.shell.stdin.write('\n');
  };
  ClucChildProcess.prototype.putDir = function(fromPath, toPath, then){
    fs.copy(fromPath,toPath,then);
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

module.exports = ClucChildProcess;
