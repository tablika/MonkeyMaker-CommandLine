var express = require('express');
var Monkey = require('monkey-maker');
var configUtil = require('config-util');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs-extra');
var multer = require('multer');
var os = require('os');
var sizeOf = require('image-size');
var LINQ = require('node-linq').LINQ;

var app = express();
app.use(bodyParser.json());
app.use(multer({
  dest: path.join(os.tmpdir(), 'com.monkey.Server', 'uploads'),
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
  }
}));

module.exports = app;

var monkeyOptions = JSON.parse(fs.readFileSync('monkey.json', 'utf8'));
monkeyOptions.project.configsPath = '/Users/peyman/Desktop/jaja';
fs.mkdirsSync(monkeyOptions.project.configsPath);
var monkey = new Monkey(monkeyOptions);

app.post('/', function (req, res) {

  var params = configUtil.evaluate({platform: 'string', name: 'string'}, req.body);
  if(!params.isValid) throw {message: 'Parameters are invalid.', errors: results.errors};
  var params = params.compile();

  console.log(monkey.options);
  var configRootPath = path.join(monkey.options.project.configsPath, params.name);

  if(fs.existsSync(configRootPath)) {
    error(res, 'Name is already taken.', 409);
    return;
  }
  if(params.platform.toLowerCase() != 'ios'){
    error(res, 'Platform is not supported yet.');
    return;
  }

  // intialize it.
  fs.mkdirsSync(path.join(configRootPath, 'ios'));
  fs.writeFileSync(path.join(configRootPath, 'ios', 'config.json'), '{}');
  fs.mkdirsSync(path.join(configRootPath, 'ios', 'resources'));

  res.status(201).location(path.join(req.originalUrl, params.name)).send();

});

app.get('/:name', function (req, res) {

  var name = req.params.name;
  var configInfo = monkey.getConfigInfo(name, 'ios');
  var configFilePath = path.join(configInfo.configPath, 'config.json');
  if(fs.existsSync(configFilePath)) {

    var originalConfigFile = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    var templateConfigFile = JSON.parse(fs.readFileSync(configInfo.configTemplateFilePath, 'utf8'));
    var evaluationResult = configUtil.evaluate(templateConfigFile, originalConfigFile);

    var response = {};
    response.settings = evaluationResult.compile();
    response.summary = evaluationResult.flatten('name', 'value');
    response.resources = fs.readdirSync(path.join(configInfo.configPath, 'resources'))
      .filter(function(x) { return /^[.]/.exec(x) ==null })
      .map(function(x) {
        return { name: x, url: path.join(req.originalUrl, 'resources', x) };
      });
    res.send(response);

  } else {
    error(res, 'Config not found.', 404);
    return;
  }

});

app.put('/:name/settings', function(req, res, next) {
  var name = req.params.name;
  var configInfo = monkey.getConfigInfo(name, 'ios');
  var configFilePath = path.join(configInfo.configPath, 'config.json');
  if(fs.existsSync(configFilePath)) {

    var inputConfig = req.body;
    var configTemplateFile = JSON.parse(fs.readFileSync(configInfo.configTemplateFilePath, 'utf8'));
    var evaluationResult = configUtil.evaluate(configTemplateFile, inputConfig);

    if(!evaluationResult.isValid) {
      return next({ message: 'Settings are not valid.', errors: evaluationResult.errors });
    };

    fs.writeFileSync(configFilePath, JSON.stringify(evaluationResult.compile(), null, 2));

    var response = {};
    response.settings = evaluationResult.compile();
    res.send(response);

  } else {
    error(res, 'Config not found.', 404);
    return;
  }
});

app.put('/:name/resources', function (req,res) {
  var name = req.params.name;
  var configInfo = monkey.getConfigInfo(name, 'ios');

  var appResourceList = monkey.options.ios.resources;
  if(!appResourceList) throw { errorMessage: 'iOS resources are not setup. set them up in monkey.json: ios.resources' };
  var linq = new LINQ(appResourceList);
  var response = { warnings: [], files: [], errors: [] };

  for(var file in req.files) {
    // See if it's a known file.
    var fileInfo = linq.First(function(x){return x.name == file});
    var uploadedFile = req.files[file];

    if(!fileInfo) {
      fs.removeSync(uploadedFile.path);
      response.warnings.push({name: file, message: "Resource is not in the app bundle."});
      continue;
    }
    if(uploadedFile.mimetype != 'image/png') {
      fs.removeSync(uploadedFile.path);
      response.errors.push({name: file, message: "Only PNG images are accepted."});
      continue;
    }

    var dimensions = sizeOf(uploadedFile.path);
    var sizeString = dimensions.width + 'x' + dimensions.height;
    if(fileInfo.size != sizeString) {
      response.errors.push({name: file, message: "Size should be: " + fileInfo.size});
      fs.removeSync(uploadedFile.path);
      continue;
    }

    // Copy the file and delete it.
    response.files.push({name: file, url: path.join(req.originalUrl, file)});
    fs.copySync(uploadedFile.path, path.join(configInfo.configPath, 'resources', file));
    fs.removeSync(uploadedFile.path);
  }
  res.status(200).send(response);
});

app.get('/:name/resources/:filename', function (req, res) {

  var name = req.params.name;
  var configInfo = monkey.getConfigInfo(name, 'ios');
  var filePath = path.join(configInfo.configPath, 'resources', req.params.filename);
  if(!fs.existsSync(filePath)) {
    error(res, 'Resource not found.');
    return;
  }

  var img = fs.readFileSync(filePath);
  res.header("Content-Type", "image/png");
  res.end(img, 'binary');

});

app.post('/:name/save', function (req, res) {

  // Step1: Make sure settings are fine.
  // Step2: Make sure images are fine.
  // Step3: Commit changes to git.

});

function error(res, message, status) {
  message = typeof(message) == 'string' ? {message: message} : message;
  res.status(status||400).send(message);
}

app.use(function (err, req, res, next) {
  console.log(err);
  if(err.hasOwnProperty('message')) {
    error(res, err, 400);
  } else {
    error(res, 'Something happened on our side :(', 500);
  }
})
