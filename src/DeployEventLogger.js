var format = require('string-format');
var Table = require('cli-table');   // That nice table!
var colors = require('colors');

format.extend(String.prototype);

module.exports = function(verbose) {
  this.verbose = verbose;
};

module.exports.prototype.willStartJob = function (job) {
  this.job = job;
}

module.exports.prototype.willStartConfig = function (args) {
  if(this.job.status.total < 2) return;
  console.log('({0}/{1}) Deploying {2} ({3})'.format(args.index, this.job.status.total,
    args.configName, beatifyPlatform(args.platform)));
}

module.exports.prototype.didEscapeConfig = function(args) {
  console.log("[ESCAPE] Config {0} is not setup for platform {1}; escaping.".format(args.configName, beatifyPlatform(args.platform)).yellow);
}

module.exports.prototype.didInstallConfig = function (args) {
  var table = new Table({ chars: { 'top': '-' , 'top-mid': '-' , 'top-left': '-' , 'top-right': '-'
    , 'bottom': '-' , 'bottom-mid': '-' , 'bottom-left': '-' , 'bottom-right': '-'
    , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
    , 'right': '' , 'right-mid': '' , 'middle': ':' }, style: { head: ['yellow'], border: ['yellow'] }});

  var any = false;
  var nameValuePair = args.configSettings.flatten('name', 'value');
  for (var name in nameValuePair) {
    any = true;
    table.push([name, nameValuePair[name]]);
  }
  if(any) console.log(table.toString());
  console.log('[ ] Successfully installed the config.');
}

module.exports.prototype.willBuildConfig = function(args) {
  console.log('[ ] Building...');
}

module.exports.prototype.didBuildConfig = function(args) {
  if(this.verbose) console.log(args.buildResults.stdout);
  console.log('Build Successful!'.green);
}

module.exports.prototype.didFinishConfig = function(args) {
  console.log('[X] DONE\n'.green);
}

module.exports.prototype.didFailConfig = function(args) {
  if(args.error.stdout) {
    if(this.verbose) console.log(args.error.stdout);
    delete args.error.stdout;
  }
  console.error(JSON.stringify(args.error, null, 2));
  console.log('Deploy Failed for {1} ({2})\nFailed On Task: {0}\n'.format(this.job.results[args.configName][args.platform].failedOn, args.configName, beatifyPlatform(args.platform)).red);
}

module.exports.prototype.willProcessArtifact = function (args) {
  console.log('[ ] Processing artifact ({0})'.format(args.artifactProcessorName));
}

module.exports.prototype.didProcessArtifact = function (args) {
  console.log('[ ] Finished ({0})'.format(args.artifactProcessorName).green);
}

module.exports.prototype.didFinishJob = function(job) {
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
