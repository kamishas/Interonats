import re

# Read the file
with open(r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src\context\CampaignContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Revert saveRecipientsToDatabase to local-only
old_save_recipients = r'const saveRecipientsToDatabase = async \(campaignId: string\) => \{[\s\S]*?console\.log\(`✅ Recipients saved successfully! \$\{stagingRecipients\.length\} recipients`\);[\s\S]*?\} catch \(error\) \{[\s\S]*?alert\(\'Failed to save recipients to backend\.\'\);[\s\S]*?\}[\s\S]*?\};'

new_save_recipients = '''const saveRecipientsToDatabase = async (campaignId: string) => {
    try {
      console.log(`[CampaignContext] Saving ${stagingRecipients.length} recipients to campaign ${campaignId}`);
      
      // Update local state only (backend integration disabled)
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId) {
          const updatedRecipients = [...c.recipients, ...stagingRecipients];
          console.log(`[CampaignContext] Updated campaign recipients:`, updatedRecipients.length);
          return {
            ...c,
            recipients: updatedRecipients,
            totalRecipients: updatedRecipients.length,
          };
        }
        return c;
      }));

      if (currentCampaign?.id === campaignId) {
        const updatedRecipients = [...currentCampaign.recipients, ...stagingRecipients];
        console.log(`[CampaignContext] Updated currentCampaign recipients:`, updatedRecipients.length);
        setCurrentCampaign({
          ...currentCampaign,
          recipients: updatedRecipients,
          totalRecipients: updatedRecipients.length,
        });
      }

      clearStaging();
      console.log(`✅ Recipients saved successfully! (${stagingRecipients.length} recipients)`);
    } catch (error) {
      console.error('Failed to save recipients:', error);
      alert('Failed to save recipients.');
    }
  };'''

# Pattern 2: Revert updateEmailContent to local-only
old_update_email = r'const updateEmailContent = async \(campaignId: string, subject: string, body: string, images\?: any\[\]\) => \{[\s\S]*?console\.log\(\'✅ Campaign content saved!\'\);[\s\S]*?\} catch \(error\) \{[\s\S]*?alert\(\'Failed to save campaign configuration\.\'\);[\s\S]*?\}[\s\S]*?\};'

new_update_email = '''const updateEmailContent = async (campaignId: string, subject: string, body: string, images?: any[]) => {
    try {
      console.log(`[CampaignContext] Updating email content with ${images?.length || 0} images`);
      
      // Update local state only (backend integration disabled)
      const updates: Partial<Campaign> = { subject, body };
      
      if (images && images.length > 0) {
        updates.images = images.map(img => ({
          id: img.id || Date.now().toString(),
          filename: img.filename,
          url: img.url,
          s3Key: img.s3Key,
          isCompliant: img.isCompliant
        }));
      }
      
      updateCampaign(campaignId, updates);
      console.log('✅ Campaign content saved!');
    } catch (error) {
      console.error('Failed to update email content:', error);
      alert('Failed to save campaign configuration.');
    }
  };'''

# Apply replacements
content = re.sub(old_save_recipients, new_save_recipients, content, flags=re.MULTILINE)
content = re.sub(old_update_email, new_update_email, content, flags=re.MULTILINE)

# Write back
with open(r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src\context\CampaignContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ CampaignContext.tsx reverted to local-only mode")
print("✅ Backend integration disabled")
print("\nYour data will be restored once the frontend is rebuilt and deployed.")
print("\nNext steps:")
print("1. npm run build")
print("2. aws s3 sync build s3://interon-email-agent-frontend-kamin/ --delete")
