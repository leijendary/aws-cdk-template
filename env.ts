import { EnvironmentConfig } from "./types/environment";

const environment = process.env.ENVIRONMENT!!;
const organization = process.env.ORGANIZATION!!;

if (!environment) {
  throw new Error("Environment not set. Make sure the environment variable 'ENVIRONMENT' is set.");
}

if (!organization) {
  throw new Error("Organization not set. Make sure the environment variable 'ORGANIZATION' is set.");
}

const domainName = `${organization}.com`;
const environmentConfig: EnvironmentConfig = {
  dev: {
    domainName: `${environment}.${domainName}`,
    cidrBlock: "10.0.0.0/16",
  },
  test: {
    domainName: `${environment}.${domainName}`,
    cidrBlock: "10.1.0.0/16",
  },
  staging: {
    domainName: `${environment}.${domainName}`,
    cidrBlock: "10.2.0.0/16",
  },
  prod: {
    domainName,
    cidrBlock: "10.3.0.0/16",
  },
};

export const isProd = () => environment === "prod";

export default {
  account: process.env.CDK_DEFAULT_ACCOUNT!!,
  region: process.env.CDK_DEFAULT_REGION!!,
  environment,
  organization,
  config: environmentConfig[environment],
};
