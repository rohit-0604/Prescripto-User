// src/pages/Appointment.jsx

import { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

const Appointment = () => {
    const { docId } = useParams();
    const navigate = useNavigate();
    const { doctors, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext);
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const [docInfo, setDocInfo] = useState(null);
    const [docSlots, setDocSlots] = useState([]);
    const [slotIndex, setSlotIndex] = useState(0);
    const [slotTime, setSlotTime] = useState('');
    const [relatedDoctors, setRelatedDoctors] = useState([]);
    const [showAllRelated, setShowAllRelated] = useState(false);

    const slotRowRef = useRef();

    const fetchDocInfo = () => {
        const foundDoc = doctors.find(doc => doc._id === docId);
        setDocInfo(foundDoc);

        if (foundDoc) {
            const related = doctors.filter(doc => doc.speciality === foundDoc.speciality && doc._id !== foundDoc._id);
            setRelatedDoctors(related);
        }
    };

    // Generate available time slots for next 7 days
    const getAvailableSlots = () => {
        // Ensure docInfo and docInfo.slots_booked are available
        if (!docInfo || !docInfo.slots_booked) {
            setDocSlots([]);
            return;
        }

        let today = new Date();
        let allSlots = [];

        // Get the booked slots for the current doctor
        const bookedSlotsForDoctor = docInfo.slots_booked;

        for (let i = 0; i < 7; i++) {
            let currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            currentDate.setSeconds(0);
            currentDate.setMilliseconds(0);

            let endTime = new Date(today);
            endTime.setDate(today.getDate() + i);
            endTime.setHours(21, 0, 0, 0); // Doctor's last slot ends at 9 PM

            let startTimeForDay = new Date(currentDate);

            if (i === 0) { // For today
                let currentHour = currentDate.getHours();
                let currentMinute = currentDate.getMinutes();

                if (currentHour < 10) { // If before 10 AM, start from 10 AM
                    startTimeForDay.setHours(10, 0, 0, 0);
                } else { // If after 10 AM, start from next hour or half-hour
                    startTimeForDay.setHours(currentHour + 1, 0, 0, 0);
                    if (currentMinute > 30) {
                        startTimeForDay.setMinutes(30);
                    } else if (currentMinute > 0) {
                        startTimeForDay.setMinutes(0);
                    }
                }

                if (startTimeForDay >= endTime) {
                    // If calculated start time is already past or at end time for today, no slots available today
                    continue;
                }
                currentDate = startTimeForDay;
            } else { // For future days, start from 10 AM
                currentDate.setHours(10, 0, 0, 0);
            }

            let timeSlotsForDay = [];
            // Format the date string as it's stored in slots_booked (e.g., "7_7_2025")
            let formattedSlotDate = currentDate.getDate() + "_" + (currentDate.getMonth() + 1) + "_" + currentDate.getFullYear();

            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                });

                // --- MODIFIED LOGIC: Determine if the slot is booked, but don't filter it out ---
                const isSlotBooked = bookedSlotsForDoctor[formattedSlotDate] &&
                                     bookedSlotsForDoctor[formattedSlotDate].includes(formattedTime);

                timeSlotsForDay.push({
                    datetime: new Date(currentDate),
                    time: formattedTime,
                    isBooked: isSlotBooked // NEW: Add this property to the slot object
                });
                // --- END MODIFIED LOGIC ---

                currentDate.setMinutes(currentDate.getMinutes() + 30);
            }

            if (timeSlotsForDay.length > 0) {
                allSlots.push(timeSlotsForDay);
            }
        }

        setDocSlots(allSlots);
        if (allSlots.length > 0) {
            setSlotIndex(prevIndex => Math.min(prevIndex, allSlots.length - 1));
        } else {
            setSlotIndex(0);
        }
    };


    const scrollSlots = (direction) => {
        const container = slotRowRef.current;
        if (container) {
            const scrollAmount = 150;
            container.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            });
        }
    };

    const bookAppointment = async () => {
        if(!token){
            toast.warn('Login to book appointment');
            return navigate('/login');
        }

        if (!slotTime) {
            toast.error("Please select a time slot for your appointment.");
            return;
        }

        // Additional client-side check to prevent booking a visually "booked" slot
        // This is a safety net in case the user clicks very fast before UI updates,
        // or if there's a minor display bug.
        const currentSelectedSlot = docSlots[slotIndex]?.find(s => s.time === slotTime);
        if (currentSelectedSlot && currentSelectedSlot.isBooked) {
             toast.error("This slot is already booked and cannot be selected.");
             setSlotTime(''); // Clear selection
             return;
        }


        try {
            const date = docSlots[slotIndex][0].datetime;
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();

            const slotDate = day + "_" + month + "_" + year;

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', {docId, slotDate, slotTime},
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if(data.success){
                toast.success(data.message);
                // After successful booking, re-fetch doctor data to update available slots
                getDoctorsData(); // This is crucial to refresh the docInfo and its slots_booked
                navigate('/my-appointments');
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.error("Error during appointment booking:", error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        }
    };

    useEffect(() => {
        fetchDocInfo();
    }, [doctors, docId]); // Depend on 'doctors' to update docInfo when doctors data changes

    useEffect(() => {
        if (docInfo) {
            getAvailableSlots();
        }
    }, [docInfo]); // Re-run when docInfo (and thus slots_booked) changes

    useEffect(() => {
        if (docSlots.length > 0 && docSlots[slotIndex]?.length > 0) {
            // Check if the currently selected slot (if any) became booked
            const selectedSlotItem = docSlots[slotIndex].find(item => item.time === slotTime);
            if (selectedSlotItem && selectedSlotItem.isBooked) {
                setSlotTime(''); // Clear selection if it's now booked
            } else if (!selectedSlotItem && slotTime) {
                // If a slot was selected but no longer exists (e.g., doctor removed it), clear selection
                 setSlotTime('');
            }
        } else {
            setSlotTime(''); // Clear selection if no slots for the day
        }
    }, [slotIndex, docSlots, slotTime]); // Also depend on slotTime to re-evaluate when it changes manually


    const displayedDoctors = showAllRelated ? relatedDoctors : relatedDoctors.slice(0, 3);

    return docInfo && (
        <div className="px-4 md:px-10 lg:px-20 py-6">
            {/* Doctor Details */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div>
                    <img className="bg-primary w-full sm:max-w-72 rounded-full" src={docInfo.image} alt={docInfo.name} />
                </div>

                <div className="flex-1 border border-gray-400 rounded-3xl p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
                    <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
                        {docInfo.name}
                        <img className="w-5" src={assets.verified_icon} alt="verified" />
                    </p>
                    <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
                        <p>{docInfo.degree} - {docInfo.speciality}</p>
                        <button className="py-0.5 px-2 border border-gray-200 text-xs rounded-full">
                            {docInfo.experience}
                        </button>
                    </div>

                    <div>
                        <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
                            About
                            <img src={assets.info_icon} alt="info" />
                        </p>
                        <p className="text-sm text-gray-500 max-w-[700px] mt-1">
                            {docInfo.about}
                        </p>
                    </div>

                    <p className="text-gray-500 font-medium mt-4">
                        Appointment fee: <span className="text-gray-600">{currencySymbol}{docInfo.fees}</span>
                    </p>

                </div>
            </div>

            {/* Booking Slots */}
            <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
                <p>Booking Slots</p>
                <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
                    {/* Only render if docSlots has items */}
                    {docSlots.length > 0 ? (
                        docSlots.map((item, index) => (
                            <div onClick={() => {
                                setSlotIndex(index);
                                setSlotTime(''); // Clear selected time when a new day is clicked
                            }}
                                key={item[0].datetime.toISOString()}
                                className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-300'}`}>
                                <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                                <p>{item[0] && item[0].datetime.getDate()}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No slots available for the next 7 days.</p>
                    )}
                </div>

                {/* Time Slots with Arrows */}
                {docSlots.length > 0 && docSlots[slotIndex]?.length > 0 && (
                        <div className="relative mt-4 px-2 sm:px-0">
                            {/* Left Arrow */}
                            <button onClick={() => scrollSlots("left")} className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow p-1 rounded-full" aria-label="Scroll left">
                                <ChevronLeft size={20} />
                            </button>

                            {/* Scrollable Time Slots */}
                            <div ref={slotRowRef} className="flex items-center gap-3 overflow-x-auto no-scrollbar px-6">
                                {docSlots[slotIndex].map((item) => (
                                    <p key={item.time}
                                       onClick={() => {
                                           // Only allow selection if the slot is NOT booked
                                           if (!item.isBooked) {
                                               setSlotTime(item.time);
                                           } else {
                                               // Optional: Provide feedback if user tries to click a booked slot
                                               toast.info("This slot is already booked.");
                                           }
                                       }}
                                       className={`
                                           text-sm font-light flex-shrink-0 px-5 py-2 rounded-full
                                           ${item.isBooked // Check if booked
                                               ? "bg-red-100 text-red-700 cursor-not-allowed opacity-60" // Styles for booked
                                               : item.time === slotTime
                                                 ? "bg-primary text-white cursor-pointer" // Styles for selected and available
                                                 : "text-gray-700 border border-gray-300 cursor-pointer" // Styles for available and unselected
                                           }
                                       `}
                                    >
                                        {item.time.toLowerCase()}
                                    </p>
                                ))}
                            </div>

                            {/* Right Arrow */}
                            <button
                                onClick={() => scrollSlots("right")}
                                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow p-1 rounded-full"
                                aria-label="Scroll right"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                )}

                {/* Book Appointment Button */}
                {docSlots.length > 0 && slotTime && (
                        <button onClick={bookAppointment} className="bg-primary text-white text-sm font-light px-14 py-3 rounded-full mt-6">
                            Book Appointment
                        </button>
                )}
            </div>

            {/* Related Doctors */}
            {relatedDoctors.length > 0 && (
                <div className="mt-10 sm:ml-72 sm:pl-4">
                    <p className="font-semibold text-lg mb-4">Related Doctors in {docInfo.speciality}</p>
                    <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {displayedDoctors.map((item, index) => (
                            <div key={index} onClick={() => navigate(`/appointment/${item._id}`)}
                                className='border border-blue-200 rounded-xl overflow-hidden bg-white cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300'>
                                <div className='bg-blue-50 flex items-center justify-center p-2 h-44'>
                                    <img src={item.image} alt={item.name} className='max-h-full max-w-full object-contain' />
                                </div>
                                <div className='p-3'>
                                    <div className='flex items-center gap-2 text-sm text-green-500 mb-1'>
                                        <span className='w-2 h-2 bg-green-500 rounded-full' />
                                        <p>Available</p>
                                    </div>
                                    <p className='font-semibold text-sm truncate'>{item.name}</p>
                                    <p className='text-xs text-gray-600'>{item.speciality}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Show More Button */}
                    {relatedDoctors.length > 3 && !showAllRelated && (
                        <button onClick={() => setShowAllRelated(true)}
                            className="mt-4 bg-primary text-white px-5 py-2 rounded-full text-sm">
                            Show More
                        </button>
                    )}

                </div>
            )}
        </div>
    );
};

export default Appointment;