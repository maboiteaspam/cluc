# Cluc API

* [`Cluc`](#Cluc)
    * [`Cluc.stream`](#stream)
    * [`Cluc.exec`](#exec)
    * [`Cluc.run`](#run)

---------------------------------------


<a name="Cluc" />
### new Cluc()

Cluc constructor.

__Arguments__

* `constructor` - A Cluc Output helper constructor, defaults to Cluc.output.process.

__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc(Cluc.output.process);
```

---------------------------------------


<a name="Cluc.stream" />
### Cluc.stream(cmd, fn)

Execute a command, return streams.

__Arguments__

* `cmd` - String representing a command line to execute.
* `fn` - A function called once command line started.
    * `err` an Error.
    * `stdout` a Stream.
    * `stderr` a Stream.

__Returns__

* `Cluc` - A Cluc object.

__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    clucLine.stream('ls -alh', function(err, stdout, stderr){
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
    });
```

---------------------------------------


<a name="Cluc.exec" />
### Cluc.exec(cmd, fn)

Execute a command, return string.

__Arguments__

* `cmd` - String representing a command line to execute.
* `fn` - A function called once command line ended.
    * `err` an Error.
    * `stdout` a String.
    * `stderr` a String.

__Returns__

* `Cluc` - A Cluc object.

__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    clucLine.exec('ls -alh', function(err, stdout, stderr){
        if(err) log.error(err);
        if(stderr) log.error(stderr)
        log.verbose(stdout)
        log.info('done')
    });
```

---------------------------------------


<a name="Cluc.run" />
### Cluc.run(transport, then)

Run a cluc line.

__Arguments__

* `transport` - a Cluc transport object to execute the commands.
* `then` - a Callback called on completion.
    * `err` an Error.

__Returns__

* `ran` - A Boolean, true if started the run.

__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    clucLine.stream('ls -alh', function(err, stdout, stderr){
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
    .exec('ls -alh', function(err, stdout, stderr){
      if(err) log.error(err);
      if(stderr) log.error(stderr)
      log.verbose(stdout)
      log.info('done')
    });

    (new ClucProcess()).run(clucLine, function(err){
      if(err) return done(err);
    });
```

---------------------------------------
