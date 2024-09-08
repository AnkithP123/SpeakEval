import React from 'react'
import { NavLink } from 'react-router-dom'

function Navbar() {
  const linkClass = ({ isActive }) => isActive ? 'bg-black text-white text-base hover:bg-gray-900 hover:text-white rounded-md px-4 py-2' : 'text-white hover:bg-gray-900 text-base hover:text-white rounded-md px-3 py-2'
  return (
    <nav className="bg-[#4e8cff] border-b border-gray-700 mb-8" style={{fontFamily: "Montserrat"}}>
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex flex-1 items-center justify-center md:justify-start">
            {/* <!-- Logo --> */}
            <NavLink className="flex flex-shrink-0 items-center mr-4" to="/">
              <img
                className="h-[70px] w-[70px]"
                src='public/logo.png'
                alt="Oral Examiner"
              />
              <span className="hidden md:block text-[#1b2932] text-[50px] font-bold ml-[-10px]"
                style={{fontFamily: "Montserrat"}}
              >
                peakEval
              </span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
