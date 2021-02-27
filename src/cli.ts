import fs from 'fs';
import execa from 'execa';
import yargs from 'yargs';
import chalk from 'chalk';
import { getEnvironment } from './environment';

const log = console.log;

yargs(process.argv.slice(2))
  .scriptName('sam-cdk')
  .strictCommands()
  .demandCommand(1)
  .demandOption('stack')
  .demandOption('template')
  .command({
    command: 'environment',
    describe: 'generate environment',
    handler: environment,
  })
  .command({
    command: 'local',
    describe: 'run SAM CLI "local" command',
    handler: () => {},
    builder: (yargs) =>
      yargs
        .demandCommand(1)
        .command({
          command: 'start-lambda',
          describe: 'run SAM CLI "local start-lambda" command',
          handler: local,
        })
        .command({
          command: 'start-api',
          describe: 'run SAM CLI "local start-api" command',
          handler: local,
        })
        .command({
          command: 'invoke <function>',
          describe: 'run SAM CLI "local invoke" command',
          handler: local,
        }),
  }).argv;

/**
 * Write the environment
 */
async function environment(argv: any) {
  const stackName = argv['stack'] as string;
  const templatePath = argv['template'] as string;
  const outputPath = (argv['output'] as string) ?? `${templatePath}.sam-cdk.json`;

  if (fs.existsSync(outputPath)) {
    log(chalk.dim(chalk.bold(`Cached environment:`), outputPath));
  } else {
    log(chalk.dim(chalk.bold(`Loading environment from template:`), templatePath));
    const environment = await getEnvironment({ stackName, templatePath });
    const environmentJson = JSON.stringify(environment, null, 2);
    fs.writeFileSync(outputPath, environmentJson);
  }
  return { outputPath, templatePath, stackName };
}

/**
 * This function calls the SAM CLI and automatically adds the `template` and `env-vars` parameters.
 */
async function local(argv: any) {
  const { outputPath } = await environment(argv);

  // Construct list of SAM CLI arguments
  const samArgv = [...argv['_'], '--env-vars', outputPath];

  // Append function name
  const functionName = argv['function'];
  if (functionName) {
    samArgv.push(functionName);
  }

  // Delete arguments that we consumed
  delete argv['_'];
  delete argv['$0'];
  delete argv['stack'];
  delete argv['output'];
  delete argv['function'];

  // Copy remaining arguments into SAM arguments list
  for (const [name, value] of Object.entries(argv)) {
    if (value === true) {
      samArgv.push(`--${name}`);
    } else {
      samArgv.push(`--${name}`, `${value}`);
    }
  }

  log(chalk.dim(chalk.bold(`Running command:`), `sam ${samArgv.join(' ')}`));

  execa.sync('sam', samArgv, {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
  });
}
