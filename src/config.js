var fs = require('fs-extra');
var Table = require('cli-table');   // That nice table!

module.exports.desc = "View or update the build config file.";
module.exports.action = function(cmd) {
  try {
    processFlags(cmd);
  } catch(exception){
    console.error('Could not find/load monkey.json');
  }
}
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
      processFlags(cmd);
    } catch(exception) {
      console.error('Could not find/load monkey.json');
    }

  }
}

module.exports.commands.get= {
  argsCount: 1,
  desc: "get value of a given key path.",
  action: function(cmd) {
    try{
      var monkeyConfig = JSON.parse(fs.readFileSync('monkey.json', 'utf8'));
      var keyValuePair = flatten(monkeyConfig);
      if(keyValuePair[cmd.args[0]]) console.log(keyValuePair[cmd.args[0]]);
      else console.error('No value is set to key path: ' + cmd.args[0]);
    } catch(exception) {
      console.error('Could not find/load monkey.json');
    }
  }
}

function processFlags(cmd) {
  var argv = cmd.argv;
  if(argv.list) {
    var table = new Table({ chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
      , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
      , 'left': '~' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
      , 'right': '' , 'right-mid': '' , 'middle': ':' }, style: { }});

    var monkeyConfig = JSON.parse(fs.readFileSync('monkey.json', 'utf8'));
    var keyValuePair = flatten(monkeyConfig);
    for(key in keyValuePair) {
      table.push([key, keyValuePair[key]]);
    }
    console.log(table.toString());
  }
}

function flatten(object, keyValuePair, prefix) {
  keyValuePair = keyValuePair || {};
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      if(typeof(object[key]) == 'object') {
        flatten(object[key], keyValuePair, prefix?prefix+'.'+key:key);
      } else {
        keyValuePair[prefix?prefix+'.'+key:key] = object[key];
      }
    }
  }
  return keyValuePair;
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
