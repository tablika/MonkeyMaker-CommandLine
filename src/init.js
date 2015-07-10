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
        fs.writeFileSync(path.join(result.iosProjectName, 'Config.plist'), defaultPlistFile);
        fs.writeFileSync(path.join(result.iosProjectName, 'config_template.json'), '{}');
      }
      if(result.androidProjectName) {
        monkeyConfig.android = {
          projectName: result.androidProjectName
        }
        fs.writeFileSync(path.join(result.androidProjectName, 'Resources', 'values', 'settings.xml'), '<?xml version="1.0" encoding="utf-8"?><resources/>');
        fs.writeFileSync(path.join(result.androidProjectName, 'config_template.json'), '{}');
      }

      fs.writeFileSync(path.join(currentDir, 'monkey.json'), JSON.stringify(monkeyConfig, null, 2));

    });

    function onErr(err) {
      console.log(err);
      return 1;
    }

}
