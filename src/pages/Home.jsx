import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import ServicesGrid from '../components/home/ServicesGrid';
import WhyChooseUs from '../components/home/WhyChooseUs';

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const section = urlParams.get('section');

    if (section === 'contacto') {
      setTimeout(() => {
        const el = document.getElementById('contacto');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }

    if (section === 'servicios') {
      setTimeout(() => {
        const el = document.getElementById('servicios');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }

    if (!section) {
      setTimeout(() => {
        window.scrollTo(0, 0)
      })
    }
  }, [location.search]);

  return (
    <div>
      <HeroSection />
      <ServicesGrid />
      <WhyChooseUs />
    </div>
  );
}