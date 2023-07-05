const environment = process.env.ENVIRONMENT!!;
const organization = process.env.ORGANIZATION!!;

export const isProd = () => environment === "prod";

export default {
  account: process.env.CDK_DEFAULT_ACCOUNT!!,
  region: process.env.CDK_DEFAULT_REGION!!,
  environment,
  organization,
  domainName: `${organization}.com`,
};
