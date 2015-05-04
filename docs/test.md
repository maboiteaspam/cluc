







# TOC
   - [cluc](#cluc)
<a name=""></a>
 
<a name="cluc"></a>
# cluc
can work on ssh.

```js
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
```

