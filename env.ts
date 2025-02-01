import { EnvironmentConfig, EnvironmentKey, environments } from "./types/environment";
import { Repository } from "./types/repository";

const account = process.env.CDK_DEFAULT_ACCOUNT!!;
const region = process.env.CDK_DEFAULT_REGION!!;
const environment = process.env.ENVIRONMENT as EnvironmentKey;
const organization = process.env.ORGANIZATION;

if (!environment) {
  throw new Error("Environment is not set. Make sure the environment variable 'ENVIRONMENT' is set.");
}

if (!environments.includes(environment)) {
  throw new Error(`Environment has an invalid value of ${environment}. Valid values are ${environments}.`);
}

if (!organization) {
  throw new Error("Organization is not set. Make sure the environment variable 'ORGANIZATION' is set.");
}

const domainName = `${organization}.com`;
const config: EnvironmentConfig = {
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

const repositories: Repository[] = [
  {
    id: "SpringApiGateway",
    name: "spring-api-gateway-template",
    owner: "leijendary",
  },
  {
    id: "SpringIam",
    name: "spring-iam-template",
    owner: "leijendary",
  },
  {
    id: "SpringNotification",
    name: "spring-notification-template",
    owner: "leijendary",
  },
  {
    id: "Spring",
    name: "spring-template",
    owner: "leijendary",
  },
  {
    id: "SpringWebsocket",
    name: "spring-websocket-template",
    owner: "leijendary",
  },
];

const env = {
  account,
  region,
  organization,
  environment,
  config: config[environment],
  subscriber: process.env.SUBSCRIBER!!,
  slack: {
    token: process.env.SLACK_TOKEN!!,
    channel: process.env.SLACK_CHANNEL!!,
  },
  isProd: environment === "prod",
  repositories,
};

export default env;
