var format = require('string-format');

format.extend(String.prototype);

module.exports = TeamCityEventLogger;

function TeamCityEventLogger() {};

module.exports.prototype.willStartJob = function(job) {
  this.job = job;
}

module.exports.prototype.willStartConfig = function(args) {
  console.log("##teamcity[blockOpened name='{0} ({1})']".format(args.configName, beatifyPlatform(args.platform)));
}

module.exports.prototype.willInstallConfig = function(args) {
  this.update_status('Installing', args);
}

module.exports.prototype.willBuildConfig = function(args) {
  this.update_status('Building', args);
}

module.exports.prototype.willProcessArtifact = function(args) {
  this.update_status('Processing Artifact ({0})'.format(args.artifactProcessorName), args);
}

module.exports.prototype.didFinishConfig = function(args) {
  console.log("##teamcity[blockClosed name='{0} ({1})']".format(args.configName, beatifyPlatform(args.platform)));
}

module.exports.prototype.didFailConfig = function(args) {
  console.log("##teamcity[message text='Deploy Failed' status='ERROR']");
  console.log("##teamcity[blockClosed name='{0} ({1})']".format(args.configName, beatifyPlatform(args.platform)));
}

module.exports.prototype.update_status = function(status, args) {
  console.log("##teamcity[progressMessage '({0}/{1}) {4} {2} ({3})']".format(args.index, this.job.status.total, args.configName, beatifyPlatform(args.platform), status));
}

module.exports.prototype.didFinishJob = function(job) {
  var status = '';
  var text = '';
  if(job.status.failed > 0) {
    status = 'failed'
    text = '({0}/{1}) Projects failed.'.format(job.status.failed, job.status.total);
    console.log("##teamcity[message text='{0}' status='ERROR']".format(text));
  } else {
    status = 'success';
    text = 'Successful.';
  }
  console.log("##teamcity[buildStatus status='{0}' text='{1}']".format(status, text));
}

function beatifyPlatform(platform) {
  if(platform.toLowerCase() == 'ios') return 'iOS';
  if(platform.toLowerCase() == 'android') return 'Android';
  return platform;
}
