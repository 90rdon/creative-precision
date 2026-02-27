# V0.1 Experimental Framework & Feedback Loop

**Status:** v0.1 is a living experiment. We are not launching a finished product; we are launching a listening mechanism. It will take weeks/months to understand the market signals. Our primary goal is to establish a high-velocity feedback loop to iterate messaging and product value based on real executive behavior.

## Core Philosophy: Listening Without Farming
Executives are hyper-sensitive to being surveyed or "farmed" for data. Our intelligence gathering must be completely invisible and native to the value exchange. We do not ask them to help us; we observe how they interact when we try to help them.

## 1. The Observation Mechanisms (How We Listen)

We will track behavioral signals, not just survey responses:

*   **Drop-off Points (The BS Detector):** If users consistently abandon the assessment after Moment 2 (The Reality check), our AI's response in Moment 2 is either too fluffy, too aggressive, or missing the mark. The drop-off is our strongest negative signal.
*   **The "Share" Trigger:** We track if they click the "Share on LinkedIn" or "Copy Link" button on the Results page. This is the ultimate proof of the "Talk Trigger" concept. If the share rate is 0%, the $50k insight wasn't valuable enough.
*   **The "Pre-Commitment" Pull (Product-Market-Sales Fit):** How many users click the "Access Framework" (Lifeline) button AND *commit time* (via a calendar webhook to book a Diagnostic Synthesis Call).
*   **Chat Transcript Thematic Analysis (Anonymized):** We will periodically review the *types* of friction executives report (e.g., "Is it mostly infosec, data silos, or middle management?") to tune our marketing copy.
*   **End-to-End Attribution (UTM Tracking):** We must tie the final `Pre_Commitment_Pull` back to the exact `utm_campaign` that generated the initial click to scientifically prove which messaging works at the Top of Funnel.

## 2. The First 10 Customers (Hand-to-Hand Combat)
We will not fall into the "if you build it, they will come" trap. V0.1 requires manual, unscalable acquisition. **Every interaction MUST use tracked UTM links:**
*   **Network Activation (`?utm_source=network`):** The first assessments will be manually sent to existing network connections.
*   **Targeted DMs (`?utm_source=linkedin_dm`):** We will use LinkedIn to identify target ICPs and test different DM copy variants (`&utm_campaign=variant_a`).
*   **Content-Led Alpha (`?utm_source=content`):** We will write thought-leadership posts highlighting the exact pains the assessment diagnoses to draw targeted traffic.

## 3. A/B Testing Strategy (The Iteration Engine)

We test variables holding everything else constant. In v0.1, we focus on the highest-leverage points:

*   **The Hook (Landing Page):**
    *   *Variant A (Strategic):* "Stop automating the old. Start designing the new."
    *   *Variant B (Pain-focused):* "You spent $3M on AI pilots. Why aren't they in production?"
*   **The Lifeline Presentation (Results Page):**
    *   *Variant A (Soft):* "Need help executing this? View the Governance Fabric."
    *   *Variant B (Direct):* "You have a Governance Deficit. Pull the framework to fix it."
*   **The System Prompt Tone:**
    *   *Variant A (The Strategist):* Heavy focus on business models and ROI questions.
    *   *Variant B (The Operator):* Heavy focus on team dynamics and deployment friction.

## 4. The Rapid Iteration Cycle (The "Ralph" Cadence)

We will not wait months to adjust. We operate on a weekly sprint cycle:
1.  **Gather:** Aggregate quantitative (drop-offs, clicks) and qualitative (transcript themes) data every Friday.
2.  **Analyze (The Ralph Loop):** Run the data through our PM/PMM/Executive archetype lens. Why did Variant B fail? Did the CTO archetype smell fluff?
3.  **Deploy:** Push prompt updates, UI copy changes, or landing page tweaks by Monday morning.

## 5. The Golden Rule of the Experiment
**Value First, Always.** Even if an experiment fails (e.g., a new prompt tone lands poorly), the baseline interaction *must* still provide value to the user. We never sacrifice the user's "Aha!" moment for the sake of gathering a cleaner data point.
