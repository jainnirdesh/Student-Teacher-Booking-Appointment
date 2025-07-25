// Firebase Appointment Management Module
import { 
    db,
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from './firebase-config.js';

import { logUserAction } from './logger-firebase.js';
import { authManager } from './auth-firebase.js';

export class AppointmentManager {
    constructor() {
        this.appointments = [];
        this.appointmentListeners = [];
        this.setupRealtimeListener();
    }

    // Setup real-time listener for appointments
    setupRealtimeListener() {
        const appointmentsQuery = query(
            collection(db, 'appointments'),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(appointmentsQuery, (snapshot) => {
            this.appointments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.notifyAppointmentChange();
        });
    }

    // Add appointment change listener
    onAppointmentChange(callback) {
        this.appointmentListeners.push(callback);
    }

    // Notify all listeners of appointment changes
    notifyAppointmentChange() {
        this.appointmentListeners.forEach(callback => {
            callback(this.appointments);
        });
    }

    // Create new appointment
    async createAppointment(appointmentData) {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser || currentUser.role !== 'student') {
                throw new Error('Only students can create appointments');
            }

            const appointment = {
                studentId: currentUser.uid,
                studentName: currentUser.name,
                studentEmail: currentUser.email,
                teacherId: appointmentData.teacherId,
                teacherName: appointmentData.teacherName,
                subject: appointmentData.subject,
                date: appointmentData.date,
                time: appointmentData.time,
                duration: appointmentData.duration || 30,
                purpose: appointmentData.purpose,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'appointments'), appointment);
            
            logUserAction(currentUser.uid, 'APPOINTMENT_CREATE', 
                `Appointment created with ${appointmentData.teacherName} on ${appointmentData.date}`);

            return { success: true, appointmentId: docRef.id };
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw new Error('Failed to create appointment');
        }
    }

    // Update appointment status
    async updateAppointmentStatus(appointmentId, status, notes = '') {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            // Find the appointment
            const appointment = this.appointments.find(apt => apt.id === appointmentId);
            if (!appointment) {
                throw new Error('Appointment not found');
            }

            // Check permissions
            if (currentUser.role === 'student' && appointment.studentId !== currentUser.uid) {
                throw new Error('Unauthorized to modify this appointment');
            }
            if (currentUser.role === 'teacher' && appointment.teacherId !== currentUser.uid) {
                throw new Error('Unauthorized to modify this appointment');
            }

            const updates = {
                status: status,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.uid
            };

            if (notes) {
                updates.notes = notes;
            }

            if (status === 'approved') {
                updates.approvedAt = new Date().toISOString();
                updates.approvedBy = currentUser.uid;
            } else if (status === 'cancelled') {
                updates.cancelledAt = new Date().toISOString();
                updates.cancelledBy = currentUser.uid;
            }

            await updateDoc(doc(db, 'appointments', appointmentId), updates);

            logUserAction(currentUser.uid, 'APPOINTMENT_STATUS_UPDATE', 
                `Appointment ${appointmentId} status changed to ${status}`);

            return { success: true };
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw new Error('Failed to update appointment');
        }
    }

    // Cancel appointment
    async cancelAppointment(appointmentId, reason = '') {
        try {
            return await this.updateAppointmentStatus(appointmentId, 'cancelled', reason);
        } catch (error) {
            throw error;
        }
    }

    // Approve appointment (teacher/admin only)
    async approveAppointment(appointmentId, notes = '') {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser || !['teacher', 'admin'].includes(currentUser.role)) {
                throw new Error('Only teachers and admins can approve appointments');
            }

            return await this.updateAppointmentStatus(appointmentId, 'approved', notes);
        } catch (error) {
            throw error;
        }
    }

    // Reject appointment (teacher/admin only)
    async rejectAppointment(appointmentId, reason = '') {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser || !['teacher', 'admin'].includes(currentUser.role)) {
                throw new Error('Only teachers and admins can reject appointments');
            }

            return await this.updateAppointmentStatus(appointmentId, 'rejected', reason);
        } catch (error) {
            throw error;
        }
    }

    // Get appointments for current user
    getMyAppointments() {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser) return [];

        return this.appointments.filter(appointment => {
            if (currentUser.role === 'student') {
                return appointment.studentId === currentUser.uid;
            } else if (currentUser.role === 'teacher') {
                return appointment.teacherId === currentUser.uid;
            } else if (currentUser.role === 'admin') {
                return true; // Admin can see all appointments
            }
            return false;
        });
    }

    // Get appointments by status
    getAppointmentsByStatus(status) {
        return this.getMyAppointments().filter(appointment => appointment.status === status);
    }

    // Get pending appointments
    getPendingAppointments() {
        return this.getAppointmentsByStatus('pending');
    }

    // Get approved appointments
    getApprovedAppointments() {
        return this.getAppointmentsByStatus('approved');
    }

    // Get all appointments (admin only)
    getAllAppointments() {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error('Only admins can view all appointments');
        }
        return this.appointments;
    }

    // Delete appointment (admin only)
    async deleteAppointment(appointmentId) {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser || currentUser.role !== 'admin') {
                throw new Error('Only admins can delete appointments');
            }

            await deleteDoc(doc(db, 'appointments', appointmentId));

            logUserAction(currentUser.uid, 'APPOINTMENT_DELETE', 
                `Appointment ${appointmentId} deleted`);

            return { success: true };
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw new Error('Failed to delete appointment');
        }
    }

    // Get appointment statistics
    getAppointmentStats() {
        const currentUser = authManager.getCurrentUserProfile();
        const myAppointments = this.getMyAppointments();

        const stats = {
            total: myAppointments.length,
            pending: myAppointments.filter(apt => apt.status === 'pending').length,
            approved: myAppointments.filter(apt => apt.status === 'approved').length,
            cancelled: myAppointments.filter(apt => apt.status === 'cancelled').length,
            rejected: myAppointments.filter(apt => apt.status === 'rejected').length
        };

        if (currentUser.role === 'admin') {
            stats.totalSystem = this.appointments.length;
            stats.pendingSystem = this.appointments.filter(apt => apt.status === 'pending').length;
        }

        return stats;
    }

    // Check for appointment conflicts
    async checkAppointmentConflict(teacherId, date, time, duration = 30) {
        try {
            const conflictingAppointments = this.appointments.filter(appointment => {
                if (appointment.teacherId !== teacherId || appointment.date !== date) {
                    return false;
                }

                if (['cancelled', 'rejected'].includes(appointment.status)) {
                    return false;
                }

                const appointmentTime = new Date(`${date} ${appointment.time}`);
                const newAppointmentTime = new Date(`${date} ${time}`);
                const appointmentEnd = new Date(appointmentTime.getTime() + (appointment.duration || 30) * 60000);
                const newAppointmentEnd = new Date(newAppointmentTime.getTime() + duration * 60000);

                // Check for overlap
                return (newAppointmentTime < appointmentEnd && newAppointmentEnd > appointmentTime);
            });

            return conflictingAppointments.length > 0;
        } catch (error) {
            console.error('Error checking appointment conflict:', error);
            return false;
        }
    }

    // Get available time slots for a teacher on a specific date
    getAvailableTimeSlots(teacherId, date) {
        const workingHours = {
            start: 9, // 9 AM
            end: 17,  // 5 PM
            slotDuration: 30 // 30 minutes
        };

        const slots = [];
        const bookedSlots = this.appointments
            .filter(apt => 
                apt.teacherId === teacherId && 
                apt.date === date && 
                ['pending', 'approved'].includes(apt.status)
            )
            .map(apt => apt.time);

        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
            for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                if (!bookedSlots.includes(timeSlot)) {
                    slots.push(timeSlot);
                }
            }
        }

        return slots;
    }
}

// Export singleton instance
export const appointmentManager = new AppointmentManager();
