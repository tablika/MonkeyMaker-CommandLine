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
//var Git = require('nodegit');
var format = require('string-format');
var exec = require('child_process').exec;

format.extend(String.prototype);

// Global Variables
var GIT_AUTHOR_USERNAME = "MonkeyMaker Build API";
var GIT_AUTHOR_EMAIL = "monkey@maker.com"
var workingDirectory = '/Users/peyman/Desktop/mk';
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
var configsRepo = null;
var repoPath = path.join(workingDirectory, 'repo');

var fetchRepo = function(repo) {
  return repo.fetch("origin", {
    credentials: function(url, userName) {
      return Git.Cred.userpassPlaintextNew(userName, monkey.options.server.getValueForKeyPath('repository.pass'));
    }
  });
}
if(!fs.existsSync(repoPath)) {
  exec('cd {0} && git clone {1} repo'.format(workingDirectory, monkey.options.getValueForKeyPath('server.repository.url')), function(err){
    console.error(err);
  })
  //console.log(x);
  // Git.clone(monkey.options.getValueForKeyPath('server.repository.url'), repoPath, function(err){console.log(err)});
  //
  // configsRepo = Git.Repository.open(repoPath).then(function(repo) {
  //   configsRepo = repo;
  //   return repo;
  // }).then(fetchRepo).catch(function(err){console.log(err)});
} else {
  // Git.Clone(monkey.options.getValueForKeyPath('server.repository.url'), repoPath, {
  //   remoteCallbacks: {
  //     credentials: function(url, userName) {
  //       return Git.Cred.userpassPlaintextNew(userName, monkey.options.server.getValueForKeyPath('repository.pass'));
  //     },
  //     certificateCheck: function() { return 1; }
  //   }
  // }).catch(function(err){console.error(err);})
  // .then(function(repo){configsRepo = repo; return repo;}).then(fetchRepo);
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

  // configsRepo.openIndex()
  // .then(function(index){
  //   index.addByPath(path.join(configName, 'ios'));
  //   index.write();
  //   return index.writeTree();
  // })
  // .then(function(t){
  //   return configsRepo.getTree(t);
  // })
  // .then(function(t){
  //   tree = t;
  //   return Git.Reference.nameToId(configsRepo, "HEAD");
  // })
  // // .then(function(head) {
  // //   console.log(head);
  // //   return configsRepo.getCommit(head);
  // // })
  // .then(function(head) {
  //   console.log(head);
  //   author = Git.Signature.now(GIT_AUTHOR_USERNAME, GIT_AUTHOR_EMAIL);
  //   committer = Git.Signature.now(GIT_AUTHOR_USERNAME, GIT_AUTHOR_EMAIL);
  //   return Git.Commit.create(configsRepo, "HEAD", author, committer, "UTF-8", "Updated " + configName + " for iOS.", tree, 1, [head]);
  // }).then(function(x){console.log("HI"); console.log(x); return x;})
  // .catch(function (err){console.log(err)});
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

    fs.writeFileSync(configFilePath, JSON.stringify(evaluationResult.compile(), null, 2));

    var response = {};
    response.settings = evaluationResult.compile();
    if(getValidationResult(name).isValid){
      pushChangesFor(name);
    }
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

app.get('/:name/validation', function (req, res) {

  res.send(getValidationResult(req.params.name));

});

function getValidationResult(configName) {

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
    }

  } else { throw { msg: 'The settings file is not even created.' }; }

  // Step2: Make sure resources are fine.
  var appResourceList = monkey.options.ios.resources;
  if(!appResourceList) throw { message: 'iOS resources are not setup. No resource file is accepted as a result.' };

  var resourceFiles = fs.readdirSync(path.join(configInfo.configPath, 'resources'))
    .filter(function(x) { return /^[.]/.exec(x) ==null });

  response.resources = {isValid: true, remainingFiles: []};
  for(var key in appResourceList) {
    if(resourceFiles.indexOf(appResourceList[key].name) == -1) {
      response.resources.isValid = false;
      response.resources.remainingFiles.push(appResourceList[key]);
    }
  }

  response.isValid = (response.settings.isValid && response.resources.isValid);

  return response;
  // Step3: AppStore info.

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
