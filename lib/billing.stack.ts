import env from "@/env";
import { Stack } from "aws-cdk-lib";
import { CfnBudget } from "aws-cdk-lib/aws-budgets";
import { CfnAnomalyMonitor, CfnAnomalySubscription } from "aws-cdk-lib/aws-ce";
import { Construct } from "constructs";

const { subscriber } = env;

export class BillingStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "Billing");

    this.budgets();
    this.anomalyMonitor();
  }

  private budgets() {
    new CfnBudget(this, "BudgetMax1Dollar", {
      budget: {
        budgetName: "$1 Max Budget",
        budgetType: "COST",
        budgetLimit: {
          amount: 1,
          unit: "USD",
        },
        timeUnit: "MONTHLY",
      },
      notificationsWithSubscribers: [
        {
          notification: {
            comparisonOperator: "GREATER_THAN",
            notificationType: "FORECASTED",
            threshold: 80,
          },
          subscribers: [
            {
              address: subscriber,
              subscriptionType: "EMAIL",
            },
          ],
        },
        {
          notification: {
            comparisonOperator: "GREATER_THAN",
            notificationType: "ACTUAL",
            threshold: 99,
          },
          subscribers: [
            {
              address: subscriber,
              subscriptionType: "EMAIL",
            },
          ],
        },
      ],
    });
  }

  private anomalyMonitor() {
    const monitor = new CfnAnomalyMonitor(this, "AwsServicesMonitor", {
      monitorName: "AWS Services",
      monitorType: "DIMENSIONAL",
      monitorDimension: "SERVICE",
    });

    new CfnAnomalySubscription(this, "Daily100PercentThreshold", {
      subscriptionName: "Daily 100% threshold",
      thresholdExpression: JSON.stringify({
        Dimensions: {
          Key: "ANOMALY_TOTAL_IMPACT_PERCENTAGE",
          MatchOptions: ["GREATER_THAN_OR_EQUAL"],
          Values: [100],
        },
      }),
      frequency: "DAILY",
      monitorArnList: [monitor.attrMonitorArn],
      subscribers: [
        {
          address: subscriber,
          type: "EMAIL",
        },
      ],
    });
  }
}
