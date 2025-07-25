import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    orderBy,
    limit 
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

// Demo users for presentation
const DEMO_USERS = {
    'admin@edubook.com': {
        password: 'admin123',
        userType: 'admin',
        name: 'Admin User',
        uid: 'demo-admin-uid'
    },
    'teacher@edubook.com': {
        password: 'teacher123',
        userType: 'teacher',
        name: 'Dr. John Smith',
        department: 'Computer Science',
        subject: 'Data Structures',
        uid: 'demo-teacher-uid'
    },
    'student@edubook.com': {
        password: 'student123',
        userType: 'student',
        name: 'Alice Johnson',
        uid: 'demo-student-uid'
    }
};

// Mock data for demo
const MOCK_DATA = {
    teachers: [
        {
            id: 'teacher1',
            name: 'Dr. John Smith',
            department: 'Computer Science',
            subject: 'Data Structures',
            email: 'teacher@edubook.com',
            approved: true
        },
        {
            id: 'teacher2',
            name: 'Prof. Sarah Wilson',
            department: 'Mathematics',
            subject: 'Calculus',
            email: 'sarah.wilson@edubook.com',
            approved: true
        },
        {
            id: 'teacher3',
            name: 'Dr. Michael Brown',
            department: 'Physics',
            subject: 'Quantum Mechanics',
            email: 'michael.brown@edubook.com',
            approved: false
        }
    ],
    students: [
        {
            id: 'student1',
            name: 'Alice Johnson',
            email: 'student@edubook.com',
            approved: true
        },
        {
            id: 'student2',
            name: 'Bob Davis',
            email: 'bob.davis@student.edu',
            approved: true
        },
        {
            id: 'student3',
            name: 'Carol White',
            email: 'carol.white@student.edu',
            approved: false
        }
    ],
    appointments: [
        {
            id: 'apt1',
            studentId: 'student1',
            teacherId: 'teacher1',
            studentName: 'Alice Johnson',
            teacherName: 'Dr. John Smith',
            date: '2025-07-25',
            time: '10:00',
            subject: 'Data Structures Doubt',
            message: 'Need help with Binary Trees implementation',
            status: 'pending',
            createdAt: new Date('2025-07-21T10:00:00Z')
        },
        {
            id: 'apt2',
            studentId: 'student2',
            teacherId: 'teacher1',
            studentName: 'Bob Davis',
            teacherName: 'Dr. John Smith',
            date: '2025-07-26',
            time: '14:00',
            subject: 'Algorithm Analysis',
            message: 'Discussion about time complexity',
            status: 'approved',
            createdAt: new Date('2025-07-20T14:00:00Z')
        },
        {
            id: 'apt3',
            studentId: 'student1',
            teacherId: 'teacher2',
            studentName: 'Alice Johnson',
            teacherName: 'Prof. Sarah Wilson',
            date: '2025-07-24',
            time: '11:00',
            subject: 'Calculus Problem',
            message: 'Help with integration techniques',
            status: 'cancelled',
            createdAt: new Date('2025-07-19T11:00:00Z')
        }
    ],
    messages: [
        {
            id: 'msg1',
            from: 'student1',
            to: 'teacher1',
            fromName: 'Alice Johnson',
            toName: 'Dr. John Smith',
            subject: 'Assignment Clarification',
            message: 'Could you please clarify the requirements for Assignment 3?',
            timestamp: new Date('2025-07-21T09:30:00Z'),
            read: false
        },
        {
            id: 'msg2',
            from: 'teacher1',
            to: 'student1',
            fromName: 'Dr. John Smith',
            toName: 'Alice Johnson',
            subject: 'Re: Assignment Clarification',
            message: 'Sure! The assignment requires implementing a complete binary search tree with all basic operations.',
            timestamp: new Date('2025-07-21T10:15:00Z'),
            read: true
        }
    ]
};

