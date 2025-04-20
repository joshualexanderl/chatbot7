'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, User, CreditCard, ArrowUpCircle, XCircle, LayoutGrid, RefreshCcw } from 'lucide-react';
import { createSupabaseClient } from '@/utils/supabase/client';
import { getSubscriptionDetails, cancelSubscriptionAction, reactivateSubscriptionAction } from '@/app/actions';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { cn } from "@/lib/utils";
import { Menu, Transition } from '@headlessui/react';

interface SettingsModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Extend state type for subscription details
interface SubscriptionDetailsState {
  planName: string | null;
  subscriptionId: string | null;
  canUpgrade: boolean;
  renewalDate: string | null;
  isCancelled: boolean;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string: string | null): string {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function SettingsModal({ isOpen, setIsOpen }: SettingsModalProps) {
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetailsState>({ planName: null, subscriptionId: null, canUpgrade: false, renewalDate: null, isCancelled: false });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMessage, setCancelSuccessMessage] = useState<string | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [reactivateError, setReactivateError] = useState<string | null>(null);
  const [reactivateSuccessMessage, setReactivateSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'account' | 'subscription'>('account');

  useEffect(() => {
    async function fetchData() {
      if (isOpen) {
        setIsLoading(true);
        setCancelError(null);
        setCancelSuccessMessage(null);
        setReactivateError(null);
        setReactivateSuccessMessage(null);
        try {
          const supabase = createSupabaseClient();
          const { data: { user } } = await supabase.auth.getUser();
          setUserEmail(user?.email ?? null);

          const details = await getSubscriptionDetails();
          setSubscriptionDetails(details);

        } catch (error) {
          console.error("Error fetching settings data:", error);
          setUserEmail(null);
          setSubscriptionDetails({ planName: null, subscriptionId: null, canUpgrade: false, renewalDate: null, isCancelled: false });
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchData();
  }, [isOpen]);

  async function handleCancel() {
    if (!subscriptionDetails.subscriptionId) return;

    setIsCancelling(true);
    setCancelError(null);
    setCancelSuccessMessage(null);
    setReactivateError(null);
    setReactivateSuccessMessage(null);
    try {
      const result = await cancelSubscriptionAction(subscriptionDetails.subscriptionId);
      if (result.success) {
        const details = await getSubscriptionDetails();
        setSubscriptionDetails(details);
        setCancelSuccessMessage("Subscription cancellation scheduled.");
      } else {
        setCancelError(result.error || "Failed to cancel subscription.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setCancelError(message);
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleReactivate() {
    if (!subscriptionDetails.subscriptionId) return;
    setIsReactivating(true);
    setReactivateError(null);
    setReactivateSuccessMessage(null);
    setCancelError(null);
    setCancelSuccessMessage(null);
    try {
      const result = await reactivateSubscriptionAction(subscriptionDetails.subscriptionId);
      if (result.success) {
        const details = await getSubscriptionDetails();
        setSubscriptionDetails(details);
        setReactivateSuccessMessage("Subscription reactivated successfully.");
      } else {
        setReactivateError(result.error || "Failed to reactivate subscription.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setReactivateError(message);
    } finally {
      setIsReactivating(false);
    }
  }

  function closeModal() {
    setIsOpen(false);
  }

  if (!isOpen) return null;

  const displayPlanName = subscriptionDetails.planName ? capitalizeFirstLetter(subscriptionDetails.planName) : 'Free';
  const isPaidPlan = !!subscriptionDetails.planName;

  const features = isPaidPlan ? [
    "Everything in Free",
    "Extended limits",
    "Standard and advanced voice mode",
    "Access to deep research",
    "Create custom GPTs",
    "Access to Sora (limited)",
    "Early access to new features"
  ] : [
    "Basic chatbot features",
    "Standard response speed",
    "Community support"
  ];

  const renderAccountContent = () => (
    <section aria-labelledby="account-heading" className="space-y-4">
       <h2 id="account-heading" className="text-lg font-semibold text-gray-900">Account Information</h2>
       <dl className="space-y-3">
         <div className="flex justify-between">
           <dt className="text-sm text-gray-600">Email address</dt>
           <dd className="text-sm font-medium text-gray-800">{userEmail ?? '-'}</dd>
         </div>
       </dl>
    </section>
  );

  const renderSubscriptionContent = () => (
    <section aria-labelledby="subscription-heading" className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 id="subscription-heading" className="text-lg font-semibold text-gray-900">{displayPlanName} Plan</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isPaidPlan 
              ? subscriptionDetails.isCancelled 
                ? `Plan cancelled. Access ends on ${subscriptionDetails.renewalDate || '[Date Unavailable]'}`
                : `Your plan auto-renews on ${subscriptionDetails.renewalDate || '[Date Unavailable]'}`
              : "Current plan details"}
          </p>
        </div>
        {isPaidPlan && (
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button as={Fragment}>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                <div className="px-1 py-1 ">
                  {subscriptionDetails.canUpgrade && (
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/pricing" passHref>
                          <button
                            onClick={closeModal}
                            className={`${ active ? 'bg-indigo-500 text-white' : 'text-gray-900' } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                             <ArrowUpCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                            Upgrade plan
                          </button>
                        </Link>
                      )}
                    </Menu.Item>
                  )}
                  {subscriptionDetails.subscriptionId && (
                    <Menu.Item>
                      {({ active }) => (
                        subscriptionDetails.isCancelled ? (
                          <button
                            onClick={handleReactivate}
                            disabled={isReactivating}
                            className={`${ active ? 'bg-green-100 text-green-700' : 'text-green-600' } group flex w-full items-center rounded-md px-2 py-2 text-sm ${isReactivating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isReactivating ? (
                              <Spinner className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                              <RefreshCcw className="mr-2 h-5 w-5" aria-hidden="true" />
                            )}
                            Reactivate Subscription
                          </button>
                        ) : (
                          <button
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className={`${ active ? 'bg-red-100 text-red-700' : 'text-red-600' } group flex w-full items-center rounded-md px-2 py-2 text-sm ${isCancelling ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isCancelling ? (
                              <Spinner className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                            )}
                            Cancel Subscription
                          </button>
                        )
                      )}
                    </Menu.Item>
                  )}
                </div>
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link href="/pricing" passHref>
                         <button
                            onClick={closeModal}
                            className={`${ active ? 'bg-gray-100 text-gray-900' : 'text-gray-700' } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            <LayoutGrid className="mr-2 h-5 w-5" aria-hidden="true" />
                            View Plans
                          </button>
                      </Link>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {isPaidPlan ? "Thanks for subscribing! Features include:" : "Your Free plan includes:"}
        </h3>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2 mt-0.5" aria-hidden="true" />
              <span className="text-sm text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-4 text-center h-5">
         {cancelSuccessMessage && (
            <p className="text-sm text-green-600"> {cancelSuccessMessage}</p>
         )}
         {cancelError && (
            <p className="text-sm text-red-600">Error: {cancelError}</p>
         )}
         {reactivateSuccessMessage && (
            <p className="text-sm text-green-600"> {reactivateSuccessMessage}</p>
         )}
         {reactivateError && (
            <p className="text-sm text-red-600">Error: {reactivateError}</p>
         )}
      </div>

    </section>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl flex h-[75vh]">
        <div className="w-48 flex-shrink-0 border-r border-gray-200 p-4 space-y-1 bg-gray-50/50">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Settings</h3>
          <button
            onClick={() => setActiveTab('account')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-left",
              activeTab === 'account' 
                ? 'bg-gray-200 text-gray-900' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <User className="h-5 w-5" />
            <span>Account</span>
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-left",
              activeTab === 'subscription' 
                ? 'bg-gray-200 text-gray-900' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <CreditCard className="h-5 w-5" />
            <span>Subscription</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex justify-end items-center p-3 border-b border-gray-200 flex-shrink-0">
            <button
              type="button"
              className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={closeModal}
              aria-label="Close settings"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12 h-full">
                <Spinner className="h-8 w-8 text-gray-500" />
              </div>
            ) : (
              activeTab === 'account' ? renderAccountContent() : renderSubscriptionContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 