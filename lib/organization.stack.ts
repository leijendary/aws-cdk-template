import { ProdOrganizationalUnit } from "@/construct/organizational-unit.construct";
import { Stack } from "aws-cdk-lib";
import { CfnOrganization, CfnOrganizationalUnit } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";

export const organizationalUnits = {
  security: "Security",
  infrastructure: "Infrastructure",
  workloads: "Workloads",
  deployments: "Deployments",
  sandbox: "Sandbox",
  suspended: "Suspended",
  policyStaging: "Policy Staging",
};

type OrganizationStackUnits = {
  [key in keyof typeof organizationalUnits]: CfnOrganizationalUnit;
};

/**
 * Reference: https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/recommended-ous-and-accounts.html
 */
export class OrganizationStack extends Stack {
  organization: CfnOrganization;
  units: OrganizationStackUnits;

  constructor(scope: Construct) {
    super(scope, "Organization");

    // Enable organizations in the current account
    this.enable();

    // Security related services, resources, and access points. Should be managed by the security team.
    this.units.security = this.createProdUnit(organizationalUnits.security);
    // Shared cloud infrastructure services like networking, repositories, and IT services.
    this.units.infrastructure = this.createProdUnit(organizationalUnits.infrastructure);
    // AWS accounts for software lifecycle. Account should be mapped to services, rather than teams.
    this.units.workloads = this.createProdUnit(organizationalUnits.workloads);
    // Use isolated AWS accounts for CI/CD. Accounts under this OU should match the Workloads OU.
    this.units.deployments = this.createProdUnit(organizationalUnits.deployments);
    // Individual technologies that requires access. For learning and innovation. Should be detached from
    // the internal network.
    this.units.sandbox = this.createUnit(organizationalUnits.sandbox);
    // To organize suspended accounts.
    this.units.suspended = this.createUnit(organizationalUnits.suspended);

    this.units.policyStaging = this.policyStaging();
  }

  private enable() {
    this.organization = new CfnOrganization(this, "Organization");
  }

  private createProdUnit(name: string) {
    const id = name.replace(/[^\p{L}]/gu, "");

    return new ProdOrganizationalUnit(this, `${id}OrganizationalUnit`, {
      name,
      parentId: this.organization.attrId,
    });
  }

  private createUnit(name: string, parentId: string = this.organization.attrId) {
    const id = name.replace(/[^\p{L}]/gu, "");

    return new CfnOrganizationalUnit(this, `${id}OrganizationalUnit`, {
      name,
      parentId,
    });
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

    return new CfnOrganizationalUnit(this, `PolicyStaging${id}OrganizationalUnit`, {
      name,
      parentId,
    });
  }
}
