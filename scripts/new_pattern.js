#!/usr/bin/env babel-node --presets es2015
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';

var argv = require('yargs')
  .usage("Usage: new_pattern.js <path>")
  .default("root", "site/patterns")
  .demandCommand(1)
  .argv
;

const pathString = argv._[0];

// validate path
if(!pathString.match(/^[a-z-_\/]+$/)) {
  console.error(pathString, "is not a friendly path.");
  console.error("Please use a friendly path. regex: a-z-_/");
  process.exit();
}

if(!argv.root.match(/^[a-z-_\/]+$/)) {
  console.error("Please use a friendly root-path. regex: a-z-_/");
  process.exit();
}

// create folder
const pathParts = pathString.split("/").filter(v => v && v.length > 0);
const patternPath = path.join.apply(undefined, pathParts);
const rootPath = path.join.apply(
  undefined,
  argv.root.split("/").filter(v => v && v.length > 0)
);
const fullPath = path.join(rootPath, patternPath)
const moduleName = pathParts.slice(-1)[0];
const prefix = path.join(fullPath, moduleName);

if(fs.exists(fullPath)) {
  console.error(fullPath + " already exists. Please pick a new one!");
  process.exit();
}

mkdirp.sync(fullPath);

// create files
['.html.php', '.config.php', '.scss', '.js'].forEach((suffix) => {
  const content =  fs.readFileSync(
    path.resolve(__dirname, 'pattern-template', 'pattern' + suffix), 'utf8'
  ).replace('%name', moduleName);

  fs.writeFileSync(prefix + suffix, content.replace('%name', moduleName));
});
