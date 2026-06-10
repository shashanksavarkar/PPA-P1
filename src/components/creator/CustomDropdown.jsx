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
        className={`flex justify-between items-center w-full px-3.5 py-2.5 text-[0.8rem] font-bold bg-white border border-border rounded-xl cursor-pointer text-left transition-all duration-200 outline-none hover:border-slate-300 focus:border-accent focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)] ${
          selectedOption ? "text-text-primary" : "text-text-secondary"
        }`}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        {isOpen ? (
          <ChevronUp size={15} className="text-text-secondary transition-transform duration-200" />
        ) : (
          <ChevronDown size={15} className="text-text-secondary transition-transform duration-200" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border border-border rounded-xl mt-1.5 shadow-lg shadow-slate-100/50 z-50 max-h-[240px] overflow-y-auto animate-[slideIn_0.15s_ease] py-1 border-slate-100">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3.5 py-2.5 text-[0.78rem] font-bold cursor-pointer transition-colors duration-150 ${
                value === opt.value 
                  ? "bg-bg-tertiary text-accent font-extrabold" 
                  : "text-slate-700 bg-transparent hover:bg-bg-tertiary hover:text-accent"
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
