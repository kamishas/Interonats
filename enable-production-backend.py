import re

# Read the file
with open(r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src\context\CampaignContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Enable backend for saveRecipientsToDatabase
old_save_recipients = r'const saveRecipientsToDatabase = async \(campaignId: string\) => \{[\s\S]*?console\.log\(`✅ Recipients saved successfully! \$\{stagingRecipients\.length\} recipients`\);[\s\S]*?\} catch \(error\) \{[\s\S]*?alert\([\'"]Failed to save recipients.*?[\'"]\);[\s\S]*?\}[\s\S]*?\};'

new_save_recipients = '''const saveRecipientsToDatabase = async (campaignId: string) => {
    try {
      console.log(`[CampaignContext] Saving ${stagingRecipients.length} recipients to campaign ${campaignId}`);
      
      // Send recipients to backend API
      const response = await apiClient.post(API_ENDPOINTS.RECIPIENTS.ADD(campaignId), 
        stagingRecipients.map(r => ({
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          company: r.company
        }))
      );
      
      console.log('✅ Recipients saved to backend:', response);
      
      // Fetch updated campaign to sync state
      const campaignData = await apiClient.get(API_ENDPOINTS.CAMPAIGNS.GET(campaignId));
      if (campaignData) {
        console.log('✅ Fetched updated campaign:', campaignData);
        updateCampaign(campaignId, {
          recipients: campaignData.recipients || [],
          totalRecipients: campaignData.totalRecipients || 0
        });
      }
      
      clearStaging();
      console.log(`✅ Recipients saved successfully! (${stagingRecipients.length} recipients)`);
    } catch (error) {
      console.error('Failed to save recipients:', error);
      alert('Failed to save recipients to backend.');
    }
  };'''

# Pattern 2: Enable backend for updateEmailContent
old_update_email = r'const updateEmailContent = async \(campaignId: string, subject: string, body: string, images\?: any\[\]\) => \{[\s\S]*?console\.log\(\'✅ Campaign content saved!\'\);[\s\S]*?\} catch \(error\) \{[\s\S]*?alert\([\'"]Failed to save campaign configuration.*?[\'"]\);[\s\S]*?\}[\s\S]*?\};'

new_update_email = '''const updateEmailContent = async (campaignId: string, subject: string, body: string, images?: any[]) => {
    try {
      console.log(`[CampaignContext] Updating email content with ${images?.length || 0} images`);
      
      // Send to backend API
      const response = await apiClient.post(API_ENDPOINTS.CAMPAIGNS.CONFIG(campaignId), {
        subject,
        bodyTemplate: body,
        images: images?.map(img => ({
          id: img.id || Date.now().toString(),
          filename: img.filename,
          s3Key: img.s3Key,
          url: img.url,
          isCompliant: img.isCompliant
        }))
      });
      
      console.log('✅ Campaign configured on backend:', response);
      
      // Update local state
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

print("✅ CampaignContext.tsx updated with backend integration")
print("\nChanges made:")
print("1. saveRecipientsToDatabase → calls ManageRecipientsLambda")
print("2. updateEmailContent → calls ConfigureCampaignLambda")
print("\n✅ Production backend integration enabled!")
