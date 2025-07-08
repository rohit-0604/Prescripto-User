import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';



const TopDoctors = () => {
  const {doctors} = useContext(AppContext)
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
      <h1 className="text-3xl font-medium">Top Doctors to Book</h1>
      <p className="sm:w-1/3 text-center text-sm">
        Simply browse through our extensive list of trusted doctors
      </p>

      <div className="w-full grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-5 pt-5 px-2 sm:px-0">
        {doctors.slice(0, 10).map((item, index) => (
          <div onClick={()=>navigate(`/appointment/${item._id}`)} key={index} className="border border-blue-200 rounded-xl overflow-hidden bg-white cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

            <div className="bg-blue-50 flex items-center justify-center p-2 h-44">
                <img
                src={item.image}
                alt={item.name}
                className="max-h-full max-w-full object-contain"
                />
            </div>

            <div className="p-3">
              <div className="flex items-center gap-2 text-sm text-green-500 mb-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <p>Available</p>
              </div>
              <p className="font-semibold text-sm truncate">{item.name}</p>
              <p className="text-xs text-gray-600">{item.speciality}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/doctors')}
        className="mt-6 px-5 py-1.5 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition"
      >
        More
      </button>
    </div>
  );
};

export default TopDoctors;
