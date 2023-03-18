export type ConfigMap = {
  [key: string]: EnvironmentProps;
};

export type EnvironmentProps = {
  domainName: string;
  cidrBlock: string;
};
