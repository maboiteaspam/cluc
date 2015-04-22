
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


    var clucLine = (new Cluc())
      .exec('echo "some content, i can test that both windows / linux @!"' , function(err,stdout,stderr){
        if(err) log.error(err);
        if(stderr) log.error(stderr);
        this.confirm(/i can test that both windows/, 'it displays the message ');
        this.warn(/windows/, 'Windows so dirty...');
        console.log(' ---------------------- end of exec');
      })
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.confirm(/v[0-9]+/, 'it displays the message ');
        this.warn(/12\.0/, 'It must should not be v0.12.0.');
        stdout.on('close',function(){
          console.log(' ---------------------- end of stream');
          done();
        });
      });

    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      if(err) return done(err);
    });
  });
  it('can work on ssh', function(done){

    var Cluc = require('../index.js');
    var server = servers.vagrant.ssh;

    var clucLine = (new Cluc())
      .exec('ls -alh' , function(err,stdout,stderr){
        if(err) log.error(err);
        if(stderr) log.error(stderr);
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
        console.log(' ---------------------- end of exec');
      })
      .stream('ls -alh' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
        stdout.on('close',function(){
          console.log(' ---------------------- end of stream');
          done();
        });
      });

    var ClucSsh = Cluc.transports.ssh;
    (new ClucSsh()).run(clucLine, server, function(err){
      if(err) return done(err);
    });
  });
});

