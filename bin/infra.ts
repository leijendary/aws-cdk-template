import { App, StackProps } from "aws-cdk-lib";
import "source-map-support/register";
import env from "../env";
import { ApiStack } from "../lib/api.stack";
import { CertificateStack } from "../lib/certificate.stack";
import { CloudFrontStack } from "../lib/cloudfront.stack";
import { DatabaseStack } from "../lib/database.stack";
import { NetworkStack } from "../lib/network.stack";
import { RepositoryStack } from "../lib/repository.stack";
import { BucketStack } from "./../lib/bucket.stack";

const account = env.account;
const region = env.region;
const app = new App();
const props: StackProps = {
  env: {
    account,
    region,
  },
  crossRegionReferences: true,
};

// Network
const { vpc, hostedZone, certificate: domainCertificate } = new NetworkStack(app, props);

// Bucket
const { bucket } = new BucketStack(app, props);

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

// Docker repository
new RepositoryStack(app, props);

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
