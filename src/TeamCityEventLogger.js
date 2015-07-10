var format = require('string-format');

format.extend(String.prototype);

module.exports = TeamCityEventLogger;

module.exports.prototype.willStartJob = function(job) {
  this.job = job;
}

module.exports.prototype.willStartConfig = function(args) {
  console.log("##teamcity[blockOpened name='{0} ({1})']".format(args.configName, beatifyPlatform(args.platform)));
}

module.exports.prototype.willInstallConfig = function(args) {
  update_status('Installing', args);
}

module.exports.prototype.willBuildConfig = function(args) {
  update_status('Building', args);
  console.log(args.buildResults.stdout);
}

module.exports.prototype.willProcessArtifact = function(args) {
  update_status('Processing Artifact (0)'.format(args.artifactProcessorName), args);
}

module.exports.prototype.didFinishConfig = function(args) {
  console.log("##teamcity[blockClosed name='{0} ({1})']".format(args.configName, beatifyPlatform(args.platform)));
}

module.exports.prototype.update_status = function(status, args){
  console.log("##teamcity[progressMessage '({0}/{1}) {4} {2} ({3})']".format(args.index, this.job.status.total, args.configName, beatifyPlatform(args.platform), status));
}

module.exports.prototype.didFinishJob = function(job) {
  console.log("##teamcity[buildStatus status='{0}' text='{1}']".format(job.status.failed>0?'failed':'success'));
}

function beatifyPlatform(platform) {
  if(platform.toLowerCase() == 'ios') return 'iOS';
  if(platform.toLowerCase() == 'android') return 'Android';
  return platform;
}
