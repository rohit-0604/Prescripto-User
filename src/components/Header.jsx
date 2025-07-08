import { assets } from '../assets/assets'

const Header = () => {
  return (
    <div className='flex flex-col md:flex-row bg-primary rounded-lg px-6 md:px-10 lg:px-20'>
      {/* Left Side */}
      <div className='md:w-1/2 flex flex-col justify-center gap-6 py-10 md:py-[8vw]'>
        <p className='text-3xl md:text-4xl text-white font-semibold leading-tight'>
          Book Appointment <br /> With Trusted Doctors
        </p>
        
        <div className='flex items-start gap-3 text-white text-sm font-light'>
          <img className='w-28' src={assets.group_profiles} alt='Group Profiles' />
          <p>
            Simply browse through our extensive list of trusted, <br className='hidden sm:block' />
            doctors and book an appointment that suits you best hassle-free.
          </p>
        </div>

        <a href='#speciality'
          className='flex items-center gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm 
                     hover:scale-105 transition-transform duration-300 w-max'
        >
          Book Appointment
          <img className='w-3' src={assets.arrow_icon} alt='Arrow Icon' />
        </a>
      </div>

      {/* Right Side */}
      <div className='md:w-1/2 relative mt-6 md:mt-0'>
        <img
          className='w-full md:absolute bottom-0 right-0 h-auto rounded-lg object-cover'
          src={assets.header_img}
          alt='Header'
        />
      </div>
    </div>
  )
}

export default Header
