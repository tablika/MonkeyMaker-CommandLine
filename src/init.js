var prompt = require('prompt');
var path = require('path');
var fs = require('fs-extra');

prompt.message = "monkey";

module.exports.desc = "Initializes monkey project settings.";
module.exports.action = function (cmd) {

  console.log('This utility walks your through creating a monkey.json file.');
  console.log('It only covers the most common items, and tries to guess sensible defaults.\n');

  var properties = [
      {
        description: 'Solution File',
        type: 'string',
        pattern: /.sln$/,
        message: 'solution file should end with .sln',
        required: true,
        name: 'solutionPath'
      },
      {
        description: 'iOS Project Name',
        type: 'string',
        required: false,
        name: 'iosProjectName'
      },
      {
        description: 'Android Project Name',
        type: 'string',
        required: false,
        name: 'androidProjectName'
      }
    ];

    prompt.start();

    prompt.get(properties, function (err, result) {
      if (err) { return onErr(err); }

      var monkeyConfig = {
        project: {
          solutionPath: path.resolve(result.solutionPath)
        }
      };
      var currentDir = process.cwd();
      process.chdir(path.dirname(monkeyConfig.project.solutionPath));
      if(result.iosProjectName) {
        monkeyConfig.ios = {
          projectName: result.iosProjectName
        }
        var defaultPlistFile =
        '<?xml version="1.0" encoding="UTF-8"?>'+
        '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'+
        '<plist version="1.0">'+
        '<dict/>'+
        '</plist>';
        var plistFilePath = path.join(result.iosProjectName, 'Config.plist');
        if(!fs.existsSync(plistFilePath)) fs.writeFileSync(plistFilePath, defaultPlistFile);

        var configTemplateFilePath = path.join(result.iosProjectName, 'config_template.json');
        if(!fs.existsSync(configTemplateFilePath)) fs.writeFileSync(configTemplateFilePath, '{}');

        var resourcesTemplateFilePath = path.join(result.iosProjectName, 'resources_template.json');
        if(!fs.existsSync(resourcesTemplateFilePath)) fs.writeFileSync(resourcesTemplateFilePath, '[]');
      }
      if(result.androidProjectName) {
        monkeyConfig.android = {
          projectName: result.androidProjectName
        }

        var settingsFilePath = path.join(result.androidProjectName, 'Resources', 'values', 'settings.xml');
        if(fs.existsSync(settingsFilePath)) fs.writeFileSync(settingsFilePath, '<?xml version="1.0" encoding="utf-8"?><resources/>');

        var configTemplateFilePath = path.join(result.androidProjectName, 'config_template.json')
        if(!fs.existsSync(configTemplateFilePath)) fs.writeFileSync(configTemplateFilePath, '{}');
      }

      fs.writeFileSync(path.join(currentDir, 'monkey.json'), JSON.stringify(monkeyConfig, null, 2));
    });

    function onErr(err) {
      console.log(err);
      return 1;
    }

}
