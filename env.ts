const environment = process.env.ENVIRONMENT!!;

export const isProd = () => environment === "prod";

export default {
  account: process.env.CDK_DEFAULT_ACCOUNT!!,
  region: process.env.CDK_DEFAULT_REGION!!,
  environment,
};
