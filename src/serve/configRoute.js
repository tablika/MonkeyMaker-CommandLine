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
var format = require('string-format');
var exec = require('child_process').exec;

format.extend(String.prototype);

// Global Variables
var GIT_AUTHOR_USERNAME = "MonkeyMaker Build API";
var GIT_AUTHOR_EMAIL = "monkey@maker.com"
var workingDirectory = path.join(os.tmpdir(), 'com.monkey.BuildAPI');
console.log('Operating at: ' + workingDirectory);
fs.mkdirsSync(workingDirectory);

// Setup express
var app = express();
app.use(bodyParser.json());
module.exports = app;

// Setup monkey
var monkeyOptions = JSON.parse(fs.readFileSync('monkey.json', 'utf8'));
monkeyOptions.project.configsPath = path.join(workingDirectory, 'repo');
var monkey = new Monkey(monkeyOptions);

// Setup Git
var repoPath = path.join(workingDirectory, 'repo');

if(!fs.existsSync(repoPath)) {
  exec('cd {0} && git clone {1} repo'.format(workingDirectory, monkey.options.getValueForKeyPath('server.repository.url')), function(err){
    console.error(err);
  })
}

// Setup uploader
app.use(multer({
  dest: path.join(workingDirectory, 'uploads'),
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
  }
}));

// Git Functions
function pushChangesFor (configName) {

  exec('cd {0} && git add {1}/ios && git commit -m "updated {1} for iOS" && git push origin master'.format(repoPath, configName), function(err){
    console.error(err);
  })
}

function saveChangesIfValid (configInfo) {
  var bag = { };
  if(getValidationResult(configInfo.configName, bag).isValid) {
    var certsPath = path.join(configInfo.configPath, 'certs');
    fs.mkdirsSync(certsPath);
    var cmd = 'cd {0} && export DELIVER_USER="{1}" && ';
    cmd += 'export DELIVER_PASSWORD="{2}" && ';
    cmd += 'export SIGH_APP_IDENTIFIER="{3}" && ';
    cmd += 'export SIGH_PROVISIONING_PROFILE_NAME="{4} Distribution (MonkeyMaker)" && ';
    cmd += 'sigh -q "{4}.mobileprovision" && ';
    cmd += 'export PEM_APP_IDENTIFIER="{3}" && ';
    cmd += 'export PEM_SAVE_PRIVATEKEY="1" && ';
    cmd += 'pem -g -s -o apns_cert.pem';
    cmd = cmd.format(certsPath, monkey.options.itunesConnect.username,
          monkey.options.itunesConnect.password, bag.compiledConfig.app.bundleId,
          bag.compiledConfig.app.name);
    exec(cmd, function() {
      pushChangesFor(configInfo.configName);
    });
  }
}

// API
app.post('/', function (req, res) {

  var params = configUtil.evaluate({platform: 'string', name: 'string'}, req.body);
  if(!params.isValid) throw {message: 'Parameters are invalid.', errors: results.errors};
  var params = params.compile();

  var configRootPath = path.join(monkey.options.project.configsPath, params.name);

  if(fs.existsSync(configRootPath)) {
    error(res, 'Name is already taken.', 409);
    return;
  }
  if(params.platform.toLowerCase() != 'ios') {
    error(res, 'Platform is not supported yet.');
    return;
  }

  // intialize it.
  fs.mkdirsSync(path.join(configRootPath, 'ios'));
  fs.writeFileSync(path.join(configRootPath, 'ios', 'config.json'), '{}');
  fs.mkdirsSync(path.join(configRootPath, 'ios', 'resources'));

  res.status(201).location(path.join(req.originalUrl, params.name)).send();

});

app.get('/', function (req, res) {
  res.send(fs.readdirSync(repoPath).filter(function(file) {
    return /^[.]/.exec(file) ==null &&
      fs.statSync(path.join(repoPath, file)).isDirectory();
  }));
})

app.get('/:name', function (req, res) {

  var name = req.params.name;
  var configInfo = monkey.getConfigInfo(name, 'ios');
  var configFilePath = path.join(configInfo.configPath, 'config.json');
  console.log(configFilePath);
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

    response.isReady = getValidationResult(name).isValid;
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
    var compiledConfig = evaluationResult.compile();
    fs.writeFileSync(configFilePath, JSON.stringify(compiledConfig, null, 2));

    var response = {};
    response.settings = compiledConfig;
    saveChangesIfValid(configInfo);
    res.send(response);

  } else {
    error(res, 'Config not found.', 404);
    return;
  }
});

