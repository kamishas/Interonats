# 🔧 Local Development Guide

## Quick Start

### 1. Start the Local Server

```powershell
python local-server.py
```

Then open your browser to: **http://localhost:3000**

### 2. Make Changes

#### Frontend Changes
- Edit files in `./frontend/` (if you have React source code)
- Or edit the compiled bundles directly (not recommended)
- Refresh browser to see changes

#### Backend Changes (Lambda Functions)
- Edit Python files in `./lambda-functions/`
- Test locally using `python test-lambda-local.py`
- Deploy to AWS using `.\deploy.ps1 -Command deploy-lambda -LambdaFunction <name>`

## Development Workflow

### Adding a New Feature

1. **Plan the Feature**
   - Decide if it's frontend, backend, or both
   - Sketch out the UI/UX changes
   - Plan the API changes

2. **Develop Locally**
   ```powershell
   # Start local server
   python local-server.py
   
   # In another terminal, watch for changes
   # (if you have React source code)
   npm run dev
   ```

3. **Test Lambda Functions**
   ```powershell
   # Test before deploying
   python test-lambda-local.py
   ```

4. **Deploy to AWS**
   ```powershell
   # Deploy Lambda function
   .\deploy.ps1 -Command deploy-lambda -LambdaFunction GenerateEmailLambda
   
   # Deploy frontend (if you have source code)
   npm run build
   .\deploy.ps1 -Command deploy-frontend
   ```

## Common Tasks

### Testing the Application

```powershell
# 1. Start local server
python local-server.py

# 2. Open browser
start http://localhost:3000

# 3. Test features:
# - Create a campaign
# - Import contacts
# - Generate AI emails
# - Send campaign
```

### Debugging Lambda Functions

```powershell
# Run the test script
python test-lambda-local.py

# Or test a specific function directly
cd lambda-functions/GenerateEmailLambda
python generate_email.py
```

### Updating Environment Variables

Lambda environment variables are stored in AWS. To update them:

```powershell
aws lambda update-function-configuration \
  --function-name SendCampaignLambda \
  --environment Variables="{ZOHO_CLIENT_ID=new_value}" \
  --region us-east-2
```

## Project Structure

```
Emails Agent/
├── local-server.py          # 🌐 Local development server
├── test-lambda-local.py     # 🧪 Lambda testing script
├── deploy.ps1               # 🚀 Deployment helper
│
├── frontend/                # 🎨 Frontend (compiled)
│   ├── index.html
│   └── assets/
│
└── lambda-functions/        # ⚡ Backend
    ├── GenerateEmailLambda/
    ├── ConfigureCampaignLambda/
    ├── ListCampaignsLambda/
    └── SendCampaignLambda/
```

## Troubleshooting

### Port 3000 Already in Use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
# Edit local-server.py and change PORT = 3000 to PORT = 3001
```

### CORS Errors

The local server has CORS enabled. If you still see CORS errors:
- Check that the Lambda functions have CORS headers
- Verify the API Gateway has CORS configured
- Try disabling browser security (for testing only)

### Lambda Functions Not Working Locally

Some Lambda functions require AWS credentials:
- Set up AWS CLI: `aws configure`
- Or use environment variables:
  ```powershell
  $env:AWS_ACCESS_KEY_ID="your-key"
  $env:AWS_SECRET_ACCESS_KEY="your-secret"
  $env:AWS_DEFAULT_REGION="us-east-2"
  ```

## Next Steps

1. **Get React Source Code** (if available)
   - Look for `src/` directory
   - Check for `package.json` and `vite.config.js`
   - If found, run `npm install` and `npm run dev`

2. **Set Up Git**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

3. **Create Development Branch**
   ```powershell
   git checkout -b feature/new-feature
   # Make changes
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

## Tips

- 💡 **Always test locally** before deploying to AWS
- 💡 **Use version control** (Git) for all changes
- 💡 **Keep AWS credentials secure** - never commit them
- 💡 **Test Lambda functions** with the test script before deploying
- 💡 **Document your changes** in commit messages

---

**Happy Coding! 🚀**
