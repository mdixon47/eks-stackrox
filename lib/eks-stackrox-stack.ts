import * as cdk from "aws-cdk-lib"
import * as eks from "aws-cdk-lib/aws-eks"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as iam from "aws-cdk-lib/aws-iam"

export class EksStackroxStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Create a new VPC for the EKS Cluster
    const vpc = new ec2.Vpc(this, "EksVpc", {
      maxAzs: 3, // Default is all AZs in the region
    })

    // IAM role for EKS Cluster Admin
    const clusterAdmin = new iam.Role(this, "ClusterAdminRole", {
      assumedBy: new iam.AccountRootPrincipal(),
    })

    // Create the EKS Cluster
    const cluster = new eks.Cluster(this, "EksCluster", {
      vpc: vpc,
      mastersRole: clusterAdmin,
      defaultCapacity: 2, // Default capacity for worker nodes
      version: eks.KubernetesVersion.V1_28,
    })

    // Optionally, enable any EKS add-ons here

    // e.g., cluster.addHelmChart('my-chart', { ... });

    // Now integrate StackRox security
    this.deployStackRox(cluster)
  }

  private deployStackRox(cluster: eks.Cluster) {
    const stackRoxNamespace = "stackrox"

    // Correct Helm repository URL for StackRox
    cluster.addHelmChart("StackRoxChart", {
      repository: "https://mirror.openshift.com/pub/rhacs/charts", // Replace with the correct repository URL
      chart: "rhacs-central", // Update with the correct chart name
      namespace: stackRoxNamespace,
      values: {
        central: {
          deploymentOverrides: {
            affinity: {},
            nodeSelector: {},
            tolerations: [],
          },
          config: {
            central: {
              exposure: {
                type: "NodePort",
              },
            },
          },
        },
      },
    })

    // Additional StackRox components could be installed in a similar way
  }
}
