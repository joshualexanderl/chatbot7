"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ImageIcon, ArrowUp, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { getUserModelSettings, updateUserSelectedModel } from '@/app/actions';
import { SettingsModal } from "./settings-modal";

const placeholderPrompts = [
  "how can I implement a chatbot for my website?",
  "explain how to create a personalized customer service bot",
  "what are the best practices for chatbot conversation design?",
  "how do I integrate this chatbot with my existing website?",
  "give me ideas for implementing proactive chat suggestions",
  "what features should I add to my support chatbot?"
];

export function IdeInterfaceComponent() {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State for animated placeholder
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  
  // Animation refs
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isTypingRef = useRef<boolean>(true);
  const charIndexRef = useRef<number>(0);
  const pauseUntilRef = useRef<number>(0);
  
  // Animation timing constants (in milliseconds)
  const ANIMATION_SPEED = 4;
  const PAUSE_AFTER_TYPE = 3500;

  // Add state for showing tab button
  const [showTabButton, setShowTabButton] = useState(false);

  // Add state for model dropdown
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelDropdownPosition, setModelDropdownPosition] = useState({ top: 0, left: 0 });

  // --- New State for Model Selection --- 
  const [enabledModels, setEnabledModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  
  // --- State for Settings Modal ---
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 

  // --- Updated Fetch Logic (Moved and wrapped in useCallback) --- 
  const loadModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      // Fetch the object containing both enabled and selected
      const settings = await getUserModelSettings(); 
      
      // --- Simplified Logic --- 
      setEnabledModels(settings.enabledModels);
      setSelectedModel(settings.selectedModel);
      
    } catch (error) {
      console.error("Failed to fetch user model settings:", error);
      setEnabledModels([]); 
      setSelectedModel(null); // Default to null on error
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  // --- Initial Load Effect ---
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // --- Callback for when settings are changed in the modal ---
  const handleSettingsChanged = useCallback(() => {
     loadModels(); 
  }, [loadModels]);

  // Animation function
  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    
    const deltaTime = timestamp - lastTimeRef.current;
    const currentPrompt = placeholderPrompts[currentPromptIndex];
    
    // Handle pausing
    if (pauseUntilRef.current > timestamp) {
      // Only show tab button during pause if input is empty and we're not actively typing
      if (!isTypingRef.current && charIndexRef.current === currentPrompt.length && !prompt) {
        setShowTabButton(true);
      } else {
        setShowTabButton(false);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    
    // Hide tab button when not paused
    setShowTabButton(false);
    
    // Determine if we should update this frame
    let shouldUpdate = false;
    
    if (isTypingRef.current) {
      // When typing
      if (deltaTime >= ANIMATION_SPEED) {
        shouldUpdate = true;
        lastTimeRef.current = timestamp;
        
        if (charIndexRef.current >= currentPrompt.length) {
          // Done typing, pause before deleting
          isTypingRef.current = false;
          pauseUntilRef.current = timestamp + PAUSE_AFTER_TYPE;
        } else {
          // Continue typing
          charIndexRef.current++;
        }
      }
    } else {
      // When deleting
      if (deltaTime >= ANIMATION_SPEED) {
        shouldUpdate = true;
        lastTimeRef.current = timestamp;
        
        if (charIndexRef.current <= 0) {
          // Done deleting, switch to next prompt immediately
          isTypingRef.current = true;
          setCurrentPromptIndex((prev) => (prev + 1) % placeholderPrompts.length);
        } else {
          // Continue deleting
          charIndexRef.current--;
        }
      }
    }
    
    // Update placeholder text if needed
    if (shouldUpdate) {
      setCurrentPlaceholder(currentPrompt.substring(0, charIndexRef.current));
    }
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [currentPlaceholder, showTabButton]);
  
  // Start and clean up animation
  useEffect(() => {
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Clean up on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Set the height to either scrollHeight or max height
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 360);
      textarea.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdownElement = document.querySelector('.fixed.bg-white.rounded-md.shadow-lg');
      if (dropdownElement && !dropdownElement.contains(target) && !dropdownRef.current?.contains(target)) {
        setIsModelDropdownOpen(false);
      }
    }
    
    if (isModelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isModelDropdownOpen]);

  // Handle tab key press
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab' && showTabButton) {
      e.preventDefault();
      setPrompt(currentPlaceholder);
      setShowTabButton(false);
      // Reset the animation state to start fresh with next prompt
      isTypingRef.current = true;
      charIndexRef.current = 0;
      setCurrentPromptIndex((prev) => (prev + 1) % placeholderPrompts.length);
    }
  }, [currentPlaceholder, showTabButton]);

  // Add keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle the uploaded image
      console.log("Image uploaded:", files[0]);
      // In a real app, you would process the image here
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    // Hide tab button when user starts typing
    setShowTabButton(false);
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log("Prompt submitted:", prompt);
  };

  // --- Updated Handler for selecting a model from dropdown --- 
  const handleModelSelect = async (modelId: string) => { // Make async
    // Optimistically update UI state
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false); 

    // Call server action to persist the selection
    try {
      const result = await updateUserSelectedModel(modelId);
      if (!result.success) {
        console.error("Failed to save selected model:", result.error);
        // Optionally: Revert UI state or show an error message
      }
    } catch (error) {
       console.error("Error calling updateUserSelectedModel:", error);
       // Optionally: Revert UI state or show an error message
    }
  };

  return (
    <div className="h-full flex bg-white">
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-3xl mx-auto px-6">

          <section className="flex flex-col items-center">
            <h1 
              className="text-center font-serif font-medium mb-4 text-[clamp(42px,5vw,62px)] leading-[1.1] text-gray-900"
            >
              Build powerful chatbots
            </h1>
            <p className="text-stone-900 text-center mb-16 text-lg">
              Start with our template and customize to fit your needs
            </p>
          </section>

          {/* Input area */}
          <div className="w-full mx-auto relative max-w-[710px] rounded-2xl border border-gray-200 bg-[#f3f4f6] overflow-hidden mb-12">
            <div className="flex flex-col">
              {/* Text input section */}
              <div className="w-full relative">
                <textarea
                  ref={textareaRef}
                  className="w-full resize-none text-base focus:outline-none text-stone-900 placeholder:text-stone-900 bg-transparent px-5 py-3 min-h-[48px] max-h-[360px]"
                  placeholder={currentPlaceholder}
                  value={prompt}
                  onChange={handlePromptChange}
                  rows={1}
                />
                {showTabButton && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] bg-gray-400/20 text-gray-500 rounded hover:bg-gray-400/30 transition-colors"
                    onClick={() => {
                      setPrompt(currentPlaceholder);
                      setShowTabButton(false);
                    }}
                  >
                    tab
                  </button>
                )}
              </div>

              {/* Controls section */}
              <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  {/* --- Updated Model Selector Button --- */}
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      className="text-gray-500 flex items-center gap-1 text-sm hover:bg-gray-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        if (isLoadingModels) return; // Prevent opening while loading
                        const rect = e.currentTarget.getBoundingClientRect();
                        setModelDropdownPosition({
                          top: rect.top - 4,
                          left: rect.left
                        });
                        setIsModelDropdownOpen(!isModelDropdownOpen);
                      }}
                      disabled={isLoadingModels} // Disable while loading
                    >
                      {/* --- Updated Button Text Logic --- */} 
                      <span>
                        {isLoadingModels 
                          ? 'Loading...' 
                          : selectedModel 
                          ? selectedModel 
                          : enabledModels.length > 0 
                          ? 'Select Model' 
                          : 'No Models Enabled'} 
                      </span>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 10L4 6H12L8 10Z" fill="#6B7280"/>
                      </svg>
                    </button>
                    
                    {/* --- Updated Model selection dropdown --- */}
                    {isModelDropdownOpen && typeof document !== 'undefined' && createPortal(
                      <div 
                        className="fixed bg-white rounded-md shadow-lg border border-gray-200 w-56 z-50"
                        style={{
                          top: `${modelDropdownPosition.top}px`,
                          left: `${modelDropdownPosition.left}px`,
                          transform: 'translateY(-100%)'
                        }}
                      >
                        <div className="p-1.5">
                          {/* Dynamically generated enabled models */}
                          {enabledModels.map((modelId) => (
                            <div 
                              key={modelId}
                              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md"
                              onClick={() => handleModelSelect(modelId)}
                            >
                              <span className="text-gray-800 text-sm">{modelId}</span>
                              {selectedModel === modelId && (
                                 <Check className="h-4 w-4 text-black" strokeWidth={2} />
                              )}
                            </div>
                          ))}

                          {/* Show message if no models are enabled */}
                          {enabledModels.length === 0 && !isLoadingModels && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No models enabled. Go to Settings &gt; Models.
                            </div>
                          )}
                          
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>

                  {/* Image upload button */}
                  <button 
                    className="text-gray-500 relative group hover:bg-gray-100 p-1.5 rounded-md transition-colors" 
                    aria-label="Upload image"
                    onClick={handleImageUpload}
                  >
                    <ImageIcon className="h-5 w-5" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
                      Attach images & files
                    </div>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png,image/jpeg"
                      onChange={handleImageChange}
                    />
                  </button>
                </div>

                {/* Submit button */}
                <button 
                  className={`flex items-center justify-center h-8 w-8 rounded-full border transition-colors ${
                    prompt.trim() 
                      ? "bg-black border-black hover:bg-gray-800" 
                      : "bg-white border-gray-200 hover:bg-gray-100"
                  }`}
                  aria-label="Submit prompt"
                  onClick={handleSubmit}
                >
                  <ArrowUp className={`h-4 w-4 ${prompt.trim() ? "text-white" : "text-gray-600"}`} />
                </button>
              </div>
            </div>
          </div>
          
          <section className="w-full text-center mt-16" aria-labelledby="prompt-suggestions">
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <h2 id="prompt-suggestions" className="text-gray-800 text-sm whitespace-nowrap">
                Try these prompts:
              </h2>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full bg-white border-gray-200 text-gray-800"
                  onClick={() => {
                    setPrompt("customer support");
                    setShowTabButton(false);
                  }}
                >
                  customer support
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full bg-white border-gray-200 text-gray-800"
                  onClick={() => {
                    setPrompt("integration guide");
                    setShowTabButton(false);
                  }}
                >
                  integration guide
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full bg-white border-gray-200 text-gray-800"
                  onClick={() => {
                    setPrompt("conversation flows");
                    setShowTabButton(false);
                  }}
                >
                  conversation flows
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full bg-white border-gray-200 text-gray-800"
                  onClick={() => {
                    setPrompt("AI capabilities");
                    setShowTabButton(false);
                  }}
                >
                  AI capabilities
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full bg-white border-gray-200 text-gray-800"
                  onClick={() => {
                    setPrompt("setup tutorial");
                    setShowTabButton(false);
                  }}
                >
                  setup tutorial
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      {/* Add SettingsModal instance */}
      <SettingsModal 
         isOpen={isSettingsModalOpen} 
         setIsOpen={setIsSettingsModalOpen} 
         onSettingsChanged={handleSettingsChanged} 
       />
    </div>
  );
} 