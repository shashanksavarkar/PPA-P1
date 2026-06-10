import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const CustomDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex justify-between items-center w-full px-3 py-2.5 text-[0.82rem] font-semibold bg-white border border-border rounded-lg cursor-pointer text-left transition-all duration-200 outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-glow)] ${
          selectedOption ? "text-text-primary" : "text-text-secondary"
        }`}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        {isOpen ? (
          <ChevronUp size={16} className="text-text-secondary" />
        ) : (
          <ChevronDown size={16} className="text-text-secondary" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border border-border rounded-lg mt-1.5 shadow-lg z-1000 max-h-[240px] overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2.5 text-[0.82rem] font-semibold text-text-primary cursor-pointer transition-colors duration-150 ${
                value === opt.value ? "bg-bg-tertiary" : "bg-transparent hover:bg-bg-tertiary"
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
