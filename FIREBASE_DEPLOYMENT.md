# Firebase Deployment Guide

This guide will help you deploy the Student-Teacher Booking Appointment system with Firebase integration.

## Prerequisites

1. Node.js (version 14 or higher)
2. Firebase CLI (`npm install -g firebase-tools`)
3. A Firebase project (created in Firebase Console)

## Step 1: Firebase Project Setup

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your existing project: `student-teacher-booking-a-a0d22`**

## Step 2: Enable Required Services

### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

### Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location closest to your users
5. Click **Done**

### Firestore Security Rules
Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Appointments
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null && (
        resource.data.studentId == request.auth.uid ||
        resource.data.teacherId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow create: if request.auth != null && request.auth.uid == request.resource.data.studentId;
    }
    
    // Messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null && (
        resource.data.senderId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Logs (admin only)
    match /logs/{logId} {
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
    }
  }
}
```

## Step 3: Initialize Firebase in Your Project

1. **Open terminal in your project directory**

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase:**
   ```bash
   firebase init
   ```

4. **Select the following features:**
   - Firestore
   - Hosting
   - Storage (optional)

5. **Configure each feature:**
   - **Firestore:** Use default `firestore.rules` and `firestore.indexes.json`
   - **Hosting:** Set public directory to current directory (.)
   - **Choose your existing project:** `student-teacher-booking-a-a0d22`

## Step 4: Update Configuration Files

Your Firebase configuration is already set up in `js/firebase-config.js` with your project credentials.

## Step 5: Create Demo Users (Optional)

To create demo users in Firebase Authentication:

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Create these demo accounts:
   - **Admin:** `admin@stu.edu` / `admin123`
   - **Teacher:** `teacher@stu.edu` / `teacher123`
   - **Student:** `student@stu.edu` / `student123`

Or use the app's registration feature and manually approve users in Firestore.

## Step 6: Update Script References

Make sure your `index.html` file uses the Firebase modules:

```html
<script src="js/firebase-config.js" type="module"></script>
<script src="js/auth-firebase.js" type="module"></script>
<script src="js/appointments-firebase.js" type="module"></script>
<script src="js/messaging-firebase.js" type="module"></script>
<script src="js/logger-firebase.js" type="module"></script>
<script src="js/main-firebase.js" type="module"></script>
```

## Step 7: Deploy to Firebase Hosting

1. **Build and deploy:**
   ```bash
   firebase deploy
   ```

2. **Your app will be available at:**
   ```
   https://student-teacher-booking-a-a0d22.web.app
   ```

## Step 8: Testing

1. **Open your deployed app**
2. **Test with demo credentials:**
   - Admin: `admin@stu.edu` / `admin123`
   - Teacher: `teacher@stu.edu` / `teacher123`
   - Student: `student@stu.edu` / `student123`

3. **Test all features:**
   - Registration
   - Login/Logout
   - Appointment booking
   - Appointment approval/rejection
   - Messaging system
   - Admin functions

## Environment Variants

### Development
- Use Firebase Emulators for local development:
  ```bash
  firebase emulators:start
  ```

### Production
- Use the deployed Firebase services
- Enable Firebase Analytics (optional)
- Set up proper monitoring and alerts

## Security Considerations

1. **Review Firestore rules** before going live
2. **Enable App Check** for production
3. **Set up proper user approval workflow**
4. **Monitor usage and costs**
5. **Set up backup strategies**

## Monitoring and Analytics

1. **Enable Firebase Analytics:**
   - Go to Analytics in Firebase Console
   - Follow setup instructions

2. **Monitor Performance:**
   - Go to Performance Monitoring
   - Add performance monitoring SDK if needed

3. **Track Crashes:**
   - Enable Crashlytics
   - Monitor error reports

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Make sure you're serving files over HTTP/HTTPS
   - Use `python -m http.server 8000` for local testing

2. **Permission Denied:**
   - Check Firestore security rules
   - Verify user authentication

3. **Module Import Errors:**
   - Ensure all script tags have `type="module"`
   - Check file paths are correct

4. **Firebase Not Initialized:**
   - Verify Firebase configuration
   - Check console for initialization errors

### Debug Steps

1. **Check browser console** for errors
2. **Verify Firebase project settings**
3. **Test with simplified Firestore rules** (allow all for testing)
4. **Check network tab** for failed requests

## Backup and Recovery

1. **Export Firestore data:**
   ```bash
   gcloud firestore export gs://[BUCKET_NAME]
   ```

2. **Regular backups:**
   - Set up automated Cloud Functions for backup
   - Export user data regularly

3. **Version control:**
   - Keep all configuration in Git
   - Tag releases for easy rollback

## Performance Optimization

1. **Use Firestore indexes** for complex queries
2. **Implement pagination** for large datasets
3. **Use Firebase Storage** for file uploads
4. **Enable compression** in hosting
5. **Implement caching strategies**

## Support and Maintenance

1. **Monitor Firebase quotas and billing**
2. **Regular security audits**
3. **Keep Firebase SDK updated**
4. **Monitor user feedback and error reports**
5. **Plan for scaling as user base grows**

---

**Note:** This Firebase-integrated version provides real-time data synchronization, user authentication, and cloud storage. The demo mode still works for presentation purposes, but all data is now properly stored in Firebase services.
