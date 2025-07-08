// src/pages/MyProfile.jsx
import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from '../assets/assets'; // Make sure assets contains user_icon and upload_icon
import { toast } from 'react-toastify'; // Ensure react-toastify is installed and imported

const MyProfile = () => {
  const { userData, updateProfileFrontend } = useContext(AppContext);
  const [isEdit, setIsEdit] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const [localUserData, setLocalUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: { line1: '', line2: '' },
    dob: '',
    gender: '',
    image: ''
  });

  useEffect(() => {
    if (userData && typeof userData === 'object' && Object.keys(userData).length > 0) {
      setLocalUserData({
        ...userData,
        address: userData.address || { line1: '', line2: '' }
      });
      setImageFile(null);
    }
  }, [userData]);

  const handleSaveInformation = async () => {
    const formData = new FormData();

    // Now, 'name' can also be updated, so we append its value from localUserData
    formData.append('name', localUserData.name || '');
    formData.append('phone', localUserData.phone || '');
    formData.append('address', JSON.stringify(localUserData.address || {}));
    formData.append('dob', localUserData.dob || '');
    formData.append('gender', localUserData.gender || '');

    if (imageFile) {
      formData.append('image', imageFile);
    }

    const success = await updateProfileFrontend(formData);

    if (success) {
      setIsEdit(false);
      setImageFile(null);
    } else {
      // Error message already displayed by toast from AppContext
    }
  };

  if (!userData || typeof userData !== 'object' || Object.keys(localUserData).length === 0) {
    return (
      <div className="max-w-lg flex flex-col gap-4 justify-center items-center h-[calc(100vh-150px)]">
        <p className="text-xl text-gray-600">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg flex flex-col gap-2 text-sm">

      {/* Image Display and Edit */}
      {isEdit ? (
        <label htmlFor="imageUpload" className="relative w-36 h-36 rounded-full overflow-hidden cursor-pointer flex items-center justify-center border border-gray-300">
          <img
            src={imageFile ? URL.createObjectURL(imageFile) : (localUserData.image || assets.user_icon)}
            alt="Profile"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xs font-bold opacity-0 hover:opacity-100 transition-opacity">
            <img src={assets.upload_icon} alt="Upload" className="w-8 h-8" />
          </div>
          <input
            onChange={(e) => setImageFile(e.target.files[0])}
            type="file"
            id="imageUpload"
            hidden
            accept="image/*"
          />
        </label>
      ) : (
        <img className="w-36 h-36 rounded-full object-cover" src={localUserData.image || assets.user_icon} alt="Profile" />
      )}

      {/* Name - Now editable */}
      {isEdit ? (
        <input
          className="bg-gray-100 mt-4 px-3 py-2 text-3xl font-medium text-neutral-800"
          type="text"
          value={localUserData.name || ''}
          onChange={(e) => setLocalUserData(prev => ({ ...prev, name: e.target.value }))}
        />
      ) : (
        <p className="font-medium text-3xl text-neutral-800 mt-4">{localUserData.name || 'N/A'}</p>
      )}

      <hr className="bg-zinc-400 h-[1px] border-none" />

      <div>
        <p className="text-neutral-500 underline mt-3">CONTACT INFORMATION</p>
        <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
          <p className="font-medium">Email Id:</p>
          <p className="text-blue-500">{localUserData.email || 'N/A'}</p>

          <p className="font-medium">Phone:</p>
          {isEdit ? (
            <input
              className="bg-gray-100 max-w-52"
              type="text"
              value={localUserData.phone || ''}
              onChange={(e) => setLocalUserData(prev => ({ ...prev, phone: e.target.value }))}
            />
          ) : (
            <p className="text-blue-400">{localUserData.phone || 'N/A'}</p>
          )}

          <p className="font-medium">Address:</p>
          {isEdit ? (
            <div className="flex flex-col gap-2">
              <input
                className="bg-gray-100"
                value={localUserData.address?.line1 || ''}
                onChange={(e) => setLocalUserData(prev => ({
                  ...prev,
                  address: { ...(prev.address || {}), line1: e.target.value }
                }))}
                type="text"
              />
              <input
                className="bg-gray-100"
                value={localUserData.address?.line2 || ''}
                onChange={(e) => setLocalUserData(prev => ({
                  ...prev,
                  address: { ...(prev.address || {}), line2: e.target.value }
                }))}
                type="text"
              />
            </div>
          ) : (
            <p className="text-gray-500">
              {localUserData.address?.line1 || 'N/A'}<br />
              {localUserData.address?.line2 || 'N/A'}
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="text-neutral-500 underline mt-3">BASIC INFORMATION</p>
        <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
          <p className="font-medium">Gender:</p>
          {isEdit ? (
            <select
              className="max-w-20 bg-gray-100 rounded-sm"
              onChange={(e) => setLocalUserData(prev => ({ ...prev, gender: e.target.value }))}
              value={localUserData.gender || ''}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          ) : (
            <p className="text-gray-500">{localUserData.gender || 'N/A'}</p>
          )}

          <p className="font-medium">Date Of Birth:</p>
          {isEdit ? (
            <input
              className="max-w-28 bg-gray-100"
              type="date"
              onChange={(e) => setLocalUserData(prev => ({ ...prev, dob: e.target.value }))}
              value={localUserData.dob || ''}
            />
          ) : (
            <p className="text-gray-500">{localUserData.dob || 'N/A'}</p>
          )}
        </div>
      </div>

      <div className="mt-10">
        {isEdit ? (
          <button
            className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white"
            onClick={handleSaveInformation}
          >
            Save Information
          </button>
        ) : (
          <button
            className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white"
            onClick={() => setIsEdit(true)} // This button sets isEdit to true
          >
            Edit
          </button>
        )}
      </div>

    </div>
  );
};

export default MyProfile;