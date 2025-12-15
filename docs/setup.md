# Setup Guide

## 1. Prerequisites
- Node.js 18+ (Download from nodejs.org)
- PostgreSQL (Database)
- Git

## 2. Installation
```bash
# Clone
git clone https://github.com/AnithaUwi/devslab_inventory_system.git
cd devslab-inventory

# Install
npm install

# Setup environment
cp .env.example .env
# Edit .env file with database info

# Setup database
npx prisma db push

# Run
npm run dev