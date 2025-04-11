
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initial check
    checkMobile()
    
    // Add listener for window resize
    window.addEventListener("resize", checkMobile)
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Return true by default when SSR (server side rendering)
  // This ensures mobile-friendly layout is prioritized when in doubt
  return isMobile === undefined ? false : isMobile
}

// Detects if the device is a touch device
export function useTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false)
  
  React.useEffect(() => {
    const isTouchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0

    setIsTouch(isTouchDevice)
  }, [])
  
  return isTouch
}

// Combine both hooks for ease of use
export function useDeviceDetection() {
  const isMobile = useIsMobile()
  const isTouch = useTouchDevice()
  
  return {
    isMobile,
    isTouch,
    isDesktop: !isMobile && !isTouch
  }
}
