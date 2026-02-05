import imaplib

EMAIL_USER = "shasank.k@interonit.com"
APP_PASSWORD = "F6JgJER5n9uc"

def debug_app_pass():
    print(f"Connecting to imap.zoho.com for {EMAIL_USER}...")
    try:
        mail = imaplib.IMAP4_SSL("imap.zoho.com")
        
        # Standard LOGIN for App Password
        mail.login(EMAIL_USER, APP_PASSWORD)
        print("✅ Authenticated via App Password!")
        
        mail.select("INBOX")
        print("✅ Selected INBOX")
        
        status, messages = mail.search(None, '(FROM "mailer-daemon")')
        if status == "OK":
             ids = messages[0].split()
             print(f"Found {len(ids)} bounces.")
        
        mail.logout()
        
    except Exception as e:
        print(f"❌ Login Error: {e}")

if __name__ == "__main__":
    debug_app_pass()
