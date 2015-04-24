# ClucContext API

* [`Cluc.output.process`]()
    * [`ClucContext`](#ClucSsh)
        * [`ClucContext.init`](#init)
        * [`ClucContext.exec`](#exec)
        * [`ClucContext.stream`](#stream)
        * [`ClucContext.run`](#run)
        * [`ClucContext.answer`](#answer)
        * [`ClucContext.display`](#display)

---------------------------------------

<a name="ClucContext" />
### new ClucContext()

ClucContext constructor.

__Arguments__


__Examples__

```js
    var Cluc = require('cluc');
    
    (new Cluc(new Cluc.output.process() ) ).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucContext.init" />
### ClucContext.init(error, stdout, stderr)

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
    
    (new Cluc()).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucContext.must" />
### ClucContext.must(search, error)

Display error message, and throw an exception,
if search does not match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    (new Cluc()).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucContext.mustnot" />
### ClucContext.mustnot(search, error)

Display error message, and throw an exception,
if search match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    (new Cluc()).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucContext.confirm" />
### ClucContext.confirm(search, confirmation)

Display confirmation message,
if search match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `confirmation` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    (new Cluc()).exec('ls -alh', function(err, stdout, stderr, conn){
        this.confirm(/some/, 'some is shown');
    });
```

---------------------------------------


<a name="ClucContext.warn" />
### ClucContext.info(search, warn)

Display info message,
if search does not match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    (new Cluc()).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucContext.warn" />
### ClucContext.warn(search, warn)

Display warn message,
if search does not match stdout or stderr.

__Arguments__

* `search` - String or RegExp to match in stdout / stderr.
* `error` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    (new Cluc()).exec('ls -alh', function(err, stdout, stderr, conn){
        this.must(/some/, 'some is not shown');
    });
```

---------------------------------------


<a name="ClucContext.answer" />
### ClucContext.answer(question, answer)

Detects a question and answers it.

__Arguments__

* `question` - String or RegExp to match in stdout / stderr.
* `answer` - A text message.

__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    (new Cluc()).exec('ls -alh', function(err, stdout, stderr, conn){
        this.answer(/Would you like to continue \?/, 'yes');
    });
```

---------------------------------------


<a name="ClucContext.display" />
### ClucContext.display()

Displays stdout and stderr to output.

__Arguments__


__Returns__


__Examples__

```js
    var Cluc = require('cluc');
    
    (new Cluc()).exec('ls -alh', function(err, stdout, stderr, conn){
        this.display();
    });
```

---------------------------------------
