import React from 'react'
import { Link } from 'react-router-dom'
import { FaExclamationTriangle, FaHome } from 'react-icons/fa'
import { GiMicrophone } from 'react-icons/gi'

function NotFound() {
  return (
    <section className="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <div className="flex flex-col items-center bg-white p-10 rounded-lg shadow-lg">
        <FaExclamationTriangle className='text-red-500 text-8xl mb-4'/>
        <h1 className="text-8xl font-bold mb-4 text-blue-600">404</h1>
        <p className="text-4xl font-bold mb-5 text-purple-600">Page Not Found</p>
        <GiMicrophone className='text-purple-500 text-6xl mb-4'/>
        <Link to="/" className="text-2xl text-blue-500 underline flex items-center">
          <FaHome className="mr-2"/> Go Back Home
        </Link>
      </div>
    </section>
  )
}

export default NotFound