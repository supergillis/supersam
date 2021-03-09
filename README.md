# supersam

<div>
  <a href="https://www.npmjs.com/package/supersam">
    <img alt="npm" src="https://img.shields.io/npm/v/supersam.svg?color=green"/>
  </a>
</div>

## Usage

`supersam` wraps `sam` CLI and uses the Lambda function environment as parameter to the `env-vars` option of SAM CLI. Additionally, `supersam` looks for Lambda functions with `supersam:watch:command` and `supersam:watch:directory` metadata and launches the given command as a child process.

All `sam` CLI options can be passed to `supersam`. The only difference is that `supersam` needs an additional stack name parameter to lookup Lambda function environments.

```shell
supersam COMMAND --stack STACK_NAME --template TEMPLATE [...SAM_CLI_OPTIONS]
```

### `supersam environment`

The `supersam environment` command creates a file that can be used as `env-vars` option to the SAM CLI. The command looks for all the Lambda functions in the given template. The environment variables of those Lambda functions are loaded from the stack with the given stack name and stored in the given output file.

```shell
supersam environment --stack STACK_NAME --template ./cdk.out/stack.template.json --output ./environment.json
sam --template ./cdk.out/stack.template.json --env-vars ./environment.json
```

### `supersam local start-api`

The `supersam local start-api` command invokes the corresponding SAM CLI `sam local start-api` command and automatically includes the `env-vars` as described above.

```shell
supersam local start-api --stack STACK_NAME --template ./cdk.out/stack.template.json [...SAM_CLI_OPTIONS]
```

### `supersam local start-lambda`

The `supersam local start-lambda` command invokes the corresponding SAM CLI `sam local start-lambda` command and automatically includes the `env-vars` as described above.

```shell
supersam local start-lambda --stack STACK_NAME --template ./cdk.out/stack.template.json [...SAM_CLI_OPTIONS]
```

### `supersam invoke`

The `supersam invoke` command invokes the corresponding SAM CLI `sam local invoke` command and automatically includes the `env-vars` as described above.

```shell
supersam local invoke FunctionName --stack STACK_NAME --template ./cdk.out/stack.template.json [...SAM_CLI_OPTIONS]
```

### Permissions

`supersam` is using AWS SDK to lookup Lambda function environments. Make sure you are using an IAM role or user that can [describe CloudFormation stack resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_DescribeStackResources.html) and [get Lambda function configuration](https://docs.aws.amazon.com/lambda/latest/dg/API_GetFunctionConfiguration.html).

## Notes

### CDK

This tool works great with CDK.

Your CDK stack has to be deployed before using `supersam` otherwise the Lambda function environment will not be found.

The following snippet shows you how to add the `supersam` metadata to your Lambda functions.

```typescript
const fn = new lambda.Function(scope, 'Function', ...);
const fnCfnResource = fn.node.defaultChild as cdk.CfnResource;
fnCfnResource.addMetadata('supersam:watch:command', 'pnpm watch');
fnCfnResource.addMetadata('supersam:watch:directory', './lambda-code`);
```

Make sure to synthesize your CDK application using the `--no-staging` option. CDK then adds metadata `aws:asset:path` pointing to your local code for every Lambda function in the synthesized template.

```shell
cdk synth --quiet --no-staging
```

### Environment Changes

## Author

Gillis Van Ginderachter

## License

GNU General Public License v3.0
