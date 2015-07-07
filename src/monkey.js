#!/usr/bin/env node
var monkey = require('monkey-maker');
var cmdliner = require('cmd-liner');

var commands = {
  config: require('./config.js')
}

cmdliner.init(commands);
