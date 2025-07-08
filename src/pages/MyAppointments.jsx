// src/pages/MyAppointments.jsx
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from 'react-modal';

// Set the app element for react-modal (important for accessibility)
Modal.setAppElement('#root');

const MyAppointments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);
  const [myAppointments, setMyAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  // State to manage payment form submission (for PayU redirect)
  const [payuFormDetails, setPayuFormDetails] = useState(null);

  const fetchMyAppointments = async () => {
    if (!token) {
      setLoading(false);
      setError("Please log in to view your appointments.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(backendUrl + '/api/user/my-appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setMyAppointments(response.data.appointments || []);
      } else {
        toast.error(response.data.message || "Failed to fetch appointments.");
        setError(response.data.message || "Failed to fetch appointments.");
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      toast.error(err.response?.data?.message || "Error fetching appointments. Please try again.");
      setError(err.response?.data?.message || "Error fetching appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (appointment) => {
    setAppointmentToCancel(appointment);
    setIsModalOpen(true);
  };

  const closeCancelModal = () => {
    setIsModalOpen(false);
    setAppointmentToCancel(null);
  };

  const handleConfirmCancellation = async () => {
    if (!appointmentToCancel) return;

    closeCancelModal();

    try {
      const response = await axios.post(backendUrl + '/api/user/cancel-appointment', {
        appointmentId: appointmentToCancel._id,
        docId: appointmentToCancel.docId,
        slotDate: appointmentToCancel.slotDate,
        slotTime: appointmentToCancel.slotTime
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchMyAppointments();
        getDoctorsData(); // Refresh global doctor data for availability
      } else {
        toast.error(response.data.message || "Failed to cancel appointment.");
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      toast.error(err.response?.data?.message || "An unexpected error occurred during cancellation. Please try again.");
    }
  };

  // --- NEW: handlePayOnline function ---
  const handlePayOnline = async (appointment) => {
    if (!token) {
      toast.warn('Please log in to make a payment.');
      return;
    }

    try {
      const response = await axios.post(backendUrl + '/api/user/payu-payment-initiate', {
        appointmentId: appointment._id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.info("Redirecting to payment gateway...");
        setPayuFormDetails(response.data.paymentParams); // Store params to trigger form submission
      } else {
        toast.error(response.data.message || "Failed to initiate payment.");
      }
    } catch (err) {
      console.error("Error initiating payment:", err);
      toast.error(err.response?.data?.message || "An unexpected error occurred during payment initiation. Please try again.");
    }
  };

  // --- NEW: useEffect to handle PayU form submission ---
  useEffect(() => {
    if (payuFormDetails) {
      const form = document.createElement('form');
      form.method = 'post';
      form.action = payuFormDetails.action; // PayU gateway URL

      for (const key in payuFormDetails) {
        if (key !== 'action' && key !== 'appointmentId') { // Exclude 'action' and local 'appointmentId'
          const hiddenField = document.createElement('input');
          hiddenField.type = 'hidden';
          hiddenField.name = key;
          hiddenField.value = payuFormDetails[key];
          form.appendChild(hiddenField);
        }
      }

      document.body.appendChild(form);
      form.submit(); // Submit the form to PayU
      document.body.removeChild(form); // Clean up the form element
      setPayuFormDetails(null); // Reset state to prevent re-submission
    }
  }, [payuFormDetails]);

  // --- NEW: useEffect to check for payment status in URL on component mount ---
  useEffect(() => {
    fetchMyAppointments(); // Always fetch appointments on mount

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const apptId = urlParams.get('appointmentId'); // Get appointment ID from URL

    if (paymentStatus) {
      if (paymentStatus === 'success') {
        toast.success(`Payment successful for appointment ${apptId || ''}!`);
      } else if (paymentStatus === 'failure') {
        toast.error(`Payment failed for appointment ${apptId || ''}. Please try again.`);
      } else if (paymentStatus === 'cancelled') {
        toast.info(`Payment cancelled for appointment ${apptId || ''}.`);
      } else if (paymentStatus === 'cancelled_by_user') { // This status is set by your backend
        toast.info(`Appointment ${apptId || ''} was cancelled by user.`);
      }
      // Clean the URL to remove payment status parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token, backendUrl]); // Re-run when backendUrl or token changes

  // --- Filtering and Sorting Appointments ---
  const filterAppointments = () => {
    const upcoming = [];
    const completed = [];
    const cancelled = [];
    const now = new Date();

    myAppointments.forEach(appointment => {
      const [day, month, year] = appointment.slotDate.split('_').map(Number);
      const [time, ampm] = appointment.slotTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

      // Prioritize cancelled status, then completed, then payment status, then date comparison
      if (appointment.cancelled) {
        cancelled.push(appointment);
      } else if (appointment.isCompleted) {
        completed.push(appointment);
      } else if (appointmentDateTime < now) {
        // If not explicitly completed by backend, but date has passed
        completed.push(appointment);
      } else {
        upcoming.push(appointment);
      }
    });

    const getDateTime = (appt) => {
        const [day, month, year] = appt.slotDate.split('_').map(Number);
        const [time, ampm] = appt.slotTime.split(' ');
        let [hours, minutes] = time.split(':')[0].map(Number); // Fixed potential issue with map on time string
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return new Date(year, month - 1, day, hours, minutes);
    };

    upcoming.sort((a, b) => getDateTime(a) - getDateTime(b));
    completed.sort((a, b) => getDateTime(b) - getDateTime(a));
    cancelled.sort((a, b) => getDateTime(b) - getDateTime(a));

    return { upcoming, completed, cancelled };
  };

  const { upcoming, completed, cancelled } = filterAppointments();

  if (loading) {
    return (
      <div className="p-4 mt-12 text-center text-gray-600">Loading appointments...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mt-12 text-center text-red-500">{error}</div>
    );
  }

  const renderAppointmentCard = (appointment) => (
    <div
      key={appointment._id}
      className={`flex flex-col md:flex-row gap-4 border-b py-4 ${appointment.cancelled ? 'cancelled-appointment-card' : ''}`}
    >
      {/* Doctor Image */}
      <div className="w-full md:w-32 aspect-square md:aspect-[3/4] overflow-hidden rounded-md bg-indigo-50">
        <img
          src={appointment.docData.image}
          alt={appointment.docData.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info Section */}
      <div className="flex-1 text-sm text-zinc-600">
        <p className="text-neutral-800 font-semibold text-base">{appointment.docData.name}</p>
        <p className="font-medium">{appointment.docData.speciality}</p>
        <p className="text-zinc-700 font-medium mt-2">Address:</p>
        <p className="text-sm">{appointment.docData.address.line1}</p>
        <p className="text-sm">{appointment.docData.address.line2}</p>
        <p className="text-sm mt-2">
          <span className="text-sm text-neutral-700 font-medium">Appointment Date & Time:</span>{" "}
          {new Date(
            parseInt(appointment.slotDate.split('_')[2]), // Year
            parseInt(appointment.slotDate.split('_')[1]) - 1, // Month (0-indexed)
            parseInt(appointment.slotDate.split('_')[0]) // Day
          ).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) + ' | ' + appointment.slotTime}
        </p>
        <p className="text-sm">
          <span className="text-sm text-neutral-700 font-medium">Fees:</span>{" "}
          {appointment.amount}
        </p>
        <p className="text-sm">
          <span className="text-sm text-neutral-700 font-medium">Booked On:</span>{" "}
          {new Date(appointment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
        </p>
        <p className="text-sm">
          <span className="text-sm text-neutral-700 font-medium">Status:</span>{" "}
          {/* --- MODIFIED: Dynamic Status Display based on paymentStatus --- */}
          <span className={
            appointment.cancelled ? "text-red-500 font-semibold" : // If cancelled
            (appointment.paymentStatus === 'paid' ? "text-green-600 font-semibold" : // If paid
            (appointment.paymentStatus === 'failed' ? "text-red-500 font-semibold" : // If payment failed
            (appointment.isCompleted ? "text-blue-500 font-semibold" : // If completed
            "text-orange-500 font-semibold")) // Default for pending payment
            )
          }>
            {appointment.cancelled ? "Cancelled" :
             (appointment.paymentStatus === 'paid' ? "Paid" :
             (appointment.paymentStatus === 'failed' ? "Payment Failed" :
             (appointment.isCompleted ? "Completed" : "Pending Payment")) // Default for pending payment
             )
            }
          </span>
          {/* --- END MODIFIED --- */}
        </p>

        {/* Buttons for Mobile */}
        <div className="flex flex-col sm:flex-row md:hidden gap-3 mt-4">
          {/* --- MODIFIED: Conditional Pay Online & Cancel Buttons --- */}
          {!appointment.cancelled && !appointment.isCompleted && appointment.paymentStatus !== 'paid' && (
            <button
              onClick={() => openCancelModal(appointment)}
              className="bg-red-100 text-red-600 py-2 rounded-md text-sm hover:bg-red-200 transition-colors duration-300"
            >
              Cancel Appointment
            </button>
          )}
          {!appointment.cancelled && !appointment.isCompleted && appointment.paymentStatus !== 'paid' && (
            <button
              onClick={() => handlePayOnline(appointment)} // Call handlePayOnline
              className="bg-primary text-white py-2 rounded-md text-sm hover:bg-indigo-600 transition-colors duration-300"
            >
              Pay Online
            </button>
          )}
          {/* --- END MODIFIED --- */}
        </div>
      </div>

      {/* Buttons for Desktop */}
      <div className="hidden md:flex flex-col items-center justify-center gap-2">
        {/* --- MODIFIED: Conditional Pay Online & Cancel Buttons --- */}
        {!appointment.cancelled && !appointment.isCompleted && appointment.paymentStatus !== 'paid' && (
          <button
            onClick={() => openCancelModal(appointment)}
            className="bg-red-100 text-red-600 w-full px-4 py-2 rounded-md text-sm hover:bg-red-200 transition-colors duration-300"
          >
            Cancel Appointment
          </button>
        )}
        {!appointment.cancelled && !appointment.isCompleted && appointment.paymentStatus !== 'paid' && (
          <button
            onClick={() => handlePayOnline(appointment)} // Call handlePayOnline
            className="bg-primary text-white w-full px-4 py-2 rounded-md text-sm hover:bg-indigo-600 transition-colors duration-300"
          >
            Pay Online
          </button>
        )}
        {/* --- END MODIFIED --- */}
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b text-lg">
        My Appointments
      </p>

      {/* Upcoming Appointments Section */}
      <div className="mt-6 border rounded-lg overflow-hidden shadow-sm">
        <div
          className="flex justify-between items-center bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
          onClick={() => setShowUpcoming(!showUpcoming)}
        >
          <h3 className="font-semibold text-lg text-gray-700">Upcoming Appointments ({upcoming.length})</h3>
          <span className="text-gray-500 text-2xl transform transition-transform duration-300">
            {showUpcoming ? '−' : '+'}
          </span>
        </div>
        <div
          className={`transition-max-height duration-500 ease-in-out overflow-hidden`}
          style={{ maxHeight: showUpcoming ? '1000px' : '0' }}
        >
          <div className="p-4 pt-0">
            {upcoming.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming appointments.</p>
            ) : (
              upcoming.map(renderAppointmentCard)
            )}
          </div>
        </div>
      </div>

      {/* Completed Appointments Section */}
      <div className="mt-6 border rounded-lg overflow-hidden shadow-sm">
        <div
          className="flex justify-between items-center bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
          onClick={() => setShowCompleted(!showCompleted)}
        >
          <h3 className="font-semibold text-lg text-gray-700">Completed Appointments ({completed.length})</h3>
          <span className="text-gray-500 text-2xl transform transition-transform duration-300">
            {showCompleted ? '−' : '+'}
          </span>
        </div>
        <div
          className={`transition-max-height duration-500 ease-in-out overflow-hidden`}
          style={{ maxHeight: showCompleted ? '1000px' : '0' }}
        >
          <div className="p-4 pt-0">
            {completed.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No completed appointments.</p>
            ) : (
              completed.map(renderAppointmentCard)
            )}
          </div>
        </div>
      </div>

      {/* Cancelled Appointments Section */}
      <div className="mt-6 border rounded-lg overflow-hidden shadow-sm">
        <div
          className="flex justify-between items-center bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
          onClick={() => setShowCancelled(!showCancelled)}
        >
          <h3 className="font-semibold text-lg text-gray-700">Cancelled Appointments ({cancelled.length})</h3>
          <span className="text-gray-500 text-2xl transform transition-transform duration-300">
            {showCancelled ? '−' : '+'}
          </span>
        </div>
        <div
          className={`transition-max-height duration-500 ease-in-out overflow-hidden`}
          style={{ maxHeight: showCancelled ? '1000px' : '0' }}
        >
          <div className="p-4 pt-0">
            {cancelled.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No cancelled appointments.</p>
            ) : (
              cancelled.map(renderAppointmentCard)
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeCancelModal}
        contentLabel="Confirm Cancellation"
        className="Modal"
        overlayClassName="Overlay"
      >
        {appointmentToCancel && (
          <div className="p-6 bg-white rounded-lg shadow-xl max-w-sm mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Confirm Cancellation</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel your appointment with{" "}
              <span className="font-medium text-neutral-800">Dr. {appointmentToCancel.docData.name}</span>{" "}
              on <span className="font-medium">{appointmentToCancel.slotDate.replace(/_/g, '/')}</span>{" "}
              at <span className="font-medium">{appointmentToCancel.slotTime}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-300"
              >
                No, Keep It
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-300"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default MyAppointments;
