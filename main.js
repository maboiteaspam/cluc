
// command line under control

var log = require('npmlog');
log.addLevel('watch', 2001, { }, '    ');
log.addLevel('success', 2002, { fg: 'white', bg: 'green' }, 'succ');
log.addLevel('confirm', 2004, { fg: 'white', bg: 'blue' }, ' ok ');
log.addLevel('cmd', 2003, { fg: 'white', bg: 'grey' }, '<CMD');
log.addLevel('answer', 2003, { fg: 'white', bg: 'grey' }, '<ANS');
log.addLevel('title', 2003, { fg: 'yellow' }, '/!\\ ');


var ClucChildProcess = require('./lib/cluc-childprocess.js');
var ClucContext = require('./lib/cluc-childprocess-context.js');
var ClucSsh = require('./lib/cluc-ssh.js');
var ClucSSHContext = require('./lib/cluc-ssh-context.js');
var ClucRules = require('./lib/cluc-rules.js');


var Cluc = require('./lib/cluc.js');

Cluc.transports = {
  ssh:ClucSsh,
  process:ClucChildProcess
};

Cluc.output = {
  ssh:ClucSSHContext,
  process:ClucContext
};

Cluc.rule = ClucRules;

module.exports = Cluc;