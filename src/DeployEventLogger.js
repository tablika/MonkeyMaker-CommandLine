var format = require('string-format');
var Table = require('cli-table');   // That nice table!
var colors = require('colors');
format.extend(String.prototype);

module.exports = DeployEventLogger;

function DeployEventLogger () {
};

DeployEventLogger.prototype.willStartJob = function (job) {
  this.job = job;
}

DeployEventLogger.prototype.willStartConfig = function (args) {
  console.log('[{0}/{1}] {2} ({3})'.format(args.index, this.job.status.total,
    args.configName, beatifyPlatform(args.platform)));
}

DeployEventLogger.prototype.didInstallConfig = function (args) {
  var table = new Table({ chars: { 'top': '-' , 'top-mid': '-' , 'top-left': '-' , 'top-right': '-'
    , 'bottom': '-' , 'bottom-mid': '-' , 'bottom-left': '-' , 'bottom-right': '-'
    , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
    , 'right': '' , 'right-mid': '' , 'middle': ':' }, style: { head: ['yellow'], border: ['yellow'] }});

  any = false;
  for (var key in args.configs) {
    if (args.configs.hasOwnProperty(key)) {
      any = true;
      table.push([key, args.configs[key]]);
    }
  }
  if(any) console.log(table.toString());
}

DeployEventLogger.prototype.willBuildConfig = function(args) {
  console.log('[ ] Building...');
}

DeployEventLogger.prototype.didBuildConfig = function(args) {
  console.log('Build Succeeded!'.green);
}


function beatifyPlatform(platform) {
  if(platform.toLowerCase() == 'ios') return 'iOS';
  if(platform.toLowerCase() == 'android') return 'Android';
  return platform;
}
