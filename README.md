# Cluc

Command line under control, a library to ease usage of command lines.

# Demo

with child_process
```js
    var Cluc = require('luc');

    var clucLine = (new Cluc())
      .exec('ls -alh' , function(err,stdout,stderr){
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
      })
      .stream('ls -alh' , function(err,stdout,stderr){
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
        stdout.on('close',function(){ done(); });
      });

    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, function(err){
      if(err) return done(err);
    });
```



with ssh
```js
    var Cluc = require('luc');

    var clucLine = (new Cluc(Cluc.output.ssh))
      .exec('ls -alh' , function(err,stdout,stderr){
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
      })
      .stream('ls -alh' , function(err,stdout,stderr){
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
        stdout.on('close',function(){ done(); });
      });
    
    var ClucSsh = Cluc.transports.ssh;
    (new ClucSsh()).run(clucLine, server, function(err){
      if(err) return done(err);
    });
```

# API

* [`Cluc`](doc/Cluc.md#Cluc)
    * [`Cluc.stream`](doc/Cluc.md#Cluc.stream)
    * [`Cluc.exec`](doc/Cluc.md#Cluc.#exec)
    * [`Cluc.run`](doc/Cluc.md#Cluc.#run)



* [`Cluc.transports.process`](doc/ClucChildProcess.md)
    * [`ClucChildProcess`](doc/ClucChildProcess.md#ClucSsh)
        * [`ClucChildProcess.exec`](doc/ClucChildProcess.md#ClucSsh.exec)
        * [`ClucChildProcess.stream`](doc/ClucChildProcess.md#ClucSsh.stream)
        * [`ClucChildProcess.run`](doc/ClucChildProcess.md#ClucSsh.run)
        
* [`Cluc.output.process`](doc/ClucOutputHelper.md)
    * [`ClucOutputHelper`](doc/ClucOutputHelper.md#ClucOutputHelper)
        * [`ClucOutputHelper.init`](doc/ClucOutputHelper.md#ClucOutputHelper.init)
        * [`ClucOutputHelper.confirm`](doc/ClucOutputHelper.md#ClucOutputHelper.confirm)
        * [`ClucOutputHelper.mustnot`](doc/ClucOutputHelper.md#ClucOutputHelper.mustnot)
        * [`ClucOutputHelper.warn`](doc/ClucOutputHelper.md#ClucOutputHelper.warn)
        * [`ClucOutputHelper.clean`](doc/ClucOutputHelper.md#ClucOutputHelper.clean)



* [`Cluc.transports.ssh`](doc/ClucSsh.md#ClucSsh)
    * [`ClucSsh`](doc/ClucSsh.md#ClucSsh)
        * [`ClucSsh.exec`](doc/ClucSsh.md#ClucSsh.exec)
        * [`ClucSsh.stream`](doc/ClucSsh.md#ClucSsh.stream)
        * [`ClucSsh.run`](doc/ClucSsh.md#ClucSsh.run)
        
* [`Cluc.output.ssh`](doc/ClucSshOutputHelper.md)
    * [`ClucSshOutputHelper`](doc/ClucSshOutputHelper.md#ClucSshOutputHelper)
        * [`ClucSshOutputHelper.init`](doc/ClucSshOutputHelper.md#ClucSshOutputHelper.init)
        * [`ClucSshOutputHelper.is`](doc/ClucSshOutputHelper.md#ClucSshOutputHelper.is)
        * [`ClucSshOutputHelper.confirm`](doc/ClucSshOutputHelper.md#ClucSshOutputHelper.confirm)
        * [`ClucSshOutputHelper.must`](doc/ClucSshOutputHelper.md#ClucSshOutputHelper.must)
        * [`ClucSshOutputHelper.mustnot`](doc/ClucSshOutputHelper.md#ClucSshOutputHelper.mustnot)
        * [`ClucSshOutputHelper.warn`](doc/ClucSshOutputHelper.md#ClucSshOutputHelper.warn)



---------------------------------------

# Status

In development. It needs some tests. It misses putFile and readDir implementations.
