import React from 'react'

function UpgradePanel({ basicCard = true }) {
    let coloring = basicCard ? 'from-blue-600 to-blue-400' : 'from-pink-600 to-fuchsia-400';
    let className = `w-[350px] p-6 m-[25px] rounded-lg bg-gradient-to-r ${coloring} text-white flex flex-col items-center shadow-lg`;
    return (
        <div className={className}>
            <h2 className="text-lg font-bold mb-2">{basicCard ? "SpeakEval Premium" : "SpeakEval Ultimate"}</h2>
            <h1 className="text-4xl font-bold mb-4">{basicCard ? "The Essentials" : "All The Perks"}</h1>
            <p className="text-2xl mb-4">{basicCard ? "$XX/XX" : "$YY/YY"}</p>
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
