#!/usr/bin/env node
var cmdliner = require('cmd-liner');

var commands = {
  config: require('./config.js'),
  deploy: require('./deploy.js'),
  init: require('./init.js'),
  install: require('./install.js'),
  serve: require('./serve/serve.js'),
  test: {
    action: function() {
      var spawn = require('child_process').spawn;
      var shellSyntaxCommand = '"export DELIVER_USER="{0}" && export DELIVER_PASSWORD="{1}" && deliver testflight -f {2} >> a.txt"'.format('app@tablika.com', 'SMhereitis@123', '/Users/peyman/Projects/Tablika/src/output/tablika.prod/ios/app.ipa');
      console.log(shellSyntaxCommand);
      var exec = require('child_process').execSync;
      var results = exec('export DELIVER_USER="{0}" && export DELIVER_PASSWORD="{1}" && deliver testflight -f {2} >> a.txt'.format('app@tablika.com', 'SMhereitis@123', '/Users/peyman/Projects/Tablika/src/output/tablika.prod/ios/app.ipa'))
      console.log(results);
      // var a = spawn('sh', ['-c', shellSyntaxCommand], { detached: false }, function(err){
      //   console.log("HI");
      //   console.log(err);
      // });
      // console.log(a.pid);
    }
  }
}

cmdliner.init(commands);
