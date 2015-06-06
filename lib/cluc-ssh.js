

var pkg = require('../package.json');
var debug = require('debug')(pkg.name);
var SSH2Utils = require('ssh2-utils');
var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');
var temp = require('temp').track();
var ssh = new SSH2Utils();

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

var ClucSsh = (function(){
  /**
   * Execute the commands on a remote machine over ssh
   *
   * @class ClucSsh
   */
  var ClucSsh = function(server, OutputHelper){
    this.cmds = [];
    this.shell = null;
    this.server = server;
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

  ClucSsh.prototype.readFile = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.readFile.apply(ssh, args);
  };
  ClucSsh.prototype.readFileSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.readFileSudo.apply(ssh, args);
  };
  ClucSsh.prototype.streamReadFile = function(){
    var args = Array.prototype.slice.call(arguments);
    (args).unshift(this.shell);
    ssh.streamReadFile.apply(ssh, args);
  };
  ClucSsh.prototype.streamReadFileSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.streamReadFileSudo.apply(ssh, args);
  };
  ClucSsh.prototype.getFile = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.getFile.apply(ssh, args);
  };
  ClucSsh.prototype.ensureFileContains = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.ensureFileContains.apply(ssh, args);
  };
  ClucSsh.prototype.ensureFileContainsSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.ensureFileContainsSudo.apply(ssh, args);
  };
  ClucSsh.prototype.putFile = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.putFile.apply(ssh, args);
  };
  ClucSsh.prototype.putFileSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.putFileSudo.apply(ssh, args);
  };
  ClucSsh.prototype.writeFile = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.writeFile.apply(ssh, args);
  };
  ClucSsh.prototype.writeFileSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.writeFileSudo.apply(ssh, args);
  };
  ClucSsh.prototype.fileExists = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.fileExists.apply(ssh, args);
  };
  ClucSsh.prototype.fileExistsSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.fileExistsSudo.apply(ssh, args);
  };
  ClucSsh.prototype.rmdir = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.rmdir.apply(ssh, args);
  };
  ClucSsh.prototype.rmdirSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.rmdirSudo.apply(ssh, args);
  };
  ClucSsh.prototype.mktemp = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.mktemp.apply(ssh, args);
  };
  ClucSsh.prototype.mkdir = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.mkdir.apply(ssh, args);
  };
  ClucSsh.prototype.mkdirSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.mkdirSudo.apply(ssh, args);
  };
  ClucSsh.prototype.ensureEmptyDir = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.ensureEmptyDir.apply(ssh, args);
  };
  ClucSsh.prototype.ensureEmptyDirSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.ensureEmptyDirSudo.apply(ssh, args);
  };
  ClucSsh.prototype.ensureOwnership = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.ensureOwnership.apply(ssh, args);
  };
  ClucSsh.prototype.putDir = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.putDir.apply(ssh, args);
  };
  ClucSsh.prototype.putDirSudo = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.putDirSudo.apply(ssh, args);
  };
  ClucSsh.prototype.getDir = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.shell);
    ssh.getDir.apply(ssh, args);
  };
  ClucSsh.prototype.generateTemplate = function(localPath, remotePath, data, then){
    var tplContent = fs.readFileSync(localPath, 'utf8');
    tplContent = _.template(tplContent)(data);
    // we do double pass to be able to inject variable within variable
    tplContent = _.template(tplContent)(data);
    ssh.writeFile(this.shell, remotePath, tplContent, then);
  };
  ClucSsh.prototype.generateTemplateSudo = function(localPath, remotePath, data, then){
    var tplContent = fs.readFileSync(localPath, 'utf8');
    tplContent = _.template(tplContent)(data);
    // we do double pass to be able to inject variable within variable
    tplContent = _.template(tplContent)(data);
    ssh.writeFileSudo(this.shell, remotePath, tplContent, then);
  };
  ClucSsh.prototype.generateTemplateDir = function(localPath, remotePath, data, then){
    var that = this;
    temp.mkdir(pkg.name, function(err, dirPath) {
      fs.copy(localPath, dirPath, function(){
        scanLocalDirectory(dirPath, function(dirs, files){
          // push files to remote
          files.forEach(function(f){
            var file = path.join(dirPath, f).replace(/[\\]/g,'/'); // windows needs this
            var tplContent = fs.readFileSync(file, 'utf8');
            tplContent = _.template(tplContent)(data);
            // we do double pass to be able to inject variable within variable
            tplContent = _.template(tplContent)(data);
            fs.writeFileSync(file, tplContent);
          });
          ssh.putDir(that.shell, dirPath, remotePath, then);
        });
      });
    });
  };
  ClucSsh.prototype.generateTemplateDirSudo = function(localPath, remotePath, data, then){
    var that = this;
    temp.mkdir(pkg.name, function(err, dirPath) {
      fs.copy(localPath, dirPath, function(){
        scanLocalDirectory(dirPath, function(dirs, files){
          // push files to remote
          files.forEach(function(f){
            var file = path.join(dirPath, f).replace(/[\\]/g,'/'); // windows needs this
            var tplContent = fs.readFileSync(file, 'utf8');
            tplContent = _.template(tplContent)(data);
            // we do double pass to be able to inject variable within variable
            tplContent = _.template(tplContent)(data);
            fs.writeFileSync(file, tplContent);
          });
          ssh.putDirSudo(that.shell, dirPath, remotePath, then);
        });
      });
    });
  };

  ClucSsh.prototype.open = function(then){
    var that = this;
    if(!this.shell){
      try{
        ssh.getConnReady( this.server, function(err, shell){
          if(err) throw err;

          that.shell = shell;

          that.shell.on('close' , function(){
            debug('shell closed');
          });
          if(then) then(null, that.shell);
        });
      }catch(e){
        if(then) then(e);
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
      }, 500);
    }else{
      if(then) then();
    }
  };
  return ClucSsh;
})();

module.exports = ClucSsh;
