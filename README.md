# ContosoVac Agent

An AI-powered agent built as a Custom GPT on ChatGPT to assist healthcare workers managing routine immunisation outreach in Contoso's national vaccination program. This project was created to explore how the "Custom GPT" feature of ChatGPT can be used to quickly build agents that perform small but impactful tasks for users in the field.

## Demo

Watch the video demo: [ContosoVac Agent Demo on YouTube](https://youtu.be/hiyg4dvjclo)

## The Problem

Newborns require vaccinations at specific intervals (1st week, 4-6 weeks, 12-14 weeks, etc.). Remote villages lack permanent healthcare staff, so town health center workers routinely travel to 5-10 nearby villages to administer vaccines. This creates a set of logistical constraints:

- Each village must be visited once every 2 weeks to meet children's immunisation schedules
- Healthcare workers juggle outreach with other clinical and administrative duties
- Vaccines have limited shelf life outside cold storage, making stock planning critical
- Repeated travel from remote villages to towns is difficult for parents, so they skip vaccines

Two key user personas were identified with distinct challenges:

**Town Medical Officer** -- a trained medical professional who plans and oversees healthcare activities for the town and nearby villages. They face repetitive low-value data fetching, analysis, and scheduling work that takes time away from other responsibilities.

**On-Ground Worker (Nurse)** -- a trained nurse who carries out vaccinations in villages and records immunisation details on the ground. They struggle with using messaging apps as their source of critical information and cumbersome data entry during field work.

## Problem Statement Deep Dive

### Routine Immunisation Outreach
![Immunisation Explanation](docs/slide%20images/1.%20immunisation%20explanation.jpg)

### Challenges Identified
![Summary of Challenges](docs/slide%20images/2.%20summary%20of%20challenges.jpg)

### Town Medical Officer

![Medical Officer Persona](docs/slide%20images/Medical%20officer%20persona.jpg)

**Workflow 1: Scheduling vaccination outreach visits**
![Scheduling Workflow](docs/slide%20images/Medical%20officer%201.jpg)

**Workflow 2: Ordering vaccine doses required for visit**
![Ordering Workflow](docs/slide%20images/Medical%20officer%202.jpg)

**Workflow 3: Reporting metrics to leadership**
![Reporting Workflow](docs/slide%20images/Medical%20Officer%203.jpg)

### On-Ground Worker (Nurse)

![Nurse Persona](docs/slide%20images/Nurse%20Persona.jpg)

**Workflow 1: Prepare for outreach visit**
![Prepare for Visit](docs/slide%20images/Nurse%201.jpg)

**Workflow 2: Fetch and update data in NHDB App in the field**
![Field Data Entry](docs/slide%20images/Nurse%202.jpg)

[View the full presentation (PDF)](docs/ContosoVac%20Agent%20Presentation.pdf)

## Solution Architecture

![Custom GPT Architecture](docs/slide%20images/custom-gpt-architecture.png)

The ContosoVac Agent is a Custom GPT that connects to two backend applications via API calls:

| App | Purpose | Stack |
|-----|---------|-------|
| **SimpleCal** | Calendar app for scheduling outreach visits to villages | Next.js, Tailwind CSS, MongoDB |
| **NHDB App** | National Health Database for patient records and vaccination tracking | Next.js, Tailwind CSS, MongoDB |

### What the agent can do

**For Medical Officers:**
- Check which villages haven't been visited recently and need scheduling
- Review upcoming calendar events and plan visits on available days
- Calculate required vaccine doses for upcoming visits based on patient data
- Generate summary reports from the health database

**For On-Ground Workers:**
- Look up visit schedules and vaccine requirements for upcoming trips
- Fetch patient data by ID for quick reference during field visits
- Record vaccination details through conversational interaction instead of navigating complex forms

## Project Structure

```
contoso-vaccine-agent/
  simplecal/          # Calendar app (Next.js, deployed on Vercel)
  nhdb-app/           # National Health Database app (Next.js, deployed on Vercel)
  vercel-gpt-hello/   # POC for Custom GPT API integration (Vercel Serverless)
  mcp-hello-server/   # POC for Claude Desktop MCP integration (Node.js, Express)
  docs/               # Presentation, requirements, and documentation
```

## Getting Started

### Prerequisites
- Node.js
- MongoDB Atlas connection string

### SimpleCal
```bash
cd simplecal
npm install
npm run dev      # Runs on port 3001
```

### NHDB App
```bash
cd nhdb-app
npm install
npm run dev      # Runs on port 3002
```

Set `MONGODB_URI` in a `.env.local` file for each app with your MongoDB Atlas connection string.
