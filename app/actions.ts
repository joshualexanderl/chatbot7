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

// --- Model Settings Types --- 
// Keep interface exported
export interface UserModelSettings {
  enabledModels: string[];
  selectedModel: string | null;
}

// Default settings constant - REMOVE export
const defaultModelSettings: UserModelSettings = {
  enabledModels: ['claude-3.5-sonnet', 'claude-3.7-sonnet', 'claude-3.7-sonnet-max'],
  selectedModel: 'claude-3.5-sonnet' 
};

/**
 * Fetches the user's model settings (enabled models and last selected model).
 * Returns default settings if no user or profile found, or if columns are null.
 */
export async function getUserModelSettings(): Promise<UserModelSettings> {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // console.warn("getUserModelSettings: No user found."); // Keep warn?
    return defaultModelSettings; 
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('enabled_models, selected_model') 
      .eq('id', user.id)
      .single(); 

    // console.log("[ACTION LOG] Raw data fetched from DB:", data); // Removed log

    if (error) {
      if (error.code === 'PGRST116') { 
        // console.warn(`getUserModelSettings: Profile not found for user ${user.id}. Returning default.`); // Keep warn?
        // console.log("[ACTION LOG] Returning default models (profile not found - PGRST116):", defaultModelSettings); // Removed log
        return defaultModelSettings;
      }
      console.error("Error fetching user model settings:", error);
      throw error; 
    }

    // Process the fetched data, providing defaults if columns are null
    const settings: UserModelSettings = {
        enabledModels: data?.enabled_models ?? defaultModelSettings.enabledModels,
        selectedModel: data?.selected_model ?? null 
    };

    // Validate if the saved selected model is actually enabled
    if (settings.selectedModel && !settings.enabledModels.includes(settings.selectedModel)) {
        // console.log(`[ACTION LOG] Saved selected model '${settings.selectedModel}' is not in enabled list. Resetting selection.`); // Removed log
        if (defaultModelSettings.selectedModel && settings.enabledModels.includes(defaultModelSettings.selectedModel)) {
             settings.selectedModel = defaultModelSettings.selectedModel;
        } else if (settings.enabledModels.length > 0) {
            settings.selectedModel = settings.enabledModels[0];
        } else {
            settings.selectedModel = null;
        }
    } else if (!settings.selectedModel && settings.enabledModels.length > 0) {
        if (defaultModelSettings.selectedModel && settings.enabledModels.includes(defaultModelSettings.selectedModel)) {
             settings.selectedModel = defaultModelSettings.selectedModel;
        } else {
            settings.selectedModel = settings.enabledModels[0];
        }
    }

    // console.log("[ACTION LOG] Returning processed user settings:", settings); // Removed log
    return settings;

  } catch (err) {
    console.error("Unexpected error in getUserModelSettings:", err);
    // console.log("[ACTION LOG] Returning default models (due to catch block):", defaultModelSettings); // Removed log
    return defaultModelSettings;
  }
}

// Server Action to update the list of enabled models
// --- MODIFIED --- Now also handles updating selected_model if it becomes disabled
export async function updateUserModelSettings(enabledIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated:", authError);
      return { success: false, error: "User not authenticated." };
    }

    // 1. Get the current selected model BEFORE updating from the CORRECT table
    const { data: currentSettings, error: fetchError } = await supabase
      .from('profiles') 
      .select('selected_model')
      .eq('id', user.id) 
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { 
       console.error("Error fetching current settings from profiles:", fetchError);
       return { success: false, error: "Failed to fetch current settings." };
    }

    const currentSelectedModel = currentSettings?.selected_model;
    let newSelectedModel = currentSelectedModel; 

    // 2. Check if the current selected model is being disabled
    if (currentSelectedModel && !enabledIds.includes(currentSelectedModel)) {
      // console.log(`Selected model '${currentSelectedModel}' is being disabled.`); // Removed log
      // 3. Determine the new selected model (first enabled or null)
      newSelectedModel = enabledIds.length > 0 ? enabledIds[0] : null;
      // console.log(`Automatically setting new selected model to: '${newSelectedModel}'`); // Removed log
    } else {
      // Ensure selected model is valid even if not changed (e.g., on first save or if current was null)
      if (currentSelectedModel && !enabledIds.includes(currentSelectedModel)) {
         newSelectedModel = enabledIds.length > 0 ? enabledIds[0] : null;
      } else if (!currentSelectedModel && enabledIds.length > 0) {
         newSelectedModel = enabledIds[0];
      }
    }

    // 4. Update BOTH enabled_models and selected_model in the CORRECT table
    const { error: updateError } = await supabase
      .from('profiles') 
      .update({ 
        enabled_models: enabledIds,
        selected_model: newSelectedModel, 
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id); 

    if (updateError) {
      console.error("Error updating user settings in profiles:", updateError);
      return { success: false, error: "Failed to update model settings." };
    }

    revalidatePath("/"); 

    return { success: true };

  } catch (err: unknown) {
    console.error("Unexpected error in updateUserModelSettings:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

// Server Action to update ONLY the selected model (used by dropdown)
// --- CORRECTED --- Use 'profiles' table and 'id' column
export async function updateUserSelectedModel(modelId: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated:", authError);
      return { success: false, error: "User not authenticated." };
    }

    const { error: updateError } = await supabase
      .from('profiles') 
      .update({ 
        selected_model: modelId,
        updated_at: new Date().toISOString(),
      })
       .eq('id', user.id); 

    if (updateError) {
      console.error("Error updating selected model in profiles:", updateError);
      return { success: false, error: "Failed to update selected model." };
    }

    revalidatePath("/");

    return { success: true };

  } catch (err: unknown) {
    console.error("Unexpected error in updateUserSelectedModel:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

// --- End Model Settings Actions --- 
