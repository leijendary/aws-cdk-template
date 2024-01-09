import { Stack } from "aws-cdk-lib";
import { CfnOrganization, CfnOrganizationalUnit } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";
import { ProdOrganizationalUnit } from "../construct/organizational-unit.construct";

export class OrganizationStack extends Stack {
  organization: CfnOrganization;

  constructor(scope: Construct) {
    super(scope, "OrganizationStack");

    // Enable organizations in the current account
    this.enable();

    // Security related services, resources, and access points. Should be managed by the security team.
    this.createProdUnit("Security");
    // Shared cloud infrastructure services like networking and IT services.
    this.createProdUnit("Infrastructure");
    // AWS accounts for software lifecycle. Account should be mapped to services, rather than teams.
    this.createProdUnit("Workloads");
    // Used isolate AWS accounts for CI/CD. Accounts under this OU should match the Workloads OU.
    this.createProdUnit("Deployments");
    // Individual technologies that requires access. For learning and innovation. Should be detached from
    // the internal network.
    this.createUnit("Sandbox");
    // To organized suspended accounts.
    this.createUnit("Suspended");

    this.policyStaging();
  }

  private enable() {
    this.organization = new CfnOrganization(this, "Organization");
  }

  private createProdUnit(name: string) {
    const id = name.replace(/[^\p{L}]/gu, "");

    new ProdOrganizationalUnit(this, `${id}OrganizationalUnit`, {
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

    this.createPolicyStagingUnit("Security", unit.attrId);
    this.createPolicyStagingUnit("Infrastructure", unit.attrId);
    this.createPolicyStagingUnit("Workloads", unit.attrId);
    this.createPolicyStagingUnit("Deployments", unit.attrId);
  }

  private createPolicyStagingUnit(name: string, parentId: string) {
    const id = name.replace(/[^\p{L}]/gu, "");

    return new CfnOrganizationalUnit(this, `PolicyStaging${id}OrganizationalUnit`, {
      name,
      parentId,
    });
  }
}
