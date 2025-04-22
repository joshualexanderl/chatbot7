'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageIcon, ArrowUp, Check, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getUserModelSettings, updateUserSelectedModel, getAnthropicResponse } from '@/app/actions'; // Keep model actions if needed in chat view
import { SettingsModal } from './settings-modal';
import { v4 as uuidv4 } from 'uuid';

// Define available models with display names within this component
// TODO: Centralize this definition later if needed
const availableModelsForDisplay = [
  { id: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus' }, 
  { id: 'claude-3-5-sonnet-20240620', displayName: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-haiku-20240307', displayName: 'Claude 3 Haiku' },
  // Add others matching the settings modal
];

// Helper to find display name from ID
const getDisplayName = (id: string | null): string | null => {
  if (!id) return null;
  const model = availableModelsForDisplay.find(m => m.id === id);
  return model ? model.displayName : id; // Fallback to ID if not found
};

// --- Types --- 
interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
}

interface ChatInterfaceProps {
  chatId: string;
  initialPrompt?: string; // Add optional initialPrompt prop
}

export function ChatInterface({ chatId, initialPrompt }: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); 

  // --- Chat State (Specific to this chat session) ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // --- Model/Settings State (Copied from IdeInterface for now) ---
  // This might need to be fetched or managed differently in a real app
  // depending on whether settings apply globally or per chat.
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelDropdownPosition, setModelDropdownPosition] = useState({ top: 0, left: 0 });
  const [enabledModels, setEnabledModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 

  // --- Load Models (Copied from IdeInterface for now) ---
  const loadModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const settings = await getUserModelSettings(); 
      setEnabledModels(settings.enabledModels);
      setSelectedModel(settings.selectedModel);
    } catch (error) {
      console.error("Failed to fetch user model settings:", error);
      setEnabledModels([]); 
      setSelectedModel(null); 
    } finally {
      setIsLoadingModels(false);
    }
  }, []); 

  // --- Effect to handle the initial prompt --- 
  useEffect(() => {
    const handleInitialPrompt = async () => {
      if (initialPrompt && messages.length === 0 && !isLoadingModels && selectedModel) { 
        console.log(`ChatInterface received initial prompt for chat ${chatId}:`, initialPrompt);
        
        const initialUserMessage: Message = {
          id: uuidv4(),
          sender: 'user',
          content: initialPrompt
        };
        // Add user message immediately
        setMessages([initialUserMessage]); 

        setIsAiResponding(true);
        if (textareaRef.current) textareaRef.current.disabled = true;
        
        try {
          // Call the server action with the initial message
          const result = await getAnthropicResponse([initialUserMessage], selectedModel);

          let aiResponseMessage: Message;
          if (result.success && result.response) {
            aiResponseMessage = {
              id: uuidv4(),
              sender: 'ai',
              content: result.response
            };
          } else {
            aiResponseMessage = {
              id: uuidv4(),
              sender: 'ai',
              content: `Error: ${result.error || 'Failed to get response from AI.'}`
            };
            console.error("AI Error:", result.error);
          }
          setMessages(prev => [...prev, aiResponseMessage]);

        } catch (error) {
          console.error("Error calling getAnthropicResponse (initial):", error);
          const errorMsg: Message = {
            id: uuidv4(),
            sender: 'ai',
            content: "An error occurred while processing your request."
          };
          setMessages(prev => [...prev, errorMsg]);
        } finally {
          setIsAiResponding(false);
          if (textareaRef.current) textareaRef.current.disabled = false;
          textareaRef.current?.focus();
        }
      }
    };

    handleInitialPrompt();
    // Dependency array includes variables needed to decide IF and HOW to run
  }, [initialPrompt, chatId, messages.length, isLoadingModels, selectedModel]); 

  // useEffect for loadModels and console log (keep chatId dependency)
  useEffect(() => {
    loadModels();
    console.log("ChatInterface mounted for chatId:", chatId);
    // Initial prompt handling is now in its own useEffect
  }, [loadModels, chatId]);

  const handleSettingsChanged = useCallback(() => {
     loadModels(); 
  }, [loadModels]);

  // ... textarea resize effect ...
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 360);
      textarea.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  // ... dropdown close effect ...
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

  // ... handleImageUpload / handleImageChange ...
  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log("Image uploaded:", files[0]);
    }
  };

  // ... handlePromptChange ...
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // --- handleSubmit for SUBSEQUENT messages --- 
  const handleSubmit = async () => {
    const currentPrompt = prompt.trim();
    if (!currentPrompt || isAiResponding || !selectedModel) {
        if (!selectedModel) console.error("Submit cancelled: No model selected");
        return; 
    }

    const newUserMessage: Message = {
      id: uuidv4(),
      sender: 'user',
      content: currentPrompt
    };
    
    // Add user message and update state immediately
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setPrompt(""); 
    
    setIsAiResponding(true); 
    if(textareaRef.current) textareaRef.current.disabled = true;
    
    try {
      console.log(`Submitting follow-up prompt for chat ${chatId}:`, currentPrompt);
      // Pass the updated message list to the action
      const result = await getAnthropicResponse(updatedMessages, selectedModel);

      let aiResponseMessage: Message;
      if (result.success && result.response) {
        aiResponseMessage = {
          id: uuidv4(),
          sender: 'ai',
          content: result.response
        };
      } else {
        aiResponseMessage = {
          id: uuidv4(),
          sender: 'ai',
          content: `Error: ${result.error || 'Failed to get response from AI.'}`
        };
        console.error("AI Error:", result.error);
      }
      // Add the AI response (or error) to the messages
      setMessages(prev => [...prev, aiResponseMessage]);

    } catch (error) {
      console.error("Error calling getAnthropicResponse (follow-up):", error);
      const errorMsg: Message = {
        id: uuidv4(),
        sender: 'ai',
        content: "An error occurred while processing your request."
      };
       // Add the error message to the messages
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiResponding(false); 
      if(textareaRef.current) textareaRef.current.disabled = false; 
      textareaRef.current?.focus(); 
    }
  };

  // --- Handler for Textarea Enter key --- 
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
        e.preventDefault(); 
        handleSubmit();
    }
  };

  // ... handleModelSelect (similar to IdeInterface) ...
  const handleModelSelect = async (modelId: string) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false); 
    try {
      await updateUserSelectedModel(modelId);
    } catch (error) {
       console.error("Error calling updateUserSelectedModel:", error);
    }
  };

  // Effect to scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- JSX for the Active Chat View --- 
  return (
    <div className="h-full flex flex-col bg-white"> 
      {/* Chat message display area */}
      <main className="flex-1 overflow-y-auto p-6 pb-24"> { /* Added padding-bottom */ }
        <div className="w-full max-w-3xl mx-auto space-y-6">
          {/* Display existing/new messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                { /* User Message Styling */ }
                {msg.sender === 'user' && (
                    <div className="max-w-[75%] px-4 py-2 rounded-xl bg-gray-100 text-gray-800">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                )}
                { /* AI Message Styling */ }
                {msg.sender === 'ai' && (
                    <div className="max-w-[90%] text-gray-800">
                        {/* AI Content - No background bubble */}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                )}
            </div>
          ))}
          
          {/* AI Loading Indicator */}
          {isAiResponding && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          {/* Element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area - Sticky at the bottom */}
      <div className="w-full max-w-3xl mx-auto px-6 pb-4 sticky bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-4">
        <div className="relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="flex flex-col">
            {/* Text input section */}
            <div className="w-full relative">
              <textarea
                ref={textareaRef}
                className="w-full resize-none text-base focus:outline-none text-stone-900 placeholder:text-gray-500 bg-transparent px-5 py-3 min-h-[48px] max-h-[360px] pr-10"
                placeholder="Ask follow-up..."
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleTextareaKeyDown}
                rows={1}
                disabled={isAiResponding}
              />
              {/* No tab button needed here */}
            </div>

            {/* Controls section */}
            <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-2">
                {/* Model Selector */}
                <div className="relative" ref={dropdownRef}>
                   <button 
                        className="text-gray-500 flex items-center gap-1 text-sm hover:bg-gray-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => {
                            if (isLoadingModels) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setModelDropdownPosition({ top: rect.top - 4, left: rect.left });
                            setIsModelDropdownOpen(!isModelDropdownOpen);
                        }}
                        disabled={isLoadingModels} 
                    >
                        <span>
                            {isLoadingModels ? 'Loading...' : getDisplayName(selectedModel) ? getDisplayName(selectedModel) : enabledModels.length > 0 ? 'Select Model' : 'No Models Enabled'} 
                        </span>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10L4 6H12L8 10Z" fill="#6B7280"/></svg>
                    </button>
                    {/* Model Dropdown Portal */}
                    {isModelDropdownOpen && typeof document !== 'undefined' && createPortal(
                        <div className="fixed bg-white rounded-md shadow-lg border border-gray-200 w-56 z-50" style={{ top: `${modelDropdownPosition.top}px`, left: `${modelDropdownPosition.left}px`, transform: 'translateY(-100%)' }}>
                            <div className="p-1.5">
                            {enabledModels.map((modelId) => {
                                const displayName = getDisplayName(modelId);
                                return (
                                    <div 
                                        key={modelId} 
                                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md" 
                                        onClick={() => handleModelSelect(modelId)}
                                    >
                                        <span className="text-gray-800 text-sm">{displayName}</span>
                                        {selectedModel === modelId && <Check className="h-4 w-4 text-black" strokeWidth={2} />}
                                    </div>
                                );
                            })}
                            {enabledModels.length === 0 && !isLoadingModels && (
                                <div className="px-3 py-2 text-sm text-gray-500 text-center"> No models enabled. Go to Settings &gt; Models. </div>
                            )}
                            </div>
                        </div>,
                    document.body)}
                </div>
                {/* Image Upload */}
                <button 
                    className="text-gray-500 relative group hover:bg-gray-100 p-1.5 rounded-md transition-colors" 
                    aria-label="Upload image" 
                    onClick={handleImageUpload}
                >
                    <ImageIcon className="h-5 w-5" />
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/png,image/jpeg" onChange={handleImageChange}/>
                </button>
              </div>
              {/* Submit Button */}
              <button 
                className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${prompt.trim() ? "bg-black text-white hover:bg-gray-800" : "bg-white text-gray-400 border border-gray-300"}`}
                aria-label="Submit prompt"
                onClick={handleSubmit}
                disabled={!prompt.trim() || isAiResponding}
              >
                {isAiResponding ? <Loader2 className="h-4 w-4 animate-spin"/> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal (Can be kept or removed depending on desired functionality) */}
      <SettingsModal 
         isOpen={isSettingsModalOpen} 
         setIsOpen={setIsSettingsModalOpen} 
         onSettingsChanged={handleSettingsChanged} 
       />
    </div>
  );
} 