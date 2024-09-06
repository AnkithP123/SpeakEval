import React from 'react'
import { Link } from 'react-router-dom'
import { FaExclamationTriangle } from 'react-icons/fa'

function Maintainence() {
  return (
    <section className="text-center flex flex-col justify-center items-center h-96">
        <FaExclamationTriangle className='text-yellow-400 text-6xl mb-4'/>
        <h1 className="text-6xl font-bold mb-4">Error</h1>
        <p className="text-4xl font-bold mb-5">Site is down/Under maintaince</p>
    </section>
  )
}

export default Maintainence