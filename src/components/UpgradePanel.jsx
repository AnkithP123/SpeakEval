import React, { useState } from 'react';
import { useStripe, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe outside of component
const stripePromise = loadStripe('pk_test_51QCpfHGxVnRgHRhaU2TgiigH5ewsnLfrzD7lrsNqYajRwibsFhJdSfu5xvNsPDQfj0UMxltdhnt9i54GngVp1q6900QGJZqNGP');

function UpgradePanelContent({ basicCard = true, onSubscribe }) {
    const stripe = useStripe();
    const [subscriptionType, setSubscriptionType] = useState('monthly'); // 'monthly' or 'yearly'
    
    let coloring = basicCard ? 'from-blue-600 to-blue-400' : 'from-pink-600 to-fuchsia-400';
    let className = `w-[400px] p-6 px-[50px] m-[25px] rounded-[15px] bg-gradient-to-r ${coloring} text-white flex flex-col items-center shadow-lg`;

    const handleAction = () => {
        let tier = basicCard ? 'Premium' : 'Ultimate';
        // Call the onSubscribe callback for subscriptions
        onSubscribe({ tier, months: 0, subscriptionType, planType: 'subscribe' });
    };

    const displayPrice = () => {
        if (subscriptionType === 'monthly') {
            return `$${basicCard ? 10 : 15}/month`;
        } else {
            const monthlyPrice = basicCard ? 10 : 15;
            const yearlyPrice = basicCard ? 100 : 150;
            const savings = Math.round((1 - (yearlyPrice / (monthlyPrice * 12))) * 100);
            return (
                <div className="flex items-center">
                    <span>${yearlyPrice}/year</span>
                    <span className={"ml-2 " + (basicCard ? "bg-blue-700 bg-opacity-70" : "bg-fuchsia-700 bg-opacity-70") + " text-white text-xs font-bold py-1 px-2 rounded-full"}>
                        Save {savings}%!
                    </span>
                </div>
            );
        }
    };

    return (
        <div className={className}>
            <h2 className="text-lg font-bold mb-2">{basicCard ? "SpeakEval Premium" : "SpeakEval Ultimate"}</h2>
            <h1 className="text-[32px] font-bold mb-4">{basicCard ? "The Essentials" : "All the Perks"}</h1>
            <p className="text-2xl mb-4">{displayPrice()}</p>

            <ul className="space-y-2 mb-6 text-center">
                <li>ꕥ {basicCard ? "25 → 50 Max Questions" : "25 → Unlimited Max Questions"}</li>   
                <li>ꕥ {basicCard ? "3 → 10 Max Runs Per Room" : "3 → Unlimited Max Runs Per Room"}</li>   
                <li>ꕥ {basicCard ? "Basic → Pro Grading AI" : "Basic → Pro Max Grading AI"}</li>
                <li>ꕥ {basicCard ? "Better Transcriptions!" : "Advanced Transcriptions!"}</li>
                <li>✔ {basicCard ? "No Transcription Queue" : "No Transcription Queue"}</li>
                <li>{basicCard ? "✘ Grading Limit (6 → 30 per minute)" : "✔ No Grading Limit"}</li>
                <li>{basicCard ? "✔ Rubric Fill From Other Exams" : "✔ Rubric Fill From Other Exams"}</li>
                <li>{basicCard ? "✔ Question Fill From Other Exams" : "✔ Question Fill From Other Exams"}</li>
                <li>{basicCard ? "✘ No Fill From AI" : "✔ Question And Rubric Fill From AI"}</li>
            </ul>

            {/* Subscription Type Toggle */}
            <div className="flex flex-row items-center mb-6">
                <button
                    className={`py-2 px-4 w-1/2 rounded-l-md ${subscriptionType === 'monthly' ? 'bg-opacity-30 bg-white text-black font-bold' : 'bg-opacity-60 text-white'}`}
                    onClick={() => setSubscriptionType('monthly')}
                >
                    <strong>Monthly</strong>
                </button>
                <div className="h-full w-[1px] bg-gray-200 bg-opacity-50 mx-1"></div>
                <button
                    className={`py-2 px-4 w-1/2 rounded-r-md ${subscriptionType === 'yearly' ? 'bg-opacity-30 bg-white text-black font-bold' : 'bg-opacity-60 text-white'}`}
                    onClick={() => setSubscriptionType('yearly')}
                >
                    <strong>Yearly</strong>
                </button>
            </div>

            <div className="mt-auto">
                <button 
                    className={`font-medium py-2 px-4 rounded-md ${(basicCard ? 'bg-blue-800' : 'bg-fuchsia-800') + ' bg-opacity-80 text-white hover:bg-opacity-60'}`}
                    onClick={handleAction}
                >
                    <label>Subscribe</label>
                </button>
            </div>
        </div>
    );
}

function UpgradePanel(props) {
    return (
        <Elements stripe={stripePromise}>
            <UpgradePanelContent {...props} />
        </Elements>
    );
}

export default UpgradePanel;
