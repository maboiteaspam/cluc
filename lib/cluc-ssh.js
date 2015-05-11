

var pkg = require('../package.json');
var debug = require('debug')(pkg.name);
var SSH2Utils = require('ssh2-utils');
var ssh = new SSH2Utils();

var ClucSsh = (function(){
  /**
   * Execute the commands on a remote machine over ssh
   *
   * @class
   */
  var ClucSsh = function(server, OutputHelper){
    this.cmds = [];
    this.shell = null;
    this.server = null;
    this.OutputHelper = OutputHelper || require('./cluc-ssh-context.js');
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
  ClucSsh.prototype.copy = function(fromPath, toPath, then){
    ssh.putDir(this.shell, fromPath, toPath, then);
  };
  ClucSsh.prototype.putDir = function(fromPath, toPath, then){
    ssh.putDir(this.shell, fromPath, toPath, then);
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

module.exports = ClucSsh;
