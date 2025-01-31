import { EnvironmentConfig, EnvironmentKey, environments } from "@/types/environment";

const account = process.env.CDK_DEFAULT_ACCOUNT!!;
const region = process.env.CDK_DEFAULT_REGION!!;
const environment = process.env.ENVIRONMENT as EnvironmentKey;
const organization = process.env.ORGANIZATION;
const subscriber = process.env.SUBSCRIBER;
const sharedAccountEmail = process.env.SHARED_ACCOUNT_EMAIL;

if (!environment) {
  throw new Error("Environment is not set. Make sure the environment variable 'ENVIRONMENT' is set.");
}

if (!environments.includes(environment)) {
  throw new Error(`Environment has an invalid value of ${environment}. Valid values are ${environments}.`);
}

if (!organization) {
  throw new Error("Organization is not set. Make sure the environment variable 'ORGANIZATION' is set.");
}

if (!subscriber) {
  throw new Error("Subscriber is not set. Make sure the environment variable 'SUBSCRIBER' is set.");
}

if (!sharedAccountEmail) {
  throw new Error("Shared account email is not set. Make sure the environment variable 'SHARED_ACCOUNT_EMAIL' is set.");
}

const domainName = `${organization}.com`;

export const config: EnvironmentConfig = {
  dev: {
    domainName: `${environment}.${domainName}`,
    cidrBlock: "10.0.0.0/16",
  },
  test: {
    domainName: `${environment}.${domainName}`,
    cidrBlock: "10.1.0.0/16",
  },
  sandbox: {
    domainName: `${environment}.${domainName}`,
    cidrBlock: "10.2.0.0/16",
  },
  prod: {
    domainName,
    cidrBlock: "10.3.0.0/16",
  },
};

export const isProd = environment === "prod";

export default {
  account,
  region,
  environment,
  organization,
  config: config[environment],
  subscriber,
  sharedAccountEmail,
  slack: {
    token: process.env.SLACK_TOKEN!!,
    channel: process.env.SLACK_CHANNEL!!,
  },
};
