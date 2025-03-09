
import React, { useState } from "react";
import { Image, Briefcase, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { usePost } from "@/context/PostContext";
import { useAuth } from "@/context/AuthContext";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const CreatePostForm: React.FC = () => {
  const { user } = useAuth();
  const { createPost } = usePost();
  const [content, setContent] = useState("");
  const [isProfessional, setIsProfessional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isSubmitting) {
      setIsSubmitting(true);
      
      createPost(content, images.length > 0 ? images : undefined, isProfessional);
      
      // Reset form
      setContent("");
      setIsProfessional(false);
      setImages([]);
      setIsSubmitting(false);
      
      toast({
        title: "Post created!",
        description: "Your post has been published successfully."
      });
    }
  };

  // For demo purposes, this just adds a placeholder image
  const handleAddImage = () => {
    if (images.length < 4) {
      setImages([...images, "/placeholder.svg"]);
    } else {
      toast({
        title: "Maximum images reached",
        description: "You can only add up to 4 images per post.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const imagePreviewVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } }
  };

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.displayName} />
              <AvatarFallback className="bg-fenix text-white">
                {user?.displayName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={`What's on your mind, ${user?.displayName.split(' ')[0]}?`}
                className="min-h-[100px] resize-none border-0 p-0 focus-visible:ring-0 text-base"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              
              <AnimatePresence>
                {images.length > 0 && (
                  <motion.div 
                    className={`grid gap-2 mt-3 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {images.map((img, index) => (
                      <motion.div 
                        key={index} 
                        className="relative group rounded-lg overflow-hidden border border-border"
                        variants={imagePreviewVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <img 
                          src={img} 
                          alt={`Upload preview ${index + 1}`} 
                          className="w-full h-auto max-h-[200px] object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="px-4 py-3 border-t flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleAddImage}
            >
              <Image className="h-4 w-4 mr-2" />
              Image
            </Button>
            
            <Toggle
              pressed={isProfessional}
              onPressedChange={setIsProfessional}
              className="gap-1"
              size="sm"
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Professional</span>
            </Toggle>
          </div>
          
          <Button 
            type="submit" 
            size="sm" 
            className="bg-fenix hover:bg-fenix-dark text-white"
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreatePostForm;