// Initialize mock data in localStorage
function initializeMockData() {
    if (!localStorage.getItem('mockTeachers')) {
        localStorage.setItem('mockTeachers', JSON.stringify(MOCK_DATA.teachers));
    }
    if (!localStorage.getItem('mockStudents')) {
        localStorage.setItem('mockStudents', JSON.stringify(MOCK_DATA.students));
    }
    if (!localStorage.getItem('mockAppointments')) {
        localStorage.setItem('mockAppointments', JSON.stringify(MOCK_DATA.appointments));
    }
    if (!localStorage.getItem('mockMessages')) {
        localStorage.setItem('mockMessages', JSON.stringify(MOCK_DATA.messages));
    }
}

// Mock authentication for demo
export async function loginUser(email, password, userType) {
    logger.info('LOGIN_ATTEMPT', { email, userType });
    
    try {
        // Check demo credentials
        if (DEMO_USERS[email] && DEMO_USERS[email].password === password) {
            const user = DEMO_USERS[email];
            
            if (userType && user.userType !== userType) {
                throw new Error('Invalid user type for this account');
            }
            
            // Simulate successful login
            const mockUser = {
                uid: user.uid,
                email: email,
                userType: user.userType,
                name: user.name,
                department: user.department || null,
                subject: user.subject || null
            };
            
            localStorage.setItem('currentUser', JSON.stringify(mockUser));
            logger.success('LOGIN_SUCCESS', { userId: user.uid, userType: user.userType });
            
            return mockUser;
        } else {
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        logger.error('LOGIN_FAILED', { email, error: error.message });
        throw error;
    }
}

export async function registerUser(userData) {
    logger.info('REGISTRATION_ATTEMPT', { email: userData.email, userType: userData.userType });
    
    try {
        // Simulate registration process
        const newUser = {
            uid: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            email: userData.email,
            name: userData.name,
            userType: userData.userType,
            department: userData.department || null,
            subject: userData.subject || null,
            approved: userData.userType === 'student' // Auto-approve students, teachers need admin approval
        };
        
        // Add to mock data
        if (userData.userType === 'teacher') {
            const teachers = JSON.parse(localStorage.getItem('mockTeachers')) || [];
            teachers.push({
                id: newUser.uid,
                name: newUser.name,
                department: newUser.department,
                subject: newUser.subject,
                email: newUser.email,
                approved: false
            });
            localStorage.setItem('mockTeachers', JSON.stringify(teachers));
        } else if (userData.userType === 'student') {
            const students = JSON.parse(localStorage.getItem('mockStudents')) || [];
            students.push({
                id: newUser.uid,
                name: newUser.name,
                email: newUser.email,
                approved: true
            });
            localStorage.setItem('mockStudents', JSON.stringify(students));
        }
        
        logger.success('REGISTRATION_SUCCESS', { userId: newUser.uid, userType: newUser.userType });
        return newUser;
    } catch (error) {
        logger.error('REGISTRATION_FAILED', { email: userData.email, error: error.message });
        throw error;
    }
}

export async function logoutUser() {
    try {
        const currentUser = getCurrentUser();
        localStorage.removeItem('currentUser');
        logger.success('LOGOUT_SUCCESS', { userId: currentUser?.uid });
    } catch (error) {
        logger.error('LOGOUT_FAILED', { error: error.message });
        throw error;
    }
}

export function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Data management functions
export async function getTeachers(approvedOnly = true) {
    const teachers = JSON.parse(localStorage.getItem('mockTeachers')) || [];
    return approvedOnly ? teachers.filter(t => t.approved) : teachers;
}

export async function getStudents(approvedOnly = true) {
    const students = JSON.parse(localStorage.getItem('mockStudents')) || [];
    return approvedOnly ? students.filter(s => s.approved) : students;
}

export async function bookAppointment(appointmentData) {
    logger.info('BOOK_APPOINTMENT_ATTEMPT', appointmentData);
    
    try {
        const appointments = JSON.parse(localStorage.getItem('mockAppointments')) || [];
        const newAppointment = {
            id: 'apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...appointmentData,
            status: 'pending',
            createdAt: new Date()
        };
        
        appointments.push(newAppointment);
        localStorage.setItem('mockAppointments', JSON.stringify(appointments));
        
        logger.success('APPOINTMENT_BOOKED', { appointmentId: newAppointment.id });
        return newAppointment;
    } catch (error) {
        logger.error('BOOK_APPOINTMENT_FAILED', { error: error.message });
        throw error;
    }
}

export async function getAppointments(userId = null, userType = null) {
    const appointments = JSON.parse(localStorage.getItem('mockAppointments')) || [];
    
    if (!userId) return appointments;
    
    if (userType === 'student') {
        return appointments.filter(apt => apt.studentId === userId);
    } else if (userType === 'teacher') {
        return appointments.filter(apt => apt.teacherId === userId);
    }
    
    return appointments;
}

export async function updateAppointmentStatus(appointmentId, status) {
    logger.info('UPDATE_APPOINTMENT_STATUS', { appointmentId, status });
    
    try {
        const appointments = JSON.parse(localStorage.getItem('mockAppointments')) || [];
        const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (appointmentIndex === -1) {
            throw new Error('Appointment not found');
        }
        
        appointments[appointmentIndex].status = status;
        localStorage.setItem('mockAppointments', JSON.stringify(appointments));
        
        logger.success('APPOINTMENT_STATUS_UPDATED', { appointmentId, status });
        return appointments[appointmentIndex];
    } catch (error) {
        logger.error('UPDATE_APPOINTMENT_FAILED', { appointmentId, error: error.message });
        throw error;
    }
}

export async function sendMessage(messageData) {
    logger.info('SEND_MESSAGE_ATTEMPT', messageData);
    
    try {
        const messages = JSON.parse(localStorage.getItem('mockMessages')) || [];
        const newMessage = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...messageData,
            timestamp: new Date(),
            read: false
        };
        
        messages.push(newMessage);
        localStorage.setItem('mockMessages', JSON.stringify(messages));
        
        logger.success('MESSAGE_SENT', { messageId: newMessage.id });
        return newMessage;
    } catch (error) {
        logger.error('SEND_MESSAGE_FAILED', { error: error.message });
        throw error;
    }
}

