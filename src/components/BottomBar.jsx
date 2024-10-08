import React from 'react'
import { NavLink } from 'react-router-dom'

function BottomBar() {
    return (
        <nav className="bg-[#4e8cff] border-b border-gray-700" style={{fontFamily: "Montserrat"}}>
            <div className="mx-auto px-2 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-center">
                    <div className="flex flex-1 items-center justify-center">
                        <span className="text-white text-base">
                            Created by Ankith Prabhakar with Nikunj Bafna
                        </span>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default BottomBar
