
process.env['NPM_LOG'] = process.env['NPM_LOG']
|| 'info'
|| 'silly'
|| 'verbose'
;

require('should');
var fs = require('fs-extra');
var log = require('npmlog');
var Vagrant = require('node-vagrant-bin');

var servers = require('./vagrant.json');
var Cluc = require('../');
var ClucProcess = Cluc.transports.process;
var ClucSSh = Cluc.transports.ssh;

var vagrant = new Vagrant();
var hasBooted = true;
before(function(done){
  this.timeout(50000);
  vagrant.isRunning(function(running){
    if(running===false){
      log.info('machine is starting please be patient');
      var box = vagrant.up('precise64',function(err,booted){
        if (!err){
          hasBooted = booted;
          log.info('ok we are done !');
          return done();
        }
        done(err);
      });
      //box.stdout.on('data', function(d){process.stdout.write(''+d)});
      //box.stderr.on('data', function(d){process.stdout.write(''+d)});
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
        //box.stdout.on('data', function(d){process.stdout.write(''+d)});
        //box.stderr.on('data', function(d){process.stdout.write(''+d)});
      } else {
        log.info('Machine won t be shutdown');
        done();
      }
    });
  });

//
//describe('cluc', function(){
//  this.timeout(50000);
//  it('can work on local', function(done){
//
//    var Cluc = require('../index.js');
//
//
//    var clucLine = (new Cluc())
//      .exec('echo "some content, i can test that both windows / linux @!"' , function(err,stdout,stderr){
//        if(err) log.error(err);
//        if(stderr) log.error(stderr);
//        this.confirm(/i can test that both windows/, 'it displays the message ');
//        this.warn(/windows/, 'Windows so dirty...');
//      })
//      .stream('node -v' , function(err,stdout,stderr){
//        if(err) log.error(err);
//        this.confirm(/v([0-9]+)\.([0-9]+)\.([0-9]+)/, 'Node version is v%s.%s.%s ');
//        this.confirm(/(v[0-9-.]+)/);
//        this.success(/12\.[0-9]/, 'It s the latest !');
//        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(clucLine.die());
//        this.display();
//        this.redo(2);
//      })
//      .stream('echo "should not appear"' , function(err,stdout,stderr){
//        if(err) log.error(err);
//        this.display();
//      });
//
//    var ClucProcess = Cluc.transports.process;
//    (new ClucProcess()).run(clucLine, function(err){
//      if(err) return done(err);
//      done();
//    });
//  });
//
//  it('can work on ssh', function(done){
//
//    var Cluc = require('../index.js');
//    var server = servers.vagrant.ssh;
//
//    var clucLine = (new Cluc())
//      .exec('ls -alh' , function(err,stdout,stderr){
//        if(err) log.error(err);
//        if(stderr) log.error(stderr);
//        this.confirm(/vagrant/, 'Username should display on unix.');
//        this.warn(/root/, 'Some files does not belong vagrant users.');
//        this.display();
//      })
//      .stream('ls -a' , function(err,stdout,stderr){
//        if(err) log.error(err);
//        this.confirm(/vagrant/, 'Username should display on unix.');
//        this.warn(/root/, 'Some files does not belong vagrant users.');
//        this.display();
//      });
//
//    var ClucSsh = Cluc.transports.ssh;
//    (new ClucSsh()).run(clucLine, server, function(err){
//      if(err) return done(err);
//      done();
//    });
//  });
//
//  it('extras', function(done){
//
//    var extras = require('../extras.js');
//    var Cluc = require('../index.js');
//    var server = servers.vagrant.ssh;
//
//    var clucLine = (new Cluc());
//
//    extras.precise64.apache.uninstall.call(clucLine);
//    extras.precise64.apache.install.call(clucLine);
//    extras.precise64.apache.reload.call(clucLine);
//
//    clucLine.record(require('fs').createWriteStream(__dirname+'/fixtures/extras.log'));
//
//    var ClucSsh = Cluc.transports.ssh;
//    (new ClucSsh()).run(clucLine, server, function(err){
//      if(err) return done(err);
//      done();
//    });
//  });
//
//  it('download', function(done){
//
//    var extras = require('../extras.js');
//    var Cluc = require('../index.js');
//    var server = servers.vagrant.ssh;
//
//    var clucLine = (new Cluc())
//      .stream('mkdir ~/test && touch test/test.bashrc', function(){
//        this.display();
//      })
//      .stream('mkdir -p ~/test/tomate && touch test/tomate/tomate.bashrc', function(){
//        this.display();
//      })
//      .stream('ls -alh ~', function(){
//        this.display();
//      })
//      .download('/home/vagrant/test', __dirname+'/fixtures/test.bashrc', function(err){
//        if(err) log.error(err);
//      });
//
//    var ClucSsh = Cluc.transports.ssh;
//    (new ClucSsh()).run(clucLine, server, function(err){
//      if(err) return done(err);
//      done();
//    });
//  });
//
//  it('error', function(done){
//
//    var extras = require('../extras.js');
//    var Cluc = require('../index.js');
//    var server = servers.vagrant.ssh;
//
//    var clucLine = (new Cluc())
//      .stream('mkdir ~/test', function(){
//        this.warn(/cannot create directory.+/).or(function(err,then){
//          then(new Error(err));
//        });
//        this.warn(/File exists/).or(function(err,then){
//          then();
//          // void
//        });
//        this.redo(2);
//      });
//
//    var ClucSsh = Cluc.transports.ssh;
//    (new ClucSsh()).run(clucLine, server, function(err){
//      if(err) return done(err);
//      done();
//    });
//  });
//
//  it('record', function(done){
//
//    var extras = require('../extras.js');
//    var Cluc = require('../index.js');
//    var server = servers.vagrant.ssh;
//
//    var clucLine = (new Cluc())
//      .stream('mkdir ~/test', function(){
//        this.warn(/cannot create directory.+/).or(function(err,then){
//          then(new Error(err));
//        });
//        this.warn(/File exists/).or(function(err,then){
//          // void
//          then();
//        });
//        this.redo(2);
//      }).record(require('fs').createWriteStream(__dirname+'/fixtures/some.log'));
//
//    var ClucSsh = Cluc.transports.ssh;
//    (new ClucSsh()).run(clucLine, server, function(err){
//      if(err) return done(err);
//      done();
//    });
//  });
//
//});


