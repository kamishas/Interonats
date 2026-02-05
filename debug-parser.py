import imaplib
import email
import re
from email.header import decode_header

EMAIL_USER = "shasank.k@interonit.com"
APP_PASSWORD = "F6JgJER5n9uc"

def parse_header(msg, header_name):
    header_val = msg.get(header_name)
    if not header_val: return ""
    decoded_list = decode_header(header_val)
    header_str = ""
    for token, encoding in decoded_list:
        if isinstance(token, bytes):
            header_str += token.decode(encoding or 'utf-8', errors='ignore')
        else:
            header_str += str(token)
    return header_str

def parse_failed_email(msg_content):
    if "X-Failed-Recipients" in msg_content:
         match = re.search(r"X-Failed-Recipients:\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", str(msg_content))
         if match: return match.group(1)

    match = re.search(r"Final-Recipient:\s*rfc822;\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", str(msg_content), re.IGNORECASE)
    if match: return match.group(1)
    return None

def debug_parser():
    print(f"Connecting to IMAP...")
    mail = imaplib.IMAP4_SSL("imap.zoho.com")
    mail.login(EMAIL_USER, APP_PASSWORD)
    mail.select("INBOX")
    
    status, messages = mail.search(None, '(FROM "mailer-daemon")')
    if status == "OK":
         ids = messages[0].split()
         print(f"Found {len(ids)} bounces.")
         # Check last 5
         for num in ids[-5:]:
             res, data = mail.fetch(num, '(RFC822)')
             raw_email = data[0][1]
             msg = email.message_from_bytes(raw_email)
             
             subject = parse_header(msg, "Subject")
             print(f"\nSubject: {subject}")
             
             # Parse Body
             body_content = ""
             if msg.is_multipart():
                 for part in msg.walk():
                     if part.get_content_type() in ["text/plain", "message/delivery-status"]:
                         body_content += str(part.get_payload(decode=True))
             else:
                 body_content = str(msg.get_payload(decode=True))
                 
             failed_email = parse_failed_email(body_content) or parse_failed_email(str(msg))
             print(f" -> Extracted Email: {failed_email}")

    mail.logout()

if __name__ == "__main__":
    debug_parser()
