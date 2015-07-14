var fs = require('fs-extra');
var path = require('path');
var Monkey = require('monkey-maker');
var colors = require('colors');     // Making it colorful!
var format = require('string-format');
var DeployEventLogger = require('./DeployEventLogger.js');
var TeamCityEventLogger = require('./TeamCityEventLogger.js');
var HockeyAppArtifactProcessor = require('monkeymaker-hockeyapp');

format.extend(String.prototype);

var projectConfigTemplate = {
  project:{
    solutionPath: "string",
    configsPath: "string.default('oem')",
    outputPath: "string.default('output')"
  }
};

module.exports.desc = "Build and/or publish projects.";
module.exports.action = function(cmd) {

  var argv = cmd
      .alias('t', 'teamcity')
      .alias('v', 'verbose')
      .alias('h', 'hockeyapp')
      .alias('s', 'store_release')
      .alias('p', 'platform')
      .alias('c', 'config')
      .demand(['c','p'])
      .usage('monkey deploy [OPTIONS]').argv;

  if(argv.sign && argv.hockeyupload)
    error('Cannot upload binaries signed for production to HockeyApp.');

  try {
    var monkeyConfig = JSON.parse(fs.readFileSync('monkey.json', 'utf8'));
    var monkey = new Monkey(monkeyConfig);

    monkey.useEventHandler(new DeployEventLogger(argv.verbose));

    if(argv.teamcity) {
      monkey.useEventHandler(new TeamCityEventLogger());
    }

    if(argv.hockeyapp) {
      monkey.useArtifactProcessor(new HockeyAppArtifactProcessor());
    }

    if(!monkeyConfig.project) error('No project details are provided in monkey.json.');
    if(!monkeyConfig.project.solutionPath) error('path to solution file is not provided in monkey.json.');
    var solutionPath = monkeyConfig.project.solutionPath;
    if(path.isAbsolute(solutionPath)) {
      solutionPath = path.resolve(solutionPath);
    }
    process.chdir(path.dirname(solutionPath));
    monkeyConfig = monkey.configUtil.evaluate(projectConfigTemplate, monkeyConfig);
    if(!monkeyConfig.isValid) listValidationErrors(monkeyConfig.errors);
    monkeyConfig = monkeyConfig.config;

    var dir_list = getDirectories(path.resolve(monkeyConfig.project.configsPath.value));
    var configsToBuild = [];

    // Either regular expression or commas
    if(argv.c.indexOf(',') > -1) {
      configsToBuild = configsToBuild.concat(argv.c.split(','));
    } else {
      var regEx = new RegExp(argv.c);
      configsToBuild = dir_list.filter(function(item){ return regEx.exec(item)!= undefined; });
    }

    var platforms = argv.p.split(',');
    var deployParams = {configs: configsToBuild, platforms: platforms};

    if(argv.version) deployParams.version = argv.version;
    if(argv.store_release) deployParams.store_release = true;

    monkey.deploy(deployParams);

  } catch (exception) {
    error(exception);
  }

}

function error(message) {
  console.error(message);
  process.exit(1);
}

function listValidationErrors(errors) {
  console.error('monkey.json has some validation errors:'.red);
  for (var i = 0; i < errors.length; i++) {
    console.error('{0} {1}'.format(errors[i].keyPath.yellow, errors[i].message));
  }
  process.exit(1);
}

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}
