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
  var results = exec('export DELIVER_USER="{0}" && export DELIVER_PASSWORD="{1}" && deliver testflight -f --skip-deploy {2}'.format(config.username, config.password, args.outputUrl));
  console.log(results.stderr);
  console.log(results.stdout);
  return { success: results.status==0 };
}
