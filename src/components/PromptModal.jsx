"use client";

import { useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";

export default function PromptModal({
  isOpen,
  onClose,
  prompt,
  setPrompt,
  onSave,
}) {
  const modalRef = useRef(null);
  const textareaRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus the textarea when modal opens
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Place cursor at the end of text
        textareaRef.current.selectionStart = textareaRef.current.value.length;
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div
        ref={modalRef}
        className="relative bg-slate-800 border border-purple-500/30 rounded-xl w-full max-w-lg mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-purple-700/20 p-4 border-b border-purple-500/30">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">
              Edit Prompt Message
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-64 p-4 bg-black/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-700/10 p-4 border-t border-purple-500/30 flex justify-end">
          <button
            onClick={() => {
              onClose();
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded-md mr-2 hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(prompt);
              onClose();
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-md hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
