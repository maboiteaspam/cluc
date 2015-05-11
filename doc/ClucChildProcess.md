# ClucChildProcess API

* [`Cluc.transports.process`]()
    * [`ClucChildProcess`](#ClucSsh)
        * [`ClucChildProcess.exec`](#exec)
        * [`ClucChildProcess.stream`](#stream)
        * [`ClucChildProcess.run`](#run)

---------------------------------------


<a name="ClucChildProcess" />
### new ClucChildProcess()

ClucChildProcess constructor.

__Arguments__


__Examples__

```js
    var Cluc = require('cluc');
    var ClucChildProcess = Cluc.transports.process;
    
    new Cluc().run(new ClucChildProcess());
```

---------------------------------------


<a name="ClucChildProcess.stream" />
### ClucChildProcess.stream(cmd, fn)

Execute a command on local, return streams.

__Arguments__

* `cmd` - String representing a command line to execute.
* `fn` - A function called once command line started.
    * `err` an Error.
    * `stdout` a Stream.
    * `stderr` a Stream.
    * `conn` an SSHClient connection.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    new Cluc()
    .exec('ls -alh', function(err, stdout, stderr, conn){
        if(err) log.error(err);
        stderr.on('data',function(d){
          log.error(''+d)
        });
        stdout.on('data',function(d){
          log.verbose(''+d)
        });
        stdout.on('close',function(){
          log.info('done')
        });
    })
    .run(new Cluc.transports.process(), function(err){
      if(err) return done(err);
    });
```

---------------------------------------


<a name="ClucChildProcess.exec" />
### ClucChildProcess.exec(cmd, fn)

Execute a command on local, return string.

__Arguments__

* `cmd` - String representing a command line to execute.
* `fn` - A function called once command line ended.
    * `err` an Error.
    * `stdout` a String.
    * `stderr` a String.
    * `conn` an SSHClient connection.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    new Cluc()
    .exec('ls -alh', function(err, stdout, stderr, conn){
        if(err) log.error(err);
        if(stderr) log.error(stderr)
        log.verbose(stdout)
        log.info('done')
    })
    .run(new Cluc.transports.process(), function(err){
      if(err) return done(err);
    });
```

---------------------------------------
