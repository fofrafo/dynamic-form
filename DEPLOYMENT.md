# 🚀 Netlify Deployment Guide

## 📦 **Quick Deployment Steps**

### 1. **Create Production Build**
```bash
npm run build
```

### 2. **Deploy to Netlify**

#### Option A: **Drag & Drop (Simplest)**
1. Zip the entire project folder
2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag the zip file to deploy

#### Option B: **Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=.
```

#### Option C: **Manual Upload**
1. Go to [netlify.com](https://netlify.com)
2. Sign up/Sign in
3. Click "Add new site" → "Deploy manually"
4. Drag the project folder

## ⚙️ **Environment Variables**

After deployment, set these environment variables in Netlify:

1. Go to **Site Settings** → **Environment Variables**
2. Add the following variables:

### **Required Variables:**
```
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key_here
USE_DEMO_MODE=false
```

### **Optional Variables:**
```
NODE_ENV=production
```

## 🌐 **Your Deployed URLs**

After deployment, you'll have these working URLs:

### **Main App:**
- `https://your-site.netlify.app/` - Main veterinary form

### **API Endpoints:**
- `https://your-site.netlify.app/api/generate-question` - Question generation
- `https://your-site.netlify.app/api/dynamic-form` - Direct form access

### **Dynamic Form Examples:**
```
English:
https://your-site.netlify.app/api/dynamic-form?tierart=Dog&alter=2%20years&name=Buddy&anlass=limping

German:
https://your-site.netlify.app/api/dynamic-form?tierart=Hund&alter=2%20Jahre&name=Max&anlass=Lahmheit
```

## ✅ **Post-Deployment Checklist**

1. **✅ Test Main App:** Visit your Netlify URL
2. **✅ Test API Endpoint:** Try the dynamic form URL
3. **✅ Test Language Detection:** Try both English/German examples
4. **✅ Test OpenAI Integration:** Submit a form to verify AI responses
5. **✅ Check Console:** Ensure no errors in browser console

## 🔧 **Troubleshooting**

### **Build Issues:**
- Ensure Node.js 18+ is used (configured in netlify.toml)
- Check for TypeScript errors: `npm run lint`

### **API Issues:**
- Verify environment variables are set correctly
- Check Function logs in Netlify dashboard

### **OpenAI Issues:**
- Confirm OPENAI_API_KEY is valid
- Check OpenAI API usage/billing

## 🌟 **Features Deployed**

✅ **Multi-language support** (English/German)
✅ **Real-time AI integration** (OpenAI GPT-4o-mini)
✅ **Dynamic form generation**
✅ **Supabase backend integration**
✅ **Mobile-responsive design**
✅ **Direct form links** (bypass initial form)

## 📞 **Support**

If you encounter issues:
1. Check Netlify Function logs
2. Verify environment variables
3. Test API endpoints individually
4. Check browser console for errors

---
**🎉 Your AI-powered veterinary form is now live!** 