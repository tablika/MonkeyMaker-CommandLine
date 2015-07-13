var format = require('string-format');
var Table = require('cli-table');   // That nice table!
var colors = require('colors');

format.extend(String.prototype);

module.exports = DeployEventLogger;

function DeployEventLogger (verbose) {
  this.verbose = verbose;
};

DeployEventLogger.prototype.willStartJob = function (job) {
  this.job = job;
}

DeployEventLogger.prototype.willStartConfig = function (args) {
  if(this.job.status.total < 2) return;
  console.log('({0}/{1}) Deploying {2} ({3})'.format(args.index, this.job.status.total,
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
  console.log('[ ] Successfully installed the config.');
}

DeployEventLogger.prototype.willBuildConfig = function(args) {
  console.log('[ ] Building...');
}

DeployEventLogger.prototype.didBuildConfig = function(args) {
  if(this.verbose) console.log(args.buildResults.stdout);
  console.log('Build Successful!'.green);
}

DeployEventLogger.prototype.didFinishConfig = function(args) {
  console.log('[X] DONE\n'.green);
}

DeployEventLogger.prototype.didFailConfig = function(args) {
  if(args.error.stdout) {
    if(this.verbose) console.log(args.error.stdout);
    delete args.error.stdout;
  }
  console.error(JSON.stringify(args.error, null, 2));
  console.log('Deploy Failed for {1} ({2})\nFailed On Task: {0}\n'.format(this.job.results[args.configName][args.platform].failedOn, args.configName, beatifyPlatform(args.platform)).red);
}

DeployEventLogger.prototype.willProcessArtifact = function (args) {
  console.log('[ ] Processing artifact ({0})'.format(args.artifactProcessorName));
}

DeployEventLogger.prototype.didProcessArtifact = function (args) {
  console.log('[ ] Finished ({0})'.format(args.artifactProcessorName).green);
}

DeployEventLogger.prototype.didFinishJob = function(job) {
  if(job.status.failed == 0) console.log("Deployed {0} successfully.".format(job.status.total>1?job.status.total+' projects':job.status.successfulConfigs[0]).green);
  else {
    console.log('Some Deploys Failed!'.red);
    var names = '';
    for (var i = 0; i < job.status.failedConfigs.length; i++) {
      var configName = job.status.failedConfigs[i];
      if(i == job.status.failedConfigs.length-1) {
        names += configName;
        break;
      }
      names += configName + ', ';
    }
    console.log('\t{0} Failed: {2}\n\t{1} Successful'.format(job.status.failed, job.status.successful, names).red);
    console.log();
  }
}

function beatifyPlatform(platform) {
  if(platform.toLowerCase() == 'ios') return 'iOS';
  if(platform.toLowerCase() == 'android') return 'Android';
  return platform;
}