app.put('/:name/resources', function (req,res) {
  var name = req.params.name;
  var configInfo = monkey.getConfigInfo(name, 'ios');
  var configFilePath = path.join(configInfo.configPath, 'config.json');
  if(!fs.existsSync(configFilePath)){
    error(res, 'Config not found.', 404);
    return;
  }
  var resourcesTemplateFilePath = path.join(configInfo.projectPath, 'resources_template.json');
  if(!fs.existsSync(resourcesTemplateFilePath)) throw { message: 'iOS resources are not setup. No resource file is accepted as a result.' };
  var appResourceList = JSON.parse(fs.readFileSync(resourcesTemplateFilePath, 'utf8'));

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
    if(uploadedFile.mimetype == 'image/png') {
      var dimensions = sizeOf(uploadedFile.path);
      var sizeString = dimensions.width + 'x' + dimensions.height;
      if(fileInfo.size != sizeString) {
        response.errors.push({name: file, message: "Size should be: " + fileInfo.size});
        fs.removeSync(uploadedFile.path);
        continue;
      }
    } else if (uploadedFile.mimetype == 'application/pdf') {

    } else {
      fs.removeSync(uploadedFile.path);
      response.errors.push({name: file, message: "Only PNG images and PDF vectors are accepted."});
      continue;
    }

    // Copy the file and delete it.
    response.files.push({name: file, url: path.join(req.originalUrl, file)});
    fs.copySync(uploadedFile.path, path.join(configInfo.configPath, 'resources', fileInfo.path, fileInfo.name));
    fs.removeSync(uploadedFile.path);
  }
  saveChangesIfValid(configInfo);
  res.status(200).send(response);
});

app.get('/:name/resources/:filename', function (req, res) {

  var name = req.params.name;
  var configInfo = monkey.getConfigInfo(name, 'ios');

  var resourcesTemplateFilePath = path.join(configInfo.projectPath, 'resources_template.json');
  if(!fs.existsSync(resourcesTemplateFilePath)) throw { message: 'iOS resources are not setup. No resource file is accepted as a result.' };
  var appResourceList = JSON.parse(fs.readFileSync(resourcesTemplateFilePath, 'utf8'));
  var linq = new LINQ(appResourceList);
  var fileInfo = linq.First(function(x){return x.name == req.params.filename});
  var filePath = path.join(configInfo.configPath, 'resources', fileInfo.path, fileInfo.name);
  if(!fs.existsSync(filePath)) {
    error(res, 'Resource not found.', 404);
    return;
  }

  var extention = path.extname(filePath);

  var img = fs.readFileSync(filePath);
  res.header("Content-Type", extention == ".pdf" ? "application/pdf" : "image/png");
  res.end(img, 'binary');

});

app.get('/:name/validation', function (req, res) {
  res.send(getValidationResult(req.params.name));
});

function getValidationResult(configName, bag) {

  var response = {};

  // Step1: Make sure settings are fine.
  var configInfo = monkey.getConfigInfo(configName, 'ios');
  var configFilePath = path.join(configInfo.configPath, 'config.json');
  if(fs.existsSync(configFilePath)) {

    var originalConfigFile = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    var templateConfigFile = JSON.parse(fs.readFileSync(configInfo.configTemplateFilePath, 'utf8'));
    var evaluationResult = configUtil.evaluate(templateConfigFile, originalConfigFile);

    if(!evaluationResult.isValid) {
      response.setValueForKeyPath('settings.isValid', false);
      response.setValueForKeyPath('settings.errors', evaluationResult.errors);
    } else {
      response.setValueForKeyPath('settings.isValid', true);
      response.setValueForKeyPath('settings.errors', null);
      if (bag) { bag.compiledConfig = evaluationResult.compile() }
    }

  } else { throw { msg: 'The settings file is not even created.' }; }

  // Step2: Make sure resources are fine.
  var resourcesTemplateFilePath = path.join(configInfo.projectPath, 'resources_template.json');
  if(!fs.existsSync(resourcesTemplateFilePath)) throw { message: 'iOS resources are not setup. No resource file is accepted as a result.' };
  var appResourceList = JSON.parse(fs.readFileSync(resourcesTemplateFilePath, 'utf8'));

  var resourceFiles = fs.readdirSync(path.join(configInfo.configPath, 'resources'))
    .filter(function(x) { return /^[.]/.exec(x) == null });

  var resourcesRoot = path.join(configInfo.configPath, 'resources');

  response.resources = {isValid: true, remainingFiles: []};
  for(var key in appResourceList) {
    var resInfo = appResourceList[key];

    if(!fs.existsSync(path.join(resourcesRoot, resInfo.path || '', resInfo.name))) {
      response.resources.isValid = false;
      delete appResourceList[key].path;
      response.resources.remainingFiles.push(appResourceList[key]);
    }
  }

  response.isValid = (response.settings.isValid && response.resources.isValid);

  return response;

}

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
