import re

def parse_failed_email(msg_content):
    # Strategy 1: Check "X-Failed-Recipients" header
    if "X-Failed-Recipients" in msg_content:
         match = re.search(r"X-Failed-Recipients:\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", str(msg_content))
         if match:
             return match.group(1), "X-Failed-Recipients"

    # Strategy 2: Look for "Final-Recipient" in body (DSN)
    # Final-Recipient: rfc822; d.young@fusion.io
    match = re.search(r"Final-Recipient:\s*rfc822;\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", str(msg_content), re.IGNORECASE)
    if match:
        return match.group(1), "Final-Recipient"

    # Strategy 3: Zoho specific "The following addresses had fatal errors"
    # The following addresses had fatal errors -----
    # [d.young@fusion.io]
    match = re.search(r"The following addresses had fatal errors[- ]*[\r\n]+\[?([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\]?", str(msg_content), re.MULTILINE | re.IGNORECASE)
    if match:
        return match.group(1), "Fatal-Errors-Block"
        
    return None, None

def parse_failure_reason(msg_content):
    # Look for "Diagnostic-Code"
    match = re.search(r"Diagnostic-Code:\s*smtp;\s*(.*)", str(msg_content), re.IGNORECASE)
    if match:
        return match.group(1).strip()
        
    # Look for Status: 4xx or 5xx
    match = re.search(r"Status:\s*([45]\.\d+\.\d+)", str(msg_content), re.IGNORECASE)
    if match:
        return f"Status {match.group(1)}"
        
    return "Unknown Bounce Reason"


# Mock content based on User Screenshots
zoho_delay_content = """
Mail Delivery Status Notification (Delay)
shasank.k

This message was created automatically by mail delivery system.
THIS IS A WARNING MESSAGE ONLY.
YOU DO NOT NEED TO RESEND YOUR MESSAGE.

The original message was received at Tue, 13 Jan 2026 22:44:48 -0800
from shasank.k@interonit.com [shasank.k@interonit.com]

----- The following addresses had fatal errors -----
[d.young@fusion.io]

Message will be retried for 4 more day(s)

Reporting-MTA: dns; mx.zohomail.com
Arrival-Date: Wed, 14 Jan 2026 00:59:42 -0500

Original-Recipient: rfc822; d.young@fusion.io
Final-Recipient: rfc822; d.young@fusion.io
Status: 421
Action: failed
Last-Attempt-Date: 14 Jan 2026 06:44:48 GMT
Diagnostic-Code: Host not reachable.
Remote-MTA: dns; localhost
"""

def test_parser():
    print("Testing Parser on Zoho Delay Screenshot Content...")
    email, strategy = parse_failed_email(zoho_delay_content)
    reason = parse_failure_reason(zoho_delay_content)
    
    print(f"Detected Email: {email}")
    print(f"Strategy Used: {strategy}")
    print(f"Detected Reason: {reason}")
    
    if email == "d.young@fusion.io":
        print("✅ SUCCESS: Email parsed correctly")
    else:
        print("❌ FAILED: Email incorrect")

    if "Host not reachable" in reason:
        print("✅ SUCCESS: Reason parsed correctly")
    else:
        print("❌ FAILED: Reason incorrect")

if __name__ == "__main__":
    test_parser()
