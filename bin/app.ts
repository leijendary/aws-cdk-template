import { App, StackProps } from "aws-cdk-lib";
import "dotenv/config";
import "source-map-support/register";
import env from "../env";
import { AlarmStack } from "../lib/alarm.stack";
import { ApiStack } from "../lib/api.stack";
import { BillingStack } from "../lib/billing.stack";
import { BucketStack } from "../lib/bucket.stack";
import { CertificateStack } from "../lib/certificate.stack";
import { CloudFrontStack } from "../lib/cloudfront.stack";
import { CodeBuildStack } from "../lib/code-build.stack";
import { DatabaseStack } from "../lib/database.stack";
import { NetworkStack } from "../lib/network.stack";
import { OrganizationStack } from "../lib/organization.stack";
import { RepositoryStack } from "../lib/repository.stack";

const { account, region } = env;
const app = new App();
const props: StackProps = {
  env: {
    account,
    region,
  },
  crossRegionReferences: true,
};

// Billing and Cost
new BillingStack(app, props);

// Organizations
new OrganizationStack(app, props);

// CodeBuild
new CodeBuildStack(app, props);

// Repositories
new RepositoryStack(app, props);

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
