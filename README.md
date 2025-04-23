# Chabot Starter: Next.js SaaS Template with Billing

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19+-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4+-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Update](https://img.shields.io/badge/Update-Billing-purple?style=flat-square)](https://update.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_Example-3ECF8E?style=flat-square&logo=supabase)](https://supabase.come/)

**Keywords:** Chatbot Template, SaaS Starter, Next.js Template, React Template, Subscription Billing, Stripe Integration, Update, Supabase Auth, Tailwind CSS, Auth Provider

This repository provides a robust starter template for building SaaS (Software as a Service) applications, specifically geared towards chatbot services, but easily adaptable for other ideas. It's built with Next.js, React, TypeScript, and Tailwind CSS, featuring pre-integrated user authentication (example using Supabase, compatible with others via Update) and subscription billing (via Update, which handles Stripe).

Get your chatbot SaaS up and running quickly with essential features already built-in!

## ✨ Features

*   **Next.js 15:** Leverages the latest features of the Next.js App Router.
*   **React 19 & TypeScript:** Modern, type-safe frontend development.
*   **Tailwind CSS 4:** Utility-first CSS framework for rapid UI development.
*   **Shadcn UI:** Beautifully designed, accessible UI components built on Radix UI and Tailwind.
*   **Flexible Authentication:** Example integration with Supabase Auth provided, but easily configurable with other auth providers supported by Update.
*   **Update & Stripe Billing:** Handles subscription management, pricing tiers, and checkout sessions via Update, powered by Stripe. SaaS-ready out of the box!
*   **Protected Routes:** Example setup for pages accessible only to logged-in users.
*   **Subscription Management UI:** Components for displaying pricing, handling checkout, managing current subscriptions (cancel/reactivate), and displaying status.
*   **Basic Chat Interface Structure:** (You'll need to add your specific chat logic here)
*   **ESLint & Prettier:** Configured for code quality and consistent formatting.

## 🚀 Getting Started

Follow these steps to get the project running locally and configured for your own SaaS application.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [Git](https://git-scm.com/)
*   An account with an Authentication Provider compatible with Update (this template provides an example setup using [Supabase](https://supabase.com/), other examples include [Clerk](https://clerk.com/), [Firebase Auth](https://firebase.google.com/docs/auth)). Generally, if your provider can issue a secure JWT, it should be compatible.
*   An [Update](https://update.dev/) account (for billing - connects to your auth provider & Stripe account)
*   A [Stripe](https://stripe.com/) account (connected via Update)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url> # Replace with your repo URL if forked
    cd chabot-starter
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Run the Development Server (Initial):**
    *   It's often helpful to start the server now to see initial UI and potential errors:
        ```bash
        npm run dev
        ```
    *   The app will likely show errors until configuration is complete. Open [http://localhost:3000](http://localhost:3000).

4.  **Set up Update & Connect Services:**
    *   Go to [Update](https://update.dev/) and create an account.
    *   In the Update dashboard:
        *   Connect your chosen Authentication Provider (this template uses Supabase as the example).
        *   Connect your Stripe account.

5.  **Configure Your Authentication Provider (Example: Supabase):**
    *   If using Supabase: Go to your [Supabase Project Dashboard](https://supabase.com/).
    *   Set up desired Authentication methods (e.g., Email/Password, Google) under the `Authentication` -> `Providers` section.
    *   Ensure your application URL (`http://localhost:3000` for local dev, `https://your-app.com` for prod) is listed in the Supabase `Authentication` -> `URL Configuration` settings.
    *   If using a different provider (like Supabase, Clerk, Firebase Auth, etc.), just paste your JWT when connecting your auth provider to Update. Consult the official [Update Documentation](https://update.dev/docs) for details on integrating various auth providers.

    *   **(If using Supabase) Set up Database Schema:**
        *   Navigate to the **SQL Editor** section in your Supabase project dashboard (Database -> SQL Editor).
        *   Open the `setup_db.sql` file located in the root of this repository.
        *   Copy the entire content of the script.
        *   Paste the script into a new query tab in the Supabase SQL Editor and click **Run**. This will create the necessary tables (e.g., user profiles) and helper functions required by the template's example logic.

6.  **Set up Environment Variables:**
    *   Copy the example environment file if you haven't already:
        ```bash
        cp .env.example .env.local
        ```
    *   Open `.env.local` and paste in the required keys:
        *   `NEXT_PUBLIC_UPDATE_PUBLISHABLE_KEY`: From your Update dashboard.
        *   `NEXT_PUBLIC_SUPABASE_URL`: From your Supabase project settings (Needed *if* using the Supabase example).
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From your Supabase project settings (Needed *if* using the Supabase example).
        *   `NEXT_PUBLIC_SITE_URL`: Set to `http://localhost:3000` for local development, or your production URL.

7.  **Create Billing Products in Update:**
    *   In the Update dashboard, go to the **Entitlements** section.
    *   Create an entitlement representing access levels (e.g., `pro`, `premium`).
    *   Go to the **Billing** section.
    *   Create your billing Products (e.g., "Pro Plan Monthly", "Pro Plan Yearly").
    *   For each Product, create Prices (e.g., $10/month).
    *   Crucially, **link each Product to the corresponding Entitlement** you created (e.g., link "Pro Plan Monthly" to the `pro` entitlement).
    *   Once configured, these products/prices should automatically appear on the `/pricing` page in your local application (you might need to restart the dev server).

### Running the Development Server (Final)

If you stopped the server, run it again:

```bash
npm run dev
# or
# yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## ✅ SaaS Ready: Billing & Subscriptions

This template is designed to help you launch a paid SaaS product quickly:

*   **Pricing Page:** Fetches products and prices directly from your Update configuration.
*   **Checkout:** Integrated checkout flow using `Update.billing.createCheckoutSession`.
*   **Subscription Management:** Users can view their current plan, see renewal dates, cancel, and reactivate subscriptions.
*   **Protected Content:** Easily restrict access to features based on user authentication status (and potentially subscription status in further development).

## 🛠️ Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) 15+ (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) 4+
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (@radix-ui/react, headlessui)
*   **Authentication:** Configured example with [Supabase](https://supabase.come/) (@supabase/ssr, @supabase/supabase-js). (Integrates with Update, which supports various providers).
*   **Billing & Subscriptions:** [Stripe](https://stripe.com/) managed via [Update](https://update.dev/) (@Update/js)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Linting/Formatting:** ESLint

## 🎯 Contributing

Contributions, issues, and feature requests are welcome! Please follow standard procedures for pull requests and issue reporting.