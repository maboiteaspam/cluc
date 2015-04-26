# Cluc

Command line under control, a library to ease usage of command lines.

# Demo

with child_process
```js
    var Cluc = require('cluc');

    var clucLine = (new Cluc())
      .exec('ls -alh' , function(err,stdout,stderr){
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.').or(function(err){
            return new Error(err);
          });
          
      })
      .stream('ls -alh' , function(err,stdout,stderr){
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
        
      }).stream('sudo apt-get remove apache2 -y', function(){
          this.progress(/Reading (:<title>[\w\s]+)[ .]*(:<current>\d+)%/);
          this.mustnot(/0 to remove/, 'no package to remove found');
          this.confirm(/([1-9]+) to remove/, ' found %s package to remove');
          this.success(/(Removing [^ ]+\s+[.]+)/i, 'Package removed !');
          this.warn(/(Unable to locate package )/i, 'Package not found');
          
      }).stream('sudo apt-get install apache2 -y', function(){
          this.mustnot(/You should explicitly select one to install/, "too many results");
          this.mustnot(/has no installation candidate/, "can not install httpd");
          this.watch(/Need to get ([0-9- ,-]+ [a-z]+) of archives/i);
          this.watch(/After this operation, ([0-9- ,-]+ [a-z]+) of additional disk space will be used/i);
          this.spin(/((Reading|Building).+)/i);
          this.spin(/^\s*([0-9]+%)/i);
          this.warn(/(is already the newest version)/i, 'Already installed');
          this.warn(/(0 newly installed)/i, 'Package not installed');
          this.confirm(/([^ /]+)\.deb/i);
          this.success(/(1 newly installed)/i, 'Package installed !');
          //this.redo(2);
          //this.display();
          
        }).download('/home/vagrant/test', __dirname+'/fixtures/test.bashrc', function(err){
           if(err) log.error(err);
           
        }).record(require('fs').createWriteStream('some/output.log'));;

    var ClucProcess = Cluc.transports.process;
    (new ClucProcess()).run(clucLine, done);
```



with ssh
```js
    var Cluc = require('cluc');

    var clucLine = (new Cluc(Cluc.output.ssh))
      .exec('ls -alh' , function(err,stdout,stderr){
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
        this.display();
      })
      .stream('ls -alh' , function(err,stdout,stderr){
        this.confirm(/vagrant/, 'Username should display on unix.');
        this.warn(/root/, 'Some files does not belong vagrant users.');
      });
    
    var ClucSsh = Cluc.transports.ssh;
    (new ClucSsh()).run(clucLine, server, done);
```

# API

