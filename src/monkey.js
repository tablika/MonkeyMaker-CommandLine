#!/usr/bin/env node
var cmdliner = require('cmd-liner');

var commands = {
  config: require('./config.js'),
  deploy: require('./deploy.js'),
  init: require('./init.js'),
  install: require('./install.js'),
  serve: require('./serve/serve.js'),
  test: {action: function(){
    var exec = require('sync-exec');
    var results = exec('deliver testflight ./app.ipa', {env:{
      'DELIVER_USER': 'app@tablika.com',
      'DELIVER_PASSWORD': 'SMhereitis@123'
    }})

    console.log(results.status);
    console.log(results.stderr);
  }}
}

cmdliner.init(commands);
