# 🏥 MediCare Hospital Management System (HMS)

> A modern, AI-powered healthcare management platform designed for efficiency, compassion, and cutting-edge patient care.

🔗 **Live Project**: [https://hospital-man-fronted.onrender.com](https://hospital-man-fronted.onrender.com)

---

## 🌟 Overview

MediCare HMS is a comprehensive, production-ready hospital management solution that integrates advanced AI capabilities with robust clinical workflows. From booking appointments to tracking patient rounds and managing emergency services, MediCare provides a seamless experience for patients, doctors, nurses, and administrative staff.

## 🚀 Key Features

### 🤖 AI-Powered Intelligence
- **Maya AI Chatbot**: A 24/7 intelligent health assistant for patient inquiries and navigation.
- **Voice AI Integration**: (Via Vapi.ai & Murf AI) Automated appointment booking, patient callback systems using natural-sounding AI voices, and accessible text-to-speech for UI elements.
- **Telephonic Triage**: Advanced AI voice handling for emergency calls and appointment confirmations.

### 🏥 Clinical & Administrative Modules
- **Patient Portal**: Secure registration, login, and dashboard for appointment history and reports.
- **Multi-Role Staff Dashboards**: Specialized views for Doctors, Nurses, Receptionists, and Cashiers.
- **Ward & Bed Management**: Real-time tracking of bed occupancy and patient rounds.
- **Emergency System**: Dedicated dashboard for ambulance tracking and emergency doctor management.
- **Salary Management**: Administrative tool for tracking and managing staff salaries.

### 📊 Advanced Reporting
- **Dynamic Dashboards**: Real-time visualization of hospital statistics using Recharts.
- **Professional PDF Generation**: Automated generation of medical reports and invoices using jsPDF.

## 🛠️ Technology Stack

| Layer | Tools & Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS |
| **UI Components** | Shadcn/UI, Radix UI, Lucide React |
| **Interactive UI** | Framer Motion (Animations), Sonner (Toasts) |
| **Data Fetching** | TanStack Query (React Query) |
| **Backend (BaaS)** | Supabase (PostgreSQL, Auth, Storage) |
| **Serverless Logic** | Supabase Edge Functions (Deno Runtime) |
| **AI Ecosystem** | Vapi.ai & Murf AI (Voice AI), OpenAI GPT-4o (Chat/Logic) |
| **Utilities** | Recharts (Graphs), jsPDF (PDFs), date-fns |

---

## 🏗️ Architecture

The project follows a modern serverless and cloud-native architecture:
1. **Unified Frontend**: A high-performance SPA optimized for speed and accessibility.
2. **Secure Database**: PostgreSQL with advanced Row Level Security (RLS) policies.
3. **AI Gateway**: Secure Edge Functions for handling LLM interactions and Vapi callbacks.
4. **Real-time Sync**: Live updates for bed management and emergency notifications.

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js**: v18 or higher
- **Supabase CLI**: For managing Edge Functions
- **Accounts**: Supabase, Vapi.ai (for AI features)

### Steps

1. **Clone the Repo**:
   ```bash
   git clone <repository-url>
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Supabase Configuration**:
   - Run the provided SQL scripts in the Supabase SQL Editor to initialize the schema.
   - Configure secrets for AI services using `supabase secrets set`.

4. **Deploy Edge Functions**:
   ```bash
   npx supabase functions deploy --no-verify-jwt
   ```

---

## 🎯 Project Representation

This project is designed to showcase a professional integration of AI with traditional enterprise workflows. It demonstrates expertise in:
- Full-stack development with **React & Supabase**.
- **AI Voice Integration** using Vapi.ai & Murf AI.
- **Complex State Management** and multi-role RBAC systems.
- **Modern UI/UX** practices using Shadcn/UI and Tailwind.

---

## 🛡️ License

MediCare HMS is open-source software licensed under the **MIT License**.