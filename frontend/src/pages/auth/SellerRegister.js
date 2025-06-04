import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import GooglePlacesAutocomplete from "../../components/GooglePlacesAutocomplete";

const LOGO_URL = "https://zammernow.com/assets/logo.svg";
const steps = ["Personal", "Shop", "Payment"];
const categories = ["Men", "Women", "Kids"]; // enum backend schema

const SellerRegister = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    password: "",
    mobile: "",
    address: "",
    shopName: "",
    gst: "",
    category: "",
    upi: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async () => {
    if (!formData.address.trim()) {
      toast.error("Please select a shop address from suggestions");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        firstName: formData.firstName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        mobileNumber: formData.mobile.trim(),
        shop: {
          name: formData.shopName.trim(),
          address: formData.address.trim(),
          gstNumber: formData.gst.trim(),
          category: formData.category,
        },
        bankDetails: {
          accountNumber: formData.upi.trim(),
        },
      };

      await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/sellers/register`,
        payload
      );

      toast.success("Seller registered successfully!");
      navigate("/seller/login");
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    logo: {
      height: '60px',
      marginBottom: '30px',
      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
    },
    stepper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '30px',
      gap: '20px'
    },
    stepCircle: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    stepActive: {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      border: '2px solid rgba(255, 255, 255, 0.5)',
      color: '#ffffff',
      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
      transform: 'scale(1.1)'
    },
    stepCompleted: {
      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
      border: '2px solid rgba(255, 255, 255, 0.5)',
      color: '#ffffff',
      boxShadow: '0 8px 25px rgba(72, 187, 120, 0.3)'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      padding: '40px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: '30px',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    inputField: {
      width: '100%',
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      fontSize: '16px',
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.3s ease',
      marginBottom: '20px',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      fontSize: '16px',
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.3s ease',
      marginBottom: '20px',
      boxSizing: 'border-box',
      cursor: 'pointer'
    },
    buttonPrimary: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      border: 'none',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
      marginBottom: '15px'
    },
    buttonSecondary: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    linkText: {
      textAlign: 'center',
      marginTop: '24px',
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)'
    },
    link: {
      color: 'rgba(255, 255, 255, 0.9)',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid #ffffff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      display: 'inline-block',
      marginRight: '8px'
    }
  };

  /* ---------- STEP UI ---------- */
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <h3 style={styles.sectionTitle}>Personal Details</h3>

            <input
              style={styles.inputField}
              className="register-input"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            <input
              style={styles.inputField}
              className="register-input"
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              style={styles.inputField}
              className="register-input"
              type="password"
              name="password"
              minLength={6}
              placeholder="Password (min 6 chars)"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <input
              style={styles.inputField}
              className="register-input"
              name="mobile"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="Mobile (10 digits)"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </>
        );

      case 1:
        return (
          <>
            <h3 style={styles.sectionTitle}>Shop Details</h3>

            <input
              style={styles.inputField}
              className="register-input"
              name="shopName"
              placeholder="Shop / Brand Name"
              value={formData.shopName}
              onChange={handleChange}
              required
            />

            {/* 🔑 address field now fully controlled */}
            <GooglePlacesAutocomplete
              className="register-input"
              style={styles.inputField}
              placeholder="Shop Address"
              value={formData.address}
              onChange={(val) =>
                setFormData((f) => ({ ...f, address: val }))
              }
            />

            <input
              style={styles.inputField}
              className="register-input"
              name="gst"
              placeholder="GST Number (optional)"
              value={formData.gst}
              onChange={handleChange}
            />

            <select
              style={styles.select}
              className="register-select"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        );

      case 2:
        return (
          <>
            <h3 style={styles.sectionTitle}>Payment Details</h3>

            <input
              style={styles.inputField}
              className="register-input"
              name="upi"
              placeholder="UPI ID / Bank Acc No."
              value={formData.upi}
              onChange={handleChange}
              required
            />
          </>
        );

      default:
        return null;
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .register-input:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.5);
          }
          
          .register-input:focus {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.6);
          }
          
          .register-input::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }
          
          .register-select:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.5);
          }
          
          .register-select:focus {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.6);
          }
          
          .register-select option {
            background: #2d3748;
            color: #ffffff;
          }
          
          .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4);
          }
          
          .btn-secondary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.5);
          }
          
          .register-link:hover {
            color: #ffffff;
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
          }
          
          @media (max-width: 768px) {
            .register-container {
              padding: 10px !important;
            }
            
            .register-card {
              padding: 30px 20px !important;
              margin: 10px;
            }
            
            .register-stepper {
              gap: 15px !important;
              margin-bottom: 20px !important;
            }
            
            .register-step-circle {
              width: 40px !important;
              height: 40px !important;
              font-size: 14px !important;
            }
            
            .register-section-title {
              font-size: 20px !important;
              margin-bottom: 20px !important;
            }
          }
        `}
      </style>
      
      <img src={LOGO_URL} alt="Zammer" style={styles.logo} />

      <div style={styles.stepper} className="register-stepper">
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.stepCircle,
              ...(i < step ? styles.stepCompleted : {}),
              ...(i === step ? styles.stepActive : {})
            }}
            className="register-step-circle"
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div style={styles.card} className="register-card">
        {renderStep()}

        {step === 2 ? (
          <button
            type="button"
            style={{
              ...styles.buttonPrimary,
              ...(loading ? styles.buttonDisabled : {})
            }}
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <span style={styles.spinner}></span>}
            {loading ? "Creating…" : "Create Seller Account"}
          </button>
        ) : (
          <button 
            type="button" 
            style={styles.buttonPrimary}
            className="btn-primary" 
            onClick={next}
          >
            Continue
          </button>
        )}

        {step > 0 && (
          <button 
            type="button" 
            style={styles.buttonSecondary}
            className="btn-secondary" 
            onClick={back}
          >
            Back
          </button>
        )}
      </div>

      <p style={styles.linkText}>
        Already have an account?{' '}
        <Link to="/seller/login" style={styles.link} className="register-link">
          Sign in here
        </Link>
      </p>
    </div>
  );
};

export default SellerRegister;