import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')
cognito = boto3.client('cognito-idp')

TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
USER_POOL_ID = os.environ['USER_POOL_ID']

def handler(event, context):
    try:
        logger.info("Received event:")
        logger.info(json.dumps(event))

        # This will actually be userId (sub), not the email
        user_id = event.get("email") or event.get("userEmail")
        if not user_id:
            raise ValueError("Missing userId (Cognito sub) in event payload.")

        # Fetching user's email from Cognito
        logger.info(f"Fetching email for Cognito userId: {user_id}")
        user = cognito.admin_get_user(
            UserPoolId=USER_POOL_ID,
            Username=user_id
        )

        email_attr = next((attr['Value'] for attr in user['UserAttributes'] if attr['Name'] == 'email'), None)
        if not email_attr:
            raise ValueError("Email attribute not found for the user in Cognito.")

        message = f"Hello {email_attr}, your login to DALScooter was successful!"
        subject = "DALScooter Login Notification"

        sns.publish(
            TopicArn=TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Login email sent successfully'})
        }

    except Exception as e:
        logger.error(f"Error sending login email: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }