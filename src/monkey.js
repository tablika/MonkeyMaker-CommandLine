#!/usr/bin/env node
var cmdliner = require('cmd-liner');

var commands = {
  config: require('./config.js'),
  deploy: require('./deploy.js')
}

cmdliner.init(commands);
