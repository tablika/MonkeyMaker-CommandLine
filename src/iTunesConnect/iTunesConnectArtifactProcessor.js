var exec = require('sync-exec');
var configUtil = require('config-util');
var format = require('string-format');

format.extend(String.prototype);

var configTemplate = {
  itunesConnect: {
    username: 'string',
    password: 'string'
  }
};

module.exports = function (monkey) {
  this.monkey = monkey;
}

module.exports.prototype.supports = function (platform) {
  return platform == 'ios';
}

module.exports.prototype.name = "iTunesConnect";

module.exports.prototype.process = function (args) {

  var evaluationResult = configUtil.evaluate(configTemplate, this.monkey.options);
  if(!evaluationResult.isValid) {
    console.error('Monkey config is not setup properly for iTunes Connect.');
  }
  var config = evaluationResult.compile().itunesConnect;
  var deliverParams = {
    'DELIVER_USER': config.username,
    'DELIVER_PASSWORD': config.password
  };
  console.log(args.outputUrl);
  var results = exec('deliver testflight ' + args.outputUrl, {env: deliverParams});
  if(results.status != 0) {
    console.log(results.stdout);
    console.log(results.stderr);
    console.log(results);
    return { success: false };
  }
  return { success: true };
}
