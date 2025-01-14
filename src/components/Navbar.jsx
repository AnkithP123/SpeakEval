import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';


let username;

let setUserName = (val) => {
  username = val;
};

const storedUsername = localStorage.getItem('username');
if (storedUsername) {
  setUserName(storedUsername);
  console.log('Username:', storedUsername);
}


let pin = null;

let setPin = (val) => {
  pin = val;
};

let getPin = () => {
  return pin;
};

const storedPin = localStorage.getItem('pin');
if (storedPin) {
  setPin(storedPin);
}

function Navbar({ setVar, setVar2, setVar3, setVar4 }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    console.log('HI');
    // Fetch the username from local storage or an API endpoint
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUserName(storedUsername);
    }

    // Fetch the pin from local storage or an API endpoint
    const storedPin = localStorage.getItem('pin');
    if (storedPin) {
      setPin(storedPin);
    }
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('gold');
    setVar3(false);
    localStorage.removeItem('ultimate');
    setVar4(false);
    localStorage.removeItem('username');
    setUserName(null);
    localStorage.removeItem('pin');
    setPin(null);
    navigate('/');
  };

  const linkClass = ({ isActive }) => isActive ? 'bg-black text-white text-base hover:bg-gray-900 hover:text-white rounded-md px-4 py-2' : 'text-white hover:bg-gray-900 text-base hover:text-white rounded-md px-3 py-2';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <nav className="bg-[#4e8cff] border-b border-gray-700 mb-8" style={{ fontFamily: "Montserrat" }}>
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex flex-1 items-center justify-center md:justify-start">
            {/* <!-- Logo --> */}
            <NavLink className="flex flex-shrink-0 items-center mr-4" to="/">
              <img
                className="h-[70px] w-[70px] ml-[-30px]"
                src={setVar ? (setVar2 ? 'crownlogo.png' : 'goldlogo.png') : 'logo.png'}
                alt=""
                onError={(e) => { e.target.src = setVar ? (setVar2 ? 'crownlogo.png' : 'goldlogo.png') : 'logo.png'; }}
              />
              <span className={setVar ? "hidden md:block text-[50px] font-bold ml-[-10px] bg-clip-text text-transparent bg-gradient-to-r from-[#EBC050] via-[#F5ED88] to-[#EBC764]" : "hidden md:block text-[#1b2932] text-[50px] font-bold ml-[-10px]"}
                style={{ fontFamily: "Montserrat" }}
              >
                peakEval
              </span>
            </NavLink>
          </div>
          <div className="flex items-center">
            {username ? (
              <div className="relative dropdown">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="text-white text-base hover:bg-gray-900 rounded-md px-3 py-2 flex items-center">
                  {username}
                  <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Logout</button>
                    <button onClick={() => navigate('/update')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Manage Configs</button>
                    {/* Add more dropdown options here */}
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleLogin} className="text-white text-base hover:bg-gray-900 rounded-md px-3 py-2">
                Teacher Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export { setUserName };
export { username };
export { pin };
export { setPin };
export { getPin };

export default Navbar;
