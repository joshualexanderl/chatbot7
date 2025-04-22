"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronDown,
  MoreHorizontal,
  Share,
  Pencil,
  Trash2,
  FolderPlus,
  Plus,
  Mail,
  ArrowRight,
  Settings,
  LogOut,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/client";
import { SettingsModal } from "./settings-modal";

export interface SidebarProps {
  className?: string;
  onToggleCollapse?: () => void;
  collapsed?: boolean;
  isAuthenticated: boolean;
  activePlanName: string | null;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string: string | null): string {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function SidebarComponent({ className, onToggleCollapse, collapsed = false, isAuthenticated, activePlanName }: SidebarProps) {
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      
      // Fix: Don't close profile menu if the click is on the profile button itself
      const profileButton = document.querySelector('.profile-button');
      if (
        profileMenuRef.current && 
        !profileMenuRef.current.contains(event.target as Node) &&
        !(profileButton && profileButton.contains(event.target as Node))
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCollapseClick = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const toggleWorkspace = () => setIsWorkspaceCollapsed(!isWorkspaceCollapsed);
  const toggleHistory = () => setIsHistoryCollapsed(!isHistoryCollapsed);

  const handleSignOut = async () => {
    const client = createSupabaseClient();
    await client.auth.signOut();
    router.push('/sign-in');
    router.refresh();
  };

  // Custom X Logo Component
  const XLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      shapeRendering="geometricPrecision" 
      textRendering="geometricPrecision" 
      imageRendering="optimizeQuality" 
      fillRule="evenodd" 
      clipRule="evenodd" 
      viewBox="0 0 512 462.799" 
      {...props}
    >
      <path 
        fillRule="nonzero" 
        d="M403.229 0h78.506L310.219 196.04 512 462.799H354.002L230.261 301.007 88.669 462.799h-78.56l183.455-209.683L0 0h161.999l111.856 147.88L403.229 0zm-27.556 415.805h43.505L138.363 44.527h-46.68l283.99 371.278z"
        fill="currentColor"
      />
    </svg>
  );

  // Simplified social link component
  const SocialLink = ({ icon: Icon, text, href }: { icon: React.ElementType, text: string, href: string }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-3 text-sm text-stone-700 hover:text-stone-900 transition-colors"
    >
      <Icon className="h-4 w-4 text-stone-500" />
      <span>{text}</span>
    </a>
  );

  // --- Define the callback for settings changes --- 
  const handleSettingsChanged = () => {
    console.log("[Sidebar] Settings changed, refreshing router...");
    router.refresh();
  };

  return (
    <div
      className={cn(
        "relative flex flex-col h-full border-r border-stone-200 bg-stone-50 transition-all duration-300 ease-in-out", 
        collapsed ? "w-0" : "w-[260px]", 
        className
      )}
      style={{
        "--sidebar-mask": "linear-gradient(to right, black calc(100% - 80px), transparent calc(100% - 20px))"
      } as React.CSSProperties}
    >
      {!collapsed && (
        <>
          <div className="flex items-center justify-between p-4 flex-shrink-0">
            <div className="flex items-center h-[26px]">
              <span 
                className="font-bold text-2xl text-zinc-900" 
                style={{ lineHeight: '26px', marginTop: '-3px' }}
              >
                start
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full transition-all duration-300 ease-in-out hover:bg-stone-200"
              onClick={handleCollapseClick}
            >
              <ChevronLeft className="h-4 w-4" /> 
            </Button>
          </div>
          
          <div className="px-3 py-2 flex-shrink-0">
            <Button
              variant="ghost"
              className="w-full text-stone-700 hover:bg-stone-200 px-1.5"
              onClick={() => router.push('/')}
            >
              <div className="flex items-center gap-2 w-full">
                <Plus className="h-4 w-4" />
                <span>New project</span>
              </div>
            </Button>
          </div>

          <Separator className="bg-stone-200"/>

          <ScrollArea className="flex-1 px-3 py-2">
            <div className="mb-2">
              <button 
                className="flex items-center justify-between w-full px-1.5 py-1.5 text-sm font-bold text-stone-700 rounded-md"
                onClick={toggleWorkspace}
              >
                <span className="text-left">Workspace</span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform text-stone-500",
                    isWorkspaceCollapsed ? "-rotate-90" : ""
                  )}
                />
              </button>
              {!isWorkspaceCollapsed && (
                <div className="mt-1 space-y-1 animate-in fade-in duration-200">
                   <Button variant="ghost" className="justify-start w-full text-stone-700 hover:bg-stone-200 text-sm px-1.5">
                     <div className="flex items-center gap-2 w-full text-left">
                       <span>📖</span> <span>Context</span>
                     </div>
                   </Button>
                   <Button variant="ghost" className="justify-start w-full text-stone-700 hover:bg-stone-200 text-sm px-1.5">
                     <div className="flex items-center gap-2 w-full text-left">
                       <span>📄</span> <span>Files</span>
                     </div>
                   </Button>
                   <Button variant="ghost" className="justify-start w-full text-stone-700 hover:bg-stone-200 text-sm px-1.5">
                     <div className="flex items-center gap-2 w-full text-left">
                       <span>🔍</span> <span>Search</span>
                     </div>
                   </Button>
                   <Button variant="ghost" className="justify-start w-full text-stone-700 hover:bg-stone-200 text-sm px-1.5">
                     <div className="flex items-center gap-2 w-full text-left">
                       <span>💻</span> <span>Code</span>
                     </div>
                   </Button>
                   <Button variant="ghost" className="justify-start w-full text-stone-700 hover:bg-stone-200 text-sm px-1.5">
                     <div className="flex items-center gap-2 w-full text-left">
                       <span>⌨️</span> <span>Terminal</span>
                     </div>
                   </Button>
                </div>
              )}
            </div>

            <Separator className="bg-stone-200 my-3"/>

            <div className="mb-2">
              <button 
                className="flex items-center justify-between w-full px-1.5 py-1.5 text-sm font-bold text-stone-700 rounded-md"
                onClick={toggleHistory}
              >
                <span className="text-left">History</span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform text-stone-500",
                    isHistoryCollapsed ? "-rotate-90" : ""
                  )}
                />
              </button>
              {!isHistoryCollapsed && (
                <div className="mt-1 space-y-1 animate-in fade-in duration-200">
                  {[0, 1].map((index) => (
                    <div 
                      key={index}
                      className="group relative flex items-center w-full px-1.5 py-2 text-sm text-stone-700 hover:bg-stone-200 rounded-lg transition-colors"
                    >
                      <div className="relative grow overflow-hidden whitespace-nowrap text-left" style={{ maskImage: "var(--sidebar-mask)" }}>
                        {index === 0 ? "Chat about landing page design" : "Refactoring the login component"}
                      </div>
                      <button 
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded absolute right-1"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === index ? null : index);
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4 text-stone-500" />
                      </button>
                      {activeDropdown === index && (
                        <div 
                          ref={dropdownRef}
                          className="absolute right-0 top-8 w-[200px] bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <button className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 text-stone-700">
                            <Share className="h-4 w-4" />
                            <span>Share</span>
                          </button>
                          <button className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 text-stone-700">
                            <Pencil className="h-4 w-4" />
                            <span>Rename</span>
                          </button>
                          <button className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 text-stone-700">
                            <FolderPlus className="h-4 w-4" />
                            <span>Add to project</span>
                          </button>
                          <Separator className="my-1" />
                          <button className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 text-red-600">
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Conditionally render the entire Upgrade section (Separator + Button div) */}
          {isAuthenticated && !activePlanName && (
            <>
              <Separator className="bg-stone-200"/>
              <div className="px-3 py-2 flex flex-col gap-y-1 flex-shrink-0">
                <Button 
                  variant="outline"
                  className="w-full justify-start gap-2 border-stone-200 text-stone-700 hover:bg-stone-200"
                  onClick={() => router.push('/pricing')}
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Upgrade Plan</span>
                </Button>
              </div>
            </>
          )}
          
          {/* Social Feedback Section (Separator is now only rendered once) */}
          <Separator className="bg-stone-200"/>
          <div className="px-5 py-4">
            <h3 className="text-sm font-medium text-stone-800 mb-3">Feedback? DM us!</h3>
            <div className="space-y-2.5">
              <SocialLink icon={XLogo} text="@wymi_" href="https://x.com/wymi_" />
              <SocialLink icon={Mail} text="Contact us" href="mailto:feedback@example.com" /> 
            </div>
          </div>

          {/* Profile Section (Moved here) */}
           <div className="p-3 border-t border-stone-200">
             <div className="relative">
               <button 
                 className="w-full h-10 bg-stone-50 text-stone-900 hover:bg-stone-200 rounded-lg flex items-center px-4 shadow-none profile-button"
                 onClick={(e) => {
                   e.stopPropagation();
                   setShowProfileMenu(!showProfileMenu);
                 }}
               >
                 <div className="flex items-center gap-2 grow">
                   <User className="h-4 w-4 flex-shrink-0" />
                   <span>Profile</span>
                   {/* Use PROP for tag */}
                   <span className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded-full">
                     {activePlanName ? capitalizeFirstLetter(activePlanName) : 'Free'}
                   </span>
                 </div>
                 <ChevronDown className={cn(
                   "h-4 w-4 transition-transform flex-shrink-0 ml-2",
                   showProfileMenu ? "rotate-180" : ""
                 )} />
               </button>
               
               {showProfileMenu && (
                 <div 
                   ref={profileMenuRef}
                   className="absolute bottom-full left-0 w-full bg-white rounded-lg shadow-lg border border-stone-200 py-1 mb-1"
                 >
                   <button 
                     className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-stone-100 text-stone-700"
                     onClick={() => {
                       setIsSettingsModalOpen(true);
                       setShowProfileMenu(false); // Close profile menu when opening modal
                     }}
                   >
                     <Settings className="h-4 w-4" />
                     <span>Settings</span>
                   </button>
                   <Separator className="my-1" />
                   <button 
                     className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-stone-100 text-red-600"
                     onClick={handleSignOut}
                   >
                     <LogOut className="h-4 w-4" />
                     <span>Sign out</span>
                   </button>
                 </div>
               )}
             </div>
           </div>
        </>
      )}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        setIsOpen={setIsSettingsModalOpen} 
        onSettingsChanged={handleSettingsChanged} 
      />
    </div>
  );
} 