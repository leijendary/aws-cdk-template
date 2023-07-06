import { App, StackProps } from "aws-cdk-lib";
import "source-map-support/register";
import env from "../env";
import { ApiStack } from "../lib/api.stack";
import { CertificateStack } from "../lib/certificate.stack";
import { CloudFrontStack } from "../lib/cloudfront.stack";
import { DatabaseStack } from "../lib/database.stack";
import { InfraStack } from "../lib/infra.stack";
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
const { vpc, hostedZone, certificate: domainCertificate } = new InfraStack(app, props);
const { bucket } = new BucketStack(app, props);
const { certificate: regionalCertificate } = new CertificateStack(app, {
  hostedZone,
  ...props,
  env: {
    ...props.env,
    // This has to be deployed here to be used by CloudFront.
    region: "us-east-1",
  },
});
new RepositoryStack(app, props);
const { securityGroup } = new ApiStack(app, {
  vpc,
  hostedZone,
  certificate: domainCertificate,
  ...props,
});
new CloudFrontStack(app, {
  bucket,
  certificate: regionalCertificate,
  hostedZone,
  ...props,
});
new DatabaseStack(app, {
  vpc,
  securityGroup,
  ...props,
});

app.synth();
