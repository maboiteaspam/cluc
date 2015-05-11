Bringing machine 'precise64' up with 'virtualbox' provider...
==> precise64: Checking if box 'ubuntu/precise64' is up to date...
==> precise64: A newer version of the box 'ubuntu/precise64' is available! You currently
==> precise64: have version '0'. The latest is version '20150430.0.0'. Run
==> precise64: `vagrant box update` to update.
==> precise64: Clearing any previously set forwarded ports...
==> precise64: Clearing any previously set network interfaces...
==> precise64: Preparing network interfaces based on configuration...
    precise64: Adapter 1: nat
==> precise64: Forwarding ports...
    precise64: 22 => 2222 (adapter 1)
==> precise64: Booting VM...
==> precise64: Waiting for machine to boot. This may take a few minutes...
    precise64: SSH address: 127.0.0.1:2222
    precise64: SSH username: vagrant
    precise64: SSH auth method: private key
    precise64: Warning: Connection timeout. Retrying...
    precise64: Warning: Remote connection disconnect. Retrying...
==> precise64: Machine booted and ready!
==> precise64: Checking for guest additions in VM...
    precise64: The guest additions on this VM do not match the installed version of
    precise64: VirtualBox! In most cases this is fine, but in rare cases it can
    precise64: prevent things such as shared folders from working properly. If you see
    precise64: shared folder errors, please make sure the guest additions within the
    precise64: virtual machine match the version of VirtualBox you have installed on
    precise64: your host and reload your VM.
    precise64: 
    precise64: Guest Additions Version: 4.1.12
    precise64: VirtualBox Version: 4.3
==> precise64: Mounting shared folders...
    precise64: /vagrant => /home/maboiteaspam/Bureau/cluc
==> precise64: Machine already provisioned. Run `vagrant provision` or use the `--provision`
==> precise64: to force provisioning. Provisioners marked to run always will still run.
==> precise64: Attempting graceful shutdown of VM...
==> centos: Domain is not created. Please run `vagrant up` first.
done !
# TOC
   - [stream](#stream)
   - [tail](#tail)
   - [orfn](#orfn)
   - [exec](#exec)
   - [then](#then)
<a name=""></a>
 
<a name="stream"></a>
# stream
execute once.

```js
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
```

can fail and stop.

```js
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
```

can redo on failure.

```js
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
```

<a name="tail"></a>
# tail
file.

```js
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
```

<a name="orfn"></a>
# orfn
can execute on rule failure.

```js
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
```

can return an error to stop execution.

```js
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
```

<a name="exec"></a>
# exec
execute once.

```js
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
```

can fail and stop.

```js
var Cluc = require('../index.js');
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
```

can redo on failure.

```js
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
```

<a name="then"></a>
# then
then.

```js
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
```

