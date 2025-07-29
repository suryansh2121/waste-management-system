import { useState, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { FaMapMarkerAlt, FaRoute, FaLeaf } from 'react-icons/fa'; 

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [stats, setStats] = useState({ bins: 0, waste: 0, cities: 0 });
  const navigate = useNavigate();

  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        bins: prev.bins < 1500 ? prev.bins + 50 : 1500,
        waste: prev.waste < 10000 ? prev.waste + 200 : 10000,
        cities: prev.cities < 25 ? prev.cities + 1 : 25,
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleLoginClick = (role) => {
    navigate('/login', { state: { role } });
    setShowLoginModal(false);
  };

  const scrollToFeatures = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="homepage-container">
      
      <nav className="navbar">
        <div className="logo">SmartWaste</div>
        <ul className="nav-links">
          <li><a href="#home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</a></li>
          <li><a href="#features" onClick={scrollToFeatures}>Features</a></li>
          <li><a href="#about">About</a></li>
          <li><button className="nav-btn" onClick={() => setShowLoginModal(true)}>Get Started</button></li>
        </ul>
      </nav>

      
      <header className="hero-section" id="home">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="hero-title">Smart Waste Management</h1>
          <p className="hero-subtitle">Revolutionizing Cleanliness with Technology</p>
          <motion.button
            className="get-started-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowLoginModal(true)}
          >
            Start Now
          </motion.button>
        </motion.div>
      </header>

      
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            className="login-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="modal-content">
              <button className="close-btn" onClick={() => setShowLoginModal(false)}>×</button>
              <h2>Choose Your Role</h2>
              <button className="modal-btn" onClick={() => handleLoginClick('citizen')}>
                Login as Citizen
              </button>
              <button className="modal-btn" onClick={() => handleLoginClick('worker')}>
                Login as Contributer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      <section className="features-section" id="features">
        <h2>Why Choose Smart Waste Management?</h2>
        <div className="features">
          {[
            {
              icon: <FaMapMarkerAlt />,
              title: 'Live Tracking',
              desc: 'Monitor nearby dustbins with real-time fill levels on an interactive map.',
            },
            {
              icon: <FaRoute />,
              title: 'Route Optimization',
              desc: 'Workers receive optimized routes to efficiently clean full bins.',
            },
            {
              icon: <FaLeaf />,
              title: 'Eco-Friendly',
              desc: 'Reduce overflow and pollution with smart waste management solutions.',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

     
      <section className="stats-section">
        <h2>Our Impact</h2>
        <div className="stats">
          <div className="stat-card">
            <h3>{stats.bins}+</h3>
            <p>Bins Managed</p>
          </div>
          <div className="stat-card">
            <h3>{stats.waste}kg</h3>
            <p>Waste Collected</p>
          </div>
          <div className="stat-card">
            <h3>{stats.cities}</h3>
            <p>Cities Covered</p>
          </div>
        </div>
      </section>

    
      <section className="about-section" id="about">
        <h2>About Us</h2>
        <p>
          Smart Waste Management is dedicated to creating cleaner, greener cities through innovative technology.
          Our platform connects citizens and workers to ensure efficient waste collection and disposal.
        </p>
        <motion.button
          className="learn-more-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToFeatures}
        >
          Explore Features
        </motion.button>
      </section>

   
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>SmartWaste</h3>
            <p>Made by Suryansh</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#about">About</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Stay Updated</h3>
            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </footer>
    </div>
  );
}