var fixturePath = __dirname+'/fixtures';

before(function(done){
  fs.mkdirs(fixturePath, function(){
    done();
  })
});

describe('stream', function(){
  this.timeout(50000);
  it('execute once', function(done){
    var doneCnt = 0;

    (new Cluc())
      .stream('node -v' , function(err){
        if(err) log.error(err);
        this.display();
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(1);
        if(err) return done(err);
        done();
      });
  });
  it('can fail and stop', function(done){

    var doneCnt = 0;

    var clucLine = (new Cluc())
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(clucLine.die());
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(clucLine.die());
        doneCnt++;

      }).stream('node -v' , function(){
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.not.eql(2);
        doneCnt.should.eql(1);
        (err===null).should.be.false;
        done();
      });
  });
  it('can redo on failure', function(done){

    var doneCnt = 0;
    (new Cluc())
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.');
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.');
        this.redo(2);
        doneCnt++;

      }).stream('node -v' , function(err,stdout,stderr){
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(3);
        (err===null).should.be.false;
        done();
      });

  });
});

describe('tail', function(){
  this.timeout(50000);
  it('file', function(done){

    var doneCnt = 0;

    var clucLine = (new Cluc())
      .tail('sudo tail -f /var/log/messages -n 50' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        clucLine.wait((function(fn){
          setTimeout(fn, 2500);
        }));
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(1);
        if(err) return done(err);
        done();
      });

  });
});

describe('orfn', function(){
  this.timeout(50000);
  it('can execute on rule failure', function(done){

    var doneCnt = 0;
    (new Cluc())
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(function(reason, then){
          doneCnt++;
          reason.should.eql('It should not be v0.12.x.');
          then();
        });

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(1);
        done();
      });

  });
  it('can return an error to stop execution', function(done){

    var doneCnt = 0;
    (new Cluc())
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(function(reason, then){
          doneCnt++;
          reason.should.eql('It should not be v0.12.x.');
          then(new Error(reason));
        });

      }).stream('node -v' , function(err,stdout,stderr){
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(1);
        done();
      });

  });
});

describe('exec', function(){
  this.timeout(50000);
  it('execute once', function(done){

    var doneCnt = 0;
    (new Cluc())
      .exec('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(1);
        if(err) return done(err);
        done();
      });
  });
  it('can fail and stop', function(done){

    var doneCnt = 0;
    var clucLine = (new Cluc())
      .exec('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(clucLine.die());
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(clucLine.die());
        doneCnt++;

      }).stream('node -v' , function(err,stdout,stderr){
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.not.eql(2);
        doneCnt.should.eql(1);
        (err===null).should.be.false;
        done();
      });
  });
  it('can redo on failure', function(done){

    var doneCnt = 0;
    (new Cluc())
      .exec('node -v' , function(err){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.');
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.');
        this.redo(2);
        doneCnt++;

      }).stream('node -v' , function(err,stdout,stderr){
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(3);
        (err===null).should.be.false;
        done();
      });

  });
});

describe('then', function(){
  this.timeout(50000);
  it('then', function(done){

    var hasThen = '';
    var doneCnt = 0;
   (new Cluc())
      .exec('node -v' , function(err, stdout, stderr){
        if(err) log.error(err);
        this.display();
        doneCnt++;

      }).then(function(next){
        hasThen += 'has';
        next();

      }).then(function(next){
        hasThen += 'Then';
        next();

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(1);
        hasThen.should.eql('hasThen');
        if(err) return done(err);
        done();
      });

  });
});

