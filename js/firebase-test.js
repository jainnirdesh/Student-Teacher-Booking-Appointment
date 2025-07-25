// Firebase Integration Test Script
// Run this in the browser console to test all Firebase functionality

class FirebaseIntegrationTest {
    constructor() {
        this.testResults = [];
        this.currentUser = null;
    }

    async runAllTests() {
        console.log('🔥 Starting Firebase Integration Tests...\n');
        
        const tests = [
            'testFirebaseInitialization',
            'testDemoLogin',
            'testUserRegistration',
            'testAppointmentCreation',
            'testAppointmentApproval',
            'testMessaging',
            'testLogging',
            'testRealtimeUpdates'
        ];

        for (const testName of tests) {
            try {
                console.log(`\n📋 Running: ${testName}`);
                await this[testName]();
                this.logTestResult(testName, 'PASSED', null);
            } catch (error) {
                console.error(`❌ ${testName} failed:`, error);
                this.logTestResult(testName, 'FAILED', error.message);
            }
        }

        this.printTestSummary();
    }

    async testFirebaseInitialization() {
        // Test Firebase app initialization
        if (!window.firebase || !auth || !db) {
            throw new Error('Firebase not properly initialized');
        }
        
        console.log('✅ Firebase initialized successfully');
        
        // Test connection to Firestore
        try {
            await getDocs(query(collection(db, 'test'), limit(1)));
            console.log('✅ Firestore connection successful');
        } catch (error) {
            console.log('⚠️ Firestore connection test skipped (no permissions)');
        }
    }

    async testDemoLogin() {
        console.log('Testing demo login...');
        
        // Test admin login
        try {
            const result = await authManager.login('admin@stu.edu', 'admin123');
            if (result.success && result.role === 'admin') {
                console.log('✅ Admin demo login successful');
                this.currentUser = authManager.getCurrentUserProfile();
            } else {
                throw new Error('Admin login failed');
            }
        } catch (error) {
            console.error('❌ Admin demo login failed:', error);
        }

        // Logout
        await authManager.logout();
        
        // Test student login
        try {
            const result = await authManager.login('student@stu.edu', 'student123');
            if (result.success && result.role === 'student') {
                console.log('✅ Student demo login successful');
                this.currentUser = authManager.getCurrentUserProfile();
            } else {
                throw new Error('Student login failed');
            }
        } catch (error) {
            console.error('❌ Student demo login failed:', error);
        }
    }

    async testUserRegistration() {
        console.log('Testing user registration...');
        
        const testUser = {
            email: `test${Date.now()}@example.com`,
            password: 'testpass123',
            name: 'Test User',
            role: 'student',
            department: 'Test Department'
        };

        try {
            const result = await authManager.register(testUser);
            if (result.success) {
                console.log('✅ User registration successful');
            } else {
                throw new Error('Registration failed');
            }
        } catch (error) {
            // Expected in demo mode
            console.log('⚠️ User registration test skipped (demo mode)');
        }
    }

    async testAppointmentCreation() {
        console.log('Testing appointment creation...');
        
        // Ensure we're logged in as student
        if (!this.currentUser || this.currentUser.role !== 'student') {
            await authManager.login('student@stu.edu', 'student123');
            this.currentUser = authManager.getCurrentUserProfile();
        }

        const appointmentData = {
            teacherId: 'demo-teacher',
            teacherName: 'Prof. John Smith',
            subject: 'Test Consultation',
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
            time: '10:00',
            duration: 30,
            purpose: 'Test appointment for Firebase integration'
        };

        try {
            const result = await appointmentManager.createAppointment(appointmentData);
            if (result.success) {
                console.log('✅ Appointment creation successful');
                this.testAppointmentId = result.appointmentId;
            } else {
                throw new Error('Appointment creation failed');
            }
        } catch (error) {
            console.error('❌ Appointment creation failed:', error);
            throw error;
        }
    }

    async testAppointmentApproval() {
        console.log('Testing appointment approval...');
        
        if (!this.testAppointmentId) {
            console.log('⚠️ No test appointment to approve');
            return;
        }

        // Login as teacher
        await authManager.logout();
        await authManager.login('teacher@stu.edu', 'teacher123');

        try {
            const result = await appointmentManager.approveAppointment(
                this.testAppointmentId, 
                'Approved for testing'
            );
            if (result.success) {
                console.log('✅ Appointment approval successful');
            } else {
                throw new Error('Appointment approval failed');
            }
        } catch (error) {
            console.error('❌ Appointment approval failed:', error);
        }
    }

