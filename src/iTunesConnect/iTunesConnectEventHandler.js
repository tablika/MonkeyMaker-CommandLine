var exec = require('sync-exec');
var format = require('string-format');
var configUtil = require('config-util');
var path = require('path');

format.extend(String.prototype);

var configTemplate = {
  itunesConnect: {
    username: 'string',
    password: 'string'
  }
};

module.exports = function(monkey) {
  this.monkey = monkey;
}

// Make sure all certs are alright before building.
module.exports.prototype.willStartJob = function (job) {
  if(job.platforms.indexOf('ios') == -1) return;
  var evaluationResult = configUtil.evaluate(configTemplate, this.monkey.options);
  if(!evaluationResult.isValid) {
    console.error('Monkey config is not setup properly for iTunes Connect');
  }
  var config = evaluationResult.compile().itunesConnect;

  var results = exec('ruby {0} {1} {2}'.format(path.join(path.dirname(__filename), 'prepareCert.rb'), config.username, config.password));
  if(results.status == 0) {
    console.log('Provisioning profiles updated successfully.');
  } else {
    console.error('[ERROR] Could not update provisioning profiles');
    console.error(results.stdout);
    console.error(results.stderr);
  }
};
