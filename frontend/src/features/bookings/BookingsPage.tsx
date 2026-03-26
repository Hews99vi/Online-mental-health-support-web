/**
 * BookingsPage.tsx — barrel for bookings / appointments feature.
 * /bookings                       → AppointmentsPage        (user view)
 * /bookings/therapist             → TherapistAppointmentsPage (therapist view)
 * /appointments/:id/join          → JoinSessionPage
 */
export { AppointmentsPage } from '../appointments/AppointmentsPage';
export { TherapistAppointmentsPage } from '../appointments/TherapistAppointmentsPage';
export { JoinSessionPage } from '../appointments/JoinSessionPage';
