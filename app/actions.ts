"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/redirect";
import { revalidatePath } from "next/cache";
import { createUpdateClient } from "@/utils/update/server";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createSupabaseClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Provide a more user-friendly error message
    let errorMessage = error.message;
    
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "We couldn't find an account with these credentials. Please double-check your email and password.";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Your email hasn't been verified yet. Please check your inbox.";
    }
    
    return encodedRedirect("error", "/sign-in", errorMessage);
  }

  // Check if email is confirmed
  const user = data.user;
  if (!user.email_confirmed_at) {
    // Email not confirmed, redirect to confirmation page
    return encodedRedirect("success", `/confirmation?email=${encodeURIComponent(email)}`, "Please confirm your email to continue.");
  }

  // Revalidate the root path to refresh client state
  revalidatePath("/");
  
  // Email confirmed, redirect to home page
  return redirect("/");
};

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createSupabaseClient();

  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin}/auth/callback`,
    },
  });

  if (error) {
    // Provide a more user-friendly error message
    let errorMessage = error.message;
    
    if (error.message.includes("already registered")) {
      errorMessage = "This email is already registered. Please sign in instead.";
    } else if (error.message.includes("weak password")) {
      errorMessage = "Please use a stronger password. It should be at least 6 characters long.";
    }
    
    return encodedRedirect("error", "/sign-up", errorMessage);
  }

  // Redirect to confirmation page with the email
  return redirect(`/confirmation?email=${encodeURIComponent(email)}`);
};

export const signOutAction = async () => {
  const client = await createSupabaseClient();
  await client.auth.signOut();
  return redirect("/sign-in");
};

export async function createCheckout(priceId: string) {
  "use server";
  
  const client = await createUpdateClient();
  const { data, error } = await client.billing.createCheckoutSession(
    priceId,
    {
      redirect_url: `${new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin}/?checkout=success`
    }
  );

  if (error) {
    throw new Error("Failed to create checkout session");
  }

  return redirect(data.url);
}

// Formats UTC date string to Month Day, Year
function formatRenewalDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    // Ensure the date is valid before formatting
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string received:", dateString);
      return null;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Specify UTC to avoid local time zone shifts
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return null;
  }
}

// Server Action to get detailed subscription status
export async function getSubscriptionDetails(): Promise<{
  planName: string | null;
  subscriptionId: string | null;
  canUpgrade: boolean;
  renewalDate: string | null;
  isCancelled: boolean;
}> {
  let planName: string | null = null;
  let subscriptionId: string | null = null;
  let canUpgrade = false;
  let currentPrice = -1; 
  let renewalDate: string | null = null;
  let isCancelled = false;

  try {
    const updateClient = await createUpdateClient();
    
    // Fetch current subscription(s)
    const { data: subData, error: subError } = await updateClient.billing.getSubscriptions();

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
    } else {
      const activeSub = subData?.subscriptions?.find(
        (sub) => sub.status === 'active'
      );

      if (activeSub) {
        subscriptionId = activeSub.id;
        planName = activeSub.product?.name ?? null; 
        currentPrice = activeSub.price?.unit_amount ?? -1; 
        // Format renewal date
        renewalDate = formatRenewalDate(activeSub.current_period_end);
        // Get cancellation status
        isCancelled = activeSub.cancel_at_period_end;

         if (!planName) {
            console.warn("Active subscription found but product name is missing. Sub ID:", subscriptionId);
         }
      }
    }

    // Fetch all products to check for potential upgrades
    const { data: prodData, error: prodError } = await updateClient.billing.getProducts();
    if (prodError) {
      console.error("Error fetching products:", prodError);
    } else if (prodData?.products) {
      if (currentPrice > -1) {
         canUpgrade = prodData.products.some(product => 
           product.prices?.some(price => 
             price.unit_amount !== null && price.unit_amount > currentPrice
           )
         );
      } else {
         canUpgrade = prodData.products.some(product => 
           product.prices?.some(price => price.unit_amount !== null && price.unit_amount > 0)
         );
      }
    }

    return { planName, subscriptionId, canUpgrade, renewalDate, isCancelled };

  } catch (err) {
    console.error("Unexpected error checking subscription details:", err);
    // Return defaults including new fields
    return { planName: null, subscriptionId: null, canUpgrade: false, renewalDate: null, isCancelled: false };
  }
}

// Server Action to cancel a subscription
export async function cancelSubscriptionAction(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
   if (!subscriptionId) {
     return { success: false, error: "Subscription ID is required." };
   }
   try {
     const updateClient = await createUpdateClient();
     // Using the CORRECT method: updateSubscription with cancel_at_period_end
     const { error } = await updateClient.billing.updateSubscription(subscriptionId, {
       cancel_at_period_end: true,
     });

     if (error) {
       console.error("Error cancelling subscription:", error);
       return { success: false, error: error.message || "Failed to cancel subscription." };
     }

     revalidatePath("/"); // Revalidate relevant paths after cancellation
     revalidatePath("/pricing");
     // Consider revalidating other paths where subscription state is shown

     return { success: true };

   } catch (err: unknown) { // Use unknown instead of any
     console.error("Unexpected error cancelling subscription:", err);
     // Type check the error
     const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
     return { success: false, error: errorMessage };
   }
}

// Server Action to reactivate a subscription
export async function reactivateSubscriptionAction(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  if (!subscriptionId) {
    return { success: false, error: "Subscription ID is required." };
  }
  try {
    const updateClient = await createUpdateClient();
    const { error } = await updateClient.billing.updateSubscription(subscriptionId, {
      cancel_at_period_end: false, // Set to false to reactivate
    });

    if (error) {
      console.error("Error reactivating subscription:", error);
      return { success: false, error: error.message || "Failed to reactivate subscription." };
    }

    revalidatePath("/"); 
    revalidatePath("/pricing");
    // Consider revalidating other paths

    return { success: true };

  } catch (err: unknown) { 
    console.error("Unexpected error reactivating subscription:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}
