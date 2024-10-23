import React from 'react';
import { useStripe, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe outside of component (replace with your publishable key)
const stripePromise = loadStripe('pk_test_51QCpfHGxVnRgHRhaU2TgiigH5ewsnLfrzD7lrsNqYajRwibsFhJdSfu5xvNsPDQfj0UMxltdhnt9i54GngVp1q6900QGJZqNGP');

// Separate the internal component that uses useStripe
function UpgradePanelContent({ basicCard = true }) {
    const stripe = useStripe();
    let coloring = basicCard ? 'from-blue-600 to-blue-400' : 'from-pink-600 to-fuchsia-400';
    let className = `w-[400px] p-6 px-[50px] m-[25px] rounded-[15px] bg-gradient-to-r ${coloring} text-white flex flex-col items-center shadow-lg`;

    const buy = async () => {
        if (!stripe) {
            console.error('Stripe has not been initialized');
            return;
        }

        console.log('buying');
        let tier = basicCard ? 'Premium' : 'Ultimate';
        let price = basicCard ? 5 : 10;
        
        try {
            const response = await fetch('https://backend-4abv.onrender.com/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tier: tier,
                    price: price
                })
            });

            const { id } = await response.json();

            const result = await stripe.redirectToCheckout({
                sessionId: id
            });

            if (result.error) {
                console.error(result.error);
            }
        } catch (error) {
            console.error('Error during checkout:', error);
        }
    };

    return (
        <div className={className}>
            <h2 className="text-lg font-bold mb-2">{basicCard ? "SpeakEval Premium" : "SpeakEval Ultimate"}</h2>
            <h1 className="text-[32px] font-bold mb-4">{basicCard ? "The Essentials" : "All the Perks"}</h1>
            <p className="text-2xl mb-4">{basicCard ? "$XX/XX" : "$YY/YY"}</p>
            <ul className="space-y-2 mb-6 text-center">
                <li>ꕥ {basicCard ? "10 Max Questions" : "Unlimited Max Questions"}</li>   
                <li>ꕥ {basicCard ? "Pro Grading AI" : "Pro Max Grading AI"}</li>
                <li>ꕥ Placeholder perk</li>
            </ul>
            <button 
                className="bg-white text-purple-600 font-medium py-2 px-4 rounded-md hover:bg-gray-100" 
                onClick={buy}
                disabled={!stripe}
            >
                Subscribe
            </button>
        </div>
    );
}

// Wrapper component that provides Stripe context
function UpgradePanel(props) {
    return (
        <Elements stripe={stripePromise}>
            <UpgradePanelContent {...props} />
        </Elements>
    );
}

export default UpgradePanel;