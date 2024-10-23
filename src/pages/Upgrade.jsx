import React from 'react'
import UpgradePanel from '../components/UpgradePanel'

function Upgrade() {
    //return upgrade bannel with blue background
    return (
        <div className="flex justify-center items-center h-screen bg-blue-400">
            <UpgradePanel />
        </div>
    )
}

export default Upgrade