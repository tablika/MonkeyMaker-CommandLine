var fs = require('fs-extra');

module.exports.desc = "View or update the build config file.";
module.exports.commands = {};

module.exports.commands.set = {
  argsCount: 2,
  desc: "add/update values in the monkey config file.",
  action: function(cmd) {

    var keyPath = cmd.args[0];
    var value = cmd.args[1];

    try {
      var monkeyConfig = JSON.parse(fs.readFileSync('monkey.json', 'utf8'));
      setValue(monkeyConfig, keyPath, value);
      fs.writeFileSync('monkey.json', JSON.stringify(monkeyConfig, null, 2));
    } catch(exception) {
      console.error('Could not find/load monkey.json');
    }

  }
}

function setValue(object, keyPath, value) {

  object = object || {};
  var currentObject = object;
  var hierarchy = keyPath.split('.');
  for (var i = 0; i < hierarchy.length; i++) {
    var currentKey = hierarchy[i];
    // If it's the last one
    if(i == hierarchy.length-1) {
      currentObject[currentKey] = value;
      return;
    }

    // Otherwise, just go on.
    if(!currentObject.hasOwnProperty(currentKey) || typeof(currentObject[currentKey]) != 'object'){
      currentObject[currentKey] = {};
    }
    currentObject = currentObject[currentKey];
  }

}
