import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Upgraded.css';
import HomePage from './HomePage';

const Upgraded = ({ set, setUltimate }) => {
    const navigate = useNavigate();
    let { ultimate } = useParams();

    useEffect(() => {
        set(true);
        setUltimate(ultimate);

        // Delay navigation until after the peel effect
        const peelTimeout = setTimeout(() => {
            navigate('/');
        }, 2500); // Match the animation duration in CSS

        return () => clearTimeout(peelTimeout);
    }, [navigate, set, setUltimate, ultimate]);

    return (
        <>
            
                <><div className="gold-cover">
                    {[...Array(100)].map((_, i) => (
                        <div key={i} className="gold-square" />
                    ))}
                </div>
                <HomePage /></>
        </>
    );
};

export default Upgraded;
