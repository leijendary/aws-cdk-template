# AWS CDK Template for Microservices

- This template is intended for the microservice architecture
- **Intended for personal use only**

## Deploying:

`ENVIRONMENT=$ENV cdk --profile $YOUR_PROFILE_NAME deploy InfraStack-$ENV (or --all)`

Where `$ENV` can be any of the following:
1. `dev`
2. `test`
3. `staging`
4. `prod`

Example:

`ENVIRONMENT=dev cdk --profile leijendary-dev deploy --all`
