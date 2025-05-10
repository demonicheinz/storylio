<div align="center">

<!-- ![Banner](/assets/banner.png) -->

<br>

![Next.js](https://img.shields.io/badge/Next.js-black?logo=nextdotjs&labelColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-black?logo=typescript&labelColor=black)
![React](https://img.shields.io/badge/React-black?logo=react&labelColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-black?logo=tailwindcss&labelColor=black)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-black?logo=framer&labelColor=black)

![GitHub License](https://img.shields.io/github/license/demonicheinz/storylio?logo=creative-commons&logoColor=white&label=License)
![GitHub last commit](https://img.shields.io/github/last-commit/demonicheinz/storylio?logo=github&label=Last%20Commit)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/demonicheinz/storylio/CodeQL.yml?branch=main&logo=github&label=Build)
[![Live Preview](https://img.shields.io/badge/Live%20Preview-🔗-blue?logo=vercel&logoColor=white)](https://storylio.heinz.id/)

</div>

## Table of Content

1. [Description](#description)
2. [Main Features](#main-features)
3. [Tech Stack](#tech-stack)
4. [Prerequisite](#prerequisite)
5. [Contributing](#contributing)
6. [License](#license)
7. [Contact](#contact)

## Description

Storylio is a modern portfolio app built using Next.js 15 and TypeScript. It is designed to help you showcase your work, blog posts, photo galleries, and information about yourself in an elegant and responsive way. The admin panel feature allows you to easily manage your content without the hassle of editing code.

## Main Features

### Frontend Features
- **Dynamic Pages:** Dynamic routing using **Next.js App Router** for `work/[slug]` and `blog/[slug]` pages.
- **Dark/Light Mode:** Toggle dark and light themes using custom hooks (`useTheme.ts`).
- **SEO Friendly:** Dynamic meta tags for each page using `generateMetadata` in **Next.js**.
- **Responsive Design:** Responsive design for all devices using **Tailwind CSS** or media queries.
- **Masonry Layout:** Gallery layout using libraries like **react-masonry-css**.

### Admin Panel Features
- **Authentication:** Login/logout using **Supabase Auth** (email/password or OAuth).
- **CRUD Operations:** Input forms to add/edit projects and articles. Form validation using libraries like **zod**.
- **File Upload:** Upload images to **Supabase Storage** with preview before uploading.
- **Dashboard Overview:** Displays simple statistics like the number of projects and articles created.

## Tech Stack

**Frontend**:
- Next.js 15 — Modern web framework with App Router and full server components support
- TypeScript — Strongly typed language for safer and scalable development
- Tailwind CSS — Utility-first CSS framework for building responsive and fast interfaces
- Shadcn/UI — Beautifully designed, accessible UI components built with Radix and Tailwind
- Framer Motion — Powerful animation library for React to create smooth and engaging UI transitions

**Backend**:
- Supabase Database — Scalable and open-source PostgreSQL backend
- Supabase Auth — Authentication system supporting email/password and OAuth providers
- Supabase Storage — Secure and efficient media storage solution

## Prerequisite

Make sure you have installed the following:

- **Node.js** `v18` or later [Download Node.js](https://nodejs.org/)
- **Package Manager**: 
  - [`pnpm`](https://pnpm.io/) (recommended) 
  - [`npm`](https://www.npmjs.com/) 
  - [`yarn`](https://yarnpkg.com/) 
  - [`bun`](https://bun.sh/)
- **Supabase Project**:
  - Create an account at [Supabase](https://supabase.com/) and set up a new project.
  - Configure Database, Authentication, and Storage as required.
- **Environment Variables**:
  - You will need to create a `.env.local` file with your Supabase credentials.

## Installation

1. Clone the repository
    ```bash
    git clone https://github.com/demonicheinz/storylio.git
    cd storylio
    ```

2. Install dependencies
    ```bash
    pnpm install
    # or
    npm install
    # or
    yarn install
    # or
    bun install
    ```

3. Create `.env.local` file:\
    Linux & macOS:
    ```bash
    # (bash/zsh)
    cp .env.example .env.local
    ```

    Windows:
    ```bash
    # (CMD/Command Prompt)
    copy .env.example .env.local

    # (PowerShell)
    Copy-Item .env.example -Destination .env.local
    ```

4. Edit `.env.local` and add the following configuration: 
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

5. Setup Supabase:
    - Create a new project in Supabase
    - Run the SQL in `supabase/schema.sql` to create tables and access policies
    - Enable email authentication and create the first admin account

6. Run the development server
    ```bash
    pnpm dev
    # or
    npm run dev
    # or
    yarn dev
    # or
    bun dev
    ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Fork this repository

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or would like to contribute, feel free to reach out to me!

- Email: [contact@heinz.id](mailto:contact@heinz.id)
- GitHub: [demonicheinz](https://github.com/demonicheinz)
- Website: [heinz.id](https://heinz.id)

---

*Made with ❤️ by [Heinz](https://github.com/demonicheinz).*