describe('mkdir', function(){
  it('creates a local directory', function(done){
    var doneCnt = 0;
    (new Cluc())
      .mkdir(fixturePath+'/test', function(err){
        if(err) log.error(err);
        (!!err).should.be.false;
        fs.existsSync(fixturePath+'/test').should.be.true;
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(1);
        if(err) return done(err);
        done();
      });
  });
  it('creates a remote directory', function(done){
    var doneCnt = 0;
    var t = Date.now();
    (new Cluc())
      .mkdir('/home/vagrant/test'+t, function(err){
        if(err) log.error(err);
        (!!err).should.be.false;
        fs.existsSync(fixturePath+'/test').should.be.true;
        doneCnt++;

      }).fileExists('/home/vagrant/test'+t, function(err, exists){
        if(err) log.error(err);
        (!!err).should.be.false;
        (exists).should.be.true;
        doneCnt++;

      }).run(new ClucSSh(servers.vagrant.ssh), function(err){
        doneCnt.should.eql(2);
        if(err) return done(err);
        done();
      });
  });
  it('fails properly to create a remote directory', function(done){
    var doneCnt = 0;
    var t = Date.now();
    (new Cluc())
      .mkdir('/root/test'+t, function(err){
        if(err) log.error(err);
        (!!err).should.be.true;
        err.code.should.eql(3);
        err.message.should.match(/Permission denied/);
        doneCnt++;

      }).run(new ClucSSh(servers.vagrant.ssh), function(err){
        doneCnt.should.eql(1);
        if(err) return done(err);
        done();
      });
  });
});

describe('ensureFileContains', function(){
  it('ensure a local file contains a piece of text', function(done){
    var t = ''+Date.now();
    var doneCnt = 0;
    (new Cluc())
      .ensureFileContains(fixturePath+'/test'+t, ''+t, function(err, contains){
        if(err) log.error(err);
        (!!contains).should.be.false;
        doneCnt++;

      }).readFile(fixturePath+'/test'+t, function(err, content){
        if(err) log.error(err);
        (content).should.match(t);
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(2);
        if(err) return done(err);
        done();
      });
  });
  it('ensure a remote file contains a piece of text', function(done){
    var t = ''+Date.now();
    var doneCnt = 0;
    (new Cluc())
      .fileExists('/home/vagrant/test'+t, function(err, exists){
        if(err) log.error(err);
        (!!exists).should.be.false;
        doneCnt++;

      }).ensureFileContains('/home/vagrant/test'+t, ''+t, function(err, contains){
        if(err) log.error(err);
        (!!contains).should.be.true;
        doneCnt++;

      }).readFile('/home/vagrant/test'+t, function(err, content){
        if(err) log.error(err);
        (content).indexOf(t).should.not.eql(-1);
        doneCnt++;

      }).run(new ClucSSh(servers.vagrant.ssh), function(err){
        doneCnt.should.eql(3);
        if(err) return done(err);
        done();
      });
  });
  it('fails properly to ensure a local file contains a piece of text', function(done){
    var doneCnt = 0;
    var t = Date.now();
    (new Cluc())
      .ensureFileContains('/root/test'+t, 'some', function(err, contains){
        if(err) log.error(err);
        (!!contains).should.be.false;
        (!!err).should.be.true;
        err.code.should.eql('EACCES');
        err.message.should.match(/EACCES/);
        doneCnt++;

      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(1);
        if(err) return done(err);
        done();
      });
  });
  it('fails properly to ensure a remote file contains a piece of text', function(done){
    var doneCnt = 0;
    var t = ''+Date.now();
    (new Cluc())
      .ensureFileContains('/root/test'+t, 'some', function(err, contains){
        if(err) log.error(err);
        (!!contains).should.be.false;
        (!!err).should.be.true;
        err.message.should.match(/Permission denied/);
        doneCnt++;

      }).run(new ClucSSh(servers.vagrant.ssh), function(err){
        doneCnt.should.eql(1);
        if(err) return done(err);
        done();
      });
  });
});

describe('captureValue', function(){
  it('can capture data from output and save its value', function(done){
    var t = ''+Date.now();
    var doneCnt = 0;
    var line = (new Cluc())
      .exec('node -v', function(err){
        if(err) log.error(err);
        (!!err).should.be.false;
        doneCnt++;
        this.captureValue('nodeVersion', /([0-9]+\.[0-9]+(\.[0-9]+)?)/);

      }).then(function(next){
        console.error(line.savedValues);
        ('nodeVersion' in line.savedValues).should.be.true;
        line.savedValues.nodeVersion.should.match(/([0-9]+\.[0-9]+(\.[0-9]+)?)/);
        next();

      }).exec('echo <%= quote(nodeVersion) %>', function(){
        this.display();
      }).run(new ClucProcess(), function(err){
        doneCnt.should.eql(1);
        if(err) return done(err);
        done();
      });
  });
});
