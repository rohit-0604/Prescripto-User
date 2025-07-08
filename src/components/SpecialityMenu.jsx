import { specialityData } from '../assets/assets'
import { Link } from 'react-router-dom'

const SpecialityMenu = () => {
  return (
    <div id='speciality' className='flex flex-col items-center gap-4 py-16 text-gray-600'>
      <h1 className='text-3xl font-medium'>Find By Speciality</h1>
      <p className='sm:w-1/3 text-center text-sm'>
        Simply browse through our extensive list of trusted doctors and schedule your appointment hassle-free.
      </p>

      <div className='flex sm:justify-center gap-6 pt-5 w-full overflow-x-auto px-2'>
        {specialityData.map((item, index) => (
          <Link onClick={()=>window.scrollTo(0,0)}
            key={index}
            to={`/doctors/${item.speciality}`}
            className="flex flex-col items-center text-xs transition-all duration-300 transform hover:-translate-y-2 cursor-pointer flex-shrink-0"
          >
            <img
              className="w-16 sm:w-24 mb-2 rounded-full object-cover shadow-lg "
              src={item.image}
              alt={item.speciality}
            />
            <p className="font-medium text-gray-700">{item.speciality}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SpecialityMenu
