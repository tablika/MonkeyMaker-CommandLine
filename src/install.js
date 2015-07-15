var fs = require('fs-extra')
var Monkey = require('monkey-maker');

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
    monkey.installConfig(cmd.args[0], argv.platform, argv.version?{version:argv.version}:{});
  } catch(exception) {
    console.error(JSON.stringify(exception, null, 2));
  }
}
