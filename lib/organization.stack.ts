import { Stack, StackProps } from "aws-cdk-lib";
import { CfnOrganization, CfnOrganizationalUnit, CfnOrganizationalUnitProps } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";
import { ProdOrganizationalUnit } from "../construct/organizational-unit.construct";

export const organizationalUnits = {
  security: "Security",
  infrastructure: "Infrastructure",
  workloads: "Workloads",
  deployments: "Deployments",
  sandbox: "Sandbox",
  suspended: "Suspended",
  policyStaging: "Policy Staging",
};

/**
 * Reference: https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/recommended-ous-and-accounts.html
 */
export class OrganizationStack extends Stack {
  organization: CfnOrganization;

  constructor(scope: Construct, props: StackProps) {
    super(scope, "Organization", props);

    // Enable organizations in the current account
    this.organization = new CfnOrganization(this, "Organization");

    // Security related services, resources, and access points. Should be managed by the security team.
    this.createProdUnit(organizationalUnits.security);
    // Shared cloud infrastructure services like networking and IT services.
    this.createProdUnit(organizationalUnits.infrastructure);
    // AWS accounts for software lifecycle. Account should be mapped to services, rather than teams.
    this.createProdUnit(organizationalUnits.workloads);
    // Use isolated AWS accounts for CI/CD and repositories.
    this.createUnit(organizationalUnits.deployments);
    // Individual technologies that requires access. For learning and innovation. Should be detached from
    // the internal network.
    this.createUnit(organizationalUnits.sandbox);
    // To organize suspended accounts.
    this.createUnit(organizationalUnits.suspended);

    this.policyStaging();
  }

  private createProdUnit(name: string, parentId: string = "r-fywf") {
    const id = name.replace(/[^\p{L}]/gu, "");
    const config: CfnOrganizationalUnitProps = {
      name,
      parentId,
    };

    return new ProdOrganizationalUnit(this, `${id}OrganizationalUnit`, config);
  }

  private createUnit(name: string, parentId: string = "r-fywf") {
    const id = name.replace(/[^\p{L}]/gu, "");
    const config: CfnOrganizationalUnitProps = {
      name,
      parentId,
    };

    return new CfnOrganizationalUnit(this, `${id}OrganizationalUnit`, config);
  }

  /**
   * Non-production OU used to verify results of applying policies before adding them to the real OU.
   * The structure inside this should represent the real OUs to be applied to, without Pre-Prod and Prod.
   */
  private policyStaging() {
    const unit = this.createUnit("Policy Staging");

    this.createPolicyStagingUnit(organizationalUnits.security, unit.attrId);
    this.createPolicyStagingUnit(organizationalUnits.infrastructure, unit.attrId);
    this.createPolicyStagingUnit(organizationalUnits.workloads, unit.attrId);
    this.createPolicyStagingUnit(organizationalUnits.deployments, unit.attrId);

    return unit;
  }

  private createPolicyStagingUnit(name: string, parentId: string) {
    const id = name.replace(/[^\p{L}]/gu, "");
    const config: CfnOrganizationalUnitProps = {
      name,
      parentId,
    };

    return new CfnOrganizationalUnit(this, `PolicyStaging${id}OrganizationalUnit`, config);
  }
}
