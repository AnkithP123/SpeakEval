import React from 'react';
import { ReactTyped } from "react-typed";

const Hero = (props) => {
  return (
    <section className="hero-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl drop-shadow-lg">
            Welcome to{" "}
            <ReactTyped
              strings={props.title}
              typeSpeed={100}
              loop
              backSpeed={65}
              cursorChar="_"
              showCursor={true}
            />
          </h1>
          <p className="my-4 text-xl text-white drop-shadow-md">
            {props.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
