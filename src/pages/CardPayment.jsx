import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FaEnvelope } from 'react-icons/fa';    
import { toast } from 'react-toastify';
import { cuteAlert } from 'cute-alert';

const stripePromise = loadStripe('pk_test_51QCpfHGxVnRgHRhaU2TgiigH5ewsnLfrzD7lrsNqYajRwibsFhJdSfu5xvNsPDQfj0UMxltdhnt9i54GngVp1q6900QGJZqNGP');

const CardPaymentPanel = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { subscriptionData, teacherPin } = location.state || {};
    
    const stripe = useStripe();
    const elements = useElements();
    
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    console.log(subscriptionData, teacherPin);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Start loading state

        if (!stripe || !elements) {
            return;
        }

        const cardElement = elements.getElement(CardElement);

        // Create the payment method with Stripe
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: 'Customer Name', // Replace with real customer name
                email: email, // Add email to billing details
            },
        });

        if (error) {
            console.error('[Error]', error);
            setLoading(false); // Stop loading if there is an error
        } else {
            console.log('[PaymentMethod]', paymentMethod);

            if (subscriptionData.planType === 'subscribe') {
            // Send the payment method, subscription data, teacherPin, and email to your backend
                try {
                    const response = await fetch('https://backend-4abv.onrender.com/create-session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            paymentMethodId: paymentMethod.id,
                            subscriptionData,
                            teacherPin,
                            email,
                        }),
                    });

                    const result = await response.json();
                    
                    console.log(result);

                    // Redirect to success page if payment is successful
                    if (result.error) {
                        console.error(result.error);
                        toast.error('Error processing payment: ' + result.error);
                        cuteAlert({
                            type: 'error',
                            title: 'An error occurred',
                            description: result.error,
                            primaryButtonText: 'OK'
                        });
                        return;
                    }
                    navigate('/');
                    toast.success('Payment Successful');
                    cuteAlert({
                        type: 'success',
                        title: 'Payment Successful',
                        description: 'You have successfully subscribed to ' + subscriptionData.tier + '. ' + result.message,
                        primaryButtonText: 'OK'
                    });
                } catch (err) {
                    console.error('Error processing payment:', err);
                } finally {
                    setLoading(false); // Stop loading after processing
                }
            } else {
                // Send the payment method, subscription data, and email to your backend
                try {
                    const response = await fetch('https://backend-4abv.onrender.com/create-session', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            paymentMethodId: paymentMethod.id,
                            subscriptionData,
                            teacherPin,
                            email,
                        }),
                        
                    });

                    const result = await response.json();
                    
                    console.log(result);

                    // Redirect to success page if payment is successful
                    if (result.error) {
                        console.error(result.error);
                        toast.error('Error processing payment: ' + result.error);
                        cuteAlert({
                            type: 'error',
                            title: 'An error occurred',
                            description: result.error,
                            primaryButtonText: 'OK'
                        });
                        return;
                    }
                    navigate('/');
                    toast.success('Payment Successful');
                    cuteAlert({
                        type: 'success',
                        title: 'Payment Successful',
                        description: 'You have successfully purchased ' + subscriptionData.tier + '. ' + result.message,
                        primaryButtonText: 'OK'
                    });
                } catch (err) {
                    console.error('Error processing payment:', err);
                } finally {
                    setLoading(false); // Stop loading after processing
                }
            }
        }
    };

    // Styles for the form
const formStyle = {
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '5px'
};

// Styles for the CardElement container
const cardElementStyle = {
        marginBottom: '20px'
};

// Options for the CardElement
const cardElementOptions = {
        style: {
                base: {
                        fontSize: '16px'
                }
        }
};

// Styles for the submit button
const buttonStyle = {
        padding: '10px 20px',
        backgroundColor: '#6772e5',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
};


    return (
        <div className="flex justify-center items-center h-screen">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h1 className="text-xl font-bold mb-4">Enter your Card Information</h1>
                <p className="mb-4">You are subscribing to: {subscriptionData?.tier}</p>
                <p className="mb-4">Teacher Pin: {teacherPin}</p>

                {/* Form with Stripe CardElement */}
                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={cardElementStyle}>
                        <label htmlFor="email" className="sr-only">Email:</label>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <FaEnvelope style={{ marginRight: '5px', color: 'dddfe6', fontSize: '24px' }} />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email"
                                style={{ width: '100%', padding: '5px', border: 'none', outline: 'none', borderRadius: '0', '::placeholder': { color: 'crimson' } }}
                            />
                        </div>
                    </div>
                    <div style={cardElementStyle}>
                        <CardElement options={{ ...cardElementOptions, style: { base: { ...cardElementOptions.style.base, '::placeholder': { color: '#9ca3af' } } } }} />
                    </div>
                    <button type="submit" disabled={!stripe || loading} style={buttonStyle}>
                        {loading ? 'Processing...' : 'Pay'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function CardPayment() {
    return (
        <Elements stripe={stripePromise}>
                <CardPaymentPanel />
        </Elements>
    );
}

export default CardPayment;
