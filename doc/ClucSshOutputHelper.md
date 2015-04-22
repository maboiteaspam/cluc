# ClucSshOutputHelper API

* [`Cluc.transports.ssh`]()
    * [`ClucSshOutputHelper`](#ClucSsh)
        * [`ClucSshOutputHelper.exec`](#exec)
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


<a name="ClucOutputHelper.init" />
### ClucOutputHelper.init(error, stdout, stderr)

Initialize members of this outputHelper.

__Arguments__

* `error` - A text message.
* `stdout` - A String or Stream of stdout.
* `stderr` - A String or Stream of stderr.

__Returns__

* `()` - void.

__Examples__

```js
    var Cluc = require('cluc');
    
    var helper = new Cluc.output.ssh();
    
    // helper.init(server, error, new Stream(), new Stream());
    
    (new Cluc(helper ) ).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
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
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
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
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
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
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.confirm(/some/, 'some is shown');
    });
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
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
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
    
    var clucLine = new Cluc(Cluc.output.ssh);
    
    clucLine.exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```
