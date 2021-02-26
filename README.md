# SAM CDK

## Usage

Make sure to synthesize your CDK application using the `--no-staging` parameter. CDK then adds metadata `aws:asset:path` pointing to your local code for every Lambda function in the synthesized template.

```shell
cdk synth --quiet --no-staging
```

```shell
sam-cdk COMMAND --stack-name STACK_NAME --template ./cdk.out/stack.template.json
```

The `sam-cdk environment` command generates a file that can be used as `env-vars` parameter to the SAM CLI. The command looks for all the Lambda functions in the given template. The environment variables of those Lambda functions are loaded from the stack with the given stack name and stored in the given output file.

```shell
sam-cdk environment --stack-name STACK_NAME --template ./cdk.out/stack.template.json --output ./environment.json
```

The `sam-cdk local start-api` command invokes the corresponding SAM CLI `sam local start-api` command and automatically includes the `env-vars` as described above.

```shell
sam-cdk local start-api --stack-name STACK_NAME --template ./cdk.out/stack.template.json [...SAM_CLI_PARAMETERS]
```

The `sam-cdk local start-lambda` command invokes the corresponding SAM CLI `sam local start-lambda` command and automatically includes the `env-vars` as described above.

```shell
sam-cdk local start-lambda --stack-name STACK_NAME --template ./cdk.out/stack.template.json [...SAM_CLI_PARAMETERS]
```

The `sam-cdk invoke` command invokes the corresponding SAM CLI `sam local invoke` command and automatically includes the `env-vars` as described above.

```shell
sam-cdk local invoke FunctionName --stack-name STACK_NAME --template ./cdk.out/stack.template.json [...SAM_CLI_PARAMETERS]
```
