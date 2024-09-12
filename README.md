# Welcome to your CDK EKS Stackrox TypeScript project

The purpose of this project is to create an EKS cluster with the Stackrox Kubernetes Security Platform 
installed to provide security and compliance for the Kubernetes clusters by creating a CDK stack.


## Prerequisites

- AWS CLI
- AWS CDK
- kubectl
- eksctl
- helm

## Installation
 
## Step 1: Install the AWS CDK

```bash
cdk init app --language typescript
```

## Step 2: Install the AWS CDK EKS module

```bash     
npm install @aws-cdk/aws-eks
```

#Step 3: Create EKS Cluster in the CDK stack.

```bash  
npm install @aws-cdk/aws-eks
```   

#Step 4: Install the Stackrox Kubernetes Security Platform

```bash                 
helm repo add stackrox https://charts.stackrox.io
helm install stackrox stackrox/central
```

```bash
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class EksStackroxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC for the EKS Cluster
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 3,
      natGateways: 1
    });

    // EKS Cluster
    const cluster = new eks.Cluster(this, 'EksCluster', {
      vpc: vpc,
      defaultCapacity: 2,
      version: eks.KubernetesVersion.V1_24,
      defaultCapacityInstance: new ec2.InstanceType('t3.medium'),
    });

    // Enable NodeGroup with Node.js 18 runtime
    const nodegroup = cluster.addNodegroupCapacity('NodeGroup', {
      instanceTypes: [new ec2.InstanceType('t3.medium')],
      desiredSize: 2,
      nodeRole: new iam.Role(this, 'NodeGroupRole', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        ]
      }),
      labels: { 'node-role.kubernetes.io/worker': 'true' }
    });

    // Example of deploying a Node.js 18 application
    cluster.addHelmChart('NodejsApp', {
      chart: 'my-nodejs-app-chart',
      repository: 'https://charts.example.com',
      values: {
        node: {
          version: '18'
        }
      }
    });

    // Install StackRox Central services (assume Helm Chart available)
    cluster.addHelmChart('StackRoxCentral', {
      chart: 'stackrox-central-services',
      repository: 'https://charts.stackrox.io',
      values: {
        central: {
          install: {
            imageTag: 'latest'
          }
        }
      }
    });

    // Install StackRox Sensor
    cluster.addHelmChart('StackRoxSensor', {
      chart: 'stackrox-sensor',
      repository: 'https://charts.stackrox.io',
      values: {
        sensor: {
          install: {
            imageTag: 'latest'
          }
        }
      }
    });

  }
}

```

## Step 5: Post-Deployment Steps

After deployment, you'll want to configure your EKS cluster with the necessary permissions and integrations. The specific steps will depend on your environment and security requirements, but in general, you'll:
- 1. Set up kubectl to interact with your cluster.
- 2. Configure StackRox security by following the StackRox documentation for integrating with AWS EKS.

## Additional Considerations

- 1. Security: Ensure you set up IAM roles and policies correctly to limit permissions.
- 2. Monitoring and Logging: Consider adding AWS CloudWatch integration for monitoring and logging.
- 3. Backup and Recovery: Implement backup and recovery strategies for your EKS cluster.


## Errors

Deployment failed: Error: The stack named EksStackroxStack failed creation, it may need to be manually deleted from the AWS console: ROLLBACK_COMPLETE: Received response status [FAILED] from custom resource. Message returned: Error: b'Release "eksstackroxstackeksclusterchartstackroxchart4963aacf" does not exist. Installing it now.\nError: chart "rhacs-central" not found in https://mirror.openshift.com/pub/rhacs/charts repository\n'

 