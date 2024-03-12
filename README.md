# AWS CDK Template for Microservices

- This template is intended for the microservice architecture
- **Intended for personal use only**

## .env:

Copy `.env.example` to `.env` and fill up the following details:

1. `ENVIRONMENT`: The environment where to deploy the stacks.
2. `ORGANIZATION`: This is mostly used as the domain name.
3. `SUBSCRIBER`: The email for billing alerts.

## IAM Role:

When creating an IAM role that has access to the CDK for deploying (like GitHub actions), create the following role:

Name: `DeploymentRole-$ENV`.

1. To access ECR repositories, use attach the `AmazonEC2ContainerRegistryPowerUser` permission.
2. Add the following inline policy and name it `AssumeRoleCDK`:

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

`cdk --profile $YOUR_PROFILE_NAME synth --all`
`cdk --profile $YOUR_PROFILE_NAME bootstrap --all`

Then execute the actual deployment:

`cdk --profile $YOUR_PROFILE_NAME deploy --all (or specific like Network-$ENV)`

Where `$ENV` can be any of the following:

1. `dev`
2. `test`
3. `staging`
4. `prod`

Example:

`cdk --profile leijendary-dev deploy --all`

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
3. Copy the contents of `private_key.pem` to the `$ENV/security` :: `cloudFront.privateKey` secret.
4. Copy `public_key.pem` to the `security` folder with the format: `distribution-key.${environment}.pem`

## Secrets:

Secrets should be created manually using a different way (like the AWS console) other than the CDK.

The reason behind this is when updating the secret itself using the CDK, all values of the secret are deleted.

Below are the most commonly used secrets.

### Aurora secret

Credentials for the AWS RDS Aurora database.

Name: `$ENV/aurora/$NAME`. Where `$NAME` is the name of the database cluster without the `$ENV` suffix.

```json
{
  "username": "",
  "password": ""
}
```

### Data Storage secret

Credentials for non-AWS created data storage.

Name: `$ENV/data-storage`.

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

Name: `$ENV/integration`.

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

Name: `$ENV/security`.

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
