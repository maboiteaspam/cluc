# TOC
   - [stream](#stream)
   - [tail](#tail)
   - [orfn](#orfn)
   - [exec](#exec)
<a name=""></a>
 
<a name="stream"></a>
# stream
execute once.

```js
var Cluc = require('../index.js');
    var dontCnt = 0;
    var clucLine = (new Cluc())
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        dontCnt++;
      });
    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      dontCnt.should.eql(1);
      if(err) return done(err);
      done();
    });
```

can fail and stop.

```js
var Cluc = require('../index.js');
    var dontCnt = 0;
    var clucLine = (new Cluc())
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(clucLine.die());
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(clucLine.die());
        dontCnt++;
      })
      .stream('node -v' , function(err,stdout,stderr){
        dontCnt++;
      });
    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      dontCnt.should.not.eql(2);
      dontCnt.should.eql(1);
      (err===null).should.be.false;
      done();
    });
```

can redo on failure.

```js
var Cluc = require('../index.js');
    var dontCnt = 0;
    var clucLine = (new Cluc())
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.');
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.');
        this.redo(2);
        dontCnt++;
      })
      .stream('node -v' , function(err,stdout,stderr){
        dontCnt++;
      });
    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      dontCnt.should.eql(3);
      (err===null).should.be.false;
      done();
    });
```

<a name="tail"></a>
# tail
file.

```js
var Cluc = require('../index.js');
    var dontCnt = 0;
    var clucLine = (new Cluc())
      .tail('sudo tail -f /var/log/messages -n 50' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        clucLine.wait((function(fn){
          setTimeout(fn, 2500);
        }));
        dontCnt++;
      });
    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      dontCnt.should.eql(1);
      if(err) return done(err);
      done();
    });
```

<a name="orfn"></a>
# orfn
can execute on rule failure.

```js
var Cluc = require('../index.js');
    var dontCnt = 0;
    var clucLine = (new Cluc())
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(function(reason, then){
          dontCnt++;
          reason.should.eql('It should not be v0.12.x.');
          then();
        });
      });
    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      dontCnt.should.eql(1);
      done();
    });
```

can return an error to stop execution.

```js
var Cluc = require('../index.js');
    var dontCnt = 0;
    var clucLine = (new Cluc())
      .stream('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(function(reason, then){
          dontCnt++;
          reason.should.eql('It should not be v0.12.x.');
          then(new Error(reason));
        });
      })
      .stream('node -v' , function(err,stdout,stderr){
        dontCnt++;
      });
    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      dontCnt.should.eql(1);
      done();
    });
```

<a name="exec"></a>
# exec
execute once.

```js
var Cluc = require('../index.js');
    var dontCnt = 0;
    var clucLine = (new Cluc())
      .exec('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        dontCnt++;
      });
    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      dontCnt.should.eql(1);
      if(err) return done(err);
      done();
    });
```

can fail and stop.

```js
var Cluc = require('../index.js');
    var dontCnt = 0;
    var clucLine = (new Cluc())
      .exec('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(clucLine.die());
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.').or(clucLine.die());
        dontCnt++;
      })
      .stream('node -v' , function(err,stdout,stderr){
        dontCnt++;
      });
    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      dontCnt.should.not.eql(2);
      dontCnt.should.eql(1);
      (err===null).should.be.false;
      done();
    });
```

can redo on failure.

```js
var Cluc = require('../index.js');
    var dontCnt = 0;
    var clucLine = (new Cluc())
      .exec('node -v' , function(err,stdout,stderr){
        if(err) log.error(err);
        this.display();
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.');
        this.mustnot(/12\.[0-9]/, 'It should not be v0.12.x.');
        this.redo(2);
        dontCnt++;
      })
      .stream('node -v' , function(err,stdout,stderr){
        dontCnt++;
      });
    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      dontCnt.should.eql(3);
      (err===null).should.be.false;
      done();
    });
```

