export type EnvironmentConfig = {
  [key: string]: EnvironmentProps;
};

export type EnvironmentProps = {
  domainName: string;
  cidrBlock: string;
};
