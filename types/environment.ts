export const environments = <const>["dev", "test", "sandbox", "prod"];

export type EnvironmentKey = (typeof environments)[number];

export type EnvironmentConfig = {
  [key in EnvironmentKey]: EnvironmentProps;
};

export type EnvironmentProps = {
  domainName: string;
  cidrBlock: string;
};
