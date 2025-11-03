import React, { useEffect } from 'react';

const RippleEffectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const createRipple = (event: MouseEvent) => {
      const button = event.currentTarget as HTMLElement;
      if (!button) return;

      button.classList.add('ripple-effect');
      const circle = document.createElement("span");
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
      circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
      circle.classList.add("ripple");

      const existingRipple = button.querySelector(".ripple");
      if (existingRipple) {
        existingRipple.remove();
      }
      button.appendChild(circle);
    };

    const applyRippleToElement = (element: HTMLElement) => {
      if (element.matches('button, [role="button"]')) {
        element.removeEventListener("click", createRipple as EventListener);
        element.addEventListener("click", createRipple as EventListener);
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              applyRippleToElement(el);
              el.querySelectorAll('button, [role="button"]').forEach(applyRippleToElement as (el: Element) => void);
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial scan
    document.querySelectorAll('button, [role="button"]').forEach(applyRippleToElement as (el: Element) => void);

    return () => {
      observer.disconnect();
      // Clean up listeners on unmount, although this component will live for the app's lifetime
      document.querySelectorAll('button, [role="button"]').forEach(element => {
          element.removeEventListener("click", createRipple as EventListener);
      });
    };
  }, []);

  return <>{children}</>;
};

export default RippleEffectProvider;
