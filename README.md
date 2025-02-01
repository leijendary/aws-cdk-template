# AWS CDK Template for Microservices

- This template is intended for the microservice architecture
- **Intended for personal use only**

## .env:

Copy `.env.example` to `.env` and fill up the following details:

1. `ENVIRONMENT`: The environment where to deploy the stacks.
2. `ORGANIZATION`: This is mostly used as the domain name.
3. `SUBSCRIBER`: The email for billing alerts.
4. `SLACK_TOKEN`: The slack auth token used by the alerts to send a message.
5. `SLACK_CHANNEL`: The slack channel where the alerts should send the message to. This should be the channel identifier.

## IAM Role:

When creating an IAM role that has access to the CDK for deploying (like GitHub actions), create the following role:

1. `BuildRole` on the Deployments OU - under the "Build" account.
2. `DeploymentRole-$ENVIRONMENT` on each Workload accounts.

To access ECR repositories, attach the `AmazonEC2ContainerRegistryPowerUser` permission. Then add the following inline 
policy and name it `AssumeRoleCDK`:

### Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["sts:AssumeRole"],
      "Resource": ["arn:aws:iam::<Account ID>:role/cdk-*"]
    }
  ]
}
```

### Trust:

You have to [configure a role for GitHub OIDC identity provider](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html#idp_oidc_Create_GitHub) first, then attach the policy below:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<Account ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<GitHub organization>/*"
        }
      }
    }
  ]
}
```

## Deploying:

Execute the following commands locally first before committing to git:

```shell
cdk --profile $AWS_PROFILE_NAME synth --all
cdk --profile $AWS_PROFILE_NAME bootstrap --all
```

Then execute the actual deployment:

`cdk --profile $AWS_PROFILE_NAME deploy --all (or specific like Network-$ENVIRONMENT)`

Where `$ENVIRONMENT` can be any of the following:

1. `dev`
2. `test`
3. `sandbox`
4. `prod`

Example:

`cdk --profile $AWS_PROFILE_NAME deploy --all`

### Account-specific Stacks

There are global stacks that should be deployed via local execution with a main account first:

1. `Billing`
2. `Organization`

Then these are the stacks that you should run in your Build account:

1. `CodeBuild`
2. `Repository`

Example:

`cdk --profile $AWS_PROFILE_NAME deploy Billing -e`

## CloudFront Public Keys

Public keys are added to the CloudFront distribution automatically by the file path and environment variable:

```javascript
join(__dirname, `../../security/distribution-key.${environment}.pem`);
```

### Create Public Keys

Refer to [Generate Public Keys](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/field-level-encryption.html).

_**TL;DR:**_

1. Generate Private Key: `openssl genrsa -out private_key.pem 2048`
2. Generate Public Key: `openssl rsa -pubout -in private_key.pem -out public_key.pem`
3. Copy the contents of `private_key.pem` to the `$ENVIRONMENT/security` :: `cloudFront.privateKey` secret.
4. Copy `public_key.pem` to the `security` folder with the format: `distribution-key.${environment}.pem`

## Secrets:

Secrets should be created manually using a different way (like the AWS console) other than the CDK.

The reason behind this is when updating the secret itself using the CDK, all values of the secret are deleted.

Below are the most commonly used secrets.

### Aurora secret

Credentials for the AWS RDS Aurora database.

Name: `$ENVIRONMENT/aurora/$NAME`. Where `$NAME` is the name of the database cluster without the `$ENVIRONMENT` suffix.

```json
{
  "username": "",
  "password": ""
}
```

### Data Storage secret

Credentials for non-AWS created data storage.

Name: `$ENVIRONMENT/data-storage`.

```json
{
  "elasticsearch.username": "",
  "elasticsearch.password": "",
  "kafka.username": "",
  "kafka.password": "",
  "rabbitmq.username": "",
  "rabbitmq.password": "",
  "redis.username": "",
  "redis.password": "",
  // Non-AWS postgres database.
  "postgres.username": "",
  "postgres.password": ""
}
```

### Integration secret

Credentials for third party integrations.

Name: `$ENVIRONMENT/integration`.

```json
{
  "apple.clientId": "",
  "google.clientId": "",
  "sendgrid.apiKey": "",
  "stripe.publishableKey": "",
  "stripe.secretKey": "",
  "stripe.webhook.paymentIntentSecret": "",
  "twilio.accountSid": "",
  "twilio.authToken": ""
}
```

### Security secret

Security related credentials like crypto, encryption, etc.

Name: `$ENVIRONMENT/security`.

```json
{
  "accessToken.privateKey": "",
  "accessToken.publicKey": "",
  "refreshToken.privateKey": "",
  "refreshToken.publicKey": "",
  "encrypt.key": "",
  "encrypt.salt": "",
  "cloudFront.publicKeyId": "",
  "cloudFront.privateKey": ""
}
```

# Branching Strategy

As you may have noticed, GitHub Actions are also included in this template repository. Each company has their own
different git workflow, and this is what I think is the fastest for most teams.

- `main` **deploys to dev**. This is ALWAYS updated. The sole purpose of this is for developer's testing.
- `release/*` **deploys to test**. Whatever is going to be placed here, means that this is a candidate for
  release. Only used by QA testers. This is where you start tagging.
- `tags` **deploys to sandbox AND prod**.
- Branches like `release/*` and `fix/*` should be very small and a PR should be opened to `main`. We still need to do
  code reviews somehow.
- Changes from `main` **may** be cherry-picked to `release/*`.
- `hotfix/*` merges to a `release/*` branch that is created from the latest production tag.
- When the `release/*` branch that contains the changes in `hotfix/*` is tagged and deployed to production, then the
  release branch will be merged back to `main`.