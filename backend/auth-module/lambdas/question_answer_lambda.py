import random
import boto3
import os
import logging
import json

dynamodb = boto3.client('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
logger = logging.getLogger()
logger.setLevel(logging.INFO)

lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    logger.info("=== Event Received ===")
    logger.info(json.dumps(event))

    trigger = event.get("triggerSource")
    session = event.get('request', {}).get('session', [])
    user_id = event['userName']  # Cognito username = email
    logger.info(f"Trigger: {trigger}, UserId: {user_id}")
    logger.info(f"Session: {json.dumps(session)}")

    # PHASE 1: DefineAuthChallenge
    if trigger == "DefineAuthChallenge_Authentication":
        success = len(session) == 2 and all(ch.get("challengeResult") for ch in session)

        event['response'] = {
            'challengeName': 'CUSTOM_CHALLENGE',
            'issueTokens': success,
            'failAuthentication': False
        }

        if success:
            # Final step passed — trigger login notification lambda
            try:
                lambda_client.invoke(
                    FunctionName='DALScooterLoginNotificationLambda',
                    InvocationType='Event',
                    Payload=json.dumps({
                        "email": user_id
                    })
                )
                logger.info(f"Login notification triggered for {user_id}")
            except Exception as notify_err:
                logger.error("Login notification trigger failed", exc_info=True)

        return event

    # PHASE 2: CreateAuthChallenge
    elif trigger == "CreateAuthChallenge_Authentication":
        if len(session) == 0:
            # First challenge — Q&A from DynamoDB
            try:
                response = dynamodb.get_item(
                    TableName=table_name,
                    Key={'userId': {'S': str(user_id)}}
                )
                item = response.get('Item', {})
                question = item['securityQuestion']['S']
                answer = item['securityAnswer']['S']
                event['response'] = {
                    'publicChallengeParameters': {'question': question},
                    'privateChallengeParameters': {'answer': answer},
                    'challengeMetadata': 'QNA_CHALLENGE'
                }
            except Exception as e:
                logger.error("DynamoDB Q&A fetch failed", exc_info=True)
                raise e

        elif len(session) == 1:
            # Second challenge — Caesar cipher
            plain = random.choice(["delta", "train", "mouse"])
            shift = 3
            cipher = ''.join([chr((ord(c) - 97 + shift) % 26 + 97) for c in plain])
            event['response'] = {
                'publicChallengeParameters': {'cipherText': cipher},
                'privateChallengeParameters': {'answer': plain},
                'challengeMetadata': 'CIPHER_CHALLENGE'
            }

        return event

    # PHASE 3: VerifyAuthChallengeResponse
    elif trigger == "VerifyAuthChallengeResponse_Authentication":
        expected = event['request']['privateChallengeParameters']['answer'].strip().lower()
        user_response = event['request']['challengeAnswer'].strip().lower()
        event['response'] = {'answerCorrect': expected == user_response}
        return event

    # Fallback
    logger.warning("Unexpected triggerSource or flow.")
    event['response'] = {
        'issueTokens': False,
        'failAuthentication': True
    }
    return event