# AWS CDK Template for Microservices

- This template is intended for the microservice architecture
- **Intended for personal use only**

## IAM User:

When creating an IAM user that has access to the CDK for deploying (like GitHub actions), create the following policy:

Name: `cdk-deployment-$ENV`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["sts:AssumeRole"],
      "Resource": ["arn:aws:iam::*:role/cdk-*"]
    }
  ]
}
```

## Deploying:

`ENVIRONMENT=$ENV ORGANIZATION=$ORG cdk --profile $YOUR_PROFILE_NAME deploy InfraStack-$ENV (or --all)`

Where `$ENV` can be any of the following:

1. `dev`
2. `test`
3. `staging`
4. `prod`

And `$ORG` is your organization/company name in all lower case. This is also going to be your domain name followed by ".com".

Example:

`ENVIRONMENT=dev ORGANIZATION=leijendary cdk --profile leijendary-dev deploy --all`

## Secrets:

Secrets should be created manually using a different way (like the AWS console) other than the CDK.

The reason behind this is when updating the secret itself using the CDK, all values of the secret are deleted.

Below are the most commonly used secrets.

### Aurora secret

Credentials for the AWS RDS Aurora database.

Name: `$NAME-aurora-$ENV`. Where `$NAME` is the name of the user of the database cluster.

```json
{
  "username": "",
  "password": ""
}
```

### Data Storage secret

Credentials for non-AWS created data storage.

Name: `data-storage-$ENV`.

```json
{
  "elasticsearch.username": "",
  "elasticsearch.password": "",
  "kafka.username": "",
  "kafka.password": "",
  "redis.username": "",
  "redis.password": "",
  // Non-AWS postgres database.
  "postgres.username": "",
  "postgres.password": ""
}
```

### Integration secret

Credentials for third party integrations.

Name: `integration-$ENV`.

```json
{
  "apple.clientId": "",
  "google.clientId": ""
}
```

### Security secret

Security related credentials like crypto, encryption, etc.

Name: `security-$ENV`.

```json
{
  "accessToken.privateKey": "",
  "accessToken.publicKey": "",
  "refreshToken.privateKey": "",
  "refreshToken.publicKey": "",
  "encrypt.key": "",
  "encrypt.salt": ""
}
```
