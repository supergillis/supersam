import fs from 'fs';
import path from 'path';
import { CloudFormation } from '@aws-sdk/client-cloudformation';
import { Lambda } from '@aws-sdk/client-lambda';

const cloudFormation = new CloudFormation({});
const lambda = new Lambda({});

export type Environment = Record<string, Record<string, string>>;

export interface GetEnvironmentProps {
  stackName: string;
  templatePath: string;
}

export async function getEnvironment({ stackName, templatePath }: GetEnvironmentProps) {
  const describeStackResources = await cloudFormation.describeStackResources({
    StackName: stackName,
  });
  if (!describeStackResources) {
    throw new Error(`Cannot find CloudFormation stack with name "${stackName}"`);
  }

  const templateFullPath = path.resolve(templatePath);
  if (!fs.existsSync(templateFullPath)) {
    throw new Error(`Cannot find file "${templatePath}"`);
  }

  const stackResources = describeStackResources.StackResources!;
  const templateContent = fs.readFileSync(templatePath);
  const template = JSON.parse(templateContent.toString());
  const templateResources: Record<string, any> = template.Resources ?? {};

  // Find logical IDs for all Lambda functions
  const functionLogicalIds = Object.entries(templateResources)
    .filter(([, resource]) => resource.Type === 'AWS::Lambda::Function')
    .map(([functionLogicalId]) => functionLogicalId);

  async function getEnvironmentVariables(functionLogicalId: string) {
    const cfnLambdaResource = stackResources.find((r) => r.LogicalResourceId === functionLogicalId);
    if (!cfnLambdaResource) {
      throw new Error(`Cannot find Lambda function with logical ID "${functionLogicalId}" in stack "${stackName}"`);
    }

    const functionName = cfnLambdaResource.PhysicalResourceId;
    const functionConfiguration = await lambda.getFunctionConfiguration({
      FunctionName: functionName,
    });
    if (!functionConfiguration) {
      throw new Error(`Cannot find Lambda Function with name "${functionName}"`);
    }
    const environmentVariables = functionConfiguration?.Environment?.Variables ?? {};
    return [functionLogicalId, environmentVariables];
  }

  const environmentEntries = await Promise.all(functionLogicalIds.map(getEnvironmentVariables));
  const environment: Environment = Object.fromEntries(environmentEntries);
  return environment;
}
