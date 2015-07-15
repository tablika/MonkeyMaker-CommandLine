var express = require('express');
var Monkey = require('monkey-maker');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs-extra');

var repoPath = '/Users/peyman/Desktop/jaja';//path.join(os.tmpdir(), 'com.monkey', 'oem');
fs.mkdirsSync(repoPath);

var app = express();
app.use(bodyParser.json());

module.exports = app;

var monkey = new Monkey(JSON.parse(fs.readFileSync('monkey.json', 'utf8')));

app.post('/', function (req, res) {

  var results = monkey.configUtil.evaluate({platform: "string", name: "string"}, req.body);
  if(!results.isValid) {
    error(res, {message: 'Parameters are invalid.', errors: results.errors});
    return;
  }

  var params = results.config;
  var configRootPath = path.join(repoPath, params.name.value);
  if(fs.existsSync(configRootPath)) {
    error(res, 'Name is already taken.', 409);
    return;
  }
  if(params.platform.value.toLowerCase() != 'ios'){
    error(res, 'Platform is not supported yet.');
    return;
  }

  // intialize it.
  fs.mkdirsSync(configRootPath);
  fs.writeFileSync(path.join(configRootPath, 'ios.config.json'), '{}');
  fs.mkdirsSync(path.join(configRootPath, 'ios.resources'));

  res.status(201).location(path.join(req.originalUrl, params.name.value)).send();

});

app.put('/:name', function(res, res) {

  var name = req.params.name;
  var configFilePath = path.join(repoPath, name, 'ios.config.json');
  if(fs.existsSync(configFilePath)) {

    var response = {};
    response.settings = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    response.resources = [];
    res.send(response);

  } else {
    error(res, 'Config not found.', 404);
    return;
  }

});

app.get('/:name', function (req, res) {

  var name = req.params.name;
  var configFilePath = path.join(repoPath, name, 'ios.config.json');
  if(fs.existsSync(configFilePath)) {

    var response = {};
    response.settings = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    response.resources = [];
    res.send(response);

  } else {
    error(res, 'Config not found.', 404);
    return;
  }

});

app.post('/:name/save', function (req, res) {



});

function error(res, message, status) {
  message = typeof(message) == 'string' ? {message: message} : message;
  res.status(status||400).send(message);
}
