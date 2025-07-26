import json
import boto3
import os
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ses = boto3.client('ses', region_name='us-east-1')

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract booking details from the event
        booking_data = event.get('booking', {})
        
        if not booking_data:
            logger.error("No booking data found in event")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No booking data provided'})
            }
        
        # Extract booking information
        user_email = booking_data.get('userEmail')
        booking_reference = booking_data.get('bookingReference')
        booking_date = booking_data.get('bookingDate')
        start_time = booking_data.get('startTime')
        end_time = booking_data.get('endTime')
        pickup_location = booking_data.get('pickupLocation')
        vehicle_model = booking_data.get('vehicleModel')
        vehicle_type = booking_data.get('vehicleType')
        total_cost = booking_data.get('totalCost')
        access_code = booking_data.get('accessCode')
        
        if not user_email:
            logger.error("No user email found in booking data")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No user email provided'})
            }
        
        # Create email content
        subject = f"Booking Confirmation - {booking_reference}"
        
        # HTML email template
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #2c3e50; }}
                .booking-details {{ background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; margin: 10px 0; }}
                .label {{ font-weight: bold; color: #2c3e50; }}
                .value {{ color: #34495e; }}
                .highlight {{ background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60; }}
                .footer {{ text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🚲 DALScooter</div>
                    <h2 style="color: #2c3e50;">Booking Confirmation</h2>
                </div>
                
                <div class="highlight">
                    <h3 style="margin: 0; color: #27ae60;">✅ Your booking has been confirmed!</h3>
                    <p style="margin: 10px 0 0 0; color: #27ae60;">Booking Reference: <strong>{booking_reference}</strong></p>
                </div>
                
                <div class="booking-details">
                    <h3 style="margin-top: 0; color: #2c3e50;">Booking Details</h3>
                    
                    <div class="detail-row">
                        <span class="label">Vehicle:</span>
                        <span class="value">{vehicle_model} ({vehicle_type})</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Date:</span>
                        <span class="value">{booking_date}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Time:</span>
                        <span class="value">{start_time} - {end_time}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Pickup Location:</span>
                        <span class="value">{pickup_location}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Total Cost:</span>
                        <span class="value">${total_cost}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Access Code:</span>
                        <span class="value" style="font-weight: bold; color: #e74c3c;">{access_code}</span>
                    </div>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <h4 style="margin: 0; color: #856404;">📋 Important Information</h4>
                    <ul style="margin: 10px 0; color: #856404;">
                        <li>Please arrive at the pickup location 5 minutes before your scheduled time</li>
                        <li>Use the access code to unlock your vehicle</li>
                        <li>Return the vehicle to the same location after your ride</li>
                        <li>For support, contact us through the app or call our helpline</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p>Thank you for choosing DALScooter!</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_body = f"""
        DALScooter - Booking Confirmation
        
        Your booking has been confirmed!
        Booking Reference: {booking_reference}
        
        Booking Details:
        - Vehicle: {vehicle_model} ({vehicle_type})
        - Date: {booking_date}
        - Time: {start_time} - {end_time}
        - Pickup Location: {pickup_location}
        - Total Cost: ${total_cost}
        - Access Code: {access_code}
        
        Important Information:
        - Please arrive at the pickup location 5 minutes before your scheduled time
        - Use the access code to unlock your vehicle
        - Return the vehicle to the same location after your ride
        - For support, contact us through the app or call our helpline
        
        Thank you for choosing DALScooter!
        """
        
        # Send email using SES
        # Note: You need to verify your email address in SES first
        # For testing, you can use a verified email address
        response = ses.send_email(
            Source='your-verified-email@example.com',  # Replace with your verified SES email
            Destination={
                'ToAddresses': [user_email]
            },
            Message={
                'Subject': {
                    'Data': subject,
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': text_body,
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': html_body,
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        
        logger.info(f"Email sent successfully to {user_email}. Message ID: {response['MessageId']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Email notification sent successfully',
                'messageId': response['MessageId']
            })
        }
        
    except Exception as e:
        logger.error(f"Error sending email notification: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to send email notification'})
        } 