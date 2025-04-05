
// Re-export toast and useToast hook from the hooks folder
// Make sure to prioritize exporting the standalone toast function first
export { toast, useToast } from "@/hooks/use-toast";

// Also re-export the types if needed
export type {
  ToastProps,
  ToastActionElement,
} from "@/components/ui/toast";
