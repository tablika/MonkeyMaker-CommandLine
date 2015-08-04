var fs = require('fs-extra')
var Monkey = require('monkey-maker');
var Table = require('cli-table');   // That nice table!

module.exports.desc = "Install an existing config.";
module.exports.argsCount = 1;
module.exports.action = function(cmd) {

  var argv = cmd
      .alias('p', 'platform')
      .demand(['p'])
      .usage('monkey install [OPTIONS]').argv;

  try{
    var monkeyConfig = JSON.parse(fs.readFileSync('monkey.json', 'utf8'));
    var monkey = new Monkey(monkeyConfig);
    var installationResult = monkey.installConfig(cmd.args[0], argv.platform, argv.version?{version:argv.version}:{});
    var any = false;
    var nameValuePair = installationResult.configSettings.flatten('name', 'value');

    var table = new Table({ chars: { 'top': '-' , 'top-mid': '-' , 'top-left': '-' , 'top-right': '-'
      , 'bottom': '-' , 'bottom-mid': '-' , 'bottom-left': '-' , 'bottom-right': '-'
      , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
      , 'right': '' , 'right-mid': '' , 'middle': ':' }, style: { head: ['yellow'], border: ['yellow'] }});

    for (var name in nameValuePair) {
      any = true;
      table.push([name, nameValuePair[name]]);
    }
    if(any) console.log(table.toString());
    console.log('[ ] Installed ' + cmd.args[0].yellow + ' for platform ' + beatifyPlatform(argv.platform).yellow);
  } catch(exception) {
    console.log(exception);
    if(typeof(exception) != 'object'){
      console.error(exception);
    } else {
        console.error(JSON.stringify(exception, null, 2));
    }
  }
}

function beatifyPlatform(platform) {
  if(platform.toLowerCase() == 'ios') return 'iOS';
  if(platform.toLowerCase() == 'android') return 'Android';
  return platform;
}
