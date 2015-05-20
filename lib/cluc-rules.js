

var log = require('npmlog');
log.addLevel('watch', 2001, { }, '    ');
log.addLevel('success', 2002, { fg: 'white', bg: 'green' }, 'succ');
log.addLevel('confirm', 2004, { fg: 'white', bg: 'blue' }, ' ok ');
log.addLevel('cmd', 2003, { fg: 'white', bg: 'grey' }, '<CMD');
log.addLevel('answer', 2003, { fg: 'white', bg: 'grey' }, '<ANS');
log.addLevel('title', 2003, { fg: 'yellow' }, '| ==');
log.addLevel('subtitle', 2003, { fg: 'yellow' }, '| --');

var _ = require('underscore');
var util = require('util');
var _s = require('underscore.string');
var symbols = require('symbolsjs');
var named = require('named-regexp').named;
var Spinner = require('cli-spinner').Spinner;
var ProgressBar = require('progress');

var ClucRule = (function(){
  /**
   * Test output against a pattern
   * then save its states until the command has finished
   *
   * @class ClucRule
   */
  var ClucRule = function(){};

  ClucRule.prototype.init = function(search, userDefinedMessage){
    this.failed = false;
    this.orFn = null;
    this.matched = null;
    this.capturedData = null;
    this.hasMatchedOnce = false;
    this.search = search instanceof RegExp ? named(search) : search;
    this.userDefinedMessage = userDefinedMessage;
  };

  ClucRule.prototype.forgeErrorMessage = function(){
    if(_.isString(this.userDefinedMessage) ){
      if(this.search instanceof RegExp ){
        var captures = this.matched ? this.matched.captures : {};
        if(Object.keys(captures).length){
          var userMsg = this.userDefinedMessage;
          Object.keys(captures).forEach(function(name){
            var value = captures[name].pop();
            userMsg = userMsg.replace(new RegExp(name,'g'), (value||'-'));
          });
          return userMsg;
        }else{
          var printArgs = [].concat(this.matched);
          printArgs.shift();
          printArgs = printArgs.map(function(v){
            return v || '-';
          });
          return _s.vsprintf(this.userDefinedMessage, printArgs);
        }
      }
      return this.userDefinedMessage;
    }
    if(_.isString(this.search) && !this.matched ){
      return this.search;
    }
    if(this.search instanceof RegExp && this.matched){
      return this.matched[1] ||
        _s.trim(this.matched.input);
    }
    return this.search;
  };

  ClucRule.prototype.testData = function(data, stdpipe, alreadyMatched){
    this.capturedData = ''+data;
    if(this.search instanceof RegExp ){
      this.matched = this.search.exec(this.capturedData);
    }else{
      this.matched = (this.capturedData).match(this.search);
    }
    if(!this.hasMatchedOnce && !!this.matched === true){
      this.hasMatchedOnce = true;
      if(this.onceMatch){
        this.onceMatch(stdpipe, alreadyMatched);
      }
    }
    if(this.onData){
      this.onData(!!this.matched, stdpipe, alreadyMatched);
    }
    return this.matched;
  };

  ClucRule.prototype.close = function(){
    if(this.capturedData===null){
      this.matched = false;
    }
    if(this.onClose){
      this.onClose(!!this.matched);
    }
  };

  ClucRule.prototype.hasFailed = function(){
    return this.failed;
  };

  ClucRule.prototype.or = function(fn){
    this.orFn = fn;
  };

  return ClucRule;
})();

var ClucMust = (function(){
  /**
   * Displays success message
   * if pattern matches
   * Otherwise displays failure message
   *
   * @class
   */
  var ClucMust = function(){};
  util.inherits(ClucMust, ClucRule);
  ClucMust.prototype.onceMatch = function(){
    log.success(' '+symbols.ok+' ', ''+(this.forgeErrorMessage() )+'' );
  };
  ClucMust.prototype.onClose = function(matched){
    if(!matched && !this.hasMatchedOnce){
      this.failed = true;
      log.warn(' '+symbols.err+' ', '\n'+' '+(this.forgeErrorMessage() )+'\n' );
    }
  };
  return ClucMust;
})();

var ClucSuccess = (function(){
  /**
   * Displays success message
   * if pattern matches
   *
   * @class ClucSuccess
   */
  var ClucSuccess = function(){};
  util.inherits(ClucSuccess, ClucRule);
  ClucSuccess.prototype.onceMatch = function(){
    this.failed = true;
    log.success(' '+symbols.ok+' ', ''+(this.forgeErrorMessage() )+'' );
    console.log('');
  };
  ClucSuccess.prototype.hasFailed = function(){
    return !this.failed;
  };
  return ClucSuccess;
})();

var ClucMustNot = (function(){
  /**
   * Displays failure message
   * if pattern matches
   * Otherwise displays success message
   *
   * @class ClucMustNot
   */
  var ClucMustNot = function(){};
  util.inherits(ClucMustNot, ClucRule);
  ClucMustNot.prototype.onceMatch = function(){
    this.failed = true;
    log.error(' '+symbols.err+' ', '\n'+(this.forgeErrorMessage() )+'\n' );
  };
  ClucMustNot.prototype.onClose = function(matched){
    if(!matched && !this.failed){
      log.success(' '+symbols.ok+' ', ''+(this.forgeErrorMessage() )+'' );
      console.log('');
    }
  };
  return ClucMustNot;
})();

