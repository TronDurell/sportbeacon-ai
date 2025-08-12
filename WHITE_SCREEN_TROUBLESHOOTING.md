# 🚨 White Screen Troubleshooting Guide

## 🔍 **Issue Diagnosis**

If you're seeing a white screen at https://sportbeacon-ai.web.app, follow this systematic troubleshooting guide.

## 📋 **Step-by-Step Debug Process**

### 1. **Check Browser Console (F12)**
```bash
# Open browser dev tools and check for errors:
# - JavaScript errors (red text)
# - Network failures (404, 500 errors)
# - Environment variable issues
```

### 2. **Verify Environment Variables**
The most common cause is missing Firebase configuration. Run:
```powershell
# Windows PowerShell
.\setup-environment.ps1

# Or manually create .env.local with:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDgpV09FF2-Rm5OzWVxsN_lW_qacvYk8EY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sportbeacon-ai.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sportbeacon-ai
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sportbeacon-ai.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=104921686559
NEXT_PUBLIC_FIREBASE_APP_ID=1:104921686559:web:406dad79245c28c4ec6b2a
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-1YH08655TT
```

### 3. **Clean Build and Deploy**
```bash
# Clean previous builds
Remove-Item -Recurse -Force dist

# Install dependencies
npm install

# Build with environment variables
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### 4. **Test Locally First**
```bash
# Build the application
npm run build

# Serve locally to test
npx serve dist

# Open http://localhost:3000
# If it works locally but not on Firebase, the issue is deployment-related
```

## 🔧 **Common Solutions**

### **Solution 1: Environment Variables Missing**
**Symptoms:** Console shows "Firebase config undefined" or similar errors
**Fix:** Create `.env.local` with Firebase configuration

### **Solution 2: Build Output Issues**
**Symptoms:** Assets not loading (404 errors)
**Fix:** 
```bash
# Clean and rebuild
Remove-Item -Recurse -Force dist
npm run build
firebase deploy --only hosting
```

### **Solution 3: Firebase Rules Blocking**
**Symptoms:** Network errors when accessing Firebase services
**Fix:** Check Firestore rules and ensure they allow read access

### **Solution 4: React Router Issues**
**Symptoms:** Page loads but shows blank content
**Fix:** Verify Firebase hosting rewrites are configured correctly

## 📊 **Verification Checklist**

- [ ] `.env.local` file exists with Firebase config
- [ ] `npm run build` completes without errors
- [ ] `dist/index.html` references correct asset paths
- [ ] `firebase.json` has correct hosting configuration
- [ ] Firebase project is properly configured
- [ ] No console errors in browser dev tools

## 🚀 **Quick Fix Commands**

```bash
# Complete reset and redeploy
Remove-Item -Recurse -Force dist
.\setup-environment.ps1
npm install
npm run build
firebase deploy --only hosting
```

## 📞 **If Issues Persist**

1. **Check Firebase Console:** https://console.firebase.google.com/project/sportbeacon-ai/overview
2. **Review Deployment Logs:** Check for any deployment errors
3. **Test with Different Browser:** Rule out browser-specific issues
4. **Check Network Tab:** Look for failed requests to Firebase services

## 🎯 **Expected Result**

After following these steps, https://sportbeacon-ai.web.app should display the SportBeaconAI application instead of a white screen.

---

**Last Updated:** July 15, 2025  
**Status:** Active troubleshooting guide 