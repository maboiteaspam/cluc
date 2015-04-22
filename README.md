# Cluc

Command line under control, a library to ease usage of command lines.

# Demo

with child_process
```js
    var Cluc = require('luc');

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

* [`Cluc.transports.ssh`]()
    * [`ClucSsh`](#ClucSsh)
        * [`ClucSsh.exec`](#exec)
        * [`ClucSsh.stream`](#stream)
        * [`ClucSsh.run`](#run)

* [`Cluc.output.ssh`]()
    * [`ClucOutputHelper`](#ClucOutputHelper)
        * [`ClucOutputHelper.confirm`](#confirm)
        * [`ClucOutputHelper.init`](#init)
        * [`ClucOutputHelper.must`](#must)
        * [`ClucOutputHelper.mustnot`](#mustnot)
        * [`ClucOutputHelper.warn`](#warn)
        * [`ClucOutputHelper.clean`](#clean)

* [`Cluc.transports.process`]()
    * [`ClucChildProcess`](#ClucSsh)
        * [`ClucChildProcess.exec`](#exec)
        * [`ClucChildProcess.stream`](#stream)
        * [`ClucChildProcess.run`](#run)

* [`Cluc.output.process`]()
    * [`ClucOutputHelper`](#ClucOutputHelper)
        * [`ClucSshOutputHelper.init`](#init)
        * [`ClucSshOutputHelper.is`](#is)
        * [`ClucSshOutputHelper.mustnot`](#mustnot)
        * [`ClucSshOutputHelper.warn`](#warn)
        * [`ClucSshOutputHelper.clean`](#clean)

---------------------------------------

# Status

In development. It needs some tests. It misses putFile and readDir implementations.
