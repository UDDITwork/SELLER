import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import GooglePlacesAutocomplete from "../../components/GooglePlacesAutocomplete";
import "./SellerRegister.css";

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

  /* ---------- STEP UI ---------- */
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <h3 className="section-title">Personal Details</h3>

            <input
              className="input-field"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            <input
              className="input-field"
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              className="input-field"
              type="password"
              name="password"
              minLength={6}
              placeholder="Password (min 6 chars)"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <input
              className="input-field"
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
            <h3 className="section-title">Shop Details</h3>

            <input
              className="input-field"
              name="shopName"
              placeholder="Shop / Brand Name"
              value={formData.shopName}
              onChange={handleChange}
              required
            />

            {/* 🔑 address field now fully controlled */}
            <GooglePlacesAutocomplete
              className="input-field"
              placeholder="Shop Address"
              value={formData.address}
              onChange={(val) =>
                setFormData((f) => ({ ...f, address: val }))
              }
            />

            <input
              className="input-field"
              name="gst"
              placeholder="GST Number (optional)"
              value={formData.gst}
              onChange={handleChange}
            />

            <select
              className="input-field"
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
            <h3 className="section-title">Payment Details</h3>

            <input
              className="input-field"
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
    <div className="seller-register">
      <img src={LOGO_URL} alt="Zammer" className="logo" />

      <div className="stepper">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`step-circle ${
              i < step ? "completed" : i === step ? "active" : ""
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="form-card">
        {renderStep()}

        {step === 2 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating…" : "Create Seller Account"}
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={next}>
            Continue
          </button>
        )}

        {step > 0 && (
          <button type="button" className="btn-secondary" onClick={back}>
            Back
          </button>
        )}
      </div>

      <p className="link-text">
        Already have an account? <Link to="/seller/login">Sign in here</Link>
      </p>
    </div>
  );
};

export default SellerRegister;
