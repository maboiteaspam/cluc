# ClucSSHContext API

* [`Cluc.output.ssh`]()
    * [`ClucSSHContext`](#ClucSsh)
        * [`ClucSSHContext.exec`](#exec)
        * [`ClucSSHContext.init`](#init)
        * [`ClucSSHContext.stream`](#stream)
        * [`ClucSSHContext.run`](#run)

---------------------------------------


<a name="ClucSSHContext" />
### new ClucSSHContext()

ClucSSHContext constructor.

__Arguments__


__Examples__

```js
    var Cluc = require('cluc');
    
    (new Cluc(new Cluc.output.ssh() ) ).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucSSHContext.init" />
### ClucSSHContext.init(error, stdout, stderr, stdin)

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


<a name="ClucSSHContext.must" />
### ClucSSHContext.must(search, error)

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


<a name="ClucSSHContext.mustnot" />
### ClucSSHContext.mustnot(search, error)

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


<a name="ClucSSHContext.confirm" />
### ClucSSHContext.confirm(search, confirmation)

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


<a name="ClucSSHContext.warn" />
### ClucSSHContext.info(search, warn)

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


<a name="ClucSSHContext.warn" />
### ClucSSHContext.warn(search, warn)

Display warn message,
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


<a name="ClucSSHContext.answer" />
### ClucSSHContext.answer(question, answer)

Detects a question and answers it.

__Arguments__

* `question` - String or RegExp to match in stdout / stderr.
* `answer` - A text message.


__Returns__


__Examples__

```js
    var Cluc = require('cluc');

    (new Cluc(Cluc.output.ssh))
    .exec('ls -alh', function(err, stdout, stderr, conn){
        this.answer(/Would you like to continue \?/, 'yes');
    });
```

---------------------------------------


<a name="ClucSSHContext.display" />
### ClucSSHContext.display()

Displays stdout and stderr to output.

__Arguments__


__Returns__


__Examples__

```js
    var Cluc = require('cluc');

    (new Cluc(Cluc.output.ssh))
    .exec('ls -alh', function(err, stdout, stderr, conn){
        this.display();
    });
```

---------------------------------------
