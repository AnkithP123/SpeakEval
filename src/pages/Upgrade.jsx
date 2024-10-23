import React from 'react'
import UpgradePanel from '../components/UpgradePanel'

function Upgrade() {
    return (
        <div className="flex justify-center items-center h-screen" style={{ transform: 'translateY(-25px)' }}>
            <UpgradePanel />
            <UpgradePanel basicCard={false} />
        </div>
    )
}

export default Upgrade