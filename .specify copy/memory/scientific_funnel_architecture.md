# The End-to-End Scientific Funnel Architecture (V0.1)

If we only track the Assessment interaction, we are blind. We won't know *which* marketing message worked, or *who* the user is, or whether the insight actually resulted in revenue. 

To be strictly scientific, we must track the entire journey from the first impression to the final pre-commitment. This is the End-to-End (E2E) Funnel.

## The Funnel Stages & Required Telemetry

### Stage 1: Top of Funnel (ToFu) - Acquisition & Lead Gen
*How do we get them to the landing page, and how do we know where they came from?*

**The Strategy (Hand-to-Hand Combat):**
1.  **Direct LinkedIn Outreach (DMs):** Targeted at specific ICPs (e.g., CTOs in mid-market healthcare).
2.  **Thought Leadership Content:** LinkedIn posts or articles discussing the "Pilot Death Spiral."
3.  **Network Referrals:** Manually asking peers to forward the assessment.

**The Scientific Telemetry (What we track):**
*   **UTM Parameters are Mandatory:** We never send a naked link. Every link must have a UTM source. 
    *   `?utm_source=linkedin&utm_campaign=direct_dm_variant_a` (Testing DM copy)
    *   `?utm_source=linkedin&utm_campaign=post_pilot_spiral` (Testing content topics)
    *   `?utm_source=network&utm_campaign=seed_list_1` (Testing referral strength)
*   **Metric:** `Traffic_by_Source`. This tells us which GTM motion actually works. If DM Variant A drives 50 clicks and Variant B drives 0, we kill Variant B.

### Stage 2: Middle of Funnel (MoFu) - The Product Interaction
*Once they arrive, do they engage with the AI? Where do they lose interest?*

**The Strategy:** The AI Assessment acts as the friction-discovery engine.

**The Scientific Telemetry (What we track):**
*   *Note: We must pass the UTM parameters from the URL into the chat session state so we can tie their behavior back to their origin source.*
*   **Metric:** `Landing_Page_Conversion` (Do they hit 'Start'?)
*   **Metric:** `Moment_Dropoff_Rate` (Do they quit at Reality, Friction, or Vision?)
*   **Metric:** `Completion_Rate` (Do they reach the final $50k insight?)

### Stage 3: Bottom of Funnel (BoFu) - The Pre-Commitment
*Did the $50k insight create enough trust and urgency that they are willing to spend capital (time or money)?*

**The Strategy:** Present the "Lifeline" (the execution framework) immediately following the diagnosis.

**The Scientific Telemetry (What we track):**
*   **Metric:** `Lifeline_CTR` (Click-Through Rate on the final "Access Framework" button).
*   **Metric:** `Pre_Commitment_Conversion` (The ultimate metric).
    *   *If the Lifeline is a Strategy Call:* Did they actually book the Calendly link for a Diagnostic Synthesis Call?
*   **The Golden Ratio:** (`Pre_Commitment_Conversion` / `Completion_Rate`). This tells us if our diagnosis is strong enough to drive action. If completion is high but conversion is 0%, our insight is interesting but not actionable (or they don't trust us to fix it).

### Stage 4: The Viral Loop (The K-Factor)
*Do they recruit for us?*

**The Strategy:** Provide a frictionless way to share the Assessment (or the anonymized diagnosis) with peers or their CEO/Board.

**The Scientific Telemetry (What we track):**
*   **Metric:** `Share_Intent` (Clicks on "Copy Link").
*   **Metric:** `Viral_Acquisition` (Traffic arriving via `?utm_source=viral_share`).

---

## The V0.1 Engineering Requirements for E2E Tracking

To make this E2E funnel work in the codebase, we don't need a massive enterprise CDP (Customer Data Platform) yet. But we DO need:

1.  **URL Parameter Parsing:** The React application must parse `window.location.search` on load and store the UTM parameters.
2.  **Session Logging:** We need a simple database (like Supabase, Firebase, or even a structured JSON log sent to a backend) that records a session object:
    *   `session_id`
    *   `utm_source` / `utm_campaign`
    *   `max_moment_reached`
    *   `friction_theme` (extracted by AI)
    *   `clicked_lifeline` (boolean)
    *   `booked_call` (boolean - via webhook from Calendly)
    *   `clicked_share` (boolean)

If we build this lightweight tracking architecture into Phase 2 of the implementation, every single session will yield scientifically pure data from the first click to the final calendar booking.
