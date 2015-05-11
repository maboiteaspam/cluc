
var _ = require('underscore');
var byline = require('byline');
var pkg = require('../package.json');
var debug = require('debug')(pkg.name);

var ClucContext = (function(){

  var ClucRules = require('./cluc-rules.js');
  var ClucRule = ClucRules.rule;

  /**
   * Context of a command
   * Helps to analyze and respond
   * to the input stream from spawned process
   *
   * @class
   */
  var ClucContext = function(){
    this.init();
  };
  ClucContext.prototype.init = function(cmd){
    if(!this.hasRunOnce){
      this.canDo = 1;
      this.hasRunOnce = false;
    }
    this.cmd = cmd  || null;
    this.stdin = null;
    this.rules = [];
    this.failedRules = [];
  };

  ClucContext.prototype.pushRule = function(Rule, initArgs ){
    var rule = new Rule();
    rule.init.apply(rule, initArgs);
    this.rules.push(rule);
    return rule;
  };

  ClucContext.prototype.captureOnce = function(search, error, fn){
    var rule = new ClucRule();
    rule.init(search, error);
    rule.onceMatch = fn;
    this.rules.push(rule);
    return rule;
  };
  ClucContext.prototype.capture = function(search, error, fn){
    var rule = new ClucRule();
    rule.init(search, error);
    rule.onData = fn;
    this.rules.push(rule);
    return rule;
  };
  ClucContext.prototype.miss = function(search, error, fn){
    var rule = new ClucRule();
    rule.init(search, error);
    rule.onClose = function(){
      if(!rule.matched){
        fn(rule);
      }
    };
    this.rules.push(rule);
    return rule;
  };


  ClucContext.prototype.must = function(search, error){
    return this.pushRule(ClucRules.must, arguments);
  };
  ClucContext.prototype.success = function(search, success ){
    return this.pushRule(ClucRules.success, arguments);
  };
  ClucContext.prototype.confirm = function(search, confirm ){
    return this.pushRule(ClucRules.confirm, arguments);
  };
  ClucContext.prototype.mustnot = function(search, error ){
    return this.pushRule(ClucRules.mustnot, arguments);
  };
  ClucContext.prototype.warn = function(search, warn ){
    return this.pushRule(ClucRules.warn, arguments);
  };

  ClucContext.prototype.watch = function(search, confirm ){
    return this.pushRule(ClucRules.watch, arguments);
  };
  ClucContext.prototype.spin = function(search ){
    return this.pushRule(ClucRules.spin, arguments);
  };
  ClucContext.prototype.spinUntil = function(search ){
    return this.pushRule(ClucRules.spinUntil, arguments);
  };
  ClucContext.prototype.progress = function(search ){
    return this.pushRule(ClucRules.progress, arguments);
  };
  ClucContext.prototype.answer = function(q, a){
    return this.pushRule(ClucRules.answer, arguments);
  };
  ClucContext.prototype.display = function(){
    return this.pushRule(ClucRules.display, [/.*/g]);
  };
  ClucContext.prototype.dieOnError = function(){
    return this.pushRule(ClucRules.dieOnError, [/.*/g]);
  };
  ClucContext.prototype.redo = function(max){
    if(!this.hasRunOnce){
      this.canDo = max;
    }
    return this;
  };



  ClucContext.prototype.executeRules = function(error, stdout, stderr, stdin){
    var rules = this.rules;
    var failedRules = this.failedRules;

    rules.forEach(function(rule){
      rule.stdin = stdin;
    });
    if(_.isString(stdout)){

      try{
        if(this.cmd.fn) this.cmd.fn.call(this, error, stdout, stderr);
      }catch(ex){
        throw ex; // shall it be voided?
      }

      var matched = false;
      rules.forEach(function(rule){
        matched = rule.testData(stdout, 'stdout', matched) || matched;
        matched = rule.testData(stderr, 'stderr', matched) || matched;
      });

      rules.forEach(function(rule){
        rule.close();
        if(rule.hasFailed()) failedRules.push(rule);
      });

    } else if(stdout){

      byline(stdout).on('data' , function(d){
        var matched = false;
        rules.forEach(function(rule){
          matched = rule.testData((''+d), 'stdout', matched) || matched;
        });
      });
      byline(stderr).on('data' , function(d){
        rules.forEach(function(rule){
          matched = rule.testData((''+d), 'stderr', matched) || matched;
        });
      });

      stdout.on('close' , function(){
        process.nextTick(function(){
          var matched = false;
          rules.forEach(function(rule){
            rule.close(matched);
            matched = rule.matched || matched;
            if(rule.hasFailed()) failedRules.push(rule);
            rule.stdin = null;
          });
        })
      });

      try{
        if(this.cmd.fn) this.cmd.fn.call(this, error, stdout, stderr);
      }catch(ex){
        throw ex; // shall it be voided?
      }

    }else{
      debug('something is wrong stdout is null')
    }
    this.hasRunOnce = true;
    this.canDo--;

    return this.hasFailed();
  };

  ClucContext.prototype.canRedo = function(){
    return this.canDo>0;
  };

  ClucContext.prototype.hasFailed = function(){
    return this.failedRules.length>0;
  };

  ClucContext.prototype.getOrRules = function(){
    var orFn = [];
    this.failedRules.forEach(function(rule){
      if(rule.orFn){
        orFn.push(rule);
      }
    });
    return orFn;
  };

  return ClucContext;
})();

module.exports = ClucContext;
