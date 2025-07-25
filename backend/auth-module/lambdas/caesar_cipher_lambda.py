# import json
# import random
# import string

# def caesar_encrypt(text, shift):
#     encrypted = ""
#     for char in text:
#         if char.isalpha():
#             ascii_offset = 65 if char.isupper() else 97
#             encrypted += chr((ord(char) + shift - ascii_offset) % 26 + ascii_offset)
#         else:
#             encrypted += char
#     return encrypted

# def handler(event, context):
#     request = event['request']
#     session = request.get('session', [])

#     if event['triggerSource'] == 'DefineAuthChallenge_Authentication':
#         # Define challenge sequence (called after Question-Answer)
#         if len(session) == 1 and session[0]['challengeName'] == 'CUSTOM_CHALLENGE':
#             event['response']['issueTokens'] = False
#             event['response']['failAuthentication'] = False
#             event['response']['challengeName'] = 'CUSTOM_CHALLENGE'
#         else:
#             event['response']['issueTokens'] = True
#             event['response']['failAuthentication'] = False
#         return event

#     elif event['triggerSource'] == 'CreateAuthChallenge_Authentication':
#         # Generate Caesar Cipher challenge
#         if len(session) == 1:
#             random_string = ''.join(random.choices(string.ascii_lowercase, k=5))
#             shift = 3
#             encrypted = caesar_encrypt(random_string, shift)
#             event['response']['publicChallengeParameters'] = {'cipherText': encrypted}
#             event['response']['privateChallengeParameters'] = {'answer': random_string}
#             event['response']['challengeMetadata'] = 'CIPHER_CHALLENGE'
#         return event

#     elif event['triggerSource'] == 'VerifyAuthChallengeResponse_Authentication':
#         # Verify the Caesar Cipher response
#         if session[1]['challengeMetadata'] == 'CIPHER_CHALLENGE':
#             expected_answer = session[1]['challengeResult']['privateChallengeParameters']['answer']
#             provided_answer = request['challengeAnswer']
#             event['response']['answerCorrect'] = expected_answer.lower() == provided_answer.lower()
#         return event

#     return event