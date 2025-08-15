"use client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PracticeExamGradingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new practice exams structure
    navigate("/practice-exams");
  }, [navigate]);

  return null;
};

export default PracticeExamGradingPage;
