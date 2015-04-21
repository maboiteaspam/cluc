# Cluc

Command line under control, a library to ease usage of command lines.

# Demo

with child_process
```js
    var Cluc = require('luc');
    var ClucProcess = Cluc.transports.process;

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

      clucLine.run(new ClucProcess());
```



with ssh
```js
    var Cluc = require('luc');
    var ClucSsh = Cluc.transports.ssh;

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
    
    var ClucSsh = Cluc.transports.ssh;
    var ssh = new ClucSsh();
    ClucSSh.getConnReady(server, function(err, conn){
      if(err) return done(err);
      clucLine.run( new ClucSsh(conn) );
    });
```

# API

* [`Cluc`](#Cluc)
    * [`Cluc.stream`](#stream)
    * [`Cluc.exec`](#exec)
    * [`Cluc.run`](#run)

* [`Cluc.transports.ssh`]()
    * [`ClucSSh`](#ClucSSh)
        * [`ClucSSh.getConnReady`](#getConnReady)
        * [`ClucSSh.stream`](#stream)
        * [`ClucSSh.run`](#run)

* [`Cluc.transports.process`]()
    * [`ClucChildProcess`](#ClucSSh)
        * [`ClucChildProcess.stream`](#stream)
        * [`ClucChildProcess.run`](#run)
    
* [`ClucOutputHelper`](#ClucOutputHelper)
    * [`ClucOutputHelper.confirm`](#confirm)
    * [`ClucOutputHelper.must`](#must)
    * [`ClucOutputHelper.mustnot`](#mustnot)
    * [`ClucOutputHelper.warn`](#warn)
    * [`ClucOutputHelper.clean`](#clean)

---------------------------------------


<a name="Cluc" />
### new Cluc()

Cluc constructor.

__Arguments__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
```


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


<a name="Cluc.run" />
### Cluc.run(transport)

Run a cluc line.

__Arguments__

* `transport` - a Cluc transport object to execute the commands.

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
    
    var ClucProcess = Cluc.transports.process;
    clucLine.run(new ClucProcess());
```

---------------------------------------


<a name="ClucSSh" />
### new ClucSSh()

ClucSSh constructor.

__Arguments__


__Examples__

```js
    var Cluc = require('cluc');
    
    var ClucSsh = Cluc.transports.ssh;
    var ssh = new ClucSsh();
```


<a name="ClucSSh.getConnReady" />
### ClucSSh.getConnReady(server, fn)

__Static__

Get ann shh connection ready to use.

__Arguments__

* `server` - Object like ssh2 credentials.
* `fn` - A function called once connection is ready or error.
    * `err` an Error.
    * `conn` an SSHClient connection.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    var ClucSsh = Cluc.transports.ssh;
    ClucSsh.getConnReady(server, function(err, conn){
      if(err) return done(err);
      clucLine.run( new ClucSsh(conn) );
    });
```


<a name="ClucSSh.stream" />
### ClucSSh.stream(cmd, fn)

Execute a command over ssh, return streams.

__Arguments__

* `cmd` - String representing a command line to execute.
* `fn` - A function called once command line started.
    * `err` an Error.
    * `stdout` a Stream.
    * `stderr` a Stream.
    * `stdin` a Stream.
    * `conn` an SSHClient connection.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    clucLine.stream('ls -alh', function(err, stdout, stderr, stdin, conn){
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
    
    var ClucSsh = Cluc.transports.ssh;
    ClucSsh.getConnReady(server, function(err, conn){
      if(err) return done(err);
      clucLine.run( new ClucSsh(conn) );
    });
```


<a name="ClucSSh.exec" />
### ClucSSh.exec(cmd, fn)

Execute a command over ssh, return string.

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
    
    var clucLine = new Cluc();
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        if(err) log.error(err);
        if(stderr) log.error(stderr)
        log.verbose(stdout)
        log.info('done')
    });
    
    var ClucSsh = Cluc.transports.ssh;
    clucLine.getConnReady(server, function(err, conn){
      if(err) return done(err);
      clucLine.run( new ClucSsh(conn) );
    });
```

---------------------------------------


<a name="ClucChildProcess" />
### new ClucChildProcess()

ClucChildProcess constructor.

__Arguments__


__Examples__

```js
    var Cluc = require('cluc');
    var ClucChildProcess = Cluc.transports.process;
    clucLine.run(new ClucChildProcess())
```


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
    
    var clucLine = new Cluc();
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
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
    
    var ClucChildProcess = Cluc.transports.process;
    clucLine.run( new ClucChildProcess() );
```


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
    
    var clucLine = new Cluc();
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        if(err) log.error(err);
        if(stderr) log.error(stderr)
        log.verbose(stdout)
        log.info('done')
    });
    
    var ClucChildProcess = Cluc.transports.process;
    clucLine.run( new ClucChildProcess() );
```

---------------------------------------

    
* [`ClucOutputHelper`](#ClucOutputHelper)
    * [`ClucOutputHelper.confirm`](#confirm)
    * [`ClucOutputHelper.must`](#must)
    * [`ClucOutputHelper.mustnot`](#mustnot)
    * [`ClucOutputHelper.warn`](#warn)
    * [`ClucOutputHelper.clean`](#clean)

<a name="ClucOutputHelper" />
### new ClucOutputHelper()

ClucOutputHelper constructor.

__Arguments__


__Examples__

```js
    // it s a private class.
```


<a name="ClucOutputHelper.must" />
### ClucOutputHelper.must(search, error)

Display error message, and throw an exception,
if search does not match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
    
    var ClucChildProcess = Cluc.transports.process;
    clucLine.run( new ClucChildProcess() );
```


<a name="ClucOutputHelper.mustnot" />
### ClucOutputHelper.mustnot(search, error)

Display error message, and throw an exception,
if search match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
    
    var ClucChildProcess = Cluc.transports.process;
    clucLine.run( new ClucChildProcess() );
```


<a name="ClucOutputHelper.confirm" />
### ClucOutputHelper.confirm(search, confirmation)

Display confirmation message,
if search match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `confirmation` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.confirm(/some/, 'some is shown');
    });
    
    var ClucChildProcess = Cluc.transports.process;
    clucLine.run( new ClucChildProcess() );
```


<a name="ClucOutputHelper.warn" />
### ClucOutputHelper.info(search, warn)

Display info message,
if search does not match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
    
    var ClucChildProcess = Cluc.transports.process;
    clucLine.run( new ClucChildProcess() );
```


<a name="ClucOutputHelper.warn" />
### ClucOutputHelper.warn(search, warn)

Display warn message,
if search does not match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc();
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
    
    var ClucChildProcess = Cluc.transports.process;
    clucLine.run( new ClucChildProcess() );
```

---------------------------------------

# Status

In development. It needs some tests. It misses putFile and readDir implementations.
