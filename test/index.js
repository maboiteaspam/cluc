
process.env['NPM_LOG'] = process.env['NPM_LOG']
|| 'silly'
|| 'info'
|| 'verbose'
;

require('should');
var log = require('npmlog');
var Vagrant = require('node-vagrant-bin');

var servers = require('./vagrant.json');

var vagrant = new Vagrant();
var hasBooted = true;
before(function(done){
  this.timeout(50000);
  vagrant.isRunning(function(running){
    if(running===false){
      vagrant.up('precise64',function(err,booted){
        hasBooted = booted;
        done();
      });
    }else{
      console.log('running machine '+running);
      hasBooted = false;
      done();
    }
  });
});
after(function(done){
    this.timeout(50000);
    vagrant.isRunning(function(running){
      console.log('running machine '+running);
      if(hasBooted){
        vagrant.halt(function(){
          console.log('halted');
          done();
        });
      } else {
        done();
      }
    });
  });

describe('cluc', function(){
  this.timeout(50000);
  it('can work on local', function(done){

    var Cluc = require('../index.js');

    var ClucProcess = Cluc.transports.process;

    var clucLine = (new Cluc())
      .exec('ls -alh' , function(err,stdout,stderr){
        if(err) log.error(err);
        if(stderr) log.error(stderr);
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
      })
      .stream('ls -alh' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
        stdout.on('close',function(){
          console.log('stream')
          done();
        });
      });

    clucLine.run(new ClucProcess())
  });
  it('can work on ssh', function(done){

    var Cluc = require('../index.js');
    var server = servers.vagrant.ssh;

    var ClucSsh = Cluc.transports.ssh;
    var ssh = new ClucSsh();

    var clucLine = (new Cluc())
      .exec('ls -alh' , function(err,stdout,stderr){
        if(err) log.error(err);
        if(stderr) log.error(stderr);
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
      })
      .stream('ls -alh' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
        stdout.on('close',function(){
          console.log('stream')
          done();
        });
      });

    ssh.getConnReady(server, function(err){
      if(err) return done(err);
      clucLine.run(ssh)
    });
  });
});

