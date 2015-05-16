# TOC
   - [stream](#stream)
   - [tail](#tail)
   - [orfn](#orfn)
   - [exec](#exec)
   - [then](#then)
   - [mkdir](#mkdir)
   - [ensureFileContains](#ensurefilecontains)
   - [captureValue](#capturevalue)
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

<a name="mkdir"></a>
# mkdir
creates a local directory.

```js
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
```

creates a remote directory.

```js
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
```

fails properly to create a remote directory.

```js
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
```

<a name="ensurefilecontains"></a>
# ensureFileContains
ensure a local file contains a piece of text.

```js
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
```

ensure a remote file contains a piece of text.

```js
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
```

fails properly to ensure a local file contains a piece of text.

```js
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
```

fails properly to ensure a remote file contains a piece of text.

```js
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
```

<a name="capturevalue"></a>
# captureValue
can capture data from output and save its value.

```js
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
```

