import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

export class Project302Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const originRequestRedirectFunction = new cloudfront.experimental.EdgeFunction(this, 'OriginRequestRedirectChaser', {
      runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset('lambdas/302Lambda'), // Points to the lambda directory
      handler: 'index.handler', // Points to the 'hello' file in the lambda directory
    });
  }
}
