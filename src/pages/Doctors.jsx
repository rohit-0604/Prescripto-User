// src/pages/Doctors.jsx
import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Doctors = () => {
  const { speciality } = useParams();
  const { doctors } = useContext(AppContext); // This 'doctors' array now gets updated from AppContext
  const navigate = useNavigate();

  const [filterDoc, setFilterDoc] = useState([]);
  const [selectedSpeciality, setSelectedSpeciality] = useState(speciality || 'All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Unique specialities list
  const uniqueSpecialities = ['All', ...Array.from(new Set(doctors.map(doc => doc.speciality)))];

  useEffect(() => {
    const activeSpeciality = speciality || selectedSpeciality;

    if (!activeSpeciality || activeSpeciality === 'All') {
      setFilterDoc(doctors);
    } else {
      setFilterDoc(doctors.filter(doc => doc.speciality === activeSpeciality));
    }
  }, [doctors, speciality, selectedSpeciality]); // filterDoc updates when 'doctors' updates

  const handleFilterClick = (spec) => {
    setSelectedSpeciality(spec);
    navigate(spec === 'All' ? '/doctors' : `/doctors/${spec}`);
    setShowFilterMenu(false);
  };

  return (
    <div className='flex flex-col md:flex-row gap-6 px-6 relative'>

      {/* ============ MOBILE: Filter Button ============ */}
      <div className='md:hidden mb-4'>
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className='w-full bg-blue-500 text-white py-2 rounded-md text-sm font-medium shadow-sm'
        >
          {showFilterMenu ? 'Close Filters' : 'Filters'}
        </button>
      </div>

      {/* ============ MOBILE: Slide Down Filter Menu ============ */}
      {showFilterMenu && (
        <div className='absolute top-14 left-0 right-0 z-40 bg-white border-t border-gray-300 shadow-md p-4 rounded-b-md md:hidden'>
          <h2 className='text-base font-semibold mb-2'>Select Speciality</h2>
          <div className='flex flex-col gap-2'>
            {uniqueSpecialities.map((spec, index) => (
              <p
                key={index}
                className={`cursor-pointer px-3 py-2 text-sm rounded-md transition-all text-center
                  ${selectedSpeciality === spec ? 'bg-primary text-white' : 'bg-blue-100 text-gray-800'}`}
                onClick={() => handleFilterClick(spec)}
              >
                {spec}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ============ DESKTOP: Sidebar Filters ============ */}
      <div className='hidden md:block w-1/4'>
        <h2 className='text-lg font-semibold mb-4'>Specialities</h2>
        <div className='flex flex-col gap-2'>
          {uniqueSpecialities.map((spec, index) => (
            <p
              key={index}
              className={`cursor-pointer px-3 py-1 rounded-md transition-all
                ${selectedSpeciality === spec ? 'bg-primary text-white' : 'hover:bg-indigo-100'}`}
              onClick={() => handleFilterClick(spec)}
            >
              {spec}
            </p>
          ))}
        </div>
      </div>

      {/* ============ RIGHT SIDE: Doctor Cards ============ */}
      <div className='w-full md:w-3/4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2 md:mt-0'>
        {filterDoc.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(`/appointment/${item._id}`)}
            className='border border-blue-200 rounded-xl overflow-hidden bg-white cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300'
          >
            <div className='bg-blue-50 flex items-center justify-center p-2 h-44'>
              <img src={item.image} alt={item.name} className='max-h-full max-w-full object-contain' />
            </div>
            <div className='p-3'>
              {/* --- MODIFIED: Dynamic Availability Status --- */}
              <div className='flex items-center gap-2 text-sm mb-1'>
                {item.available ? ( // Check the 'available' field from the doctor object
                  <>
                    <span className='w-2 h-2 bg-green-500 rounded-full' />
                    <p className='text-green-500'>Available</p>
                  </>
                ) : (
                  <>
                    <span className='w-2 h-2 bg-red-500 rounded-full' />
                    <p className='text-red-500'>Unavailable</p>
                  </>
                )}
              </div>
              {/* --- END MODIFIED --- */}
              <p className='font-semibold text-sm truncate'>{item.name}</p>
              <p className='text-xs text-gray-600'>{item.speciality}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Doctors;
