import { CfnOrganizationalUnit, CfnOrganizationalUnitProps } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";

export class ProdOrganizationalUnit extends CfnOrganizationalUnit {
  constructor(scope: Construct, id: string, props: CfnOrganizationalUnitProps) {
    super(scope, id, props);

    // If there is a Prod OU, there should also be a Pre-Prod OU.
    this.createUnit(id, "Pre-Prod");
    this.createUnit(id, "Prod");
  }

  private createUnit(id: string, name: string) {
    const suffix = name.replace(/[^\p{L}]/gu, "");

    new CfnOrganizationalUnit(this, `${id}-${suffix}`, {
      name,
      parentId: this.attrId,
    });
  }
}