export async function getMessages(userId) {
    const messages = JSON.parse(localStorage.getItem('mockMessages')) || [];
    return messages.filter(msg => msg.from === userId || msg.to === userId)
                   .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function approveUser(userId, userType) {
    logger.info('APPROVE_USER_ATTEMPT', { userId, userType });
    
    try {
        if (userType === 'teacher') {
            const teachers = JSON.parse(localStorage.getItem('mockTeachers')) || [];
            const teacherIndex = teachers.findIndex(t => t.id === userId);
            if (teacherIndex !== -1) {
                teachers[teacherIndex].approved = true;
                localStorage.setItem('mockTeachers', JSON.stringify(teachers));
            }
        } else if (userType === 'student') {
            const students = JSON.parse(localStorage.getItem('mockStudents')) || [];
            const studentIndex = students.findIndex(s => s.id === userId);
            if (studentIndex !== -1) {
                students[studentIndex].approved = true;
                localStorage.setItem('mockStudents', JSON.stringify(students));
            }
        }
        
        logger.success('USER_APPROVED', { userId, userType });
    } catch (error) {
        logger.error('APPROVE_USER_FAILED', { userId, error: error.message });
        throw error;
    }
}

export async function deleteUser(userId, userType) {
    logger.info('DELETE_USER_ATTEMPT', { userId, userType });
    
    try {
        if (userType === 'teacher') {
            const teachers = JSON.parse(localStorage.getItem('mockTeachers')) || [];
            const filteredTeachers = teachers.filter(t => t.id !== userId);
            localStorage.setItem('mockTeachers', JSON.stringify(filteredTeachers));
        } else if (userType === 'student') {
            const students = JSON.parse(localStorage.getItem('mockStudents')) || [];
            const filteredStudents = students.filter(s => s.id !== userId);
            localStorage.setItem('mockStudents', JSON.stringify(filteredStudents));
        }
        
        logger.success('USER_DELETED', { userId, userType });
    } catch (error) {
        logger.error('DELETE_USER_FAILED', { userId, error: error.message });
        throw error;
    }
}

// Initialize mock data on module load
initializeMockData();
