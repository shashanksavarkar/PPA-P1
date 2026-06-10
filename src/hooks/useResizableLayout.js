import { useState, useEffect, useRef } from "react";
import { getLocal } from "../utils/storage";

export const useResizableLayout = () => {
  const containerRef = useRef(null);
  const rightColumnRef = useRef(null);

  const [layout, setLayout] = useState({
    col1Width:  getLocal("ppa_col1_width", 30),
    col2Width:  getLocal("ppa_col2_width", 45),
    col3Height: getLocal("ppa_col3_height", 55),
    dragging:   "none",
    isDesktop:  typeof window !== "undefined" ? window.innerWidth > 1024 : true
  });
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { col1Width, col2Width, col3Height, dragging, isDesktop } = layout;

  useEffect(() => {
    const onResize = () => setLayout(p => ({ ...p, isDesktop: window.innerWidth > 1024 }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (dragging === "none") return;
    const onMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (dragging === "col1") {
        const val = ((e.clientX - rect.left) / rect.width) * 100;
        if (val >= 15 && val <= 50) { 
          setLayout(p => ({ ...p, col1Width: val })); 
          localStorage.setItem("ppa_col1_width", JSON.stringify(val)); 
        }
      } else if (dragging === "col2") {
        const col2Val = ((e.clientX - rect.left) / rect.width) * 100 - (sidebarCollapsed ? 0 : col1Width);
        const totalVal = col2Val + (sidebarCollapsed ? 0 : col1Width);
        if (col2Val >= 20 && totalVal <= 85) { 
          setLayout(p => ({ ...p, col2Width: col2Val })); 
          localStorage.setItem("ppa_col2_width", JSON.stringify(col2Val)); 
        }
      } else if (dragging === "col3" && rightColumnRef.current) {
        const rRect = rightColumnRef.current.getBoundingClientRect();
        const val = ((e.clientY - rRect.top) / rRect.height) * 100;
        if (val >= 15 && val <= 85) { 
          setLayout(p => ({ ...p, col3Height: val })); 
          localStorage.setItem("ppa_col3_height", JSON.stringify(val)); 
        }
      }
    };
    const onUp = () => { 
      setLayout(p => ({ ...p, dragging: "none" })); 
      document.body.style.cursor = ""; 
      document.body.style.userSelect = ""; 
    };
    document.body.style.cursor     = (dragging === "col1" || dragging === "col2") ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => { 
      document.removeEventListener("mousemove", onMove); 
      document.removeEventListener("mouseup", onUp); 
    };
  }, [dragging, col1Width, sidebarCollapsed]);

  const startDragging = (type) => {
    setLayout(p => ({ ...p, dragging: type }));
  };

  return {
    containerRef,
    rightColumnRef,
    col1Width,
    col2Width,
    col3Height,
    dragging,
    isDesktop,
    sidebarCollapsed,
    setSidebarCollapsed,
    startDragging
  };
};
