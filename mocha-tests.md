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

