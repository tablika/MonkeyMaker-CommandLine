var format = require('string-format');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

format.extend(String.prototype);

var verbose = false;

module.exports.desc = "Start a RESTful API wrapper for MonkeyMaker.";
module.exports.action = function (cmd) {

  app.use(bodyParser.json());

  var argv = cmd
    .alias('p', 'port').default('p', 3000)
    .alias('h', 'host').default('h', 'localhost')
    .alias('v', 'verbose').argv;

  verbose = argv.verbose;

  app.use('/api/v1/config/', require('./configRoute.js'));

  app.listen(argv.port, argv.host);
  log('Listening... (Host: {0}, Port: {1})'.format(argv.host, argv.port));
}

function log(text) {
  if(verbose) {
    console.log('[' + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + '] ' + text);
  }
}
