# Chabot Starter: Next.js SaaS Template with Billing

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![UpdateDev](https://img.shields.io/badge/UpdateDev-Billing-purple?style=flat-square)](https://update.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.io/)

**Keywords:** Chatbot Template, SaaS Starter, Next.js Template, React Template, Subscription Billing, Stripe Integration, UpdateDev, Supabase Auth, Tailwind CSS

This repository provides a robust starter template for building SaaS (Software as a Service) applications, specifically geared towards chatbot services, but easily adaptable for other ideas. It's built with Next.js, React, TypeScript, and Tailwind CSS, featuring pre-integrated user authentication (Supabase) and subscription billing (via UpdateDev, which handles Stripe).

Get your chatbot SaaS up and running quickly with essential features already built-in!

## ✨ Features

*   **Next.js 14:** Leverages the latest features of the Next.js App Router.
*   **React & TypeScript:** Modern, type-safe frontend development.
*   **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
*   **Shadcn UI:** Beautifully designed, accessible UI components built on Radix UI and Tailwind.
*   **Supabase Auth:** Secure and easy-to-implement user authentication.
*   **UpdateDev Billing:** Handles subscription management, pricing tiers, and checkout sessions (powered by Stripe). SaaS-ready out of the box!
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
*   A [Supabase](https://supabase.io/) account (for authentication)
*   An [UpdateDev](https://update.dev/) account (for billing - connects to your Stripe account)
*   A [Stripe](https://stripe.com/) account (connected via UpdateDev)

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

4.  **Set up UpdateDev & Connect Services:**
    *   Go to [UpdateDev](https://update.dev/) and create an account.
    *   In the UpdateDev dashboard:
        *   Connect your Authentication Provider (Supabase).
        *   Connect your Stripe account.

5.  **Configure Supabase:**
    *   Go to your [Supabase Project Dashboard](https://supabase.com/).
    *   Set up desired Authentication providers (e.g., Email/Password, Google) under the `Authentication` -> `Providers` section.
    *   Ensure your application URL (`http://localhost:3000` for local dev, `https://your-app.com` for prod) is listed in the Supabase `Authentication` -> `URL Configuration` settings.

6.  **Set up Environment Variables:**
    *   Copy the example environment file if you haven't already:
        ```bash
        cp .env.example .env.local
        ```
    *   Open `.env.local` and paste in the required keys:
        *   `NEXT_PUBLIC_UPDATE_PUBLISHABLE_KEY`: From your UpdateDev dashboard.
        *   `NEXT_PUBLIC_SUPABASE_URL`: From your Supabase project settings.
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From your Supabase project settings.
        *   `NEXT_PUBLIC_SITE_URL`: Set to `http://localhost:3000` for local development, or your production URL.

7.  **Create Billing Products in UpdateDev:**
    *   In the UpdateDev dashboard, go to the **Entitlements** section.
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

*   **Pricing Page:** Fetches products and prices directly from your UpdateDev configuration.
*   **Checkout:** Integrated checkout flow using `UpdateDev.billing.createCheckoutSession`.
*   **Subscription Management:** Users can view their current plan, see renewal dates, cancel, and reactivate subscriptions.
*   **Protected Content:** Easily restrict access to features based on user authentication status (and potentially subscription status in further development).

## 🛠️ Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) 14+ (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (@radix-ui/react, headlessui)
*   **Authentication:** [Supabase](https://supabase.io/) (@supabase/ssr, @supabase/supabase-js)
*   **Billing & Subscriptions:** [UpdateDev](https://update.dev/) (@updatedev/js) (Manages Stripe integration)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Linting/Formatting:** ESLint

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Please follow standard procedures for pull requests and issue reporting.