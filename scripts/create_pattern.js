import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import {spawn} from 'child_process';

console.log('Hi! ヾ(＾-＾)ノ');
console.log('Lazy, huh? That\'s cool. Let me help you being lazy. :)');

inquirer
  .prompt({
    type: 'list',
    name: 'type',
    message: 'What do you want to create?',
    choices: ['component', 'bit', 'utility', 'template'],
    default: () => {
      return 'component';
    }
  })

  .then((answer) => {
    const type = answer.type;
    console.log('A ' + type + ', eh? Nice.')

    inquirer.prompt({
      type: 'input',
      name: 'name',
      message: "What do you want to call it?\nTip: Use slashes to denote a sub-component. (eg texts/faq)",
      validate: function(value) {
        if(value.match(/^[a-z-_\/]+$/i)) {
          if(value.split('/').length <= 2) {
            return true;
          }

          return 'Sorry, only one level of sub-componetns supported';
        }

        return 'The name may only contain ascii-characters, dashes, lo-dashes and slashes';
      }
    }).then(function(answer){
      const parts = answer.name.split('/');

      if (parts.length == 1) {
        var component = parts[0];
      }

      if (parts.length == 2) {
        var parent = parts[0];
        var component = parts[1];
      }

      createComponent({ parent, component, type: `${type}s`});
    });
  });

function createComponent(args) {
  const {component, type, parent} = args;
  const pathParts = ['site', 'patterns', type, parent, component].filter(v => v && v.length > 0);
  const compPath = path.join.apply(undefined, pathParts);
  const prefix = path.join(compPath, component);
  const className = [parent, component].filter(v => !!v).join('-');

  if(!fs.exists(compPath)) {
    mkdirp.sync(compPath);
  }


  console.log(`Creating files in ${compPath}`);

  fs.writeFileSync(prefix + '.html.php', `<div class="f-${className} todo <?= $modifier ?>">\n  <?= \$${component} ?>\n</div>`);
  fs.writeFileSync(prefix + '.scss', `.f-${className} {\n\n}`);
  fs.writeFileSync(prefix + '.config.php', `<?php
  return [
    'defaults' => [
      'modifier' => '', // used to pass down modifiers/classes from parent component
      '${component}' => 'todo: \$${component}'
    ]
  ];\n`);

  if(type == "templates") {
    let templatePath = path.join('site', 'templates', component);
    fs.writeFileSync(templatePath +'.php', `<?php pattern("templates/${component}"); ?>`)
  }

  console.log('\nDONE! Now, you go, run `npm start` and do stuff!\n\n<3');
}

function npmStart() {
  const watcher = spawn('npm', ['start','--color','always']);

  watcher.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  watcher.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  watcher.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}