var ClucConfirm = (function(){
  /**
   * Displays confirm message
   * if pattern matches
   * @class ClucConfirm
   */
  var ClucConfirm = function(){};
  util.inherits(ClucConfirm, ClucRule);
  ClucConfirm.prototype.onceMatch = function(){
    this.failed = true;
    log.confirm('   ', this.forgeErrorMessage());
    console.log('');
  };
  ClucConfirm.prototype.hasFailed = function(){
    return !this.failed;
  };
  return ClucConfirm;
})();

var ClucWarn = (function(){
  /**
   * Displays warning message
   * if pattern matches
   * @class ClucWarn
   */
  var ClucWarn = function(){};
  util.inherits(ClucWarn, ClucRule);
  ClucWarn.prototype.onceMatch = function(){
    this.failed = true;
    log.warn('   ', this.forgeErrorMessage());
  };
  return ClucWarn;
})();

var ClucWatch = (function(){
  /**
   * Displays the output
   * When pattern matches
   * @class ClucWatch
   */
  var ClucWatch = function(){};
  util.inherits(ClucWatch, ClucRule);
  ClucWatch.prototype.onData = function(matched){
    if(matched){
      log.watch('  |', this.forgeErrorMessage() );
    }
  };
  return ClucWatch;
})();

var ClucSpin = (function(){
  /**
   * Displays a spinner
   * while pattern matches
   * @class ClucSpin
   */
  var ClucSpin = function(){};
  util.inherits(ClucSpin, ClucRule);
  ClucSpin.prototype.onData = function(matched){
    if(matched){
      if(!this.spinner){
        this.spinner = new Spinner(this.userDefinedMessage || '%s');
        this.spinner.setSpinnerString('|/-\\');
      }
      this.spinner.stop();
      this.spinner.start();
    }
    if(!matched){
      if(this.spinner){
        this.spinner.stop(true);
      }
    }
  };
  ClucSpin.prototype.onClose = function(){
    if(this.spinner){
      this.spinner.stop(true);
    }
  };
  return ClucSpin;
})();

var ClucSpinUntil = (function(){
  /**
   * Displays a spinner
   * until pattern matches
   * @class ClucSpinUntil
   */
  var ClucSpinUntil = function(){
    this.spinner = new Spinner(this.userDefinedMessage || '%s');
    this.spinner.setSpinnerString('|/-\\');
    this.spinner.start();
  };
  util.inherits(ClucSpinUntil, ClucRule);
  ClucSpinUntil.prototype.onData = function(matched){
    if(matched){
      if(this.spinner){
        this.spinner.stop(true);
      }
    }
  };
  ClucSpinUntil.prototype.onClose = function(){
    if(this.spinner){
      this.spinner.stop(true);
    }
  };
  return ClucSpinUntil;
})();

var ClucProgress = (function(){
  /**
   * Displays a progress
   * while pattern matches
   * @class ClucProgress
   */
  var ClucProgress = function(){};
  util.inherits(ClucProgress, ClucRule);
  ClucProgress.prototype.onData = function(matched){
    if(matched){
      var captures = this.matched.captures ||  {};
      if(Object.keys(captures).length){
        var current = (captures.current || []).pop() || 0;
        var title = (captures.title || []).pop() || '';
        var total = (captures.total || []).pop() || 100;
        if(!this.bar){
          this.bar = new ProgressBar(':title [:bar] :percent :etas ', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            title: title,
            total: total
          });
        }
        this.bar.update( current/total,{
          title:title
        });
      }
    }
  };
  return ClucProgress;
})();

var ClucAnswer = (function(){
  /**
   * Writes the stdin with provided answer
   * When given pattern matches
   * @class ClucAnswer
   */
  var ClucAnswer = function(){};
  util.inherits(ClucAnswer, ClucRule);
  ClucAnswer.prototype.onData = function(matched){
    if(matched){
      log.answer('    ', this.forgeErrorMessage());
      this.stdin.write(this.userDefinedMessage);
      this.stdin.write('\n');
    }
  };
  return ClucAnswer;
})();

var ClucDisplay = (function(){
  /**
   * Displays the output
   * When patterns has not previsouly matches
   * @class ClucDisplay
   */
  var ClucDisplay = function(){};
  util.inherits(ClucDisplay, ClucRule);
  ClucDisplay.prototype.onData = function(matched, stdpipe, alreadyMatched){
    if(!alreadyMatched){
      var data = this.capturedData===null?'no data\n':this.capturedData;
      log.watch('   ', data );
    }
  };
  ClucDisplay.prototype.onClose = function(){
    if(!this.search){
      var data = this.capturedData===null?'no data':this.capturedData;
      log.watch('   ', data );
    }
  };
  return ClucDisplay;
})();

var ClucDieOnError = (function(){
  /**
   * Throws an error
   * When patterns match in stderr
   * @class ClucDieOnError
   */
  var ClucDieOnError = function(){};
  util.inherits(ClucDieOnError, ClucRule);
  ClucDieOnError.prototype.onData = function(matched, stdpipe){
    if(this.capturedData && stdpipe==='stderr'){
      log.error('   ', this.capturedData );
      if(!this.failed) this.failed = '';
      this.failed+=this.capturedData;
    }
  };
  ClucDieOnError.prototype.onClose = function(){
    if(this.failed){
      throw this.failed;
    }
  };
  return ClucDieOnError;
})();

module.exports = {
  rule:ClucRule,
  must:ClucMust,
  success:ClucSuccess,
  confirm:ClucConfirm,
  mustnot:ClucMustNot,
  warn:ClucWarn,
  watch:ClucWatch,
  spin:ClucSpin,
  spinUntil:ClucSpinUntil,
  progress:ClucProgress,
  answer:ClucAnswer,
  display:ClucDisplay,
  dieOnError:ClucDieOnError
};