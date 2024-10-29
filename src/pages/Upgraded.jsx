import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import './Upgraded.css';
import HomePage from './HomePage';

function Upgraded ({ set, setUltimate }) {

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    let ultimate = queryParams.get('ultimate') === 'true';
    
    useEffect(() => {
        set(true);
        setUltimate(ultimate);
    }, [set, setUltimate, ultimate]);

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
