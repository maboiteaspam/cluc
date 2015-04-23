# Cluc

Command line under control, a library to ease usage of command lines.

# Demo

with child_process
```js
    var Cluc = require('cluc');

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
    var Cluc = require('cluc');

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


* [`ClucRule`](doc/ClucRule.md#ClucRule)
    * [`ClucRule.init`](doc/ClucRule.md#ClucRule.init)
    * [`ClucRule.forgeErrorMessage`](doc/ClucRule.md#ClucRule.forgeErrorMessage)
    * [`ClucRule.testData`](doc/ClucRule.md#ClucRule.testData)
    * [`ClucRule.close`](doc/ClucRule.md#ClucRule.close)

* [`Cluc.rules.must`](doc/ClucRule.md#ClucMust)
    * [`ClucMust.onClose`](doc/ClucRule.md#ClucMust.onClose)

* [`Cluc.rules.success`](doc/ClucRule.md#ClucSuccess)
    * [`ClucSuccess.onceMatch`](doc/ClucRule.md#ClucSuccess.onceMatch)

* [`Cluc.rules.mustnot`](doc/ClucRule.md#ClucMustNot)
    * [`ClucMustNot.onMatch`](doc/ClucRule.md#ClucMustNot.onMatch)
    * [`ClucMustNot.or`](doc/ClucRule.md#ClucMustNot.or)
    * [`ClucMustNot.onClose`](doc/ClucRule.md#ClucMustNot.onClose)

* [`Cluc.rules.confirm`](doc/ClucRule.md#ClucConfirm)
    * [`ClucConfirm.onceMatch`](doc/ClucRule.md#ClucConfirm.onceMatch)

* [`Cluc.rules.warn`](doc/ClucRule.md#ClucWarn)
    * [`ClucWarn.onceMatch`](doc/ClucRule.md#ClucWarn.onceMatch)

* [`Cluc.rules.watch`](doc/ClucRule.md#ClucWatch)
    * [`ClucWatch.onMatch`](doc/ClucRule.md#ClucWatch.onMatch)

* [`Cluc.rules.answer`](doc/ClucRule.md#ClucAnswer)
    * [`ClucAnswer.onMatch`](doc/ClucRule.md#ClucAnswer.onMatch)

* [`Cluc.rules.display`](doc/ClucRule.md#ClucDisplay)
    * [`ClucDisplay.onMatch`](doc/ClucRule.md#ClucDisplay.onMatch)


---------------------------------------

# Status

In development. It needs some tests. It misses putFile and readDir implementations.
