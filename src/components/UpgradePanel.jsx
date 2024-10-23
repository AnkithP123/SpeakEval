import React from 'react'

function UpgradePanel() {
  return (
    <div className="w-72 p-6 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white flex flex-col items-center shadow-lg">
      <h2 className="text-lg font-bold mb-2">NITRO BASIC</h2>
      <h1 className="text-4xl font-bold mb-4">The Essentials</h1>
      <p className="text-2xl mb-4">$2.99 / month</p>
      <ul className="space-y-2 mb-6 text-center">
        <li>✔️ Custom emoji anywhere</li>
        <li>✔️ 50MB uploads</li>
        <li>✔️ Custom app icons</li>
      </ul>
      <button className="bg-white text-purple-600 font-medium py-2 px-4 rounded-md hover:bg-gray-100">
        Subscribe
      </button>
    </div>
  )
}

export default UpgradePanel