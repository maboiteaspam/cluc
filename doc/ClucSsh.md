# ClucSsh API

* [`Cluc.transports.ssh`]()
    * [`ClucSsh`](#ClucSsh)
        * [`ClucSsh.exec`](#exec)
        * [`ClucSsh.stream`](#stream)
        * [`ClucSsh.run`](#run)

---------------------------------------


<a name="ClucSsh" />
### new ClucSsh()

ClucSsh constructor.

__Arguments__


__Examples__

```js
    var Cluc = require('cluc');
    
    var ClucSsh = Cluc.transports.ssh;
    var ssh = new ClucSsh();
```

---------------------------------------


<a name="ClucSsh.run" />
### ClucSsh.run(clucLine, server, done)

Run a clucLine over ssh.

__Arguments__

* `server` - Object like ssh2 credentials.
* `done` - A function called once cluc line is executed.
    * `err` an Error.
    * `conn` an SSHClient connection.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    var ClucSsh = Cluc.transports.ssh;
    var ssh = new ClucSsh(conn)
    ssh.run(clucLine, server, function(err){
      if(err) return done(err);
    });
```

---------------------------------------


<a name="ClucSsh.stream" />
### ClucSsh.stream(cmd, fn)

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
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
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
    var ssh = new ClucSsh(conn)
    ssh.run(clucLine, server, function(err){
      if(err) return done(err);
    });
```

---------------------------------------


<a name="ClucSsh.exec" />
### ClucSsh.exec(cmd, fn)

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
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        if(err) log.error(err);
        if(stderr) log.error(stderr)
        log.verbose(stdout)
        log.info('done')
    });
    
    var ClucSsh = Cluc.transports.ssh;
    var ssh = new ClucSsh(conn)
    ssh.run(clucLine, server, function(err){
      if(err) return done(err);
    });
```

---------------------------------------
