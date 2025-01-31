import env from "@/env";
import { AlarmStack } from "@/lib/alarm.stack";
import { ApiStack } from "@/lib/api.stack";
import { BillingStack } from "@/lib/billing.stack";
import { BucketStack } from "@/lib/bucket.stack";
import { CertificateStack } from "@/lib/certificate.stack";
import { CloudFrontStack } from "@/lib/cloudfront.stack";
import { DatabaseStack } from "@/lib/database.stack";
import { NetworkStack } from "@/lib/network.stack";
import { OrganizationStack } from "@/lib/organization.stack";
import { RepositoryStack } from "@/lib/repository.stack";
import { App, StackProps } from "aws-cdk-lib";
import "dotenv/config";
import "source-map-support/register";

const { account, region, environment } = env;
const app = new App();
const props: StackProps = {
  env: {
    account,
    region,
  },
  crossRegionReferences: true,
};
const deploymentRole = `arn:aws:iam::${account}:role/DeploymentRole-${environment}`;

// Billing and Cost
new BillingStack(app);

// Organizations
const { units } = new OrganizationStack(app);

// Docker repositories
new RepositoryStack(app, {
  organizationalUnit: units.infrastructure,
  deploymentRole,
});

// Network
const { vpc, hostedZone, certificate: domainCertificate } = new NetworkStack(app, props);

// Certificate
const { certificate: regionalCertificate } = new CertificateStack(app, {
  hostedZone,
  ...props,
  env: {
    ...props.env,
    // This has to be deployed here to be used by CloudFront.
    region: "us-east-1",
  },
});

// Alarm
new AlarmStack(app, props);

// Bucket
const { bucket } = new BucketStack(app, props);

// API
const { loadBalancer, securityGroup } = new ApiStack(app, {
  vpc,
  certificate: domainCertificate,
  ...props,
});

// CloudFront
new CloudFrontStack(app, {
  bucket,
  certificate: regionalCertificate,
  hostedZone,
  loadBalancer,
  ...props,
});

// Database
new DatabaseStack(app, {
  vpc,
  securityGroup,
  ...props,
});

app.synth();
