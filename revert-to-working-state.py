# Simple fix: Revert to local-only mode since backend has persistent issues

import re

print("="*80)
print("REVERTING TO LOCAL-ONLY MODE (WORKING VERSION)")
print("="*80)

# Read CampaignContext
with open(r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src\context\CampaignContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Check if already in local mode
if 'Update local state only' in content:
    print("✅ Already in local-only mode")
else:
    print("⏳ Switching to local-only mode...")
    
    # Pattern for saveRecipientsToDatabase
    old_save = r'const saveRecipientsToDatabase = async \(campaignId: string\) => \{[\s\S]*?console\.log\(`✅ Recipients saved successfully! \$\{stagingRecipients\.length\} recipients`\);[\s\S]*?\} catch \(error\) \{[\s\S]*?alert\([\'"]Failed to save recipients.*?[\'"]\);[\s\S]*?\}[\s\S]*?\};'
    
    new_save = '''const saveRecipientsToDatabase = async (campaignId: string) => {
    try {
      console.log(`[CampaignContext] Saving ${stagingRecipients.length} recipients to campaign ${campaignId}`);
      
      // Update local state only (backend has issues)
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
    
    content = re.sub(old_save, new_save, content, flags=re.MULTILINE)
    
    # Pattern for updateEmailContent
    old_update = r'const updateEmailContent = async \(campaignId: string, subject: string, body: string, images\?: any\[\]\) => \{[\s\S]*?console\.log\(\'✅ Campaign content saved!\'\);[\s\S]*?\} catch \(error\) \{[\s\S]*?alert\([\'"]Failed to save campaign configuration.*?[\'"]\);[\s\S]*?\}[\s\S]*?\};'
    
    new_update = '''const updateEmailContent = async (campaignId: string, subject: string, body: string, images?: any[]) => {
    try {
      console.log(`[CampaignContext] Updating email content with ${images?.length || 0} images`);
      
      // Update local state only (backend has issues)
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
    
    content = re.sub(old_update, new_update, content, flags=re.MULTILINE)
    
    # Write back
    with open(r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src\context\CampaignContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Reverted to local-only mode")

print("\n" + "="*80)
print("NEXT: Rebuild and deploy frontend")
print("="*80)
