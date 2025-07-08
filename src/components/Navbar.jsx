import { useState, useRef, useEffect, useContext } from 'react';
import { assets } from '../assets/assets';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  // Destructure logoutUser from AppContext
  const { token, setToken, userData, loadUserProfileData, logoutUser } = useContext(AppContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect to handle token changes and initial load for user profile
  useEffect(() => {
    setIsLoadingProfile(true);
    if (token) {
      // loadUserProfileData is now responsible for handling its own 401s via interceptor
      loadUserProfileData().finally(() => {
        setIsLoadingProfile(false);
      });
    } else {
      setDropdownOpen(false);
      setShowMenu(false);
      setIsLoadingProfile(false);
    }
  }, [token, loadUserProfileData]);

  // Modified handleLogout to use the centralized logoutUser from AppContext
  const handleLogout = () => {
    logoutUser(); // Call the centralized logout function
    // The navigate('/login') and toast.info() are handled by logoutUser in AppContext
    // No need to setToken(false) or removeItem('token') here, as logoutUser does it.
    setDropdownOpen(false);
    setShowMenu(false);
  };

  const menuItems = [
    { label: 'HOME', path: '/' },
    { label: 'ALL DOCTORS', path: '/doctors' },
    { label: 'ABOUT', path: '/about' },
    { label: 'CONTACT', path: '/contact' },
  ];

  const getNavLinkClass = (text) => {
    const isDoctors = text === 'ALL DOCTORS' && location.pathname.startsWith('/doctors');
    return ({ isActive }) =>
      isActive || isDoctors
        ? 'text-primary font-semibold'
        : 'text-gray-700 hover:text-primary';
  };

  const profileImageSrc = (userData && userData.image) ? userData.image : assets.profile_pic;

  return (
    <div className='flex items-center justify-between py-4 mb-5 border-b border-gray-400 px-6 z-50 relative bg-white'>
      {/* Logo */}
      <img
        className='w-44 cursor-pointer'
        src={assets.logo}
        onClick={() => navigate('/')}
        alt="Logo"
      />

      {/* Desktop Menu */}
      <ul className='hidden md:flex items-center gap-6 font-medium'>
        {menuItems.map((item, index) => (
          <NavLink key={index} to={item.path} className={getNavLinkClass(item.label)}>
            <li className='py-1 transition-all duration-200'>{item.label}</li>
          </NavLink>
        ))}
      </ul>

      {/* Right Section */}
      <div className='flex items-center gap-4 relative'>
        {isLoadingProfile ? (
          <div className='hidden md:block w-8 h-8 rounded-full bg-gray-200 animate-pulse'></div>
        ) : token ? (
          <>
            {/* Desktop Profile Dropdown */}
            <div className='relative hidden md:block' ref={dropdownRef}>
              <div className='flex items-center gap-2 cursor-pointer'
              onClick={() => setDropdownOpen(!dropdownOpen)} >
                <img className='w-8 h-8 rounded-full object-cover' src={profileImageSrc} alt="Profile" />
                <img className='w-3' src={assets.dropdown_icon} alt="Dropdown Icon" />
              </div>
              <div className={`absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 transition-all duration-200 ease-in-out z-[9999] ${dropdownOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`} >
                <p onClick={() => { setDropdownOpen(false); navigate('/my-profile'); }} className='px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer'>MY PROFILE</p>
                <p onClick={() => { setDropdownOpen(false); navigate('/my-appointments'); }} className='px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer'>MY APPOINTMENTS</p>
                <p onClick={handleLogout} className='px-4 py-2 text-sm hover:bg-red-100 text-red-500 cursor-pointer'>LOGOUT</p>
              </div>
            </div>

            {/* Mobile Profile Pic (just image) */}
            <img
              onClick={() => navigate('/my-profile')}
              className='w-8 h-8 rounded-full md:hidden object-cover'
              src={profileImageSrc}
              alt="Profile"
            />
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className='bg-primary text-white px-6 py-2 rounded-full font-medium hidden md:block transition-all
            duration-200 hover:bg-primary-dark'
          >
            Create Account
          </button>
        )}

        {/* Mobile Menu Icon */}
        <img
          onClick={() => setShowMenu(!showMenu)}
          className='w-6 md:hidden cursor-pointer'
          src={showMenu ? assets.cross_icon : assets.menu_icon}
          alt="Menu Icon"
        />
      </div>

      {/* Mobile Menu Dropdown */}
      {showMenu && (
        <div className='md:hidden absolute top-[100%] right-6 mt-2 bg-white w-56 rounded-lg shadow-lg p-4 z-[9999] animate-slide-down'>
          <ul className='flex flex-col gap-3 text-zinc-700 font-medium text-sm'>
            {menuItems.map((item, index) => (
              <li key={index} onClick={() => { setShowMenu(false); navigate(item.path); }} className='cursor-pointer border-b pb-1'>
                {item.label}
              </li>
            ))}
            {/* Conditionally render profile menu items only if token exists and not loading */}
            {!isLoadingProfile && token && (
              <>
                <li onClick={() => { setShowMenu(false); navigate('/my-profile'); }} className="cursor-pointer border-b pb-1">
                  MY PROFILE
                </li>
                <li onClick={() => { setShowMenu(false); navigate('/my-appointments'); }} className="cursor-pointer border-b pb-1">
                  MY APPOINTMENTS
                </li>
                <li onClick={handleLogout} className="cursor-pointer text-red-500">
                  LOGOUT
                </li>
              </>
            )}
            {/* Show Create Account button on mobile if not logged in and not loading profile */}
            {!isLoadingProfile && !token && (
                <li onClick={() => { setShowMenu(false); navigate('/login'); }} className="cursor-pointer text-primary">
                    Create Account
                </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Navbar;
