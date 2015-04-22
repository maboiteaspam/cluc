# ClucSshOutputHelper API

* [`Cluc.transports.ssh`]()
    * [`ClucSshOutputHelper`](#ClucSsh)
        * [`ClucSshOutputHelper.exec`](#exec)
        * [`ClucSshOutputHelper.init`](#init)
        * [`ClucSshOutputHelper.stream`](#stream)
        * [`ClucSshOutputHelper.run`](#run)

---------------------------------------


<a name="ClucSshOutputHelper" />
### new ClucSshOutputHelper()

ClucSshOutputHelper constructor.

__Arguments__


__Examples__

```js
```js
    var Cluc = require('cluc');
    
    (new Cluc(new Cluc.output.ssh() ) ).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucSshOutputHelper.init" />
### ClucSshOutputHelper.init(error, stdout, stderr, stdin)

Initialize members of this outputHelper.

__Arguments__

* `error` - A text message.
* `stdout` - A String or Stream of stdout.
* `stderr` - A String or Stream of stderr.
* `stdin` - A Stream of stdin.

__Returns__

* `()` - void.

__Examples__

```js
    var Cluc = require('cluc');
    
    var helper = new Cluc.output.ssh();
    
    // helper.init(server, error, new Stream(), new Stream(), new Stream());
    
    (new Cluc(helper ) ).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucSshOutputHelper.must" />
### ClucSshOutputHelper.must(search, error)

Display error message, and throw an exception,
if search does not match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucSshOutputHelper.mustnot" />
### ClucSshOutputHelper.mustnot(search, error)

Display error message, and throw an exception,
if search match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucSshOutputHelper.confirm" />
### ClucSshOutputHelper.confirm(search, confirmation)

Display confirmation message,
if search match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `confirmation` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.confirm(/some/, 'some is shown');
    });
```

---------------------------------------


<a name="ClucSshOutputHelper.warn" />
### ClucSshOutputHelper.info(search, warn)

Display info message,
if search does not match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucSshOutputHelper.warn" />
### ClucSshOutputHelper.warn(search, warn)

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
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------
