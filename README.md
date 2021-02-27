# SAM CDK

<div>
  <a href="https://www.npmjs.com/package/sam-cdk">
    <img alt="npm" src="https://img.shields.io/npm/v/sam-cdk.svg?color=green"/>
  </a>
</div>

Generate environment variables from CDK projects for use by SAM CLI.

## Usage

`sam-cdk` wraps `sam` CLI. All `sam` CLI options can be passed to `sam-cdk`. The only difference is that `sam-cdk` needs a stack name to lookup Lambda function environments.

```shell
sam-cdk COMMAND --stack STACK_NAME --template TEMPLATE [...SAM_CLI_OPTIONS]
```

### `sam-cdk environment`

The `sam-cdk environment` command generates a file that can be used as `env-vars` option to the SAM CLI. The command looks for all the Lambda functions in the given template. The environment variables of those Lambda functions are loaded from the stack with the given stack name and stored in the given output file.

```shell
sam-cdk environment --stack STACK_NAME --template ./cdk.out/stack.template.json --output ./environment.json
sam --template ./cdk.out/stack.template.json --env-vars ./environment.json
```

### `sam-cdk local start-api`

The `sam-cdk local start-api` command invokes the corresponding SAM CLI `sam local start-api` command and automatically includes the `env-vars` as described above.

```shell
sam-cdk local start-api --stack STACK_NAME --template ./cdk.out/stack.template.json [...SAM_CLI_OPTIONS]
```

### `sam-cdk local start-lambda`

The `sam-cdk local start-lambda` command invokes the corresponding SAM CLI `sam local start-lambda` command and automatically includes the `env-vars` as described above.

```shell
sam-cdk local start-lambda --stack STACK_NAME --template ./cdk.out/stack.template.json [...SAM_CLI_OPTIONS]
```

### `sam-cdk invoke`

The `sam-cdk invoke` command invokes the corresponding SAM CLI `sam local invoke` command and automatically includes the `env-vars` as described above.

```shell
sam-cdk local invoke FunctionName --stack STACK_NAME --template ./cdk.out/stack.template.json [...SAM_CLI_OPTIONS]
```

### Permissions

`sam-cdk` is using AWS SDK to lookup Lambda function environments. Make sure you are using an IAM role or user that can [describe CloudFormation stack resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_DescribeStackResources.html) and [get Lambda function configuration](https://docs.aws.amazon.com/lambda/latest/dg/API_GetFunctionConfiguration.html).

## Notes

### CDK

Your CDK stack has to be deployed before using this tool.

Make sure to synthesize your CDK application using the `--no-staging` option. CDK then adds metadata `aws:asset:path` pointing to your local code for every Lambda function in the synthesized template.

```shell
cdk synth --quiet --no-staging
```

### Environment Changes

## Author

Gillis Van Ginderachter

## License

GNU General Public License v3.0
