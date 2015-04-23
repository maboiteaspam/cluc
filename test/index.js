
process.env['NPM_LOG'] = process.env['NPM_LOG']
|| 'info'
|| 'silly'
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
      log.info('machine is starting please be patient');
      var box = vagrant.up('precise64',function(err,booted){
        hasBooted = booted;
        log.info('ok we are done !');
        done();
      });
      box.stdout.on('data', function(d){process.stdout.write(''+d)});
      box.stderr.on('data', function(d){process.stdout.write(''+d)});
    }else{
      log.info('Machine already running '+running);
      hasBooted = false;
      done();
    }
  });
});
after(function(done){
    this.timeout(50000);
    vagrant.isRunning(function(running){
      if(hasBooted && running){
        log.info('Machine was started by mocha, halting');
        var box = vagrant.halt(function(){
          console.log('done !');
          done();
        });
        box.stdout.on('data', function(d){process.stdout.write(''+d)});
        box.stderr.on('data', function(d){process.stdout.write(''+d)});
      } else {
        log.info('Machine won t be shutdown');
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
      })
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.confirm(/v([0-9]+)\.([0-9]+)\.([0-9]+)/, 'Node version is v%s.%s.%s ');
        this.confirm(/(v[0-9-.]+)/);
        this.success(/12\.0/, 'It s the latest !');
        this.mustnot(/12\.0/, 'It should not be v0.12.0.').or(clucLine.die());
        this.display();
      })
      .stream('echo "should not appear"' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
      });

    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      if(err) return done(err);
      done();
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
        this.display();
      })
      .stream('ls -a' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
        this.display();
      });

    var ClucSsh = Cluc.transports.ssh;
    (new ClucSsh()).run(clucLine, server, function(err){
      if(err) return done(err);
      done();
    });
  });

  it('extras', function(done){

    var extras = require('../extras.js');
    var Cluc = require('../index.js');
    var server = servers.vagrant.ssh;

    var clucLine = (new Cluc());

    extras.precise64.apache.uninstall.call(clucLine);
    extras.precise64.apache.install.call(clucLine);
    extras.precise64.apache.reload.call(clucLine);

    var ClucSsh = Cluc.transports.ssh;
    (new ClucSsh()).run(clucLine, server, function(err){
      if(err) return done(err);
      done();
    });
  });
});

