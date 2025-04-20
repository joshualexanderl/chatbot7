import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/utils/supabase/server";
import { ArrowUpRight } from "lucide-react";
import { createUpdateClient } from "@/utils/update/server";

export default async function Header() {
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const updateClient = await createUpdateClient()
  const { data: { subscriptions } } = await updateClient.billing.getSubscriptions();

  const isAuthenticated = user != null
  const isPaid = subscriptions != null && subscriptions.length > 0 && subscriptions[0].status === 'active'

  return (
    <header className="py-6 px-10 flex items-center justify-between flex-shrink-0">
    <div className="flex items-center gap-3">
      {/* Logo with menu button - conditional rendering based on logoVisible */}
      {/* {logoVisible && ( */}
        <div className="flex items-center justify-start gap-3 h-[26px]">
          <div 
            // onClick={toggleSidebar} 
            className="cursor-pointer transition-transform hover:scale-110 duration-200"
          >
            {/* Custom hamburger with thinner lines */}
            <div className="flex flex-col justify-center gap-1 w-4 h-4">
              <div className="w-4 h-[1px] bg-zinc-800 rounded-full"></div>
              <div className="w-4 h-[1px] bg-zinc-800 rounded-full"></div>
              <div className="w-4 h-[1px] bg-zinc-800 rounded-full"></div>
            </div>
          </div>
          <span 
            // className={`font-bold text-2xl text-zinc-900 transition-all duration-200 ease-in-out ${
            //   // logoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            // }`}
            // USE CN!!!!!!
            className={`font-bold text-2xl text-zinc-900 transition-all duration-200 ease-in-out`}
            style={{ 
              lineHeight: '26px', 
              marginTop: '-3px'
            }}
          >start</span>
        </div>
      {/* )} */}
    </div>
    
    <div className="flex items-center">
        {(!isPaid && isAuthenticated) && <Link 
          className="relative inline-flex items-center justify-center gap-1 whitespace-nowrap transition-colors focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-stone-900 text-stone-100 hover:bg-stone-800 px-4 py-2 h-10 rounded-full text-sm font-medium shadow-none"
          // onClick={() => router.push('/pricing')}
          href="/pricing"
        >
          Upgrade 
          <ArrowUpRight className="h-4 w-4" />
        </Link>}
        {!isAuthenticated && 
        <div className="flex items-center gap-4">
          <Link href="/sign-up">
            <button 
              className="relative inline-flex items-center justify-center gap-1 whitespace-nowrap transition-colors focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 hover:bg-stone-100 text-stone-900 active:bg-stone-200 px-4 py-2 h-10 rounded-full text-sm font-medium shadow-none"
            >
              Sign up
            </button>
          </Link>
          <Link href="/sign-in">
            <Button 
              className="relative inline-flex items-center justify-center gap-1 whitespace-nowrap transition-colors focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-stone-900 text-stone-100 hover:bg-stone-800 px-4 py-2 h-10 rounded-full text-sm font-medium shadow-none" 
            >
              Log in
            </Button>
          </Link>
        </div>}
    </div>
  </header>
  );
}
