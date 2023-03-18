import { App } from "aws-cdk-lib";
import "source-map-support/register";
import env from "../env";
import { ApiStack } from "../lib/api-stack";
import { DatabaseStack } from "../lib/database-stack";
import { SecretStack } from "../lib/secret-stack";
import { ConfigMap } from "../types/environment";
import { InfraStack } from "./../lib/infra-stack";
import { RepositoryStack } from "./../lib/repository-stack";

const environment = env.environment;
const configMap: ConfigMap = {
  dev: {
    domainName: "dev.leijendary.com",
    cidrBlock: "10.0.0.0/16",
  },
  test: {
    domainName: "test.leijendary.com",
    cidrBlock: "10.1.0.0/16",
  },
  staging: {
    domainName: "staging.leijendary.com",
    cidrBlock: "10.2.0.0/16",
  },
  prod: {
    domainName: "leijendary.com",
    cidrBlock: "10.3.0.0/16",
  },
};
const app = new App();
const config = configMap[environment];
const account = env.account;
const region = env.region;
const props = {
  env: {
    account,
    region,
  },
  ...config,
};
const { appVpc: vpc, hostedZone, certificate } = new InfraStack(app, props);
new RepositoryStack(app, props);
const { apiSecurityGroup } = new ApiStack(app, {
  vpc,
  hostedZone,
  certificate,
  ...props,
});
new DatabaseStack(app, {
  vpc,
  apiSecurityGroup,
  ...props,
});
new SecretStack(app, props);

app.synth();
