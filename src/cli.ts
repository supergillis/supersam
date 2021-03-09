import fs from 'fs';
import execa from 'execa';
import yargs from 'yargs';
import chalk from 'chalk';
import pt from 'prepend-transform';
import { getEnvironment, getMetadata } from './environment';

const log = console.log;

yargs(process.argv.slice(2))
  .scriptName('sam-cdk')
  .strictCommands()
  .demandCommand(1)
  .demandOption('stack')
  .demandOption('template')
  .command({
    command: 'environment',
    describe: 'creates environment file',
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
 * Write the environment.
 */
async function environment(argv: any) {
  const stackName = argv['stack'] as string;
  const templatePath = argv['template'] as string;
  const outputPath = (argv['output'] as string) ?? `${templatePath}.sam-cdk.json`;

  // TODO Merge additional --env-vars

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
 * Get the metadata.
 */
async function metadata(argv: any) {
  const templatePath = argv['template'] as string;
  const functionMetadata = await getMetadata({ templatePath });
  return { templatePath, functionMetadata };
}

/**
 * This function calls the SAM CLI and automatically adds the `template` and `env-vars` parameters.
 */
async function local(argv: any) {
  const { outputPath } = await environment(argv);
  const { functionMetadata } = await metadata(argv);

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

  // List of default colors to use for prefixing the spawned process outputs
  const colors = [chalk.green, chalk.blue, chalk.red];
  const nextColor = () => colors.shift() ?? chalk.yellow;

  // Run SAM
  const sam = run({
    name: nextColor()('sam'),
    command: 'sam',
    argv: samArgv,
  });

  // Run all functions that have supersam metadata
  const watchers = [];
  for (const [logicalId, metadata] of Object.entries(functionMetadata)) {
    const fullCommand = metadata?.['supersam:watch:command'];
    const cwd = metadata?.['supersam:watch:directory'];
    if (fullCommand) {
      const [command, ...argv] = fullCommand.split(' ');

      // Run the supersam watch command
      watchers.push(
        run({
          name: nextColor()(logicalId),
          command,
          argv,
          cwd,
        }),
      );
    }
  }

  // Wait for the first command to finish
  await Promise.all([sam, ...watchers]);
}

/**
 * Auxiliary function to run a command and prefix its output.
 */
function run({ command, name = command, argv, cwd }: { name: string; command: string; argv: string[]; cwd?: string }) {
  log(chalk.dim(chalk.bold(`Running command:`), `${command} ${argv.join(' ')}`));

  const sam = execa(command, argv, { cwd });
  sam.stdout?.pipe(pt(`${name} `))?.pipe(process.stdout);
  sam.stderr?.pipe(pt(`${name} `))?.pipe(process.stderr);
}