#### [`Cluc`](doc/Cluc.md#Cluc)
* [`Cluc.stream`](doc/Cluc.md#Cluc.stream)
* [`Cluc.tail`](doc/Cluc.md#Cluc.tail)
* [`Cluc.exec`](doc/Cluc.md#Cluc.#exec)
* [`Cluc.run`](doc/Cluc.md#Cluc.#run)
* [`Cluc.wait`](doc/Cluc.md#Cluc.#wait)
* [`Cluc.concat`](doc/Cluc.md#Cluc.#concat)
* [`Cluc.die`](doc/Cluc.md#Cluc.#die)

#### [`Cluc.transports`]()
* [`Cluc.transports.process`](doc/ClucChildProcess.md)
* [`Cluc.transports.ssh`](doc/ClucSsh.md#ClucSsh)

#### [`Cluc.output`]()
* [`Cluc.output.process`](doc/ClucContext.md)
* [`Cluc.output.ssh`](doc/ClucSSHContext.md)

#### [`Cluc.rules`]()
* [`Cluc.rules.must`](doc/ClucRule.md#ClucMust)
* [`Cluc.rules.success`](doc/ClucRule.md#ClucSuccess)
* [`Cluc.rules.mustnot`](doc/ClucRule.md#ClucMustNot)
* [`Cluc.rules.confirm`](doc/ClucRule.md#ClucConfirm)
* [`Cluc.rules.warn`](doc/ClucRule.md#ClucWarn)
* [`Cluc.rules.watch`](doc/ClucRule.md#ClucWatch)
* [`Cluc.rules.answer`](doc/ClucRule.md#ClucAnswer)
* [`Cluc.rules.display`](doc/ClucRule.md#ClucDisplay)


#### [`ClucChildProcess`](doc/ClucChildProcess.md#ClucSsh)
* [`ClucChildProcess.exec`](doc/ClucChildProcess.md#ClucSsh.exec)
* [`ClucChildProcess.stream`](doc/ClucChildProcess.md#ClucSsh.stream)
* [`ClucChildProcess.run`](doc/ClucChildProcess.md#ClucSsh.run)
* [`ClucChildProcess.createContext`](doc/ClucChildProcess.md#ClucSsh.createContext)


#### [`ClucContext`](doc/ClucContext.md#ClucContext)
* [`ClucContext.init`](doc/ClucContext.md#ClucContext.init)
* [`ClucContext.pushRule`](doc/ClucContext.md#ClucContext.pushRule)
* [`ClucContext.must`](doc/ClucContext.md#ClucContext.must)
* [`ClucContext.success`](doc/ClucContext.md#ClucContext.success)
* [`ClucContext.confirm`](doc/ClucContext.md#ClucContext.confirm)
* [`ClucContext.mustnot`](doc/ClucContext.md#ClucContext.mustnot)
* [`ClucContext.warn`](doc/ClucContext.md#ClucContext.warn)
* [`ClucContext.watch`](doc/ClucContext.md#ClucContext.watch)
* [`ClucContext.answer`](doc/ClucContext.md#ClucContext.answer)
* [`ClucContext.display`](doc/ClucContext.md#ClucContext.display)
* [`ClucContext.redo`](doc/ClucContext.md#ClucContext.redo)


#### [`ClucSsh`](doc/ClucSsh.md#ClucSsh)
* [`ClucSsh.exec`](doc/ClucSsh.md#ClucSsh.exec)
* [`ClucSsh.stream`](doc/ClucSsh.md#ClucSsh.stream)
* [`ClucSsh.run`](doc/ClucSsh.md#ClucSsh.run)
* [`ClucSsh.createContext`](doc/ClucSsh.md#ClucSsh.createContext)

        
#### [`ClucSSHContext`](doc/ClucSSHContext.md#ClucSSHContext)
* [`ClucSSHContext.init`](doc/ClucSSHContext.md#ClucSSHContext.init)
* [`ClucSSHContext.pushRule`](doc/ClucSSHContext.md#ClucSSHContext.pushRule)
* [`ClucSSHContext.is`](doc/ClucSSHContext.md#ClucSSHContext.is)
* [`ClucSSHContext.must`](doc/ClucSSHContext.md#ClucSSHContext.must)
* [`ClucSSHContext.success`](doc/ClucSSHContext.md#ClucSSHContext.success)
* [`ClucSSHContext.confirm`](doc/ClucSSHContext.md#ClucSSHContext.confirm)
* [`ClucSSHContext.mustnot`](doc/ClucSSHContext.md#ClucSSHContext.mustnot)
* [`ClucSSHContext.warn`](doc/ClucSSHContext.md#ClucSSHContext.warn)
* [`ClucSSHContext.watch`](doc/ClucSSHContext.md#ClucSSHContext.watch)
* [`ClucSSHContext.answer`](doc/ClucSSHContext.md#ClucSSHContext.answer)
* [`ClucSSHContext.display`](doc/ClucSSHContext.md#ClucSSHContext.display)
* [`ClucSSHContext.redo`](doc/ClucSSHContext.md#ClucSSHContext.redo)


#### [`ClucRule`](doc/ClucRule.md#ClucRule)
* [`ClucRule.init`](doc/ClucRule.md#ClucRule.init)
* [`ClucRule.forgeErrorMessage`](doc/ClucRule.md#ClucRule.forgeErrorMessage)
* [`ClucRule.testData`](doc/ClucRule.md#ClucRule.testData)
* [`ClucRule.close`](doc/ClucRule.md#ClucRule.close)
* [`ClucRule.hasFailed`](doc/ClucRule.md#ClucRule.hasFailed)
* [`ClucRule.or`](doc/ClucRule.md#ClucRule.or)

    
#### [`ClucMust`](doc/ClucRule.md#ClucMust)
* [`ClucMust.onClose`](doc/ClucRule.md#ClucMust.onClose)

    
#### [`ClucSuccess`](doc/ClucRule.md#ClucSuccess)
* [`ClucSuccess.onceMatch`](doc/ClucRule.md#ClucSuccess.onceMatch)

    
#### [`ClucMustNot`](doc/ClucRule.md#ClucMustNot)
* [`ClucMustNot.onData`](doc/ClucRule.md#ClucMustNot.onData)

    
#### [`ClucConfirm`](doc/ClucRule.md#ClucConfirm)
* [`ClucConfirm.onceMatch`](doc/ClucRule.md#ClucConfirm.onceMatch)

    
#### [`ClucWarn`](doc/ClucRule.md#ClucWarn)
* [`ClucWarn.onceMatch`](doc/ClucRule.md#ClucWarn.onceMatch)

    
#### [`ClucWatch`](doc/ClucRule.md#ClucWatch)
* [`ClucWatch.onData`](doc/ClucRule.md#ClucWatch.onData)

    
#### [`ClucAnswer`](doc/ClucRule.md#ClucAnswer)
* [`ClucAnswer.onData`](doc/ClucRule.md#ClucAnswer.onData)
    
    
#### [`ClucDisplay`](doc/ClucRule.md#ClucDisplay)
* [`ClucDisplay.onData`](doc/ClucRule.md#ClucDisplay.onData)


---------------------------------------

# Status

In development. 
It needs some tests. 
It misses putFile and readDir implementations. 
Documentation update.