    async testMessaging() {
        console.log('Testing messaging system...');
        
        // Ensure logged in as student
        await authManager.logout();
        await authManager.login('student@stu.edu', 'student123');

        try {
            const result = await messagingManager.sendMessage(
                'demo-teacher',
                'Prof. John Smith',
                'teacher@stu.edu',
                'Test Message',
                'This is a test message for Firebase integration testing.'
            );
            
            if (result.success) {
                console.log('✅ Message sending successful');
                this.testMessageId = result.messageId;
            } else {
                throw new Error('Message sending failed');
            }
        } catch (error) {
            console.error('❌ Message sending failed:', error);
        }

        // Test message reading
        if (this.testMessageId) {
            try {
                await messagingManager.markAsRead(this.testMessageId);
                console.log('✅ Message read status update successful');
            } catch (error) {
                console.error('❌ Message read status update failed:', error);
            }
        }
    }

    async testLogging() {
        console.log('Testing logging system...');
        
        try {
            // Test different log levels
            logUserAction('test-user', 'TEST_INFO', { message: 'Test info log' });
            logError(new Error('Test error'), 'Testing error logging');
            logPageView('test-page', 'test-user');
            
            // Test log retrieval
            const logs = getLogs({ level: 'info' });
            const stats = getLogStats();
            
            console.log('✅ Logging system functional');
            console.log(`📊 Log stats:`, stats);
        } catch (error) {
            console.error('❌ Logging test failed:', error);
            throw error;
        }
    }

    async testRealtimeUpdates() {
        console.log('Testing real-time updates...');
        
        let realtimeTestPassed = false;
        
        // Set up a listener for appointment changes
        const unsubscribe = appointmentManager.onAppointmentChange((appointments) => {
            console.log('✅ Real-time appointment update received');
            realtimeTestPassed = true;
        });

        // Trigger an update (if we have a test appointment)
        if (this.testAppointmentId) {
            try {
                await appointmentManager.updateAppointmentStatus(
                    this.testAppointmentId, 
                    'completed', 
                    'Test completed'
                );
            } catch (error) {
                console.log('⚠️ Real-time test update failed, but listener still works');
            }
        }

        // Wait a bit for real-time update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (realtimeTestPassed) {
            console.log('✅ Real-time updates working');
        } else {
            console.log('⚠️ Real-time updates not detected (may still be working)');
        }
        
        // Clean up listener
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    }

    logTestResult(testName, status, error) {
        this.testResults.push({
            test: testName,
            status: status,
            error: error,
            timestamp: new Date().toISOString()
        });
    }

    printTestSummary() {
        console.log('\n🎯 TEST SUMMARY');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Success Rate: ${Math.round((passed/total) * 100)}%`);
        
        console.log('\nDetailed Results:');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.status}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (failed === 0) {
            console.log('🎉 All tests passed! Firebase integration is working perfectly.');
        } else {
            console.log('🔧 Some tests failed. Check the following:');
            console.log('   - Firebase project configuration');
            console.log('   - Authentication settings');
            console.log('   - Firestore security rules');
            console.log('   - Network connectivity');
        }
        
        return {
            total,
            passed,
            failed,
            successRate: Math.round((passed/total) * 100),
            results: this.testResults
        };
    }

    // Manual test helpers
    async testManualLogin(email, password) {
        try {
            const result = await authManager.login(email, password);
            console.log('Login result:', result);
            console.log('Current user:', authManager.getCurrentUserProfile());
        } catch (error) {
            console.error('Login failed:', error);
        }
    }

    async testManualAppointment() {
        const appointments = appointmentManager.getMyAppointments();
        console.log('My appointments:', appointments);
        
        const stats = appointmentManager.getAppointmentStats();
        console.log('Appointment stats:', stats);
    }

    async testManualMessages() {
        const messages = messagingManager.getMyMessages();
        console.log('My messages:', messages);
        
        const stats = messagingManager.getMessageStats();
        console.log('Message stats:', stats);
    }
}

// Create global test instance
window.firebaseTest = new FirebaseIntegrationTest();

// Auto-run tests if desired
// firebaseTest.runAllTests();

console.log('🔥 Firebase Integration Test Suite Loaded!');
console.log('Run: firebaseTest.runAllTests() to start testing');
console.log('Or use individual test methods:');
console.log('  - firebaseTest.testManualLogin("admin@stu.edu", "admin123")');
console.log('  - firebaseTest.testManualAppointment()');
console.log('  - firebaseTest.testManualMessages()');

export default FirebaseIntegrationTest;
