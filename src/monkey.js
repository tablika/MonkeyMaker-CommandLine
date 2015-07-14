#!/usr/bin/env node
var cmdliner = require('cmd-liner');

var commands = {
  config: require('./config.js'),
  deploy: require('./deploy.js'),
  init: require('./init.js'),
  install: require('./install.js'),
  serve: require('./serve/serve.js')
}

cmdliner.init(commands);
